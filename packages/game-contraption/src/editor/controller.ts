import { clone, kit, part, W, H } from "../levels";
import type { Level, Part, PartType } from "../types";
import {
  isSafeLevelId,
  parseLevelFile,
  parseLevelIndex,
  blankLevel as blankFile,
  levelIssues,
  type LevelFile,
  type LevelIndex,
} from "../level-files";
import {
  EditorDocument,
  addPart,
  copyLevel,
  describe,
  issues,
  moveSelection,
  setSpareQuantity,
  type Selection,
} from "./model";
import { EditorPreview } from "./preview";
import { EditorPlaytest } from "./playtest";

const palette: PartType[] = [
  "ramp",
  "belt",
  "spring",
  "fan",
  "funnel",
  "bumper",
  "wall",
  "button",
  "lever",
];
const filePath = (id: string) =>
  `/api/contraption/levels/${encodeURIComponent(id)}`;
const safeId = isSafeLevelId;
const el = <T extends Element>(root: ParentNode, selector: string) => {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`Missing editor element ${selector}`);
  return found;
};

export class ContraptionEditorController {
  private files = new Map<string, LevelFile>();
  private levelDiagnostics = new Map<string, string[]>();
  private index: LevelIndex = { version: 1, levels: [] };
  private savedIndex = "[]";
  private doc: EditorDocument;
  private selection: Selection | null = null;
  private pickingTarget: Selection | null = null;
  private snap = true;
  private drag: { pointer: number; selection: Selection } | null = null;
  private preview: EditorPreview;
  private playtest: EditorPlaytest;
  private playing = false;
  private overlay: HTMLCanvasElement;
  private canvas: HTMLCanvasElement;
  private abort = new AbortController();
  private resize?: ResizeObserver;

  constructor(private root: HTMLElement) {
    const initial = blankFile();
    initial.level.id = "new-contraption";
    this.doc = new EditorDocument(initial, false);
    this.canvas = el(root, "#editor-canvas");
    this.overlay = el(root, "#editor-overlay");
    this.preview = new EditorPreview(this.canvas, this.overlay);
    this.playtest = new EditorPlaytest(el(root, "#play-host"), () =>
      this.stopPlaytest(),
    );
    this.bind();
    void this.load();
  }
  dispose(): void {
    this.abort.abort();
    this.resize?.disconnect();
    this.playtest.dispose();
    this.preview.dispose();
  }

  private bind(): void {
    const options = { signal: this.abort.signal };
    this.root.addEventListener("click", this.click, options);
    this.root.addEventListener("input", this.input, options);
    this.root.addEventListener("change", this.change, options);
    this.root.addEventListener("focusin", this.focusIn, options);
    this.root.addEventListener("focusout", this.focusOut, options);
    this.overlay.addEventListener("pointerdown", this.pointerDown, options);
    this.overlay.addEventListener("pointermove", this.pointerMove, options);
    this.overlay.addEventListener("pointerup", this.pointerUp, options);
    this.overlay.addEventListener("pointercancel", this.pointerCancel, options);
    this.overlay.addEventListener(
      "lostpointercapture",
      this.pointerCancel,
      options,
    );
    window.addEventListener("keydown", this.key, options);
    window.addEventListener("beforeunload", this.beforeUnload, options);
    this.resize = new ResizeObserver(() => {
      this.preview.resize();
      this.render();
    });
    this.resize.observe(this.canvas);
    this.render();
  }
  private load = async (): Promise<void> => {
    try {
      const [rows, indexRaw] = await Promise.all([
        request("/api/contraption/levels"),
        request("/api/contraption/index"),
      ]);
      const summaries = rows as {
        levels: Array<{ id: string; name: string; issues: string[] }>;
      };
      this.index = parseLevelIndex(indexRaw);
      this.savedIndex = JSON.stringify(this.index.levels);
      for (const row of summaries.levels) {
        this.levelDiagnostics.set(
          row.id,
          Array.isArray(row.issues) ? row.issues : [],
        );
        try {
          const file = parseLevelFile(await request(filePath(row.id)));
          this.files.set(file.level.id, file);
        } catch (error) {
          this.levelDiagnostics.set(row.id, [
            ...(this.levelDiagnostics.get(row.id) ?? []),
            message(error),
          ]);
        }
      }
      const first =
        this.index.levels.find((id) => this.files.has(id)) ??
        this.files.keys().next().value;
      if (first) {
        this.doc.replace(clone(this.files.get(first)!));
        this.selection = null;
      }
      this.status("Level files loaded.");
      this.render();
    } catch (error) {
      this.status(`Could not load level files: ${message(error)}`, true);
      this.render();
    }
  };
  private click = (event: MouseEvent): void => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-action]",
    );
    if (!button) return;
    const action = button.dataset.action!;
    if (this.playing && !["stop", "restart", "pause"].includes(action)) return;
    if (action === "toggle-tools" || action === "toggle-inspector") {
      const rail = action === "toggle-tools" ? "tools" : "inspector";
      const collapsed = this.root.classList.toggle(rail + "-collapsed");
      el<HTMLElement>(
        this.root,
        "#" + button.getAttribute("aria-controls"),
      ).hidden = collapsed;
      button.setAttribute("aria-expanded", String(!collapsed));
      button.textContent = (collapsed ? "Show " : "Hide ") + rail;
      return;
    }
    if (action !== "pick-target" && !action.startsWith("toggle-"))
      this.pickingTarget = null;
    if (action === "pick-target") {
      this.pickingTarget = this.pickingTarget ? null : this.selection;
      this.render();
      this.overlay.focus();
      return;
    }
    if (action === "blank") {
      if (this.confirmDiscard()) {
        const id = this.newId();
        if (id) {
          const file = blankFile();
          file.level.id = id;
          this.doc.replace(file, false);
          this.selection = null;
          this.render();
        }
      }
    } else if (action === "copy") {
      if (this.confirmDiscard()) {
        const id = this.newId();
        if (id) {
          this.doc.replace(copyLevel(this.doc.value, id), false);
          this.selection = null;
          this.render();
        }
      }
    } else if (action === "save") void this.saveFile();
    else if (action === "undo") {
      this.doc.undo();
      this.ensureSelection();
      this.render();
    } else if (action === "redo") {
      this.doc.redo();
      this.ensureSelection();
      this.render();
    } else if (action === "rotate-left" || action === "rotate-right")
      this.mutateSelected((p) => {
        if ("angle" in p)
          p.angle += action === "rotate-left" ? -Math.PI / 12 : Math.PI / 12;
      });
    else if (action === "duplicate") this.duplicateSelected();
    else if (action === "delete") this.deleteSelected();
    else if (action === "add-source")
      this.doc.edit((f) => {
        if (f.level.sources.length < 12)
          f.level.sources.push({ x: W / 2, y: 95, vx: 0 });
      });
    else if (action === "remove-source")
      this.doc.edit((f) => {
        if (f.level.sources.length > 1) f.level.sources.pop();
      });
    else if (action === "include") this.includeCurrent();
    else if (action === "list-save") void this.saveIndex();
    else if (action === "up" || action === "down" || action === "remove-entry")
      this.changeList(action, Number(button.dataset.index));
    else if (action === "play") this.startPlaytest();
    else if (action === "stop") this.stopPlaytest();
    else if (action === "restart") this.playtest.restart();
    this.render();
  };
  private input = (event: Event): void => {
    const target = event.target as
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (target.matches("[data-field=spare-quantity]")) {
      this.doc.edit((f) =>
        setSpareQuantity(
          f.level,
          target.dataset.type as PartType,
          Number(target.value),
        ),
      );
      return;
    }
    if (target.matches("#snap-toggle")) {
      this.snap = (target as HTMLInputElement).checked;
      this.render();
      return;
    }
    if (!target.matches("[data-field]")) return;
    if (target.matches("[data-field]")) {
      const field = target.dataset.field!;
      if (field === "name" || field === "tag")
        this.doc.edit((f) => {
          f.level[field] = target.value;
        });
      else if (field === "period")
        this.doc.edit((f) => {
          f.level.period = Number(target.value);
        });
      else if (field === "x" || field === "y" || field === "angle")
        this.updateTransform(field, Number(target.value));
      else if (field === "fixed")
        this.mutateSelected((p) => {
          if ("type" in p && p.type !== "switch")
            p.locked = (target as HTMLInputElement).checked;
        });
      else if (field === "enabled")
        this.mutateSelected((p) => {
          if ("type" in p) p.enabled = (target as HTMLInputElement).checked;
        });
      else if (field === "mode")
        this.mutateSelected((p) => {
          if ("type" in p) p.mode = target.value as "toggle" | "latch";
        });
      else if (field === "target")
        this.mutateSelected((p) => {
          if ("type" in p) p.targetId = target.value || undefined;
        });
      else if (field === "direction")
        this.mutateSelected((p) => {
          if ("type" in p)
            p.flip = (target as HTMLInputElement).checked ? -1 : 1;
        });
      else if (field === "spare-quantity")
        this.doc.edit((f) =>
          setSpareQuantity(
            f.level,
            target.dataset.type as PartType,
            Number(target.value),
          ),
        );
    }
    this.render();
  };
  private change = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    if (target.matches("#file-select")) {
      const file = this.files.get(target.value);
      if (file && this.confirmDiscard()) {
        this.doc.replace(file);
        this.selection = null;
        this.render();
      }
    }
    if (target.matches("#spare-select")) {
      this.selection = target.value
        ? { kind: "spare", id: target.value }
        : null;
      this.render();
    }
    if (target.matches("[data-field=spare-quantity]")) this.doc.endBatch();
    this.render();
  };
  private focusIn = (event: FocusEvent): void => {
    if ((event.target as Element).matches?.("[data-field=spare-quantity]"))
      this.doc.beginBatch();
  };
  private focusOut = (event: FocusEvent): void => {
    if ((event.target as Element).matches?.("[data-field=spare-quantity]")) {
      this.doc.endBatch();
      this.render();
    }
  };

  private saveFile = async (): Promise<void> => {
    const payload = this.doc.value;
    try {
      const saved = parseLevelFile(payload);
      await request(filePath(payload.level.id), {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      this.files.set(saved.level.id, saved);
      this.levelDiagnostics.set(saved.level.id, levelIssues(saved));
      this.doc.acceptSaved(payload);
      this.status("Level file saved. List inclusion is still separate.");
    } catch (error) {
      this.status(
        `Save failed; your draft is still here: ${message(error)}`,
        true,
      );
    }
    this.render();
  };
  private saveIndex = async (): Promise<void> => {
    const payload = clone(this.index);
    try {
      const saved = parseLevelIndex(payload);
      await request("/api/contraption/index", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      this.savedIndex = JSON.stringify(saved.levels);
      this.status("Playable list saved.");
    } catch (error) {
      this.status(
        `List save failed; your changes are still here: ${message(error)}`,
        true,
      );
    }
    this.render();
  };
  private includeCurrent(): void {
    const f = this.doc.value;
    const problems = issues(f);
    if (problems.length) {
      this.status(
        `Fix level issues before including it: ${problems.join(" · ")}`,
        true,
      );
      return;
    }
    if (this.doc.dirty || !this.files.has(f.level.id)) {
      this.status("Save this level file before adding it to the list.", true);
      return;
    }
    if (!this.index.levels.includes(f.level.id))
      this.index.levels.push(f.level.id);
  }
  private changeList(action: string, at: number): void {
    if (action === "remove-entry") this.index.levels.splice(at, 1);
    else {
      const to = at + (action === "up" ? -1 : 1);
      if (to >= 0 && to < this.index.levels.length)
        [this.index.levels[at], this.index.levels[to]] = [
          this.index.levels[to],
          this.index.levels[at],
        ];
    }
  }
  private startPlaytest(): void {
    const problems = issues(this.doc.value);
    if (problems.length) {
      this.status(problems.join(" · "), true);
      return;
    }
    this.playing = true;
    this.playtest.start(clone(this.doc.value.level));
    this.root.classList.add("is-playing");
    this.render();
  }
  private stopPlaytest(): void {
    this.playtest.stop();
    this.playing = false;
    this.root.classList.remove("is-playing");
    this.render();
  }

  private pointerDown = (event: PointerEvent): void => {
    if (this.playing) return;
    const point = this.point(event),
      file = this.doc.value;
    const selected = this.hit(
      file.level,
      point.x,
      point.y,
      event.pointerType === "touch" ? 22 : 10,
    );
    if (this.pickingTarget) {
      const target =
        selected?.kind === "part"
          ? file.level.initial.find((p) => p.id === selected.id)
          : undefined;
      if (target && (target.type === "belt" || target.type === "fan")) {
        this.mutateSelected((p) => {
          p.targetId = target.id;
        });
        this.pickingTarget = null;
        this.render();
      }
      event.preventDefault();
      return;
    }
    if (!selected) {
      this.selection = null;
      this.render();
      return;
    }
    this.selection = selected;
    this.drag = { pointer: event.pointerId, selection: selected };
    this.doc.beginBatch();
    this.overlay.setPointerCapture(event.pointerId);
    this.render();
  };
  private pointerMove = (event: PointerEvent): void => {
    if (!this.drag || this.drag.pointer !== event.pointerId) return;
    const p = this.point(event);
    this.doc.edit((f) =>
      moveSelection(f.level, this.drag!.selection, p.x, p.y, this.snap),
    );
    this.render();
  };
  private pointerUp = (): void => {
    if (!this.drag) return;
    this.doc.endBatch();
    this.drag = null;
    this.render();
  };
  private pointerCancel = (): void => {
    if (!this.drag) return;
    this.doc.cancelBatch();
    this.drag = null;
    this.render();
  };
  private point(event: PointerEvent): { x: number; y: number } {
    const r = this.overlay.getBoundingClientRect();
    return {
      x: ((event.clientX - r.left) * W) / r.width,
      y: ((event.clientY - r.top) * H) / r.height,
    };
  }
  private hit(
    level: Level,
    x: number,
    y: number,
    pad: number,
  ): Selection | null {
    for (let i = level.sources.length - 1; i >= 0; i--)
      if (Math.hypot(level.sources[i].x - x, level.sources[i].y - y) < 38 + pad)
        return { kind: "source", index: i };
    if (
      Math.abs(level.bowl.x - x) < 80 + pad &&
      Math.abs(level.bowl.y - y) < 55 + pad
    )
      return { kind: "bowl" };
    for (const p of [...level.initial].reverse()) {
      const size = kit[p.type];
      const dx = x - p.x,
        dy = y - p.y,
        lx = dx * Math.cos(p.angle) + dy * Math.sin(p.angle),
        ly = -dx * Math.sin(p.angle) + dy * Math.cos(p.angle);
      if (Math.abs(lx) < size.w / 2 + pad && Math.abs(ly) < size.h / 2 + pad)
        return { kind: "part", id: p.id };
    }
    return null;
  }
  private updateTransform(field: string, value: number): void {
    if (!Number.isFinite(value)) return;
    const selection = this.selection;
    if (selection?.kind === "source")
      this.doc.edit((f) => {
        const source = f.level.sources[selection.index];
        if (source && (field === "x" || field === "y")) source[field] = value;
      });
    else if (selection?.kind === "bowl")
      this.doc.edit((f) => {
        if (field === "x" || field === "y") f.level.bowl[field] = value;
      });
    else
      this.mutateSelected((p) => {
        if (field === "angle") p.angle = (value * Math.PI) / 180;
        else if (field === "x" || field === "y") p[field] = value;
      });
  }
  private mutateSelected(fn: (p: Part) => void): void {
    const selection = this.selection;
    if (!selection || selection.kind === "source" || selection.kind === "bowl")
      return;
    this.doc.edit((f) => {
      const list = selection.kind === "part" ? f.level.initial : f.level.spares;
      const p = list.find((x) => x.id === selection.id);
      if (p) fn(p);
    });
  }
  private duplicateSelected(): void {
    const selection = this.selection;
    if (!selection || selection.kind !== "part") return;
    this.doc.edit((f) => {
      const p = f.level.initial.find((x) => x.id === selection.id);
      if (!p) return;
      const q = clone(p);
      q.id = `part-${crypto.randomUUID()}`;
      q.x = Math.min(W - 20, q.x + 35);
      q.y = Math.min(600, q.y + 35);
      f.level.initial.push(q);
      this.selection = { kind: "part", id: q.id };
    });
  }
  private deleteSelected(): void {
    const selection = this.selection;
    if (!selection) return;
    this.doc.edit((f) => {
      if (selection.kind === "part")
        f.level.initial = f.level.initial.filter((p) => p.id !== selection.id);
      else if (selection.kind === "spare")
        f.level.spares = f.level.spares.filter((p) => p.id !== selection.id);
      else if (selection.kind === "source" && f.level.sources.length > 1)
        f.level.sources.splice(selection.index, 1);
    });
    this.selection = null;
  }
  private key = (event: KeyboardEvent): void => {
    if (this.playing) return;
    if (event.key === "Escape" && this.pickingTarget) {
      event.preventDefault();
      this.pickingTarget = null;
      this.render();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void this.saveFile();
      return;
    }
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    if (
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      ["q", "e"].includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
      if (!event.repeat) {
        this.mutateSelected((p) => {
          p.angle +=
            event.key.toLowerCase() === "q" ? -Math.PI / 12 : Math.PI / 12;
        });
        this.render();
      }
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "z"
    ) {
      event.preventDefault();
      event.shiftKey ? this.doc.redo() : this.doc.undo();
      this.render();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "y"
    ) {
      event.preventDefault();
      this.doc.redo();
      this.render();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      !event.altKey &&
      event.key.toLowerCase() === "d"
    ) {
      event.preventDefault();
      if (!event.repeat) {
        this.duplicateSelected();
        this.render();
      }
    } else if (event.key === "Delete" || event.key === "Backspace") {
      this.deleteSelected();
      this.render();
    }
  };
  private beforeUnload = (event: BeforeUnloadEvent): void => {
    if (this.doc.dirty || this.indexDirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  };
  private get indexDirty(): boolean {
    return JSON.stringify(this.index.levels) !== this.savedIndex;
  }
  private confirmDiscard(): boolean {
    return (
      !this.doc.dirty ||
      window.confirm("Discard unsaved changes to this level?")
    );
  }
  private newId(): string | null {
    const value = el<HTMLInputElement>(this.root, "#new-id").value.trim();
    if (!safeId(value) || this.files.has(value)) {
      this.status(
        "Use a new lowercase ID with letters, numbers and single hyphens.",
        true,
      );
      return null;
    }
    return value;
  }
  private ensureSelection(): void {
    if (this.selection && !describe(this.doc.value.level, this.selection))
      this.selection = null;
  }
  private status(value: string, error = false): void {
    const node = el<HTMLElement>(this.root, "#status");
    node.textContent = value;
    node.dataset.error = String(error);
  }
  private render(): void {
    this.ensureSelection();
    const f = this.doc.value,
      level = f.level,
      selected = describe(level, this.selection),
      issuesList = issues(f);
    const fileSelect = el<HTMLSelectElement>(this.root, "#file-select"),
      options = [...this.files.keys()].map(
        (id) => new Option(`${this.files.get(id)!.level.name} · ${id}`, id),
      );
    fileSelect.replaceChildren(...options);
    if (this.files.has(level.id)) fileSelect.value = level.id;
    else fileSelect.selectedIndex = -1;
    el<HTMLElement>(this.root, "#doc-id").textContent = level.id;
    el<HTMLElement>(this.root, "#dirty").textContent = this.doc.dirty
      ? "Unsaved"
      : "Saved";
    el<HTMLElement>(this.root, "#dirty").dataset.dirty = String(this.doc.dirty);
    setVal(this.root, "[data-field=name]", level.name);
    setVal(this.root, "[data-field=tag]", level.tag);
    setVal(this.root, "[data-field=period]", String(level.period));
    const paletteRoot = el<HTMLElement>(this.root, "#palette");
    paletteRoot.replaceChildren(
      ...palette.map((type) => {
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.add = type;
        b.textContent = kit[type].name;
        b.addEventListener("click", () => {
          this.doc.edit((d) => {
            const p = addPart(d.level, type);
            this.selection = { kind: "part", id: p.id };
          });
          this.render();
        });
        return b;
      }),
    );
    const selectedRoot = el<HTMLElement>(this.root, "#selected");
    selectedRoot.hidden = !selected;
    el<HTMLElement>(this.root, "#empty").hidden = !!selected;
    if (selected) {
      el<HTMLElement>(this.root, "#selection-name").textContent =
        selected.label;
      setVal(this.root, "[data-field=x]", String(Math.round(selected.x)));
      setVal(this.root, "[data-field=y]", String(Math.round(selected.y)));
      const angle = selected.angle ?? 0;
      setVal(
        this.root,
        "[data-field=angle]",
        String(Math.round((angle * 180) / Math.PI)),
      );
      const p = selected.part;
      const editablePosition = this.selection?.kind !== "spare";
      toggle(this.root, "#position-row", editablePosition);
      toggle(this.root, "#angle-row", editablePosition && !!p);
      toggle(
        this.root,
        "#fixed-row",
        !!p && this.selection?.kind === "part" && p.type !== "switch",
      );
      toggle(
        this.root,
        "#control-row",
        !!p && (p.type === "button" || p.type === "lever"),
      );
      toggle(this.root, "#belt-row", p?.type === "belt");
      toggle(this.root, "#fan-row", p?.type === "fan");
      if (p) {
        el<HTMLInputElement>(this.root, "[data-field=fixed]").checked =
          !!p.locked;
        el<HTMLInputElement>(this.root, "[data-field=enabled]").checked =
          p.enabled !== false;
        el<HTMLSelectElement>(this.root, "[data-field=mode]").value =
          p.mode ?? "toggle";
        const target = el<HTMLSelectElement>(this.root, "[data-field=target]");
        const all = [...level.initial, ...level.spares];
        const labels = new Map<string, number>();
        target.replaceChildren(
          new Option("Choose target…", ""),
          ...all
            .filter(
              (x) => x.id !== p.id && (x.type === "belt" || x.type === "fan"),
            )
            .map((x) => {
              const number = (labels.get(x.type) ?? 0) + 1;
              labels.set(x.type, number);
              const kind = level.initial.includes(x) ? "Placed" : "Spare";
              return new Option(
                `${kit[x.type].name} ${number} · ${kind} · (${Math.round(x.x)}, ${Math.round(x.y)})`,
                x.id,
              );
            }),
        );
        target.value = p.targetId ?? "";
        el<HTMLInputElement>(this.root, "[data-field=direction]").checked =
          (p.flip ?? 1) < 0;
      }
    }
    el<HTMLElement>(this.root, "#issues").replaceChildren(
      ...issuesList.map((issue) => {
        const li = document.createElement("li");
        li.textContent = issue;
        return li;
      }),
    );
    el<HTMLElement>(this.root, "#issue-summary").textContent = issuesList.length
      ? `${issuesList.length} issue${issuesList.length === 1 ? "" : "s"}`
      : "Ready";
    el<HTMLButtonElement>(this.root, "[data-action=play]").disabled =
      issuesList.length > 0;
    this.renderSpares(level);
    this.renderList();
    if (
      this.pickingTarget !== this.selection ||
      !selected?.part ||
      !["button", "lever"].includes(selected.part.type)
    )
      this.pickingTarget = null;
    const picking = !!this.pickingTarget;
    el<HTMLButtonElement>(this.root, "[data-action=pick-target]").textContent =
      picking ? "Cancel target pick (Esc)" : "Pick target on board";
    el<HTMLElement>(this.root, "#target-pick-help").hidden = !picking;
    this.overlay.style.cursor = picking ? "crosshair" : "";
    this.preview.show(f, this.selection, this.snap, picking);
    el<HTMLInputElement>(this.root, "#snap-toggle").checked = this.snap;
    this.root.classList.toggle("is-playing", this.playing);
    el<HTMLElement>(this.root, "#play-ui").hidden = !this.playing;
  }
  private renderSpares(level: Level): void {
    const panel = el<HTMLElement>(this.root, "#spares");
    panel.replaceChildren(
      ...palette.map((type) => {
        const row = document.createElement("label");
        row.className = "spare-row";
        const count = level.spares.filter((p) => p.type === type).length,
          placed = level.initial.filter(
            (p) => p.type === type && !p.locked,
          ).length;
        row.append(
          document.createTextNode(
            `${kit[type].name} · ${placed} placed · spares `,
          ),
        );
        const input = document.createElement("input");
        input.type = "number";
        input.min = "0";
        input.max = String(
          Math.max(
            0,
            96 - level.initial.length - (level.spares.length - count),
          ),
        );
        input.value = String(count);
        input.dataset.field = "spare-quantity";
        input.dataset.type = type;
        row.append(input);
        return row;
      }),
    );
    const select = el<HTMLSelectElement>(this.root, "#spare-select");
    select.replaceChildren(
      new Option("Configure spare piece…", ""),
      ...level.spares.map(
        (p, i) => new Option(`${kit[p.type].name} ${i + 1}`, p.id),
      ),
    );
    if (this.selection?.kind === "spare") select.value = this.selection.id;
  }
  private renderList(): void {
    const list = el<HTMLOListElement>(this.root, "#included");
    const rows = this.index.levels.map((id, index) => {
      const li = document.createElement("li"),
        file = this.files.get(id),
        problems = this.levelDiagnostics.get(id) ?? [];
      const label = document.createElement("span");
      label.textContent = `${index + 1}. ${file?.level.name ?? `${id} (missing or invalid file)`}${problems.length ? ` · ${problems.join("; ")}` : ""}`;
      if (problems.length || !file) {
        li.dataset.invalid = "true";
        li.title =
          problems.join("; ") || "The referenced level file is missing.";
      }
      li.append(
        label,
        actionButton("↑", "up", index, index === 0),
        actionButton(
          "↓",
          "down",
          index,
          index === this.index.levels.length - 1,
        ),
        actionButton("Remove", "remove-entry", index),
      );
      return li;
    });
    if (!rows.length) {
      const empty = document.createElement("li");
      empty.className = "empty-list-row";
      empty.textContent = "No levels included. Add and save a level to begin.";
      rows.push(empty);
    }
    list.replaceChildren(...rows);
    el<HTMLElement>(this.root, "#list-dirty").textContent = this.indexDirty
      ? "Unsaved list"
      : "List saved";
    el<HTMLButtonElement>(this.root, "[data-action=list-save]").disabled =
      !this.indexDirty;
  }
}

function setVal(root: ParentNode, selector: string, value: string): void {
  const input = root.querySelector<HTMLInputElement>(selector);
  if (input && document.activeElement !== input) input.value = value;
}
function toggle(root: ParentNode, selector: string, visible: boolean): void {
  const node = root.querySelector<HTMLElement>(selector);
  if (node) node.hidden = !visible;
}
function actionButton(
  text: string,
  action: string,
  index: number,
  disabled = false,
): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  b.dataset.action = action;
  b.dataset.index = String(index);
  b.disabled = disabled;
  return b;
}
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof result?.error === "string"
        ? result.error
        : `${response.status} ${response.statusText}`,
    );
  return result;
}
