import type { TownActivityState } from "./activities";

export type TownContextActionId = "fish" | "dig";

export interface TownContextAvailability {
  readonly streamBank: boolean;
  readonly digAllowed: boolean;
}

export interface TownContextAction {
  readonly id: TownContextActionId;
  readonly label: "Fish" | "Dig";
  readonly enabled: boolean;
}

export interface TownContextMenuView {
  readonly open: boolean;
  /** Fish and Dig are always present; callers use `open` to render the arc. */
  readonly actions: readonly [TownContextAction, TownContextAction];
}

/**
 * Holds only the interaction state for the avatar's contextual action arc.
 * It deliberately has no knowledge of world coordinates, DOM events, or
 * fishing's independent Reel prompt.
 */
export class TownContextMenu {
  private menuOpen = false;
  private availability: TownContextAvailability = {
    streamBank: false,
    digAllowed: false,
  };

  get open(): boolean {
    return this.menuOpen;
  }

  get view(): TownContextMenuView {
    return {
      open: this.menuOpen,
      actions: [
        { id: "fish", label: "Fish", enabled: this.availability.streamBank },
        { id: "dig", label: "Dig", enabled: this.availability.digAllowed },
      ],
    };
  }

  /** Refreshes the availability without changing the user's open/closed choice. */
  setAvailability(availability: TownContextAvailability) {
    this.availability = { ...availability };
  }

  /**
   * Opens or closes only for a tap on an avatar that is not travelling or
   * using another town activity. Returns true when the tap was accepted.
   */
  toggleAvatarTap(
    stationary: boolean,
    activityState: TownActivityState,
  ): boolean {
    if (!stationary || activityState !== "idle") return false;
    this.menuOpen = !this.menuOpen;
    return true;
  }

  /** Called as soon as a route begins so the arc cannot trail behind the avatar. */
  closeForWalk() {
    this.menuOpen = false;
  }

  /** Called when Dig or Fish begins; Reel intentionally remains outside this menu. */
  closeForAction() {
    this.menuOpen = false;
  }

  /** Clears transient state during leave-town or disposal-style cleanup. */
  reset() {
    this.menuOpen = false;
  }
}
