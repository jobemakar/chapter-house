import "./editor.css";
import { ContentCompiler } from "./content";
import type { LevelDocument, Point, TerrainMaterial } from "./content-types";
import { DigAndDouseGame } from "./game";
import { loadDigAndDouseProgress, type DigAndDouseProgress } from "./progress";
import type { GameHostServices } from "@chapter-house/game-host";
import {
  EditorHistory,
  addObject,
  beginAuthoring,
  clamp,
  cloneDocument,
  describeSelection,
  duplicateSelection,
  hitTest,
  moveSelection,
  nextObjectId,
  removeSelection,
  safeId,
  selectionPosition,
  snap,
  terrainMaterial,
  type AddKind,
  type Selection,
  type Tool,
} from "./editor/model";
import { EditorPreview } from "./editor/preview";

type LevelListResponse = { levels: LevelDocument[]; errors: string[] };
type CampaignDocument = { version: 1; levels: string[] };
type StatusKind = "ok" | "working" | "error";
type Facing = "left" | "right" | "up" | "down";

const API = "/__douse_editor";

class DigAndDouseEditor {
  private document: LevelDocument = ContentCompiler.createLevel(
    "new-level",
    "New woodland clearing",
  );
  private savedDocument = "";
  private readonly history = new EditorHistory();
  private readonly preview: EditorPreview;
  private selection: Selection | null = null;
  private tool: Tool = "select";
  private hover: Point | null = null;
  private brushRadius = 0.375;
  private shapeMaterial: TerrainMaterial = "empty";
  private pendingPolygon: Point[] = [];
  private rectangleStart: Point | null = null;
  private pointerId: number | null = null;
  private dragOrigin: Point | null = null;
  private dragDocument: LevelDocument | null = null;
  private dragging = false;
  private showGrid = true;
  private levels = new Map<string, LevelDocument>();
  private knownSaved = false;
  private campaign: string[] = [];
  private savedCampaign = "[]";
  private playtest: DigAndDouseGame | null = null;

  constructor(private readonly root: HTMLElement) {
    this.preview = new EditorPreview(
      this.required<HTMLCanvasElement>("#editor-canvas"),
    );
    this.bind();
    this.renderAll();
    void this.loadLibrary();
  }

  dispose(): void {
    this.playtest?.dispose();
  }

  private bind(): void {
    const canvas = this.required<HTMLCanvasElement>("#editor-canvas");
    canvas.addEventListener("pointerdown", (event) => this.pointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.pointerMove(event));
    canvas.addEventListener("pointerup", (event) => this.pointerUp(event));
    canvas.addEventListener("pointercancel", (event) =>
      this.pointerCancel(event),
    );
    canvas.addEventListener("pointerleave", () => {
      if (this.pointerId === null) {
        this.hover = null;
        this.renderPreview();
      }
    });
    canvas.addEventListener("lostpointercapture", () => this.finishPointer());

    this.root
      .querySelectorAll<HTMLButtonElement>("[data-tool]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this.setTool(button.dataset.tool as Tool),
        ),
      );
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-add]")
      .forEach((button) =>
        button.addEventListener("click", () =>
          this.addPaletteObject(button.dataset.add as AddKind),
        ),
      );
    const brush = this.required<HTMLInputElement>("#brush-radius");
    brush.addEventListener("input", () => {
      this.brushRadius = Number(brush.value) / 2;
      this.required<HTMLOutputElement>("#brush-output").value = Number(
        brush.value,
      ).toFixed(2);
      this.renderPreview();
    });
    this.required<HTMLSelectElement>("#shape-material").addEventListener(
      "change",
      (event) => {
        this.shapeMaterial = (event.currentTarget as HTMLSelectElement)
          .value as TerrainMaterial;
      },
    );
    this.required<HTMLInputElement>("#grid-toggle").addEventListener(
      "change",
      (event) => {
        this.showGrid = (event.currentTarget as HTMLInputElement).checked;
        this.renderPreview();
      },
    );

    this.required<HTMLButtonElement>("#new-button").addEventListener(
      "click",
      () => this.createLevel(),
    );
    this.required<HTMLButtonElement>(
      "#duplicate-level-button",
    ).addEventListener("click", () => this.duplicateLevel());
    this.required<HTMLSelectElement>("#level-select").addEventListener(
      "change",
      (event) =>
        void this.openLevel((event.currentTarget as HTMLSelectElement).value),
    );
    ["#save-button", "#footer-save-button"].forEach((selector) =>
      this.required<HTMLButtonElement>(selector).addEventListener(
        "click",
        () => void this.saveLevel(),
      ),
    );
    this.required<HTMLButtonElement>("#undo-button").addEventListener(
      "click",
      () => this.undo(),
    );
    this.required<HTMLButtonElement>("#redo-button").addEventListener(
      "click",
      () => this.redo(),
    );
    this.required<HTMLButtonElement>(
      "#duplicate-selection-button",
    ).addEventListener("click", () => this.duplicateSelected());
    this.required<HTMLButtonElement>(
      "#delete-selection-button",
    ).addEventListener("click", () => this.deleteSelected());

    this.required<HTMLButtonElement>("#play-button").addEventListener(
      "click",
      () => void this.startPlaytest(),
    );
    this.required<HTMLButtonElement>("#restart-button").addEventListener(
      "click",
      () => this.playtest?.restart(),
    );
    this.required<HTMLButtonElement>("#stop-button").addEventListener(
      "click",
      () => this.stopPlaytest(),
    );
    this.required<HTMLButtonElement>("#campaign-add-button").addEventListener(
      "click",
      () => this.addToCampaign(),
    );
    this.required<HTMLButtonElement>("#campaign-save-button").addEventListener(
      "click",
      () => void this.saveCampaign(),
    );
    this.required<HTMLOListElement>("#campaign-list").addEventListener(
      "click",
      (event) => this.campaignAction(event),
    );

    window.addEventListener("keydown", (event) => this.keyDown(event));
    window.addEventListener("beforeunload", (event) => {
      if (!this.hasUnsavedWork()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  private async loadLibrary(): Promise<void> {
    const initialDocument = JSON.stringify(this.document);
    this.setStatus(
      "library",
      "Loading level files from the local editor server…",
      "working",
    );
    try {
      const [list, campaign] = await Promise.all([
        requestJson(`${API}/levels`) as Promise<LevelListResponse>,
        requestJson(`${API}/campaign`) as Promise<CampaignDocument>,
      ]);
      if (!list || !Array.isArray(list.levels) || !Array.isArray(list.errors))
        throw new Error("The levels endpoint returned an unexpected response.");
      if (
        !campaign ||
        campaign.version !== 1 ||
        !Array.isArray(campaign.levels)
      )
        throw new Error(
          "The campaign endpoint returned an unexpected response.",
        );
      this.levels = new Map(list.levels.map((level) => [level.id, level]));
      // A saved first draft has the same ID as the startup placeholder. Restore
      // it only if the user has not started editing while the request was pending.
      const savedInitial = this.levels.get(this.document.id);
      if (savedInitial && JSON.stringify(this.document) === initialDocument) {
        this.document = cloneDocument(savedInitial);
        this.savedDocument = JSON.stringify(this.document);
        this.history.clear();
        this.renderAll();
      }
      this.campaign = [...campaign.levels];
      this.savedCampaign = JSON.stringify(this.campaign);
      this.knownSaved = true;
      this.renderLibrary();
      this.renderCampaign();
      if (list.errors?.length)
        this.setStatus(
          "library",
          `Loaded with ${list.errors.length} file error${list.errors.length === 1 ? "" : "s"}: ${list.errors.join(" · ")}`,
          "error",
        );
      else
        this.setStatus(
          "library",
          `${this.levels.size} saved draft${this.levels.size === 1 ? "" : "s"} available.`,
          "ok",
        );
    } catch (error) {
      this.knownSaved = false;
      this.renderLibrary();
      this.setStatus("library", localServerMessage(error), "error");
    }
  }

  private createLevel(): void {
    if (!this.mayDiscard("create a new level")) return;
    const proposed = window.prompt(
      "Name the new level",
      "New woodland clearing",
    );
    if (proposed === null) return;
    const name = proposed.trim() || "New woodland clearing";
    let id = safeId(name),
      suffix = 2;
    while (this.levels.has(id)) id = `${safeId(name)}-${suffix++}`;
    this.document = ContentCompiler.createLevel(id, name);
    this.savedDocument = "";
    this.history.clear();
    this.selection = null;
    this.resetDrawing();
    this.setTool("select");
    this.renderAll();
    this.setStatus(
      "editor",
      "New filled-dirt draft created. Save when it is ready to keep.",
      "ok",
    );
  }

  private duplicateLevel(): void {
    const proposed = window.prompt(
      "Name the duplicate",
      `${this.document.name} copy`,
    );
    if (proposed === null) return;
    const name = proposed.trim() || `${this.document.name} copy`;
    let id = safeId(name),
      suffix = 2;
    while (this.levels.has(id)) id = `${safeId(name)}-${suffix++}`;
    this.document = cloneDocument(this.document);
    this.document.id = id;
    this.document.name = name;
    if (this.document.legacy) {
      this.document.legacy.id = id;
      this.document.legacy.name = name;
    }
    this.document.terrain.forEach((item, index) => {
      item.id = `${id}-${item.kind}-${index + 1}`;
    });
    this.document.reservoirs.forEach((item, index) => {
      item.id = `${id}-tank-${index + 1}`;
    });
    this.document.pipes.forEach((item, index) => {
      item.id = `${id}-pipe-${index + 1}`;
    });
    this.savedDocument = "";
    this.history.clear();
    this.selection = null;
    this.resetDrawing();
    this.renderAll();
    this.setStatus(
      "editor",
      "Duplicate is a new unsaved draft with its own stable ID.",
      "ok",
    );
  }

  private async openLevel(id: string): Promise<void> {
    if (!id || id === this.document.id) return;
    if (!this.mayDiscard("open another level")) {
      this.renderLibrary();
      return;
    }
    try {
      this.setStatus("library", `Opening ${id}…`, "working");
      const value = (await requestJson(
        `${API}/levels/${encodeURIComponent(id)}`,
      )) as LevelDocument;
      this.document = value;
      this.savedDocument = JSON.stringify(value);
      this.history.clear();
      this.selection = null;
      this.resetDrawing();
      this.setTool("select");
      this.renderAll();
      this.setStatus("library", `Opened ${value.name}.`, "ok");
      if (value.legacy)
        this.setStatus(
          "editor",
          "The authoring preview shows convertible geometry; Play keeps the original runtime layout exact.",
          "working",
        );
    } catch (error) {
      this.setStatus("library", errorMessage(error), "error");
    }
  }

  private async saveLevel(): Promise<void> {
    const snapshot = cloneDocument(this.document);
    const serialized = JSON.stringify(snapshot);
    try {
      this.setStatus("library", `Saving ${snapshot.id}.json…`, "working");
      await requestJson(`${API}/levels/${encodeURIComponent(snapshot.id)}`, {
        method: "PUT",
        body: serialized,
      });
      this.levels.set(snapshot.id, snapshot);
      if (this.document.id === snapshot.id) this.savedDocument = serialized;
      this.knownSaved = true;
      this.renderLibrary();
      this.renderHeader();
      this.setStatus(
        "library",
        `Saved ${snapshot.name} as a draft.${JSON.stringify(this.document) === serialized ? "" : " Newer edits remain unsaved."} Campaign order is unchanged.`,
        "ok",
      );
    } catch (error) {
      this.setStatus("library", localServerMessage(error), "error");
    }
  }

  private setTool(tool: Tool): void {
    if (this.tool === "polygon" && tool !== "polygon") this.pendingPolygon = [];
    this.rectangleStart = null;
    this.tool = tool;
    this.root
      .querySelectorAll<HTMLButtonElement>("[data-tool]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.tool === tool),
        ),
      );
    this.setStatus(
      "editor",
      tool === "select"
        ? "Click an object or outlined shape. Drag to move it."
        : tool === "polygon"
          ? "Click at least three vertices, then press Enter to close the shape."
          : tool === "rectangle"
            ? "Drag a rectangle on the board."
            : "Drag on the board to add one ordered brush stroke.",
      "ok",
    );
    this.renderPreview();
  }

  private addPaletteObject(kind: AddKind): void {
    this.mutate(
      (document) => {
        this.selection = addObject(document, kind);
      },
      `Added ${kind.replace("pipe-", "")} to the board.`,
    );
    this.setTool("select");
  }

  private pointerDown(event: PointerEvent): void {
    if (this.playtest || this.pointerId !== null) return;
    event.preventDefault();
    const canvas = event.currentTarget as HTMLCanvasElement;
    canvas.focus();
    const point = this.preview.point(event);
    this.hover = point;
    if (this.tool === "polygon") {
      this.pendingPolygon.push({ x: snap(point.x), y: snap(point.y) });
      this.renderPreview();
      return;
    }
    this.pointerId = event.pointerId;
    canvas.setPointerCapture(event.pointerId);
    this.dragOrigin = point;
    this.dragDocument = cloneDocument(this.document);
    this.dragging = false;
    if (this.tool.startsWith("brush-")) {
      this.history.remember(this.document);
      this.document = beginAuthoring(this.document);
      this.document.terrain.push({
        id: nextObjectId(this.document, "brush"),
        kind: "brush",
        material: terrainMaterial(this.tool, this.shapeMaterial),
        radius: this.brushRadius,
        points: [brushCellCenter(point)],
      });
      this.selection = {
        kind: "terrain",
        index: this.document.terrain.length - 1,
      };
      this.dragging = true;
      this.renderAll();
      return;
    }
    if (this.tool === "rectangle") {
      this.rectangleStart = { x: snap(point.x), y: snap(point.y) };
      this.renderPreview();
      return;
    }
    const next = hitTest(this.document, point);
    this.selection = next;
    this.renderAll();
  }

  private pointerMove(event: PointerEvent): void {
    const point = this.preview.point(event);
    this.hover = point;
    if (event.pointerId !== this.pointerId) {
      this.renderPreview();
      return;
    }
    if (this.tool.startsWith("brush-")) {
      const operation = this.document.terrain[this.document.terrain.length - 1];
      if (operation?.kind === "brush") {
        const last = operation.points[operation.points.length - 1]!;
        if (
          Math.hypot(point.x - last.x, point.y - last.y) >=
          this.brushRadius * 0.3
        )
          operation.points.push(brushCellCenter(point));
      }
      this.renderPreview();
      return;
    }
    if (this.tool === "rectangle") {
      this.dragging = true;
      this.renderPreview();
      return;
    }
    if (!this.selection || !this.dragOrigin || !this.dragDocument) return;
    const distance = Math.hypot(
      point.x - this.dragOrigin.x,
      point.y - this.dragOrigin.y,
    );
    if (distance < 0.05 && !this.dragging) return;
    if (!this.dragging) {
      this.document = beginAuthoring(this.dragDocument);
      this.dragging = true;
    } else this.document = beginAuthoring(this.dragDocument);
    moveSelection(
      this.document,
      this.selection,
      snap(point.x - this.dragOrigin.x),
      snap(point.y - this.dragOrigin.y),
    );
    this.renderAll();
  }

  private pointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    const point = this.preview.point(event);
    this.hover = point;
    if (this.tool === "rectangle" && this.rectangleStart) {
      const start = this.rectangleStart,
        end = { x: snap(point.x), y: snap(point.y) };
      if (
        Math.abs(end.x - start.x) >= 0.15 &&
        Math.abs(end.y - start.y) >= 0.15
      )
        this.mutate((document) => {
          const left = Math.min(start.x, end.x),
            right = Math.max(start.x, end.x),
            top = Math.min(start.y, end.y),
            bottom = Math.max(start.y, end.y);
          document.terrain.push({
            id: nextObjectId(document, "rectangle"),
            kind: "polygon",
            material: this.shapeMaterial,
            points: [
              { x: left, y: top },
              { x: right, y: top },
              { x: right, y: bottom },
              { x: left, y: bottom },
            ],
          });
          this.selection = {
            kind: "terrain",
            index: document.terrain.length - 1,
          };
        }, "Rectangle added to the ordered terrain stack.");
    } else if (this.dragging) {
      if (!this.tool.startsWith("brush-") && this.dragDocument)
        this.history.remember(this.dragDocument);
      this.noteChanged(
        this.tool.startsWith("brush-")
          ? "Brush stroke added."
          : "Selection moved.",
      );
    }
    this.finishPointer();
    this.renderAll();
  }

  private pointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.pointerId) return;
    if (this.dragDocument && !this.tool.startsWith("brush-"))
      this.document = this.dragDocument;
    this.finishPointer();
    this.renderAll();
  }

  private finishPointer(): void {
    this.pointerId = null;
    this.dragOrigin = null;
    this.dragDocument = null;
    this.dragging = false;
    this.rectangleStart = null;
  }

  private finishPolygon(): void {
    if (this.pendingPolygon.length < 3) {
      this.setStatus(
        "editor",
        "A polygon needs at least three vertices.",
        "error",
      );
      return;
    }
    const points = this.pendingPolygon.map((point) => ({ ...point }));
    this.pendingPolygon = [];
    this.mutate((document) => {
      document.terrain.push({
        id: nextObjectId(document, "polygon"),
        kind: "polygon",
        material: this.shapeMaterial,
        points,
      });
      this.selection = { kind: "terrain", index: document.terrain.length - 1 };
    }, "Polygon added. Select it to move the whole shape or drag one vertex.");
    this.setTool("select");
  }

  private mutate(
    change: (document: LevelDocument) => void,
    message: string,
    convertGeometry = true,
  ): void {
    this.history.remember(this.document);
    this.document = convertGeometry
      ? beginAuthoring(this.document)
      : cloneDocument(this.document);
    change(this.document);
    this.noteChanged(message);
    this.renderAll();
  }

  private noteChanged(message: string): void {
    this.setStatus("editor", message, "ok");
  }

  private undo(): void {
    const document = this.history.undo(this.document);
    if (!document) return;
    this.document = document;
    this.selection = null;
    this.resetDrawing();
    this.renderAll();
    this.setStatus("editor", "Undid the last authoring change.", "ok");
  }

  private redo(): void {
    const document = this.history.redo(this.document);
    if (!document) return;
    this.document = document;
    this.selection = null;
    this.resetDrawing();
    this.renderAll();
    this.setStatus("editor", "Redid the authoring change.", "ok");
  }

  private duplicateSelected(): void {
    if (!this.selection) return;
    this.mutate((document) => {
      this.selection =
        duplicateSelection(document, this.selection!) ?? this.selection;
    }, "Duplicated the selected object.");
  }

  private deleteSelected(): void {
    if (!this.selection) return;
    const label = describeSelection(this.document, this.selection);
    if (["intake", "target"].includes(this.selection.kind)) {
      this.setStatus(
        "editor",
        "Every level must retain one working intake and one fire target. Move them instead.",
        "error",
      );
      return;
    }
    this.mutate((document) => {
      removeSelection(document, this.selection!);
      this.selection = null;
    }, `${label} deleted.`);
  }

  private addToCampaign(): void {
    if (!this.levels.has(this.document.id)) {
      this.setStatus(
        "campaign",
        "Save this draft before adding it to the campaign.",
        "error",
      );
      return;
    }
    const issues = ContentCompiler.validate(this.document);
    if (issues.length) {
      this.setStatus(
        "campaign",
        "Fix structural errors before campaign inclusion. A successful playtest is not required.",
        "error",
      );
      return;
    }
    if (!this.campaign.includes(this.document.id))
      this.campaign.push(this.document.id);
    this.renderCampaign();
    this.setStatus(
      "campaign",
      "Draft added locally. Save campaign to write the new order.",
      "working",
    );
  }

  private campaignAction(event: Event): void {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "button[data-campaign]",
    );
    if (!button) return;
    const index = Number(button.dataset.index),
      action = button.dataset.campaign;
    if (!Number.isInteger(index) || index < 0 || index >= this.campaign.length)
      return;
    if (action === "remove") this.campaign.splice(index, 1);
    else if (action === "up" && index > 0)
      [this.campaign[index - 1], this.campaign[index]] = [
        this.campaign[index],
        this.campaign[index - 1],
      ];
    else if (action === "down" && index < this.campaign.length - 1)
      [this.campaign[index + 1], this.campaign[index]] = [
        this.campaign[index],
        this.campaign[index + 1],
      ];
    this.renderCampaign();
    this.setStatus(
      "campaign",
      "Campaign order changed locally. Save it when ready.",
      "working",
    );
  }

  private async saveCampaign(): Promise<void> {
    const snapshot = [...this.campaign];
    try {
      this.setStatus("campaign", "Saving campaign order…", "working");
      await requestJson(`${API}/campaign`, {
        method: "PUT",
        body: JSON.stringify({
          version: 1,
          levels: snapshot,
        } satisfies CampaignDocument),
      });
      this.savedCampaign = JSON.stringify(snapshot);
      this.setStatus(
        "campaign",
        `Saved ${snapshot.length} campaign level${snapshot.length === 1 ? "" : "s"}.${JSON.stringify(this.campaign) === this.savedCampaign ? "" : " Newer ordering changes remain unsaved."}`,
        "ok",
      );
    } catch (error) {
      this.setStatus("campaign", localServerMessage(error), "error");
    }
  }

  private async startPlaytest(): Promise<void> {
    const issues = ContentCompiler.validate(this.document);
    if (issues.length) {
      this.setStatus(
        "editor",
        "Play is blocked until the structural issues at right are fixed.",
        "error",
      );
      return;
    }
    try {
      const level = ContentCompiler.compile(cloneDocument(this.document));
      const host = this.required<HTMLElement>("#play-host");
      this.required<HTMLElement>("#edit-stage").hidden = true;
      this.required<HTMLElement>("#play-stage").hidden = false;
      this.required<HTMLButtonElement>("#play-button").disabled = true;
      const session = new DigAndDouseGame(
        host,
        isolatedServices((message) => {
          if (this.playtest === session) this.setPlayStatus(message);
        }),
        { level, testMode: true },
      );
      this.playtest = session;
      this.setAuthoringLocked(true);
      this.setPlayStatus("Loading an isolated snapshot of the current draft…");
      await session.ready;
      if (this.playtest !== session) return;
      const status = session.status?.() as { ready?: boolean } | undefined;
      if (!status?.ready) {
        this.setPlayStatus(
          "The playtest could not finish loading. Stop and review the browser console.",
        );
        return;
      }
      this.setPlayStatus(
        "Testing this exact draft snapshot · progress and rewards are isolated",
      );
    } catch (error) {
      this.stopPlaytest();
      this.setStatus(
        "editor",
        `Unable to start playtest: ${errorMessage(error)}`,
        "error",
      );
    }
  }

  private stopPlaytest(): void {
    this.playtest?.dispose();
    this.playtest = null;
    this.required<HTMLElement>("#play-host").replaceChildren();
    this.required<HTMLElement>("#play-stage").hidden = true;
    this.required<HTMLElement>("#edit-stage").hidden = false;
    this.required<HTMLButtonElement>("#play-button").disabled = false;
    this.setAuthoringLocked(false);
    this.renderAll();
    this.setStatus(
      "editor",
      "Playtest stopped. Authoring selection and undo history are unchanged.",
      "ok",
    );
  }

  private keyDown(event: KeyboardEvent): void {
    if (this.playtest) {
      if (event.key === "Escape") this.stopPlaytest();
      return;
    }
    if (isTyping(event.target)) return;
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "s") {
      event.preventDefault();
      void this.saveLevel();
      return;
    }
    if (modifier && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? this.redo() : this.undo();
      return;
    }
    if (modifier && event.key.toLowerCase() === "y") {
      event.preventDefault();
      this.redo();
      return;
    }
    if (event.key === "Enter" && this.tool === "polygon") {
      event.preventDefault();
      this.finishPolygon();
      return;
    }
    if (event.key === "Escape") {
      if (this.playtest) this.stopPlaytest();
      else {
        this.resetDrawing();
        this.setTool("select");
      }
      return;
    }
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      this.selection
    ) {
      event.preventDefault();
      this.deleteSelected();
      return;
    }
    if (modifier && event.key.toLowerCase() === "d" && this.selection) {
      event.preventDefault();
      this.duplicateSelected();
      return;
    }
    if (event.key.toLowerCase() === "r" && this.selection?.kind === "pipe") {
      event.preventDefault();
      this.mutate((document) => {
        const pipe =
          document.pipes[
            this.selection!.kind === "pipe" ? this.selection!.index : -1
          ];
        if (pipe)
          pipe.rotation = ((pipe.rotation + 90) % 360) as 0 | 90 | 180 | 270;
      }, "Rotated pipe 90 degrees.");
    }
  }

  private renderAll(): void {
    this.renderHeader();
    this.renderLibrary();
    this.renderPreview();
    this.renderProperties();
    this.renderValidation();
    this.renderCampaign();
    this.renderControls();
  }

  private renderHeader(): void {
    this.required<HTMLElement>("#document-name").textContent =
      this.document.name;
    this.required<HTMLElement>("#document-id").textContent = this.document.id;
    const dirty = this.isLevelDirty(),
      pill = this.required<HTMLElement>("#dirty-pill");
    pill.dataset.dirty = String(dirty);
    pill.textContent = dirty ? "Unsaved edits" : "Saved";
    this.required<HTMLElement>("#legacy-banner").hidden = !this.document.legacy;
  }

  private renderLibrary(): void {
    const select = this.required<HTMLSelectElement>("#level-select");
    select.replaceChildren();
    const current = document.createElement("option");
    current.value = this.document.id;
    current.textContent = `${this.document.name}${this.levels.has(this.document.id) ? "" : " (unsaved)"}`;
    select.append(current);
    [...this.levels.values()]
      .filter((item) => item.id !== this.document.id)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((level) => {
        const option = document.createElement("option");
        option.value = level.id;
        option.textContent = level.name;
        select.append(option);
      });
    select.value = this.document.id;
  }

  private renderPreview(): void {
    this.preview.render({
      document: this.document,
      selection: this.selection,
      tool: this.tool,
      showGrid: this.showGrid,
      hover: this.hover,
      brushRadius: this.brushRadius,
      pendingPolygon: this.pendingPolygon,
      rectangleStart: this.rectangleStart,
    });
  }

  private renderProperties(): void {
    const host = this.required<HTMLElement>("#properties"),
      selection = this.selection;
    const position = selection
      ? selectionPosition(this.document, selection)
      : null;
    let html = `<div class="property-grid"><label class="wide">Level name<input data-property="level-name" type="text" maxlength="80" value="${escapeAttribute(this.document.name)}"></label><label class="wide">Completion quota<input data-property="requiredPercent" type="number" min="1" max="100" step="1" value="${this.document.requiredPercent}"></label>`;
    if (!selection)
      html += `</div><div class="empty-properties">Select an object or outlined terrain operation to edit its exact values.</div>`;
    else {
      html += `<h3 class="wide">${escapeHtml(describeSelection(this.document, selection))}</h3>`;
      if (position)
        html +=
          numberField("x", "X", position.x, 0, 12) +
          numberField("y", "Y", position.y, 0, 15);
      if (selection.kind === "reservoir") {
        const item = this.document.reservoirs[selection.index];
        if (item)
          html +=
            numberField("w", "Width", item.w, 0.6, 12) +
            numberField("h", "Height", item.h, 0.6, 15) +
            numberField(
              "fillPercent",
              "Starting fill %",
              item.fillPercent,
              0,
              100,
              1,
            ) +
            selectField("outlet", "Outlet side", item.outlet, [
              "left",
              "right",
              "bottom",
            ]);
      } else if (selection.kind === "rock") {
        const item = this.document.rocks[selection.index];
        if (item)
          html +=
            numberField("w", "Width", item.w, 0.15, 12) +
            numberField("h", "Height", item.h, 0.15, 15);
      } else if (selection.kind === "pipe") {
        const item = this.document.pipes[selection.index];
        if (item)
          html +=
            selectField("pipeKind", "Pipe piece", item.kind, [
              "straight",
              "elbow",
              "tee",
              "cross",
            ]) +
            selectField("rotation", "Rotation", String(item.rotation), [
              "0",
              "90",
              "180",
              "270",
            ]);
      } else if (selection.kind === "decoy" || selection.kind === "intake") {
        const item =
          selection.kind === "intake"
            ? this.document.intake
            : this.document.decoys[selection.index];
        if (item)
          html += selectField("facing", "Facing", item.facing, [
            "left",
            "right",
            "up",
            "down",
          ]);
      } else if (selection.kind === "target")
        html +=
          numberField("w", "Width", this.document.target.w, 0.3, 12) +
          numberField("h", "Height", this.document.target.h, 0.3, 15);
      else if (selection.kind === "terrain") {
        const item = this.document.terrain[selection.index];
        if (item)
          html +=
            selectField("material", "Material", item.material, [
              "dirt",
              "empty",
              "rock",
            ]) +
            (item.kind === "brush"
              ? numberField("radius", "Brush radius", item.radius, 0.075, 2.4)
              : `<p class="hint wide">${item.points.length} editable vertices. Click a vertex on the board to move it.</p>`);
      }
      html += `</div>`;
    }
    host.innerHTML = html;
    host
      .querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-property]")
      .forEach((control) =>
        control.addEventListener("change", () => this.applyProperty(control)),
      );
  }

  private applyProperty(control: HTMLInputElement | HTMLSelectElement): void {
    const property = control.dataset.property!;
    if (property === "level-name") {
      const value = control.value.trim();
      if (value)
        this.mutate(
          (document) => {
            document.name = value;
          },
          "Level name changed; its stable ID is unchanged.",
          false,
        );
      return;
    }
    const number = Number(control.value);
    this.mutate(
      (document) => {
        if (property === "requiredPercent") {
          document.requiredPercent = clamp(number, 1, 100);
          return;
        }
        if (!this.selection) return;
        const selection = this.selection;
        if (property === "x" || property === "y") {
          const current = selectionPosition(document, selection);
          if (!current) return;
          moveSelection(
            document,
            selection,
            property === "x" ? snap(number - current.x) : 0,
            property === "y" ? snap(number - current.y) : 0,
          );
          return;
        }
        if (selection.kind === "reservoir") {
          const item = document.reservoirs[selection.index];
          if (!item) return;
          if (property === "w") item.w = clamp(number, 0.6, 12 - item.x);
          else if (property === "h") item.h = clamp(number, 0.6, 15 - item.y);
          else if (property === "fillPercent")
            item.fillPercent = clamp(Math.round(number), 0, 100);
          else if (property === "outlet")
            item.outlet = control.value as "left" | "right" | "bottom";
        } else if (selection.kind === "rock") {
          const item = document.rocks[selection.index];
          if (!item) return;
          if (property === "w") item.w = clamp(number, 0.15, 12 - item.x);
          else if (property === "h") item.h = clamp(number, 0.15, 15 - item.y);
        } else if (selection.kind === "pipe") {
          const item = document.pipes[selection.index];
          if (!item) return;
          if (property === "pipeKind")
            item.kind = control.value as typeof item.kind;
          else if (property === "rotation")
            item.rotation = number as typeof item.rotation;
        } else if (selection.kind === "decoy" || selection.kind === "intake") {
          const item =
            selection.kind === "intake"
              ? document.intake
              : document.decoys[selection.index];
          if (item && property === "facing")
            item.facing = control.value as Facing;
        } else if (selection.kind === "target") {
          if (property === "w")
            document.target.w = clamp(number, 0.3, 12 - document.target.x);
          else if (property === "h")
            document.target.h = clamp(number, 0.3, 15 - document.target.y);
        } else if (selection.kind === "terrain") {
          const item = document.terrain[selection.index];
          if (!item) return;
          if (property === "material")
            item.material = control.value as TerrainMaterial;
          else if (property === "radius" && item.kind === "brush")
            item.radius = clamp(number, 0.075, 2.4);
        }
      },
      `${propertyLabel(property)} updated.`,
    );
  }

  private renderValidation(): void {
    let issues: string[];
    try {
      issues = ContentCompiler.validate(this.document);
    } catch (error) {
      issues = [errorMessage(error)];
    }
    const summary = this.required<HTMLElement>("#validation-summary");
    summary.dataset.valid = String(issues.length === 0);
    summary.textContent = issues.length
      ? `${issues.length} issue${issues.length === 1 ? "" : "s"}`
      : "Ready";
    const list = this.required<HTMLUListElement>("#issue-list");
    list.replaceChildren(
      ...issues.map((issue) => {
        const item = document.createElement("li");
        item.textContent = issue;
        return item;
      }),
    );
  }

  private renderCampaign(): void {
    const list = this.required<HTMLOListElement>("#campaign-list");
    list.replaceChildren();
    if (!this.campaign.length) {
      const item = document.createElement("li");
      item.innerHTML = `<span>No levels included yet</span>`;
      list.append(item);
      return;
    }
    this.campaign.forEach((id, index) => {
      const row = document.createElement("li"),
        name = this.levels.get(id)?.name ?? id;
      row.innerHTML = `<span title="${escapeAttribute(id)}">${escapeHtml(name)}</span><span class="campaign-row-actions"><button type="button" data-campaign="up" data-index="${index}" aria-label="Move ${escapeAttribute(name)} up" ${index === 0 ? "disabled" : ""}>↑</button><button type="button" data-campaign="down" data-index="${index}" aria-label="Move ${escapeAttribute(name)} down" ${index === this.campaign.length - 1 ? "disabled" : ""}>↓</button><button type="button" data-campaign="remove" data-index="${index}" aria-label="Remove ${escapeAttribute(name)} from campaign">×</button></span>`;
      list.append(row);
    });
  }

  private renderControls(): void {
    this.required<HTMLButtonElement>("#undo-button").disabled =
      !this.history.canUndo;
    this.required<HTMLButtonElement>("#redo-button").disabled =
      !this.history.canRedo;
    const removable =
      !!this.selection && !["intake", "target"].includes(this.selection.kind);
    this.required<HTMLButtonElement>("#delete-selection-button").disabled =
      !removable;
    this.required<HTMLButtonElement>("#duplicate-selection-button").disabled =
      !removable;
    this.required<HTMLButtonElement>("#campaign-add-button").disabled =
      this.campaign.includes(this.document.id);
  }

  private hasUnsavedWork(): boolean {
    return (
      this.isLevelDirty() ||
      JSON.stringify(this.campaign) !== this.savedCampaign
    );
  }
  private isLevelDirty(): boolean {
    return JSON.stringify(this.document) !== this.savedDocument;
  }
  private mayDiscard(action: string): boolean {
    return (
      !this.isLevelDirty() ||
      window.confirm(`Discard unsaved edits and ${action}?`)
    );
  }
  private resetDrawing(): void {
    this.pendingPolygon = [];
    this.rectangleStart = null;
    this.finishPointer();
  }
  private setAuthoringLocked(locked: boolean): void {
    this.root.classList.toggle("is-playing", locked);
    [
      ".library-bar",
      ".left-rail",
      ".right-rail",
      ".stage-toolbar",
      ".editor-footer",
    ].forEach((selector) => {
      const region = this.required<HTMLElement>(selector);
      region.inert = locked;
      region.setAttribute("aria-hidden", String(locked));
    });
  }
  private setPlayStatus(message: string): void {
    this.required<HTMLElement>("#play-status").textContent = message;
  }
  private setStatus(
    scope: "library" | "editor" | "campaign",
    message: string,
    kind: StatusKind,
  ): void {
    const element = this.required<HTMLElement>(`#${scope}-status`);
    element.textContent = message;
    element.dataset.kind = kind;
  }
  private required<T extends Element>(selector: string): T {
    const value = this.root.querySelector<T>(selector);
    if (!value) throw new Error(`Missing editor element ${selector}`);
    return value;
  }
}

function isolatedServices(
  notify: (message: string) => void,
): GameHostServices<DigAndDouseProgress> {
  return {
    progress: loadDigAndDouseProgress(null),
    muted: false,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    activePlaySeconds: 0,
    exit: () => undefined,
    notify,
    saveProgress: () => undefined,
    creditActivePlay: () => 0,
    awardReward: () => false,
  };
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  let body: unknown;
  const type = response.headers.get("content-type") ?? "";
  if (!type.toLowerCase().includes("application/json"))
    throw new Error(
      `Expected JSON from ${url}, but the editor endpoint was not active.`,
    );
  try {
    body = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(`The editor endpoint returned malformed JSON for ${url}.`);
  }
  if (!response.ok) {
    const detail =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : typeof body === "string"
          ? body
          : response.statusText;
    throw new Error(`${response.status} ${detail}`);
  }
  return body;
}

function localServerMessage(error: unknown): string {
  return `The local Dig & Douse editor server is unavailable. Start the package's editor-enabled Vite dev server; shipped gameplay cannot write level files. ${errorMessage(error)}`;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function isTyping(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}
function numberField(
  property: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step = 0.15,
): string {
  return `<label>${label}<input data-property="${property}" type="number" min="${min}" max="${max}" step="${step}" value="${round(value)}"></label>`;
}
function selectField(
  property: string,
  label: string,
  value: string,
  options: string[],
): string {
  return `<label>${label}<select data-property="${property}">${options.map((option) => `<option value="${option}"${option === value ? " selected" : ""}>${optionLabel(option)}</option>`).join("")}</select></label>`;
}
function optionLabel(value: string): string {
  return value === "tee"
    ? "T-junction"
    : value === "cross"
      ? "Four-way"
      : value.charAt(0).toUpperCase() + value.slice(1);
}
function propertyLabel(value: string): string {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}
function round(value: number): string {
  return String(Math.round(value * 1000) / 1000);
}
function brushCellCenter(point: Point): Point {
  // A one-cell circular brush must hit a cell center, not a four-cell corner.
  return {
    x: Math.min(11.925, Math.floor(point.x / 0.15) * 0.15 + 0.075),
    y: Math.min(14.925, Math.floor(point.y / 0.15) * 0.15 + 0.075),
  };
}
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}
function escapeAttribute(value: string): string {
  return escapeHtml(value);
}

const root = document.getElementById("douse-editor");
if (!root) throw new Error("Missing #douse-editor");
const editor = new DigAndDouseEditor(root);
window.addEventListener("pagehide", () => editor.dispose(), { once: true });
