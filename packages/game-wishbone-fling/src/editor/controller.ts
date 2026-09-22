import {
  copyLevelFile, isSafeLevelId, levelIssues, parseLevelFile, parseLevelIndex, playableYard,
  type LevelFile, type LevelIndex,
} from "../level-files";
import { EditorPlaytest } from "./playtest";
import { EditorPreview } from "./preview";
import {
  EditorDocument, addPaletteObject, blankLevel, describeSelection, duplicateSelection, hitTest,
  linkSelection, moveSelection, removeSelection, resizeSelection, rotateSelection, selectionExists,
  type PaletteKind, type Selection,
} from "./model";

type ListResponse = { levels: unknown[]; errors: string[] };

export class WishboneEditorController {
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
  private panning = false;
  private spaceDown = false;
  private playing = false;
  private pointerLast = { x: 0, y: 0 };
  private savingLevel = false;
  private savingCampaign = false;

  constructor(private readonly root: HTMLElement) {
    const canvas = this.required<HTMLCanvasElement>("#editor-canvas");
    const overlay = this.required<HTMLCanvasElement>("#editor-overlay");
    this.preview = new EditorPreview(canvas, overlay);
    this.playtest = new EditorPlaytest(this.required("#play-stage"), (paused) => {
      this.required<HTMLButtonElement>("#play-pause-button").textContent = paused ? "Resume" : "Pause";
      this.required("#playtest-status").textContent = paused ? "Paused isolated playtest" : "Running isolated playtest";
    }, () => this.stopPlaytest());
    this.bindActions(overlay);
    this.renderAll();
    void this.loadLibrary();
  }

  dispose(): void { this.preview.dispose(); this.playtest.dispose(); }

  private bindActions(overlay: HTMLCanvasElement): void {
    this.onClick("#blank-button", () => this.createBlank());
    this.onClick("#copy-button", () => this.copyCurrent());
    this.onClick("#save-button", () => void this.saveLevel());
    this.required<HTMLSelectElement>("#level-select").addEventListener("change", (event) => this.openLevel((event.currentTarget as HTMLSelectElement).value));
    this.bindChange("#yard-name", (input) => this.edit((file) => { file.yard.name = input.value; }));
    this.bindChange("#yard-subtitle", (input) => this.edit((file) => { file.yard.subtitle = input.value; }));
    this.bindChange("#world-width", (input) => this.changeWorld("width", input.valueAsNumber));
    this.bindChange("#world-height", (input) => this.changeWorld("height", input.valueAsNumber));
    this.required<HTMLInputElement>("#snap-toggle").addEventListener("change", (event) => { this.snap = (event.currentTarget as HTMLInputElement).checked; this.renderPreview(); });
    this.onClick("#undo-button", () => this.undo()); this.onClick("#redo-button", () => this.redo());
    this.onClick("#zoom-in-button", () => this.preview.zoomAt(1.2)); this.onClick("#zoom-out-button", () => this.preview.zoomAt(1 / 1.2)); this.onClick("#fit-button", () => this.preview.fit());
    this.onClick("#duplicate-button", () => this.duplicate()); this.onClick("#delete-button", () => this.deleteSelected());
    this.bindChange("#object-x", () => this.applyInspectorPosition()); this.bindChange("#object-y", () => this.applyInspectorPosition());
    this.bindChange("#object-rotation", () => this.applyInspectorRotation());
    this.bindChange("#object-width", () => this.applyInspectorSize()); this.bindChange("#object-height", () => this.applyInspectorSize());
    this.required<HTMLSelectElement>("#object-link").addEventListener("change", (event) => {
      if (!this.selection) return; const selection = this.selection;
      this.edit((file) => linkSelection(file, selection, (event.currentTarget as HTMLSelectElement).value || undefined));
    });
    this.root.querySelectorAll<HTMLButtonElement>("[data-palette]").forEach((button) => button.addEventListener("click", () => this.addObject(button.dataset.palette as PaletteKind)));
    this.onClick("#play-button", () => this.startPlaytest()); this.onClick("#play-pause-button", () => this.playtest.togglePause());
    this.onClick("#play-restart-button", () => this.playtest.restart()); this.onClick("#play-stop-button", () => this.stopPlaytest());
    this.onClick("#campaign-add-button", () => this.addToCampaign()); this.onClick("#campaign-save-button", () => void this.saveCampaign());
    this.required<HTMLOListElement>("#campaign-list").addEventListener("click", (event) => this.handleCampaignAction(event));

    overlay.addEventListener("pointerdown", (event) => this.pointerDown(event));
    overlay.addEventListener("pointermove", (event) => this.pointerMove(event));
    overlay.addEventListener("pointerup", (event) => this.pointerUp(event));
    overlay.addEventListener("pointercancel", (event) => this.pointerCancel(event));
    overlay.addEventListener("wheel", (event) => { event.preventDefault(); this.preview.zoomAt(Math.exp(-event.deltaY * .0015), this.canvasPoint(event)); }, { passive: false });
    window.addEventListener("resize", () => this.preview.resize());
    window.addEventListener("keydown", (event) => this.keyDown(event));
    window.addEventListener("keyup", (event) => { if (event.code === "Space") this.spaceDown = false; });
    window.addEventListener("beforeunload", (event) => { if (this.hasUnsavedWork()) { event.preventDefault(); event.returnValue = ""; } });
  }

  private async loadLibrary(): Promise<void> {
    const [listResult, indexResult] = await Promise.allSettled([requestJson("/api/wishbone/levels"), requestJson("/api/wishbone/index")]);
    const messages: string[] = [];
    let parsed: LevelFile[] = [];
    if (listResult.status === "fulfilled") {
      try {
        const list = listResult.value as Partial<ListResponse>;
        if (!Array.isArray(list.levels)) throw new Error("The local level service returned no files.");
        parsed = list.levels.map(parseLevelFile);
        this.savedLevels = new Map(parsed.map((file) => [file.yard.id, file]));
        if (Array.isArray(list.errors)) messages.push(...list.errors);
      } catch (error) { messages.push(errorMessage(error)); }
    } else messages.push(`Level files unavailable: ${errorMessage(listResult.reason)}`);
    if (indexResult.status === "fulfilled") {
      try { const index = parseLevelIndex(indexResult.value); this.campaign = [...index.levels]; this.savedCampaign = JSON.stringify(this.campaign); }
      catch (error) { this.campaign = []; this.savedCampaign = "__missing-index__"; messages.push(errorMessage(error)); }
    } else { this.campaign = []; this.savedCampaign = "__missing-index__"; messages.push(`Playable order unavailable: ${errorMessage(indexResult.reason)} Save order to create it.`); }
    const untouchedInitial = !this.knownSaved && !this.document.dirty && this.document.value.yard.id === "new-wishbone-yard";
    const first = this.campaign.find((id) => this.savedLevels.has(id)) ?? parsed[0]?.yard.id;
    if (first && untouchedInitial) this.replaceDocument(this.savedLevels.get(first)!, true);
    this.setStatus("#library-status", messages.length ? `Loaded ${parsed.length} file(s). ${messages.join(" ")}` : `${parsed.length} local level files loaded.`, messages.length ? "error" : "ok");
    this.renderAll();
  }

  private createBlank(): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current file save to finish.", "working"); return; }
    if (!this.confirmReplace()) return; const id = this.newLevelId(); if (!id) return;
    this.replaceDocument(blankLevel(id), false); this.setEditorStatus("Blank draft created. The launcher support follows the launcher automatically.", "ok");
  }

  private copyCurrent(): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current file save to finish.", "working"); return; }
    const id = this.newLevelId(); if (!id) return;
    try { const copy = copyLevelFile(this.document.value, id); copy.yard.name += " Copy"; this.replaceDocument(copy, false); this.setEditorStatus("Independent copy created with new object identities.", "ok"); }
    catch (error) { this.setEditorStatus(errorMessage(error), "error"); }
  }

  private openLevel(id: string): void {
    if (this.savingLevel) { this.setEditorStatus("Wait for the current file save to finish.", "working"); this.renderLibrary(); return; }
    const file = this.savedLevels.get(id); if (!file) return;
    if (!this.confirmReplace()) { this.required<HTMLSelectElement>("#level-select").value = this.document.value.yard.id; return; }
    this.replaceDocument(file, true); this.setEditorStatus(`Opened ${file.yard.name}.`, "ok");
  }

  private replaceDocument(file: LevelFile, knownSaved: boolean): void {
    this.selection = null; this.document.replace(file); this.knownSaved = knownSaved;
    this.required<HTMLInputElement>("#new-level-id").value = suggestCopyId(file.yard.id); this.preview.fit(); this.renderAll();
  }

  private async saveLevel(): Promise<void> {
    if (this.savingLevel || this.playing) return;
    if (isTextEntry(document.activeElement)) (document.activeElement as HTMLElement).blur();
    const payload = this.document.value;
    if (!isSafeLevelId(payload.yard.id)) { this.setEditorStatus("Level ID must use lowercase letters, numbers, and single hyphens.", "error"); return; }
    this.savingLevel = true; this.required<HTMLButtonElement>("#save-button").disabled = true; this.setEditorStatus("Saving draft file…", "working");
    try {
      const result = await requestJson(`/api/wishbone/levels/${encodeURIComponent(payload.yard.id)}`, { method: "PUT", body: JSON.stringify(payload) }) as { level?: unknown };
      const saved = parseLevelFile(result.level ?? payload);
      this.savedLevels.set(saved.yard.id, saved);
      const stillActive = this.document.value.yard.id === saved.yard.id;
      const unchanged = stillActive ? this.document.acceptSaved(saved) : false;
      if (stillActive) this.knownSaved = true;
      this.renderAll(); this.setEditorStatus(!stillActive ? "File saved; another draft is now open." : unchanged ? "Draft file saved." : "Saved that version; newer edits remain unsaved.", stillActive && unchanged ? "ok" : "working");
    } catch (error) { this.setEditorStatus(`Save failed: ${errorMessage(error)}`, "error"); }
    finally { this.savingLevel = false; this.required<HTMLButtonElement>("#save-button").disabled = false; this.renderHeader(); }
  }

  private edit(change: (file: LevelFile) => void): void { if (!this.playing && this.document.edit(change)) this.renderAll(); }
  private undo(): void { if (!this.playing && this.document.undo()) { this.ensureSelection(); this.renderAll(); } }
  private redo(): void { if (!this.playing && this.document.redo()) { this.ensureSelection(); this.renderAll(); } }
  private addObject(kind: PaletteKind): void {
    const file = this.document.value, count = file.yard.pieces.length + file.yard.terrain.length + file.yard.devices.length;
    let next: Selection | null = null; this.edit((draft) => { next = addPaletteObject(draft, kind, { x: Math.min(draft.yard.world.width - 80, 360 + count * 18), y: Math.min(draft.yard.world.height - 80, 280 + (count % 7) * 34) }); });
    this.selection = next; this.renderAll();
  }
  private duplicate(): void { if (!this.selection) return; const current = this.selection; let next: Selection | null = null; this.edit((file) => { next = duplicateSelection(file, current); }); this.selection = next; this.renderAll(); }
  private deleteSelected(): void { if (!this.selection) return; const current = this.selection; this.edit((file) => removeSelection(file, current)); this.selection = null; this.renderAll(); }
  private changeWorld(axis: "width" | "height", value: number): void { if (Number.isFinite(value)) this.edit((file) => { file.yard.world[axis] = Math.max(axis === "width" ? 320 : 320, Math.min(10000, value)); }); }

  private applyInspectorPosition(): void {
    if (!this.selection) return; const x = this.required<HTMLInputElement>("#object-x").valueAsNumber, y = this.required<HTMLInputElement>("#object-y").valueAsNumber;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return; const selection = this.selection; this.edit((file) => moveSelection(file, selection, { x, y }, this.snap));
  }
  private applyInspectorRotation(): void {
    if (!this.selection) return; const degrees = this.required<HTMLInputElement>("#object-rotation").valueAsNumber; if (!Number.isFinite(degrees)) return;
    const selection = this.selection; this.edit((file) => rotateSelection(file, selection, degrees * Math.PI / 180));
  }
  private applyInspectorSize(): void {
    if (!this.selection) return; const width = this.required<HTMLInputElement>("#object-width").valueAsNumber, height = this.required<HTMLInputElement>("#object-height").valueAsNumber;
    const selection = this.selection; this.edit((file) => resizeSelection(file, selection, width, height));
  }

  private pointerDown(event: PointerEvent): void {
    if (this.playing || (event.button !== 0 && event.button !== 1)) return;
    this.pointerLast = this.canvasPoint(event); this.panning = event.button === 1 || this.spaceDown;
    if (!this.panning) { this.selection = hitTest(this.document.value, this.preview.toWorld(this.pointerLast)); if (this.selection) { this.dragging = true; this.document.beginBatch(); } }
    (event.currentTarget as HTMLCanvasElement).setPointerCapture(event.pointerId); (event.currentTarget as HTMLCanvasElement).classList.add("dragging"); this.renderAll();
  }
  private pointerMove(event: PointerEvent): void {
    const point = this.canvasPoint(event);
    if (this.panning) this.preview.pan(point.x - this.pointerLast.x, point.y - this.pointerLast.y);
    else if (this.dragging && this.selection) { const selection = this.selection; if (this.document.edit((file) => moveSelection(file, selection, this.preview.toWorld(point), this.snap))) this.renderAll(); }
    this.pointerLast = point;
  }
  private pointerUp(event: PointerEvent): void { this.finishPointer(); const canvas = event.currentTarget as HTMLCanvasElement; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); }
  private pointerCancel(event: PointerEvent): void { if (this.dragging) this.document.cancelBatch(); this.finishPointer(); (event.currentTarget as HTMLCanvasElement).classList.remove("dragging"); this.renderAll(); }
  private finishPointer(): void { if (this.dragging) this.document.endBatch(); this.dragging = false; this.panning = false; this.required("#editor-overlay").classList.remove("dragging"); this.renderAll(); }
  private canvasPoint(event: { clientX: number; clientY: number }) { const rect = this.required<HTMLCanvasElement>("#editor-overlay").getBoundingClientRect(); return { x: (event.clientX - rect.left) * 1200 / rect.width, y: (event.clientY - rect.top) * 720 / rect.height }; }

  private startPlaytest(): void {
    if (this.playing) return; const file = this.document.value, issues = levelIssues(file);
    if (issues.length) { this.setEditorStatus(`Play unavailable: ${issues.join(" ")}`, "error"); return; }
    try { playableYard(file); this.playing = true; this.root.classList.add("is-playtesting"); this.setEditingEnabled(false); this.preview.hide(); this.playtest.start(file); this.document.markPlaytested(file.yard); this.renderHeader(); }
    catch (error) { this.playtest.stop(); this.playing = false; this.root.classList.remove("is-playtesting"); this.setEditingEnabled(true); this.renderAll(); this.setEditorStatus(`Play unavailable: ${errorMessage(error)}`, "error"); }
  }
  private stopPlaytest(): void { if (!this.playing) return; this.playtest.stop(); this.playing = false; this.root.classList.remove("is-playtesting"); this.setEditingEnabled(true); this.renderAll(); this.setEditorStatus("Playtest stopped. The exact authored layout is restored.", "ok"); }

  private addToCampaign(): void {
    const file = this.document.value, issues = levelIssues(file);
    if (!this.knownSaved || this.document.dirty) { this.setCampaignStatus("Save this exact draft before including it.", "error"); return; }
    if (issues.length) { this.setCampaignStatus(`Cannot include: ${issues.join(" ")}`, "error"); return; }
    if (!this.campaign.includes(file.yard.id)) this.campaign.push(file.yard.id); this.renderCampaign(); this.setCampaignStatus("Included locally. Save order to write index.json.", "working");
  }
  private handleCampaignAction(event: Event): void {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-campaign-action]"); if (!button) return;
    const index = Number(button.dataset.index), action = button.dataset.campaignAction; if (!Number.isInteger(index) || index < 0 || index >= this.campaign.length) return;
    if (action === "remove") this.campaign.splice(index, 1);
    else if (action === "up" && index > 0) [this.campaign[index - 1], this.campaign[index]] = [this.campaign[index], this.campaign[index - 1]];
    else if (action === "down" && index < this.campaign.length - 1) [this.campaign[index + 1], this.campaign[index]] = [this.campaign[index], this.campaign[index + 1]];
    this.renderCampaign();
  }
  private async saveCampaign(): Promise<void> {
    if (this.savingCampaign) return; const payload: LevelIndex = { version: 1, levels: [...this.campaign] };
    this.savingCampaign = true; this.required<HTMLButtonElement>("#campaign-save-button").disabled = true; this.setCampaignStatus("Saving playable order…", "working");
    try { await requestJson("/api/wishbone/index", { method: "PUT", body: JSON.stringify(payload) }); const sent = JSON.stringify(payload.levels); this.savedCampaign = sent; this.renderCampaign(); this.setCampaignStatus(JSON.stringify(this.campaign) === sent ? "Playable order saved." : "Saved that order; newer changes remain.", "ok"); }
    catch (error) { this.setCampaignStatus(`Order save failed: ${errorMessage(error)}`, "error"); }
    finally { this.savingCampaign = false; this.required<HTMLButtonElement>("#campaign-save-button").disabled = false; }
  }

  private keyDown(event: KeyboardEvent): void {
    if (event.code === "Space" && !isTextEntry(event.target)) { this.spaceDown = true; event.preventDefault(); }
    const command = event.ctrlKey || event.metaKey;
    if (command && event.key.toLowerCase() === "s") { event.preventDefault(); if (!this.playing) void this.saveLevel(); return; }
    if (isTextEntry(event.target) || this.playing) return;
    if (command && event.key.toLowerCase() === "z") { event.preventDefault(); event.shiftKey ? this.redo() : this.undo(); return; }
    if (command && event.key.toLowerCase() === "y") { event.preventDefault(); this.redo(); return; }
    if (command && event.key.toLowerCase() === "c" && this.selection) { event.preventDefault(); this.duplicate(); return; }
    if ((event.key === "Delete" || event.key === "Backspace") && this.selection) { event.preventDefault(); this.deleteSelected(); return; }
    if (event.key.startsWith("Arrow") && this.selection) {
      event.preventDefault(); const selected = describeSelection(this.document.value, this.selection); if (!selected) return;
      const amount = event.shiftKey ? 20 : 1, selection = this.selection;
      const dx = event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0, dy = event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0;
      this.edit((file) => moveSelection(file, selection, { x: selected.x + dx, y: selected.y + dy }, false));
    }
  }

  private renderAll(): void { this.renderHeader(); this.renderDetails(); this.renderLibrary(); this.renderInspector(); this.renderIssues(); this.renderCampaign(); this.renderPreview(); }
  private renderHeader(): void { const file = this.document.value, unsaved = !this.knownSaved || this.document.dirty; this.required("#document-title").textContent = file.yard.name || "Untitled Yard"; this.required("#document-id").textContent = file.yard.id; const marker = this.required("#dirty-marker"); marker.textContent = !this.knownSaved ? "New draft" : this.document.dirty ? "Unsaved" : "Saved"; marker.dataset.dirty = String(unsaved); this.required<HTMLButtonElement>("#undo-button").disabled = !this.document.canUndo; this.required<HTMLButtonElement>("#redo-button").disabled = !this.document.canRedo; }
  private renderDetails(): void { const yard = this.document.value.yard; this.setInput("#yard-name", yard.name); this.setInput("#yard-subtitle", yard.subtitle); this.setInput("#world-width", yard.world.width); this.setInput("#world-height", yard.world.height); }
  private renderLibrary(): void { const select = this.required<HTMLSelectElement>("#level-select"), current = this.document.value.yard.id; select.replaceChildren(); if (!this.knownSaved) select.add(new Option(`Unsaved draft · ${current}`, current)); for (const file of [...this.savedLevels.values()].sort((a, b) => a.yard.name.localeCompare(b.yard.name))) { const option = new Option(`${file.yard.name} · ${file.yard.id}`, file.yard.id); select.add(option); } if (!this.knownSaved || this.savedLevels.has(current)) select.value = current; }
  private renderPreview(): void { if (!this.playing) { this.preview.show(this.document.value, this.selection, this.snap); this.preview.resize(); } }
  private renderInspector(): void {
    const file = this.document.value, selected = describeSelection(file, this.selection), fields = this.required("#inspector-fields"); this.required("#inspector-empty").hidden = !!selected; fields.hidden = !selected; if (!selected) return;
    this.required("#selected-label").textContent = selected.label; this.setInput("#object-x", round(selected.x)); this.setInput("#object-y", round(selected.y));
    const rotation = this.required<HTMLElement>("#rotation-row"); rotation.hidden = selected.angle === undefined; if (selected.angle !== undefined) this.setInput("#object-rotation", round(selected.angle * 180 / Math.PI));
    const sizes = this.required("#size-fields"); sizes.hidden = selected.width === undefined; if (selected.width !== undefined) { this.setInput("#object-width", round(selected.width)); this.setInput("#object-height", round(selected.height!)); }
    const linkRow = this.required<HTMLElement>("#link-row"), select = this.required<HTMLSelectElement>("#object-link"); linkRow.hidden = !selected.linkKind; select.replaceChildren(new Option("Choose a target…", ""));
    if (selected.linkKind) for (const device of file.yard.devices.filter((item) => item.kind === selected.linkKind)) select.add(new Option(device.id, device.id)); select.value = selected.targetId ?? "";
    this.required<HTMLButtonElement>("#duplicate-button").disabled = this.selection?.kind === "launcher";
  }
  private renderIssues(): void { const issues = levelIssues(this.document.value), list = this.required<HTMLUListElement>("#issue-list"); list.replaceChildren(...issues.map((issue) => { const item = document.createElement("li"); item.textContent = issue; return item; })); const summary = this.required("#issue-summary"); summary.textContent = issues.length ? `${issues.length} issue${issues.length === 1 ? "" : "s"}` : "Ready"; summary.dataset.valid = String(!issues.length); this.required<HTMLButtonElement>("#play-button").disabled = !!issues.length; }
  private renderCampaign(): void {
    const list = this.required<HTMLOListElement>("#campaign-list"); list.replaceChildren(); this.campaign.forEach((id, index) => { const row = document.createElement("li"), title = document.createElement("span"), actions = document.createElement("span"), saved = this.savedLevels.get(id); title.textContent = saved ? `${saved.yard.name}${levelIssues(saved).length ? " (invalid; omitted from play)" : ""}` : `${id} (missing; omitted from play)`; actions.className = "campaign-row-actions"; for (const [action, label] of [["up", "↑"], ["down", "↓"], ["remove", "×"]] as const) { const button = document.createElement("button"); button.type = "button"; button.dataset.campaignAction = action; button.dataset.index = String(index); button.textContent = label; button.disabled = action === "up" ? index === 0 : action === "down" ? index === this.campaign.length - 1 : false; actions.append(button); } row.append(title, actions); list.append(row); }); const dirty = JSON.stringify(this.campaign) !== this.savedCampaign, marker = this.required("#campaign-dirty"); marker.textContent = dirty ? "Order unsaved" : "Order saved"; marker.dataset.dirty = String(dirty); }

  private setEditingEnabled(enabled: boolean): void { this.root.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>("[data-edit-control], .campaign-panel button").forEach((control) => { control.disabled = !enabled; }); }
  private ensureSelection(): void { if (!selectionExists(this.document.value, this.selection)) this.selection = null; }
  private hasUnsavedWork(): boolean { return !this.knownSaved || this.document.dirty || JSON.stringify(this.campaign) !== this.savedCampaign; }
  private confirmReplace(): boolean { return (this.knownSaved && !this.document.dirty) || window.confirm("Discard the unsaved draft or changes to this yard?"); }
  private newLevelId(): string | null { const id = this.required<HTMLInputElement>("#new-level-id").value.trim(); if (!isSafeLevelId(id)) { this.setEditorStatus("Use lowercase letters, numbers, and single hyphens for the file ID.", "error"); return null; } if (this.savedLevels.has(id)) { this.setEditorStatus("That file ID already exists. Open it or choose another ID.", "error"); return null; } return id; }
  private setEditorStatus(message: string, kind: string): void { this.setStatus("#editor-status", message, kind); }
  private setCampaignStatus(message: string, kind: string): void { this.setStatus("#campaign-status", message, kind); }
  private setStatus(selector: string, message: string, kind: string): void { const target = this.required(selector); target.textContent = message; target.dataset.kind = kind; }
  private setInput(selector: string, value: string | number): void { const input = this.required<HTMLInputElement | HTMLTextAreaElement>(selector); if (document.activeElement !== input) input.value = String(value); }
  private bindChange(selector: string, action: (input: HTMLInputElement) => void): void {
    const input = this.required<HTMLInputElement>(selector);
    input.addEventListener("focus", () => this.document.beginBatch());
    input.addEventListener("input", () => action(input));
    input.addEventListener("blur", () => { this.document.endBatch(); this.renderAll(); });
  }
  private onClick(selector: string, action: () => void): void { this.required<HTMLButtonElement>(selector).addEventListener("click", action); }
  private required<T extends HTMLElement = HTMLElement>(selector: string): T { const item = this.root.querySelector<T>(selector); if (!item) throw new Error(`Missing editor control ${selector}`); return item; }
}

async function requestJson(url: string, init?: RequestInit): Promise<unknown> { const response = await fetch(url, { ...init, headers: init?.body ? { "Content-Type": "application/json" } : undefined }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : `${response.status} ${response.statusText}`); return body; }
function errorMessage(error: unknown): string { return error instanceof Error ? error.message : String(error); }
function isTextEntry(target: EventTarget | null): boolean { return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement; }
function round(value: number): number { return Math.round(value * 100) / 100; }
function suggestCopyId(id: string): string { return `${id.replace(/-copy-\d+$/, "")}-copy-1`; }
