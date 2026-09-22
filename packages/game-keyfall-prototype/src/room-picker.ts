import type { CampaignCatalog } from "./catalog";
import type { KeyfallProgress, RoomDefinition, RoomWing } from "./types";

const WINGS: readonly RoomWing[] = ["campaign", "prototype"];

export class RoomPicker {
  private activeWing: RoomWing;
  private readonly tabButtons = new Map<RoomWing, HTMLButtonElement>();
  private readonly panels = new Map<RoomWing, HTMLElement>();
  private readonly roomButtons = new Map<string, HTMLButtonElement>();

  constructor(
    private readonly root: HTMLElement,
    private readonly catalog: CampaignCatalog,
    private readonly onSelect: (room: RoomDefinition) => void,
    selectedRoomId: string,
    private readonly orderedFiles = false,
  ) {
    const selected = catalog.roomById(selectedRoomId);
    this.activeWing = orderedFiles ? "campaign" : selected?.wing ?? (catalog.roomsForWing("campaign").length ? "campaign" : "prototype");
    this.render();
  }

  select(roomId: string, progress: KeyfallProgress): void {
    const room = this.catalog.roomById(roomId);
    if (!room) return;
    this.activeWing = this.orderedFiles ? "campaign" : room.wing;
    this.update(progress, roomId);
  }

  update(progress: KeyfallProgress, selectedRoomId: string): void {
    for (const wing of WINGS) {
      const selected = wing === this.activeWing;
      this.tabButtons.get(wing)?.setAttribute("aria-selected", String(selected));
      const tab = this.tabButtons.get(wing);
      if (tab) tab.tabIndex = selected ? 0 : -1;
      const panel = this.panels.get(wing);
      if (panel) panel.hidden = !selected;
    }
    for (const room of this.catalog.all()) {
      const button = this.roomButtons.get(room.id);
      if (!button) continue;
      const current = room.id === selectedRoomId;
      if (current) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
      const completed = progress.completed.includes(room.id);
      const tickets = progress.bestTickets[room.id] ?? 0;
      button.classList.toggle("is-complete", completed);
      button.setAttribute("aria-label", `${room.title}. ${completed ? `Complete, best ${tickets} of 3 tickets` : "Not yet complete"}.`);
    }
  }

  private render(): void {
    this.root.replaceChildren();
    const tabs = document.createElement("div");
    tabs.className = "wing-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Room wings");
    const panels = document.createElement("div");
    panels.className = "wing-panels";

    for (const wing of this.orderedFiles ? ["campaign" as const] : WINGS) {
      const rooms = this.orderedFiles ? this.catalog.all() : this.catalog.roomsForWing(wing);
      const tab = document.createElement("button");
      tab.type = "button";
      tab.id = `keyfall-${wing}-tab`;
      tab.className = "wing-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `keyfall-${wing}-panel`);
      tab.textContent = `${wing === "campaign" ? "Campaign" : "Prototype"} (${rooms.length})`;
      tab.addEventListener("click", () => this.activateWing(wing));
      tab.addEventListener("keydown", (event) => this.handleTabKey(event, wing));
      tabs.append(tab);
      this.tabButtons.set(wing, tab);

      const panel = document.createElement("section");
      panel.id = `keyfall-${wing}-panel`;
      panel.className = "wing-panel";
      if (!this.orderedFiles) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
      } else panel.setAttribute("aria-label", "Levels in campaign order");
      if (rooms.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-wing";
        empty.textContent = "No rooms are included in this wing. Add saved levels using the local editor's campaign list.";
        panel.append(empty);
      } else {
        const grid = document.createElement("div");
        grid.className = "room-grid";
        rooms.forEach((room, index) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "room-button";
          const number = document.createElement("span");
          number.className = "room-number"; number.textContent = String(index + 1);
          const title = document.createElement("span"); title.textContent = room.title;
          const state = document.createElement("span"); state.className = "room-state";
          state.setAttribute("aria-hidden", "true"); state.textContent = "●";
          button.append(number, title, state);
          button.addEventListener("click", () => this.onSelect(room));
          grid.append(button);
          this.roomButtons.set(room.id, button);
        });
        panel.append(grid);
      }
      panels.append(panel);
      this.panels.set(wing, panel);
    }
    if (this.orderedFiles) {
      const title = document.createElement("p");
      title.className = "eyebrow"; title.textContent = `Levels · ${this.catalog.all().length}`;
      this.root.append(title, panels);
    } else this.root.append(tabs, panels);
  }

  private activateWing(wing: RoomWing): void {
    this.activeWing = wing;
    for (const candidate of WINGS) {
      const selected = candidate === wing;
      const tab = this.tabButtons.get(candidate);
      tab?.setAttribute("aria-selected", String(selected));
      if (tab) tab.tabIndex = selected ? 0 : -1;
      const panel = this.panels.get(candidate);
      if (panel) panel.hidden = !selected;
    }
  }

  private handleTabKey(event: KeyboardEvent, wing: RoomWing): void {
    const currentIndex = WINGS.indexOf(wing);
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % WINGS.length;
    if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + WINGS.length) % WINGS.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = WINGS.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    const nextWing = WINGS[nextIndex];
    this.activateWing(nextWing);
    this.tabButtons.get(nextWing)?.focus();
  }
}
