import { isSafeLevelId, levelIssues, parseLevelFile, parseLevelIndex, playableRoom, type DraftRoom, type LevelFile, type LevelIndex } from "../level-files";
import type { RuntimeState, Vec } from "../types";
import { EditorPlaytest } from "./playtest";
import { EditorPreview } from "./preview";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  EditorDocument,
  addPaletteObject,
  blankLevel,
  describeSelection,
  duplicateSelection,
  hitTest,
  moveSelection,
  removeSelection,
  rotateSelection,
  setSelectionLength,
  setSelectionPower,
  type PaletteKind,
  type Selection,
} from "./model";

type LevelListResponse = { levels: unknown[]; errors: string[] };

export class KeyfallEditorController {
  private document = new EditorDocument(blankLevel());
  private selection: Selection | null = null;
  private readonly preview: EditorPreview;
  private readonly playtest: EditorPlaytest;
  private savedLevels = new Map<string, LevelFile>();
  private knownSaved = false;
  private campaign: string[] = [];
  private savedCampaign = "[]";
  private snap = true;
  private dragging = false;
  private playing = false;
  private testedRoom?: DraftRoom;
  private playState: RuntimeState = "ready";
  private savingLevel = false;
  private savingCampaign = false;

  constructor(private readonly root: HTMLElement) {
    const editCanvas = this.required<HTMLCanvasElement>("#editor-canvas");
    const overlay = this.required<HTMLCanvasElement>("#editor-overlay");
    const testCanvas = this.required<HTMLCanvasElement>("#playtest-canvas");
    this.preview = new EditorPreview(editCanvas, overlay);
    this.playtest = new EditorPlaytest(testCanvas, (status) => this.onPlayStatus(status));
    this.bindActions(overlay);
    this.renderAll();
    void this.loadLibrary();
  }

  dispose(): void { this.preview.dispose(); this.playtest.dispose(); }

  private bindActions(overlay: HTMLCanvasElement): void {
    this.required<HTMLButtonElement>("#blank-button").addEventListener("click", () => this.createBlank());
    this.required<HTMLButtonElement>("#copy-button").addEventListener("click", () => this.copyCurrent());
    this.required<HTMLButtonElement>("#save-button").addEventListener("click", () => void this.saveLevel());
    this.required<HTMLSelectElement>("#level-select").addEventListener("change", (event) => this.openLevel((event.currentTarget as HTMLSelectElement).value));
    const title = this.required<HTMLInputElement>("#room-title");
    const instruction = this.required<HTMLTextAreaElement>("#room-instruction");
    this.bindBatchedInput(title, () => this.edit((file) => { file.room.title = title.value.trim() || "Untitled Room"; }));
    this.bindBatchedInput(instruction, () => this.edit((file) => { file.room.subtitle = instruction.value.trim(); }));
    this.required<HTMLInputElement>("#snap-toggle").addEventListener("change", (event) => { this.snap = (event.currentTarget as HTMLInputElement).checked; this.renderPreview(); });
    this.required<HTMLButtonElement>("#undo-button").addEventListener("click", () => this.undo());
    this.required<HTMLButtonElement>("#redo-button").addEventListener("click", () => this.redo());
    this.required<HTMLButtonElement>("#duplicate-button").addEventListener("click", () => this.duplicate());
    this.required<HTMLButtonElement>("#delete-button").addEventListener("click", () => this.deleteSelected());
    this.bindBatchedInput(this.required<HTMLInputElement>("#object-x"), () => this.applyInspectorPosition());
    this.bindBatchedInput(this.required<HTMLInputElement>("#object-y"), () => this.applyInspectorPosition());
    this.bindBatchedInput(this.required<HTMLInputElement>("#object-rotation"), () => this.applyInspectorRotation());
    this.bindBatchedInput(this.required<HTMLInputElement>("#object-power"), () => this.applyInspectorPower());
    this.bindBatchedInput(this.required<HTMLInputElement>("#object-length"), () => this.applyInspectorLength());
    this.root.querySelectorAll<HTMLButtonElement>("[data-palette]").forEach((button) => button.addEventListener("click", () => this.addObject(button.dataset.palette as PaletteKind)));

    this.required<HTMLButtonElement>("#play-button").addEventListener("click", () => this.startPlaytest());
    this.required<HTMLButtonElement>("#play-pause-button").addEventListener("click", () => this.playtest.togglePause());
    this.required<HTMLButtonElement>("#play-reset-button").addEventListener("click", () => this.playtest.reset());
    this.required<HTMLButtonElement>("#play-stop-button").addEventListener("click", () => this.stopPlaytest());

    this.required<HTMLButtonElement>("#campaign-add-button").addEventListener("click", () => this.addToCampaign());
    this.required<HTMLButtonElement>("#campaign-clear-button").addEventListener("click", () => { this.campaign = []; this.renderCampaign(); });
    this.required<HTMLButtonElement>("#campaign-save-button").addEventListener("click", () => void this.saveCampaign());
    this.required<HTMLOListElement>("#campaign-list").addEventListener("click", (event) => this.handleCampaignAction(event));

    overlay.addEventListener("pointerdown", (event) => this.pointerDown(event));
    overlay.addEventListener("pointermove", (event) => this.pointerMove(event));
    overlay.addEventListener("pointerup", (event) => this.pointerUp(event));
    overlay.addEventListener("pointercancel", (event) => this.pointerCancel(event));
    overlay.addEventListener("lostpointercapture", () => this.finishDrag());
    window.addEventListener("resize", () => { this.preview.resize(); this.playtest.resize(); });
    window.addEventListener("keydown", (event) => this.keyDown(event));
    window.addEventListener("beforeunload", (event) => {
      if (!this.hasUnsavedWork()) return;
      event.preventDefault();
      event.returnValue = "";
    });
  }

  private async loadLibrary(): Promise<void> {
    this.setLibraryStatus("Loading local level files…", "working");
    try {
      const [listValue, indexValue] = await Promise.all([requestJson("/api/keyfall/levels"), requestJson("/api/keyfall/index")]);
      const list = listValue as Partial<LevelListResponse>;
      if (!Array.isArray(list.levels)) throw new Error("The level service returned no level list.");
      const parsed = list.levels.map((value) => parseLevelFile(value));
      this.savedLevels = new Map(parsed.map((file) => [file.room.id, file]));
      const index = parseLevelIndex(indexValue);
      this.campaign = [...index.levels];
      this.savedCampaign = JSON.stringify(this.campaign);
      this.renderLibrary();
      this.renderCampaign();
      const firstId = index.levels.find((id) => this.savedLevels.has(id)) ?? parsed[0]?.room.id;
      if (firstId) this.replaceDocument(this.savedLevels.get(firstId)!, true);
      const errors = Array.isArray(list.errors) ? list.errors : [];
      this.setLibraryStatus(errors.length ? `Loaded with ${errors.length} file error${errors.length === 1 ? "" : "s"}: ${errors.join(" ")}` : `${parsed.length} local level files loaded.`, errors.length ? "error" : "ok");
    } catch (error) {
      this.setLibraryStatus(errorMessage(error), "error");
      this.renderAll();
    }
  }

  private createBlank(): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current save to finish.", "working"); return; }
    if (!this.confirmReplace()) return;
    const id = this.newLevelId();
    if (!id) return;
    this.replaceDocument(blankLevel(id), false);
    this.setEditorStatus("Blank draft created. Add a key and goal before testing.", "ok");
  }

  private copyCurrent(): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current save to finish.", "working"); return; }
    if (!this.confirmReplace()) return;
    const id = this.newLevelId();
    if (!id) return;
    const copy = this.document.value;
    copy.room.id = id;
    copy.room.title = `${copy.room.title} Copy`;
    copy.playtested = false;
    this.replaceDocument(copy, false);
    this.setEditorStatus("Copy created with its source provenance retained. Save it to create the new file.", "ok");
  }

  private openLevel(id: string): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current save to finish.", "working"); this.required<HTMLSelectElement>("#level-select").value = this.document.value.room.id; return; }
    const file = this.savedLevels.get(id);
    if (!file) return;
    if (!this.confirmReplace()) { this.required<HTMLSelectElement>("#level-select").value = this.document.value.room.id; return; }
    this.replaceDocument(file, true);
    this.setEditorStatus(`Opened ${file.room.title}.`, "ok");
  }

  private replaceDocument(file: LevelFile, knownSaved: boolean): void {
    this.selection = null;
    this.document.replace(file);
    this.knownSaved = knownSaved;
    this.required<HTMLInputElement>("#new-level-id").value = suggestCopyId(file.room.id);
    this.renderAll();
  }

  private async saveLevel(): Promise<void> {
    if (this.savingLevel) return;
    if (isTextEntry(document.activeElement)) (document.activeElement as HTMLElement).blur();
    const payload = this.document.value;
    if (!isSafeLevelId(payload.room.id)) { this.setEditorStatus("Level ID must use lowercase letters, numbers, and single hyphens.", "error"); return; }
    const button = this.required<HTMLButtonElement>("#save-button");
    this.savingLevel = true;
    button.disabled = true;
    this.setEditorStatus("Saving level file…", "working");
    try {
      await requestJson(`/api/keyfall/levels/${encodeURIComponent(payload.room.id)}`, { method: "PUT", body: JSON.stringify(payload) });
      this.savedLevels.set(payload.room.id, payload);
      this.knownSaved = true;
      const unchanged = this.document.acceptSaved(payload);
      this.renderLibrary(); this.renderHeader();
      this.setEditorStatus(unchanged ? "Level file saved." : "Saved that version; newer edits are still unsaved.", unchanged ? "ok" : "working");
    } catch (error) {
      this.setEditorStatus(`Save failed: ${errorMessage(error)}`, "error");
    } finally {
      this.savingLevel = false;
      button.disabled = false;
      this.renderHeader();
    }
  }

  private addObject(kind: PaletteKind): void {
    if (this.playing) return;
    const count = this.document.value.room.cords.length + this.document.value.room.tickets.length + this.document.value.room.props.length + (this.document.value.room.elements?.length ?? 0);
    const at = { x: 280 + ((count % 5) - 2) * 18, y: 280 + (count % 7) * 22 };
    let selected: Selection | null = null;
    this.edit((file) => { selected = addPaletteObject(file.room, kind, at); });
    this.selection = selected;
    if ((kind === "key" && this.document.value.room.keyStart) || (kind === "goal" && this.document.value.room.goal)) {
      this.setEditorStatus(kind === "key" ? "This room uses one key." : "This room uses one goal.", "ok");
    }
    this.renderAll();
  }

  private edit(change: (file: LevelFile) => void): void {
    if (this.playing) return;
    if (this.document.edit(change)) this.renderAll();
  }

  private undo(): void { if (!this.playing && this.document.undo()) { this.ensureSelection(); this.renderAll(); } }
  private redo(): void { if (!this.playing && this.document.redo()) { this.ensureSelection(); this.renderAll(); } }

  private duplicate(): void {
    if (!this.selection || this.playing) return;
    let next: Selection | null = null;
    this.edit((file) => { next = duplicateSelection(file.room, this.selection!); });
    this.selection = next;
    this.renderAll();
  }

  private deleteSelected(): void {
    if (!this.selection || this.playing) return;
    const selection = this.selection;
    this.edit((file) => removeSelection(file.room, selection));
    this.selection = null;
    this.renderAll();
  }

  private applyInspectorPosition(): void {
    if (!this.selection) return;
    const x = this.required<HTMLInputElement>("#object-x").valueAsNumber;
    const y = this.required<HTMLInputElement>("#object-y").valueAsNumber;
    if (!Number.isFinite(x) || !Number.isFinite(y)) { this.setEditorStatus("Object coordinates must be numbers.", "error"); return; }
    const selection = this.selection;
    this.edit((file) => moveSelection(file.room, selection, { x, y }, this.snap));
  }

  private applyInspectorRotation(): void {
    if (!this.selection) return;
    const degrees = this.required<HTMLInputElement>("#object-rotation").valueAsNumber;
    if (!Number.isFinite(degrees)) { this.setEditorStatus("Rotation must be a number of degrees.", "error"); return; }
    const selection = this.selection;
    this.edit((file) => rotateSelection(file.room, selection, degrees * Math.PI / 180));
  }

  private applyInspectorPower(): void {
    if (!this.selection) return;
    const power = this.required<HTMLInputElement>("#object-power").valueAsNumber;
    if (!Number.isFinite(power)) { this.setEditorStatus("Fan power must be a number.", "error"); return; }
    const selection = this.selection;
    this.edit((file) => setSelectionPower(file.room, selection, power));
  }

  private applyInspectorLength(): void {
    if (!this.selection) return;
    const length = this.required<HTMLInputElement>("#object-length").valueAsNumber;
    if (!Number.isFinite(length)) { this.setEditorStatus("Platform length must be a number.", "error"); return; }
    const selection = this.selection;
    this.edit((file) => setSelectionLength(file.room, selection, length));
  }

  private pointerDown(event: PointerEvent): void {
    if (this.playing || event.button !== 0) return;
    const point = this.canvasPoint(event);
    this.selection = hitTest(this.document.value.room, point);
    if (this.selection) {
      this.dragging = true;
      this.document.beginBatch();
      (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId);
    }
    this.renderAll();
  }

  private pointerMove(event: PointerEvent): void {
    if (!this.dragging || !this.selection) return;
    const point = this.canvasPoint(event), selection = this.selection;
    if (this.document.edit((file) => moveSelection(file.room, selection, point, this.snap))) this.renderAll();
  }

  private pointerUp(event: PointerEvent): void {
    if (!this.dragging) return;
    const canvas = event.currentTarget as HTMLCanvasElement;
    this.finishDrag();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  private pointerCancel(_event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.document.cancelBatch();
    this.renderAll();
  }

  private finishDrag(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.document.endBatch();
    this.renderAll();
  }

  private canvasPoint(event: PointerEvent): Vec {
    const rect = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return { x: (event.clientX - rect.left) * BOARD_WIDTH / rect.width, y: (event.clientY - rect.top) * BOARD_HEIGHT / rect.height };
  }

  private startPlaytest(): void {
    if (this.playing) return;
    const file = this.document.value;
    const issues = draftIssues(file);
    if (issues.length) { this.setEditorStatus(`Playtest unavailable: ${issues.join(" ")}`, "error"); this.renderIssues(); return; }
    try {
      const room = playableRoom(parseLevelFile(file));
      this.testedRoom = JSON.parse(JSON.stringify(file.room)) as DraftRoom;
      this.playing = true;
      this.playState = "ready";
      this.preview.hide();
      this.root.classList.add("is-playtesting");
      this.setEditingEnabled(false);
      this.playtest.start(room);
      this.renderPlayStatus(0, false);
      this.playtest.resize();
    } catch (error) {
      this.playing = false;
      this.testedRoom = undefined;
      this.root.classList.remove("is-playtesting");
      this.setEditingEnabled(true);
      this.renderAll();
      this.setEditorStatus(`Playtest unavailable: ${errorMessage(error)}`, "error");
    }
  }

  private stopPlaytest(): void {
    if (!this.playing) return;
    this.playtest.stop();
    this.playing = false;
    this.testedRoom = undefined;
    this.root.classList.remove("is-playtesting");
    this.setEditingEnabled(true);
    this.renderAll();
    this.setEditorStatus("Playtest stopped. The editing layout is unchanged.", "ok");
  }

  private onPlayStatus(status: { state: RuntimeState; tickets: number; completed: boolean }): void {
    this.playState = status.state;
    if (status.completed && this.testedRoom && this.document.markPlaytested(this.testedRoom)) this.renderHeader();
    this.renderPlayStatus(status.tickets, status.completed);
  }

  private renderPlayStatus(tickets: number, completed: boolean): void {
    const state = completed ? "Completed" : this.playState === "paused" ? "Paused" : this.playState === "playing" ? "Playing" : "Ready";
    this.required<HTMLElement>("#playtest-status").textContent = `${state} · ${tickets} ticket${tickets === 1 ? "" : "s"}`;
    this.required<HTMLButtonElement>("#play-pause-button").textContent = this.playState === "paused" ? "Resume" : "Pause";
  }

  private addToCampaign(): void {
    const file = this.document.value;
    const issues = draftIssues(file);
    if (!this.knownSaved || this.document.dirty) { this.setCampaignStatus("Save this exact level version before adding it.", "error"); return; }
    if (issues.length) { this.setCampaignStatus(`Cannot add: ${issues.join(" ")}`, "error"); return; }
    if (this.campaign.includes(file.room.id)) { this.setCampaignStatus("That level is already in the campaign.", "ok"); return; }
    this.campaign.push(file.room.id);
    this.renderCampaign();
    this.setCampaignStatus("Added locally. Save order to write index.json.", "working");
  }

  private handleCampaignAction(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-campaign-action]");
    if (!button) return;
    const index = Number(button.dataset.index), action = button.dataset.campaignAction;
    if (!Number.isInteger(index) || index < 0 || index >= this.campaign.length) return;
    if (action === "remove") this.campaign.splice(index, 1);
    else if (action === "up" && index > 0) [this.campaign[index - 1], this.campaign[index]] = [this.campaign[index], this.campaign[index - 1]];
    else if (action === "down" && index < this.campaign.length - 1) [this.campaign[index], this.campaign[index + 1]] = [this.campaign[index + 1], this.campaign[index]];
    this.renderCampaign();
  }

  private async saveCampaign(): Promise<void> {
    if (this.savingCampaign) return;
    const payload: LevelIndex = { version: 1, levels: [...this.campaign] };
    const button = this.required<HTMLButtonElement>("#campaign-save-button");
    this.savingCampaign = true;
    button.disabled = true;
    this.setCampaignStatus("Saving campaign order…", "working");
    try {
      await requestJson("/api/keyfall/index", { method: "PUT", body: JSON.stringify(payload) });
      const sent = JSON.stringify(payload.levels);
      this.savedCampaign = sent;
      this.renderCampaign();
      this.setCampaignStatus(JSON.stringify(this.campaign) === sent ? "Campaign order saved." : "Saved that order; newer changes are still unsaved.", JSON.stringify(this.campaign) === sent ? "ok" : "working");
    } catch (error) { this.setCampaignStatus(`Campaign save failed: ${errorMessage(error)}`, "error"); }
    finally { this.savingCampaign = false; button.disabled = false; this.renderCampaign(); }
  }

  private keyDown(event: KeyboardEvent): void {
    const command = event.ctrlKey || event.metaKey;
    if (command && event.key.toLowerCase() === "s") {
      event.preventDefault();
      if (!this.playing) {
        if (isTextEntry(document.activeElement)) (document.activeElement as HTMLElement).blur();
        queueMicrotask(() => void this.saveLevel());
      }
      return;
    }
    if (isTextEntry(event.target)) return;
    if (command && event.key.toLowerCase() === "d" && this.selection) { event.preventDefault(); this.duplicate(); return; }
    if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if (command && event.key.toLowerCase() === "y") { event.preventDefault(); this.redo(); return; }
    if (this.playing || !this.selection) return;
    if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); this.deleteSelected(); return; }
    const rotateKey = event.key.toLowerCase();
    if (!command && !event.altKey && (rotateKey === "q" || rotateKey === "e")) {
      const selected = describeSelection(this.document.value.room, this.selection);
      if (selected?.rotation === undefined) return;
      event.preventDefault();
      const selection = this.selection;
      const currentRotation = selected.rotation;
      const step = Math.PI / 12 * (rotateKey === "q" ? -1 : 1);
      this.edit((file) => rotateSelection(file.room, selection, currentRotation + step));
      return;
    }
    const directions: Record<string, Vec> = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const selected = describeSelection(this.document.value.room, this.selection);
    if (!selected) return;
    const distance = event.shiftKey ? 10 : 1, selection = this.selection;
    this.edit((file) => moveSelection(file.room, selection, { x: selected.position.x + direction.x * distance, y: selected.position.y + direction.y * distance }, false));
  }

  private renderAll(): void {
    this.renderHeader();
    this.renderMetadata();
    this.renderInspector();
    this.renderIssues();
    this.renderLibrary();
    this.renderCampaign();
    if (!this.playing) this.renderPreview();
  }

  private renderHeader(): void {
    const file = this.document.value;
    const dirty = this.document.dirty || !this.knownSaved;
    this.required<HTMLElement>("#document-title").textContent = file.room.title;
    this.required<HTMLElement>("#document-id").textContent = file.room.id;
    const marker = this.required<HTMLElement>("#dirty-marker");
    marker.textContent = dirty ? "Unsaved" : "Saved";
    marker.dataset.dirty = String(dirty);
    this.required<HTMLElement>("#playtested-marker").textContent = file.playtested ? "Playtested" : "Not playtested";
    this.required<HTMLButtonElement>("#undo-button").disabled = !this.document.canUndo || this.playing;
    this.required<HTMLButtonElement>("#redo-button").disabled = !this.document.canRedo || this.playing;
  }

  private renderMetadata(): void {
    const room = this.document.value.room;
    const title = this.required<HTMLInputElement>("#room-title");
    const instruction = this.required<HTMLTextAreaElement>("#room-instruction");
    if (document.activeElement !== title) title.value = room.title;
    if (document.activeElement !== instruction) instruction.value = room.subtitle;
    this.required<HTMLInputElement>("#snap-toggle").checked = this.snap;
  }

  private renderInspector(): void {
    const selected = describeSelection(this.document.value.room, this.selection);
    const empty = this.required<HTMLElement>("#inspector-empty"), fields = this.required<HTMLElement>("#inspector-fields");
    empty.hidden = Boolean(selected); fields.hidden = !selected;
    if (!selected) return;
    this.required<HTMLElement>("#selected-label").textContent = selected.label;
    const xInput = this.required<HTMLInputElement>("#object-x"), yInput = this.required<HTMLInputElement>("#object-y");
    if (document.activeElement !== xInput) xInput.value = formatNumber(selected.position.x);
    if (document.activeElement !== yInput) yInput.value = formatNumber(selected.position.y);
    const rotationRow = this.required<HTMLElement>("#rotation-row");
    rotationRow.hidden = selected.rotation === undefined;
    const rotationInput = this.required<HTMLInputElement>("#object-rotation");
    if (selected.rotation !== undefined && document.activeElement !== rotationInput) rotationInput.value = formatNumber(selected.rotation * 180 / Math.PI);
    const powerRow = this.required<HTMLElement>("#power-row"), powerInput = this.required<HTMLInputElement>("#object-power");
    powerRow.hidden = selected.power === undefined;
    if (selected.power !== undefined && document.activeElement !== powerInput) powerInput.value = formatNumber(selected.power);
    const lengthRow = this.required<HTMLElement>("#length-row"), lengthInput = this.required<HTMLInputElement>("#object-length");
    lengthRow.hidden = selected.length === undefined;
    if (selected.length !== undefined && document.activeElement !== lengthInput) lengthInput.value = formatNumber(selected.length);
    this.required<HTMLButtonElement>("#duplicate-button").disabled = this.selection?.kind === "key" || this.selection?.kind === "goal";
  }

  private renderIssues(): void {
    const issues = draftIssues(this.document.value);
    const list = this.required<HTMLUListElement>("#issue-list");
    list.replaceChildren(...issues.map((issue) => element("li", issue)));
    this.required<HTMLElement>("#issue-summary").textContent = issues.length ? `${issues.length} structure issue${issues.length === 1 ? "" : "s"}` : "Ready to test and add";
    this.required<HTMLElement>("#issue-summary").dataset.valid = String(issues.length === 0);
    this.required<HTMLButtonElement>("#play-button").disabled = issues.length > 0 || this.playing;
  }

  private renderPreview(): void { this.preview.show(this.document.value, this.selection, this.snap); }

  private renderLibrary(): void {
    const select = this.required<HTMLSelectElement>("#level-select");
    const selected = this.document.value.room.id;
    select.replaceChildren(...[...this.savedLevels.values()].sort((a, b) => a.room.title.localeCompare(b.room.title)).map((file) => {
      const option = document.createElement("option");
      option.value = file.room.id;
      option.textContent = `${file.room.title} · ${file.room.wing}`;
      return option;
    }));
    if (this.savedLevels.has(selected)) select.value = selected;
    else select.selectedIndex = -1;
  }

  private renderCampaign(): void {
    const list = this.required<HTMLOListElement>("#campaign-list");
    list.replaceChildren(...this.campaign.map((id, index) => {
      const file = this.savedLevels.get(id);
      const item = document.createElement("li");
      const label = document.createElement("span");
      label.textContent = file ? file.room.title : `${id} (missing file)`;
      const controls = document.createElement("span"); controls.className = "campaign-row-actions";
      controls.append(
        campaignButton("↑", "Move up", "up", index, index === 0),
        campaignButton("↓", "Move down", "down", index, index === this.campaign.length - 1),
        campaignButton("Remove", "Remove from campaign", "remove", index, false),
      );
      item.append(label, controls); return item;
    }));
    const dirty = JSON.stringify(this.campaign) !== this.savedCampaign;
    const marker = this.required<HTMLElement>("#campaign-dirty"); marker.textContent = dirty ? "Unsaved order" : "Order saved"; marker.dataset.dirty = String(dirty);
    this.required<HTMLButtonElement>("#campaign-save-button").disabled = this.savingCampaign || !dirty;
    this.required<HTMLButtonElement>("#campaign-clear-button").disabled = this.campaign.length === 0;
  }

  private setEditingEnabled(enabled: boolean): void {
    this.root.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>("[data-edit-control]").forEach((control) => { control.disabled = !enabled; });
  }

  private bindBatchedInput(control: HTMLInputElement | HTMLTextAreaElement, update: () => void): void {
    control.addEventListener("focus", () => this.document.beginBatch());
    control.addEventListener("input", update);
    control.addEventListener("blur", () => { this.document.endBatch(); this.renderAll(); });
  }

  private ensureSelection(): void { if (this.selection && !describeSelection(this.document.value.room, this.selection)) this.selection = null; }
  private hasUnsavedWork(): boolean { return this.document.dirty || !this.knownSaved || JSON.stringify(this.campaign) !== this.savedCampaign; }
  private confirmReplace(): boolean { return !this.document.dirty && this.knownSaved || window.confirm("Replace this draft and discard its unsaved changes?"); }

  private newLevelId(): string | null {
    const input = this.required<HTMLInputElement>("#new-level-id"), id = input.value.trim();
    if (!isSafeLevelId(id)) { this.setEditorStatus("Choose a lowercase ID using letters, numbers, and single hyphens.", "error"); input.focus(); return null; }
    if (this.savedLevels.has(id)) { this.setEditorStatus("That level ID already exists. Open it or choose a new ID.", "error"); input.focus(); return null; }
    return id;
  }

  private setEditorStatus(message: string, kind: "ok" | "working" | "error"): void { const node = this.required<HTMLElement>("#editor-status"); node.textContent = message; node.dataset.kind = kind; }
  private setLibraryStatus(message: string, kind: "ok" | "working" | "error"): void { const node = this.required<HTMLElement>("#library-status"); node.textContent = message; node.dataset.kind = kind; }
  private setCampaignStatus(message: string, kind: "ok" | "working" | "error"): void { const node = this.required<HTMLElement>("#campaign-status"); node.textContent = message; node.dataset.kind = kind; }
  private required<T extends Element>(selector: string): T { const value = this.root.querySelector<T>(selector); if (!value) throw new Error(`Missing editor control: ${selector}`); return value; }
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const value = await response.json().catch(() => ({})) as { error?: unknown };
  if (!response.ok) throw new Error(typeof value.error === "string" ? value.error : `${response.status} ${response.statusText}`);
  return value;
}

function campaignButton(text: string, label: string, action: string, index: number, disabled: boolean): HTMLButtonElement {
  const button = document.createElement("button"); button.type = "button"; button.textContent = text; button.title = label; button.setAttribute("aria-label", label); button.dataset.campaignAction = action; button.dataset.index = String(index); button.disabled = disabled; return button;
}
function element(tag: "li", text: string): HTMLLIElement { const node = document.createElement(tag); node.textContent = text; return node; }
function isTextEntry(target: EventTarget | null): boolean { return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable); }
function formatNumber(value: number): string { return String(Math.round(value * 100) / 100); }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function suggestCopyId(id: string): string { return `${id.replace(/-copy(?:-\d+)?$/, "")}-copy`; }
function draftIssues(file: LevelFile): string[] {
  try { return levelIssues(parseLevelFile(file)); }
  catch (error) { return [errorMessage(error)]; }
}
