import { LocalDiagnostics } from "./core/diagnostics";
import {
  ProfileRepository,
  browserStorage,
  type OwnedItem,
} from "./core/profile";
import { ClubhouseRoom } from "./room/room";
import { RoomAudio } from "./room/audio";
import { CatalogPortraits } from "./room/portraits";
import { PetAssets } from "./room/pet-assets";
import { REACTION_CHOICES } from "./room/reaction-catalog";
import type { ReactionKind } from "./room/reactions";
import type { GameSession } from "./core/game-session";
import {
  IntegratedGames,
  type IntegratedGameId,
} from "./core/integrated-games";
import {
  TownWorld,
  type TownContextView,
  type TownDiscoveryView,
} from "./town/world";
import { PirateIslandWorld } from "./town/pirate-world";
import { FISH, FINDS, type DiscoveryDefinition } from "./town/activities";
import { assetUrl } from "./core/asset-url";
import {
  AVATAR_COLOR_CATALOG,
  avatarColorName,
  normalizeAvatarColor,
} from "./core/avatar-colors";
import { GamePreviews } from "./core/game-previews";
import { GamesShelf } from "./core/games-shelf";
import { furniture, pets, getFurniture } from "./core/catalog";
import { setCurrentNavigation } from "./core/navigation-ui";
import { FirebaseSession, type MemberSessionState } from "./firebase/session";
import { InvalidUsernameError } from "./firebase/username";
import "./styles.css";
import "./room/actions.css";
const paths: Record<string, string> = {
  book: "M4 4h6c2 0 2 2 2 2s0-2 2-2h6v15h-6c-2 0-2 2-2 2s0-2-2-2H4z M12 6v15",
  game: "M7 7h10c3 0 5 9 4 11s-4-1-5-3H8c-1 2-4 5-5 3S4 7 7 7z M7 9v5 M4.5 11.5h5 M16 10h.1 M19 13h.1",
  sofa: "M5 12V7c0-2 3-2 7-2s7 0 7 2v5 M3 11c-2 0-2 6 0 6h18c2 0 2-6 0-6s-2 2-2 2H5s0-2-2-2z M5 17v3 M19 17v3",
  paw: "M8 14c3-5 5-5 8 0s1 7-4 5c-5 2-7 0-4-5z M6 9c-3 0-3-5-1-5s3 5 1 5z M10 7c-2 0-2-6 0-6s2 6 0 6z M15 7c-2 0-2-6 0-6s2 6 0 6z M19 9c-2 0-1-5 1-5s2 5-1 5z",
  style: "M8 3c1 4 7 4 8 0l6 4-3 5-3-2v11H8V10l-3 2-3-5z",
  shop: "M5 7h14l2 14H3z M8 7V5a4 4 0 018 0v2",
  sound: "M3 9h4l5-5v16l-5-5H3z M16 8c3 2 3 6 0 8 M19 5c5 4 5 10 0 14",
  expand: "M8 3H3v5 M16 3h5v5 M21 16v5h-5 M3 16v5h5",
  wave: "M8 13V5c0-2 3-2 3 0v6-8c0-2 3-2 3 0v8-6c0-2 3-2 3 0v7-4c0-2 3-2 3 0v7c0 7-10 9-13 4l-4-5c-1-2 1-3 3-1l2 2",
  jump: "M12 20V4 M6 10l6-6 6 6 M4 20h3 M17 20h3",
  outside: "M4 18l5-7 4 4 3-5 4 8z M5 18h14 M12 5a2 2 0 110-4 2 2 0 010 4z",
  home: "M3 11l9-8 9 8 M5 10v10h14V10 M9 20v-6h6v6",
  collection: "M5 4h14v16H5z M8 2v4 M16 2v4 M8 10h8 M8 14h5",
  call: "M4 8h9v5c0 4-2 7-5 7s-5-3-5-6c0-3 2-6 5-6 M13 9h5c2 0 3 1 3 3s-1 3-3 3h-3 M7 12h2",
  back: "M19 12H5 M11 6l-6 6 6 6",
};
function icon(name: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.book}"/></svg>`;
}
class ChapterHouse {
  private profile = new ProfileRepository(browserStorage());
  private memberSession = new FirebaseSession();
  private memberState: MemberSessionState = { status: "loading" };
  private audio = new RoomAudio(this.profile.state.muted);
  private petAssets = new PetAssets();
  private room: ClubhouseRoom;
  private portraits = new CatalogPortraits();
  private game: GameSession | null = null;
  private activeGameId: IntegratedGameId | null = null;
  private gameLoadToken = 0;
  private town: TownWorld | PirateIslandWorld | null = null;
  private panel: string | null = null;
  private toastTimer = 0;
  private panelFocus: HTMLElement | null = null;
  constructor(private root: HTMLElement) {
    root.innerHTML = `<header class="topbar">
<button data-action="exit-game" class="game-exit" aria-label="Exit game">${icon("back")}<span>Exit game</span></button>
<a class="brand" href="#" aria-label="Chapter House home">${icon("book")}<span>chapter house<small>BATTLE OF THE BOOKS</small>
</span>
</a>
<nav class="app-nav" aria-label="Chapter House activities">${[
      ["outside", "outside", "Outside"],
      ["clubhouse", "home", "Clubhouse"],
      ["collection", "collection", "Collection"],
      ["games", "game", "Games"],
      ["decorate", "sofa", "Decorate"],
      ["pets", "paw", "Pets"],
      ["style", "style", "Your look"],
      ["shop", "shop", "Shop"],
    ]
      .map(
        ([id, symbol, label]) =>
          `<button data-action="${id}" aria-label="${label}" title="${label}">${icon(symbol)}</button>`,
      )
      .join("")}</nav>
<button class="identity" data-action="account" aria-label="Open account">
<span class="name">
</span>
<span class="save-dot" title="Saved on this device">
</span>
</button>
<div class="wallet" aria-label="Your coins">
<span class="coin" aria-hidden="true">C</span>
<b data-ui="coins">0</b>
</div>
<div class="utilities">
<button data-action="sound" class="icon-button" aria-label="Toggle sound">${icon("sound")}</button>
<button data-action="fullscreen" class="icon-button" aria-label="Fullscreen">${icon("expand")}</button>
<button data-action="help" class="icon-button" aria-label="Help">?</button>
</div>
</header>
<div class="save-warning" role="status" hidden>Saving is unavailable. Keep this tab open to retain this session.</div>
<section class="space-descriptor" aria-live="polite">
<span class="eyebrow" data-ui="space-label"></span>
<h1 data-ui="space-title"></h1>
<p data-ui="space-detail"></p>
</section>
<div class="world-actions" role="group" aria-label="Avatar actions">
<div class="reaction-control">
<div class="quick-reactions" role="menu" aria-label="Choose a reaction" hidden>${REACTION_CHOICES.map(
      (reaction) =>
        `<button data-action="react-choice" data-id="${reaction.value}" role="menuitem" aria-label="${reaction.label} reaction" title="${reaction.label}">${reaction.emoji}</button>`,
    ).join("")}</div>
<button data-action="reactions" aria-label="Reactions" title="Reactions" aria-expanded="false"><span class="react-face">☺</span></button>
</div>
<button data-action="wave" aria-label="Wave" title="Wave">${icon("wave")}</button>
<button data-action="jump" aria-label="Jump" title="Jump">${icon("jump")}</button>
<button data-action="call" aria-label="Call pet" title="Call pet">${icon("call")}</button>
</div>
<main class="room-page">
<div class="room-world">
</div>
<div class="room-caption">
<span class="leaf-dot">
</span> Tap an open spot to wander</div>
<div class="edit-mode-bar"><span>Decorating · Tap a piece to move it</span><button data-action="done-decorating">Done</button></div>
<div class="placement-bar" hidden>
<div>
<b data-ui="placing">
</b>
<small data-ui="placement-hint">
</small>
</div>
<div class="placement-actions">
<button data-action="rotate">Rotate ↻</button>
<button data-action="store">Store</button>
<button data-action="cancel-placement">Cancel</button>
<button data-action="place" class="primary">Place here</button>
</div>
</div>
</main>
<main class="game-host" hidden>
</main>
<main class="town-page" hidden><div class="town-world"></div>
<div class="town-context" role="group" aria-label="Avatar actions" data-mode="hidden" hidden><button data-action="town-fish"><span>🎣</span> Fish</button><button data-action="town-dig"><span>♠</span> Dig</button><button data-action="town-reel"><span>!</span> Reel!</button></div>
<div class="town-discovery" role="status" aria-live="polite" hidden><img alt=""><div><small>NEW DISCOVERY</small><b></b><span></span></div></div>
</main>
<aside class="panel" aria-label="Clubhouse options" hidden>
<header>
<div>
<span class="eyebrow" data-ui="panel-label">
</span>
<h2 data-ui="panel-title">
</h2>
</div>
<button data-action="close-panel" aria-label="Close panel">×</button>
</header>
<div class="panel-content">
</div>
</aside>
<div class="toast" role="status" aria-live="polite">
</div>
<dialog class="welcome">
<div class="welcome-art">${icon("paw")}</div>
<span class="eyebrow">EVERY STORY NEEDS A SIDEKICK</span>
<h2>Meet your first little friend.</h2>
<p>Choose a pet to share your clubhouse.<br>There are more friends to collect as you play.</p>
<div class="starter-options">
</div>
</dialog>
<dialog class="account-dialog" aria-labelledby="account-title">
<button class="dialog-close" data-action="close-account" aria-label="Close account">×</button>
<span class="eyebrow">MEMBER DOOR</span>
<h2 id="account-title">Come back to your clubhouse</h2>
<form data-form="member-login">
<label>Username<input name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required minlength="3" maxlength="24"></label>
<label>Password<input name="password" type="password" autocomplete="current-password" required minlength="6"></label>
<p class="account-error" role="alert" hidden></p>
<button class="primary" type="submit">Sign in</button>
</form>
<section class="member-account" hidden>
<p>Signed in as <b data-ui="member-name"></b>.</p>
<button data-action="account-sign-out">Return to local guest</button>
</section>
<p class="quiet account-note">Accounts are created privately by Jobe. No email address is needed.</p>
</dialog>`;
    this.root.querySelector(".brand")!.addEventListener("click", (e) => {
      e.preventDefault();
      this.leaveTown();
      this.leaveGame();
    });
    this.room = new ClubhouseRoom(
      this.root.querySelector(".room-world")!,
      this.profile,
      this.notify,
      this.placementChanged,
      (sound) => this.audio.play(sound),
      this.petAssets,
    );
    void this.petAssets
      .load()
      .then(() => {
        this.room.useLoadedPetAssets();
        this.town?.useLoadedPetAssets();
      })
      .catch((error: unknown) => {
        console.error("Cube Pets failed to load", error);
        this.notify(
          "The new pets couldn't load, so their cozy stand-ins are still here.",
        );
      });
    root.addEventListener("click", this.click);
    root.addEventListener("change", this.change);
    root.addEventListener("submit", this.submit);
    root.addEventListener("pointerdown", () => this.audio.unlock(), {
      capture: true,
    });
    root.addEventListener("keydown", () => this.audio.unlock(), {
      capture: true,
    });
    document.addEventListener("visibilitychange", () =>
      this.audio.setHidden(document.hidden),
    );
    this.audio.setHidden(document.hidden);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.game) {
        this.closePanel();
        this.room.cancelPlacement();
      }
    });
    this.profile.subscribe(() => {
      this.refreshHeader();
      this.audio.setMuted(this.profile.state.muted);
      this.town?.setMuted(this.profile.state.muted);
      this.town?.syncAvatarAppearance();
      if (this.panel === "collection") this.renderPanel();
    });
    this.memberSession.subscribe((state) => {
      this.memberState = state;
      this.refreshHeader();
      this.renderAccountDialog();
    });
    this.refreshHeader();
    this.showSpaceDescriptor("clubhouse");
    this.refreshNavigation();
    if (!this.profile.state.starterChosen) {
      this.root.querySelector(".starter-options")!.innerHTML = pets
        .filter((p) => p.starter)
        .map(
          (p) =>
            `<button data-action="starter" data-id="${p.id}"><img src="${this.portraits.image(p.id, true)}" alt=""><b>${p.name}</b><span>Choose ${p.name.split(" ")[0]}</span></button>`,
        )
        .join("");
      const dialog = this.root.querySelector<HTMLDialogElement>(".welcome")!;
      dialog.addEventListener("cancel", (e) => e.preventDefault());
      dialog.showModal();
    }
    const debug = window as unknown as { chapterHouseStatus: () => unknown };
    debug.chapterHouseStatus = () => ({
      screen: this.activeGameId ?? (this.town ? "town" : "clubhouse"),
      profile: structuredClone(this.profile.state),
      saved: this.profile.saved,
      room: this.room.status(),
      audio: this.audio.status(),
      game: this.game?.status?.() ?? null,
      town: this.town?.status() ?? null,
    });
    new LocalDiagnostics(debug.chapterHouseStatus);
  }
  private ui<T extends HTMLElement = HTMLElement>(name: string): T {
    return this.root.querySelector(`[data-ui="${name}"]`)!;
  }
  private refreshHeader() {
    this.root.classList.toggle("reduce-motion", this.profile.state.reduced);
    this.root.querySelector<HTMLElement>(".save-warning")!.hidden =
      this.profile.saved;
    this.ui("coins").textContent = String(this.profile.state.currency);
    const username =
      this.memberState.status === "member"
        ? this.memberState.username
        : this.profile.state.name;
    this.root.querySelector(".name")!.textContent = username;
    const identity = this.root.querySelector<HTMLElement>(".identity")!;
    identity.classList.toggle("member", this.memberState.status === "member");
    identity.setAttribute(
      "aria-label",
      this.memberState.status === "member"
        ? `Account: ${username}`
        : `Local guest: ${username}. Open member sign in`,
    );
    const dot = this.root.querySelector<HTMLElement>(".save-dot")!;
    dot.classList.toggle("unavailable", !this.profile.saved);
    dot.title = this.profile.saved
      ? "Saved on this device"
      : "Saving unavailable — keep this tab open";
    this.root
      .querySelector('[data-action="sound"]')!
      .setAttribute("aria-pressed", String(!this.profile.state.muted));
  }
  private click = (event: Event) => {
    const el = (event.target as Element).closest<HTMLElement>("[data-action]");
    if (!el || el.closest(".game-page")) return;
    const action = el.dataset.action,
      id = el.dataset.id!;
    if (!["wave", "jump", "call", "pet", "sound"].includes(action!))
      this.audio.play("ui");
    if (
      [
        "games",
        "decorate",
        "pets",
        "style",
        "shop",
        "help",
        "collection",
      ].includes(action!)
    ) {
      this.openPanel(action!);
      return;
    }
    switch (action) {
      case "account":
        this.openAccountDialog();
        break;
      case "close-account":
        this.closeAccountDialog();
        break;
      case "account-sign-out":
        void this.signOutMember();
        break;
      case "outside":
        if (this.town instanceof PirateIslandWorld) this.returnToWillowbrook();
        else this.enterTown();
        break;
      case "clubhouse":
        this.leaveTown();
        this.leaveGame();
        break;
      case "inside":
        this.leaveTown();
        break;
      case "town-dig":
        if (this.town instanceof TownWorld) this.town.dig();
        break;
      case "town-fish":
        if (this.town instanceof TownWorld) this.town.fish();
        break;
      case "town-reel":
        if (this.town instanceof TownWorld) this.town.reel();
        break;
      case "react-choice":
        this.applyReaction(id as ReactionKind);
        break;
      case "reactions":
        this.toggleQuickReactions();
        break;
      case "close-panel":
        this.closePanel();
        break;
      case "play-game":
        void this.enterGame(id as IntegratedGameId);
        break;
      case "exit-game":
        this.leaveGame();
        break;
      case "starter":
        if (this.profile.chooseStarter(id)) {
          this.root.querySelector<HTMLDialogElement>(".welcome")!.close();
          this.notify("Welcome home. Tap the floor to take a little walk.");
        }
        break;
      case "sound":
        this.toggleSound();
        break;
      case "fullscreen":
        void this.fullscreen();
        break;
      case "wave":
        if (this.town) this.town.wave();
        else this.room.wave();
        break;
      case "jump":
        if (this.town) this.town.jump();
        else this.room.jump();
        break;
      case "call":
        if (this.town) this.town.callPet();
        else this.room.callPets();
        break;
      case "furnish":
        this.closePanel(false);
        this.room.beginPlacement(id);
        break;
      case "rotate":
        this.room.rotate();
        break;
      case "place":
        this.room.commitPlacement();
        break;
      case "store":
        this.room.storeSelected();
        break;
      case "cancel-placement":
        this.room.cancelPlacement();
        break;
      case "done-decorating":
        this.closePanel();
        this.room.setEditing(false);
        break;
      case "undo":
        this.room.undo();
        this.renderPanel();
        break;
      case "buy-furniture":
        if (this.profile.buyFurniture(id)) {
          this.notify(`${getFurniture(id)!.name} is in Decorate.`);
          this.renderPanel();
        }
        break;
      case "buy-pet":
        if (this.profile.buyPet(id)) {
          this.notify("A new little friend has arrived.");
          this.renderPanel();
        }
        break;
      case "interact-furniture":
        this.closePanel();
        this.room.interactWithFurniture(id);
        break;
      case "pet":
        this.room.pet(id);
        break;
      case "toggle-pet":
        this.profile.setPetActive(
          id,
          !this.profile.state.activePets.includes(id),
        );
        this.renderPanel();
        break;
      case "color":
        this.profile.state.avatar.color = normalizeAvatarColor(id);
        this.profile.save();
        this.renderPanel();
        break;
      case "accessory":
        this.profile.state.avatar.accessory = id;
        this.profile.save();
        this.renderPanel();
        break;
    }
  };
  private toggleQuickReactions() {
    const list = this.root.querySelector<HTMLElement>(".quick-reactions")!;
    const button = this.root.querySelector<HTMLElement>(
      '[data-action="reactions"]',
    )!;
    list.hidden = !list.hidden;
    button.setAttribute("aria-expanded", String(!list.hidden));
  }
  private closeQuickReactions() {
    const list = this.root.querySelector<HTMLElement>(".quick-reactions")!;
    list.hidden = true;
    this.root
      .querySelector('[data-action="reactions"]')!
      .setAttribute("aria-expanded", "false");
  }
  private applyReaction(kind: ReactionKind) {
    if (this.town) this.town.react(kind);
    else this.room.react(kind);
    this.closeQuickReactions();
  }
  private change = (event: Event) => {
    const el = event.target as HTMLInputElement;
    if (el.dataset.action === "reduced") {
      this.profile.state.reduced = el.checked;
      this.profile.save();
    }
  };
  private submit = (event: SubmitEvent) => {
    const form = (event.target as Element).closest<HTMLFormElement>(
      '[data-form="member-login"]',
    );
    if (!form) return;
    event.preventDefault();
    void this.signInMember(form);
  };
  private openAccountDialog() {
    const dialog =
      this.root.querySelector<HTMLDialogElement>(".account-dialog")!;
    this.renderAccountDialog();
    if (!dialog.open) dialog.showModal();
    if (this.memberState.status !== "member") {
      dialog.querySelector<HTMLInputElement>('[name="username"]')!.focus();
    }
  }
  private closeAccountDialog() {
    const dialog =
      this.root.querySelector<HTMLDialogElement>(".account-dialog")!;
    if (dialog.open) dialog.close();
    this.setAccountError("");
  }
  private renderAccountDialog() {
    const dialog =
      this.root.querySelector<HTMLDialogElement>(".account-dialog");
    if (!dialog) return;
    const form = dialog.querySelector<HTMLFormElement>(
      '[data-form="member-login"]',
    )!;
    const member = dialog.querySelector<HTMLElement>(".member-account")!;
    const signedIn = this.memberState.status === "member";
    form.hidden = signedIn;
    member.hidden = !signedIn;
    if (this.memberState.status === "member") {
      this.ui("member-name").textContent = this.memberState.username;
      dialog.querySelector("h2")!.textContent = "You’re home";
      dialog.querySelector<HTMLElement>(".account-note")!.textContent =
        "Your local guest save remains on this device while online profile syncing is connected next.";
    } else {
      dialog.querySelector("h2")!.textContent = "Come back to your clubhouse";
      dialog.querySelector<HTMLElement>(".account-note")!.textContent =
        "Accounts are created privately by Jobe. No email address is needed.";
    }
  }
  private async signInMember(form: HTMLFormElement) {
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
    const data = new FormData(form);
    submit.disabled = true;
    submit.textContent = "Opening…";
    this.setAccountError("");
    try {
      const username = await this.memberSession.signIn(
        String(data.get("username") ?? ""),
        String(data.get("password") ?? ""),
      );
      form.reset();
      this.closeAccountDialog();
      this.notify(`Signed in as ${username}. Your local guest save is safe.`);
    } catch (error) {
      this.setAccountError(
        error instanceof InvalidUsernameError
          ? error.message
          : "That username and password did not match. Check them and try again.",
      );
    } finally {
      submit.disabled = false;
      submit.textContent = "Sign in";
    }
  }
  private async signOutMember() {
    try {
      await this.memberSession.signOut();
      this.closeAccountDialog();
      this.notify(`Back to local guest ${this.profile.state.name}.`);
    } catch {
      this.setAccountError("Sign out did not finish. Please try again.");
    }
  }
  private setAccountError(message: string) {
    const error = this.root.querySelector<HTMLElement>(".account-error");
    if (!error) return;
    error.textContent = message;
    error.hidden = !message;
  }
  notify = (text: string) => {
    const toast = this.root.querySelector<HTMLElement>(".toast")!;
    toast.textContent = text;
    toast.classList.add("visible");
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(
      () => toast.classList.remove("visible"),
      4200,
    );
  };
  private placementChanged = (item: OwnedItem | null, error: string | null) => {
    const bar = this.root.querySelector<HTMLElement>(".placement-bar")!;
    bar.hidden = !item;
    if (!item) return;
    this.ui("placing").textContent = getFurniture(item.definitionId)!.name;
    this.ui("placement-hint").textContent =
      error ?? "Tap the floor to choose a spot. Green means it fits.";
    this.ui("placement-hint").classList.toggle("error", !!error);
    this.root.querySelector<HTMLButtonElement>(
      '[data-action="place"]',
    )!.disabled = !!error;
  };
  private openPanel(name: string) {
    if (this.panel === name) {
      this.closePanel();
      return;
    }
    this.closePanel();
    this.panelFocus = document.activeElement as HTMLElement;
    this.panel = name;
    this.root.querySelector<HTMLElement>(".panel")!.hidden = false;
    this.root.classList.add("panel-open");
    this.room.setEditing(name === "decorate");
    if (this.game) this.game.setPaused(true);
    this.renderPanel();
    this.root
      .querySelector<HTMLElement>('[data-action="close-panel"]')!
      .focus();
  }
  private closePanel(stopEdit = true) {
    this.panel = null;
    const panel = this.root.querySelector<HTMLElement>(".panel")!;
    panel.hidden = true;
    delete panel.dataset.panel;
    this.root.classList.remove("panel-open");
    this.root
      .querySelectorAll(".app-nav button")
      .forEach((b) => b.removeAttribute("aria-current"));
    if (stopEdit) this.room?.setEditing(false);
    if (this.game) this.game.setPaused(false);
    this.panelFocus?.focus();
    this.panelFocus = null;
    this.refreshNavigation();
  }
  private renderPanel() {
    const name = this.panel;
    if (!name) return;
    this.root.querySelector<HTMLElement>(".panel")!.dataset.panel = name;
    const content = this.root.querySelector(".panel-content")!;
    const labels: Record<string, [string, string]> = {
      games: ["A NEW CHAPTER", "A little adventure?"],
      decorate: ["MAKE ROOM FOR YOU", "Your things"],
      pets: ["GOOD COMPANY", "Little friends"],
      style: ["HELLO, YOU", "Make yourself at home"],
      shop: ["THE CORNER SHOP", "Something lovely"],
      help: ["SETTLE RIGHT IN", "A little help"],
      reactions: ["SAY IT WITH A LITTLE FEELING", "How do you feel?"],
      collection: ["FOUND AROUND WILLOWBROOK", "Your collection"],
    };
    this.ui("panel-label").textContent = labels[name][0];
    this.ui("panel-title").textContent = labels[name][1];
    setCurrentNavigation(
      this.root.querySelectorAll<HTMLButtonElement>(".app-nav button"),
      name,
    );
    if (name === "games")
      content.innerHTML = `<div class="integrated-game-list">${IntegratedGames.entries
        .map((game) => {
          const adapter = IntegratedGames.get(game.id)!;
          const art = `<img src="${game.cardArtUrl}" alt="${game.cardArtAlt}">`;
          const progress = adapter.summarize(
            this.profile.gameProgress(game.id),
          );
          return `<div class="integrated-game-entry"><button class="game-card" data-action="play-game" data-id="${game.id}"><div class="game-card-art">${art}<span>${game.book}</span></div><div><h3>${game.title}</h3><p>${game.heading}</p><span class="primary faux-button">Let’s play →</span></div></button><div class="reward-note"><span>✦</span><div><b>A keepsake for your corner</b><p>${progress}</p></div></div></div>`;
        })
        .join("")}</div>${GamePreviews.markup()}`;
    if (name === "decorate")
      content.innerHTML = `<p>Pick something below, or tap furniture in the room. Tap the floor to find its new home.</p><button data-action="undo" class="text-button">↶ Undo last room change</button><div class="catalog-grid">${this.profile.state.items
        .map((item) => {
          const d = getFurniture(item.definitionId)!;
          return `<button class="catalog-card" data-action="furnish" data-id="${item.id}"><img src="${this.portraits.image(d.id)}" alt=""><b>${d.name}</b><small>${item.placement ? "In your room" : "Ready to place"}</small></button>`;
        })
        .join("")}</div>`;
    if (name === "pets")
      content.innerHTML = `<p>Tap a roaming pet to show it some love. Use <b>Call pet</b> to bring your friends over.</p><div class="catalog-grid">${this.profile.state.pets
        .map((id) => {
          const p = pets.find((p) => p.id === id)!;
          const active = this.profile.state.activePets.includes(id);
          return `<div class="catalog-card"><img src="${this.portraits.image(id, true)}" alt=""><b>${p.name}</b><button data-action="pet" data-id="${id}" ${active ? "" : "disabled"}>Pet ${p.name.split(" ")[0]} ♥</button><button data-action="toggle-pet" data-id="${id}" aria-pressed="${active}">${active ? "Let them rest" : "Come out and play"}</button></div>`;
        })
        .join(
          "",
        )}<button class="empty-pet" data-action="shop"><span>+</span><b>Room for a friend</b><small>Meet more pets in the shop</small></button><div class="empty-pet decorative" aria-hidden="true"><span>+</span></div></div>`;
    if (name === "style")
      content.innerHTML = `<div class="style-preview"><img src="${this.portraits.avatar(this.profile.state.avatar.color, this.profile.state.avatar.accessory)}" alt="Fox avatar in ${avatarColorName(this.profile.state.avatar.color)} fur"></div><h3>A little color</h3><div class="swatches">${AVATAR_COLOR_CATALOG.map((color) => `<button style="--swatch:${color.value}" data-action="color" data-id="${color.value}" aria-label="${color.name} fur" aria-pressed="${this.profile.state.avatar.color === color.value}"></button>`).join("")}</div><h3>The finishing touch</h3><div class="accessories">${["scarf", "bow", "none"].map((a) => `<button data-action="accessory" data-id="${a}" aria-pressed="${this.profile.state.avatar.accessory === a}">${a === "none" ? "Just me" : a[0].toUpperCase() + a.slice(1)}</button>`).join("")}</div><p class="quiet">These starter looks are free and can be changed any time.</p>`;
    if (name === "shop")
      content.innerHTML = `<p>Little rewards for time spent playing. Your coins grow during active games.</p><h3>A new companion</h3><div class="catalog-grid">${pets
        .map((p) => {
          const owned = this.profile.state.pets.includes(p.id);
          return `<div class="catalog-card"><img src="${this.portraits.image(p.id, true)}" alt=""><b>${p.name}</b><button data-action="buy-pet" data-id="${p.id}" ${owned || this.profile.state.currency < p.price ? "disabled" : ""}>${owned ? "Already your friend" : `${p.price} coins · Adopt`}</button></div>`;
        })
        .join(
          "",
        )}</div><h3>A little something for home</h3><div class="catalog-grid">${furniture
        .filter((d) => d.price !== undefined)
        .map(
          (d) =>
            `<div class="catalog-card"><img src="${this.portraits.image(d.id)}" alt=""><b>${d.name}</b><button data-action="buy-furniture" data-id="${d.id}" ${this.profile.state.currency < d.price! ? "disabled" : ""}>${d.price} coins · Bring home</button></div>`,
        )
        .join(
          "",
        )}</div><p class="quiet">Small decorations take a few active minutes. Your first additional pet is about ten minutes away.</p>`;
    if (name === "reactions")
      content.innerHTML = `<div class="reaction-choices"><button data-action="react-heart" aria-label="Love reaction">♥<small>Love</small></button><button data-action="react-surprise" aria-label="Excited reaction">!<small>Wow</small></button><button data-action="react-question" aria-label="Curious reaction">?<small>Curious</small></button></div><p>Your bubbles are fluffy thought clouds. Pets have little rounded speech bubbles when you pet, call or feed them.</p>`;
    if (name === "collection")
      content.innerHTML = `<p>Fish beside the stream or dig on walkable ground. Duplicates stack, and rare discoveries sparkle a little brighter.</p>${this.collectionSection("Fish", FISH)}${this.collectionSection("Finds", FINDS)}`;
    if (name === "help")
      content.innerHTML = `<p>Use the top bar to move between spaces and open your activities. Tap the floor to walk, or focus the world and use the arrow keys. Drag to pan; use a mouse wheel or pinch with two fingers to zoom. React, wave, jump, and call your pet with the shared action buttons.</p><h3>Make a little space</h3><p>Open Decorate inside the clubhouse to move, rotate, or store furniture. Choose a spot on the floor, then Place here. Undo reverses your last room change.</p><h3>Play. Collect. Come home.</h3><p>Open Games for Wishbone Fling or Dig &amp; Douse. Outside, tap your stationary avatar to open the Dig and Fish action arc. Your collection and room save automatically on this device.</p><h3>Members</h3><p>Tap your name in the top bar to sign in with the username and password Jobe gave you. No email is needed.</p><label class="setting"><input type="checkbox" data-action="reduced" ${this.profile.state.reduced ? "checked" : ""}> Reduce motion</label><p class="quiet">${this.profile.saved ? "Saved on this device." : "Saving is unavailable in this browser. Keep this tab open to retain this session."} Member profile syncing and shared visits are the next Firebase step.</p>`;
  }
  private collectionSection(
    title: string,
    definitions: readonly DiscoveryDefinition[],
  ) {
    return `<h3>${title}</h3><div class="collection-grid">${definitions
      .map((definition) => {
        const count =
          this.profile.state.collection[definition.kind][definition.id] ?? 0;
        const art = definition.image
          ? `<img src="${assetUrl(definition.image)}" alt="">`
          : `<span class="collection-icon" aria-hidden="true">${definition.icon}</span>`;
        return `<article class="collection-card rarity-${definition.rarity} ${count ? "discovered" : "locked"}"><div class="collection-art">${art}</div><b>${count ? definition.name : "Not found yet"}</b><small>${definition.rarity}${count ? ` · ×${count}` : ""}</small></article>`;
      })
      .join("")}</div>`;
  }
  private townContextChanged = (view: TownContextView) => {
    const bubble = this.root.querySelector<HTMLElement>(".town-context")!;
    bubble.hidden = !view.visible;
    bubble.dataset.mode = view.mode;
    bubble.style.left = `${view.x}px`;
    bubble.style.top = `${view.y}px`;
    for (const action of ["fish", "dig", "reel"] as const) {
      const button = bubble.querySelector<HTMLButtonElement>(
        `[data-action="town-${action}"]`,
      )!;
      const state = view.actions.find((candidate) => candidate.id === action);
      button.hidden = !state;
      button.disabled = !state?.enabled;
      button.setAttribute("aria-disabled", String(!state?.enabled));
      button.title =
        action === "fish" && state && !state.enabled
          ? "Fish beside a clear stretch of stream"
          : "";
    }
  };
  private townDiscoveryChanged = (view: TownDiscoveryView) => {
    const bubble = this.root.querySelector<HTMLElement>(".town-discovery")!;
    bubble.hidden = !view.visible || !view.discovery;
    bubble.style.left = `${view.x}px`;
    bubble.style.top = `${view.y}px`;
    if (!view.discovery) return;
    bubble.className = `town-discovery rarity-${view.discovery.rarity}`;
    const image = bubble.querySelector<HTMLImageElement>("img")!;
    image.src = view.discovery.image ? assetUrl(view.discovery.image) : "";
    image.alt = view.discovery.name;
    bubble.querySelector("b")!.textContent = view.discovery.name;
    bubble.querySelector("span")!.textContent = `Collection ×${view.count}`;
  };
  private async enterGame(id: IntegratedGameId) {
    this.leaveTown();
    this.leaveGame();
    this.closePanel();
    this.audio.setRoomActive(false);
    this.room.setPaused(true);
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = true;
    const host = this.root.querySelector<HTMLElement>(".game-host")!;
    host.hidden = false;
    host.scrollTop = 0;
    const loadToken = ++this.gameLoadToken;
    this.activeGameId = id;
    const adapter = IntegratedGames.get(id);
    if (!adapter) return;
    host.innerHTML = `<div class="game-loading" role="status">Opening ${adapter.definition.title}…</div>`;
    this.root.classList.add("playing");
    this.closeQuickReactions();
    this.hideSpaceDescriptor();
    this.refreshNavigation();
    try {
      const createGame = await adapter.load();
      if (loadToken !== this.gameLoadToken) return;
      this.game = createGame(host, {
        progress: this.profile.gameProgress(id),
        muted: this.profile.state.muted,
        reducedMotion: this.profile.state.reduced,
        activePlaySeconds: this.profile.state.activeSeconds,
        exit: () => this.leaveGame(),
        notify: this.notify,
        saveProgress: (progress) => this.profile.saveGameProgress(id, progress),
        creditActivePlay: (total) => this.profile.creditActivity(total),
        awardReward: (rewardId) => this.profile.awardGameReward(id, rewardId),
      });
    } catch (error) {
      if (loadToken !== this.gameLoadToken) return;
      console.error("Unable to open integrated game", error);
      this.notify("That game couldn't open. Please try again.");
      this.leaveGame();
    }
  }
  private leaveGame() {
    if (!this.game && !this.root.classList.contains("playing")) return;
    this.gameLoadToken++;
    this.closePanel();
    this.game?.dispose();
    this.game = null;
    this.activeGameId = null;
    this.root.querySelector<HTMLElement>(".game-host")!.hidden = true;
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = false;
    this.root.classList.remove("playing");
    this.room.setPaused(false);
    this.audio.setRoomActive(true);
    this.showSpaceDescriptor("clubhouse");
    this.refreshNavigation();
  }
  private toggleSound() {
    this.profile.state.muted = !this.profile.state.muted;
    this.profile.save();
    this.game?.setMuted(this.profile.state.muted);
  }
  private enterTown() {
    if (this.town) return;
    this.leaveGame();
    this.closePanel();
    this.room.cancelPlacement();
    this.room.setPaused(true);
    this.audio.setRoomActive(false);
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = true;
    this.root.querySelector<HTMLElement>(".town-page")!.hidden = false;
    this.root.classList.add("outside");
    this.closeQuickReactions();
    this.showSpaceDescriptor("willowbrook");
    this.town = new TownWorld(
      this.root.querySelector<HTMLElement>(".town-world")!,
      this.profile,
      () => this.leaveTown(),
      this.notify,
      this.townContextChanged,
      this.townDiscoveryChanged,
      this.petAssets,
      () => this.enterPirateIsland(),
    );
    this.refreshNavigation();
  }
  private leaveTown() {
    if (!this.town) return;
    this.town.dispose();
    this.town = null;
    this.root.classList.remove("outside");
    this.root.querySelector<HTMLElement>(".town-page")!.hidden = true;
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = false;
    this.room.setPaused(false);
    this.audio.setRoomActive(true);
    this.closeQuickReactions();
    this.showSpaceDescriptor("clubhouse");
    this.refreshNavigation();
  }
  private enterPirateIsland() {
    if (!(this.town instanceof TownWorld)) return;
    this.town.dispose();
    this.town = null;
    this.closeQuickReactions();
    this.showSpaceDescriptor("pirate-island");
    this.town = new PirateIslandWorld(
      this.root.querySelector<HTMLElement>(".town-world")!,
      this.profile,
      this.notify,
      this.petAssets,
    );
    this.refreshNavigation();
  }
  private returnToWillowbrook() {
    if (!(this.town instanceof PirateIslandWorld)) return;
    this.town.dispose();
    this.town = null;
    this.enterTown();
  }
  private showSpaceDescriptor(
    space: "clubhouse" | "willowbrook" | "pirate-island",
  ) {
    const copy = {
      clubhouse: [
        "MAKE YOURSELF AT HOME",
        "Your little story corner.",
        "Good books · small adventures · a space that’s all yours",
      ],
      willowbrook: [
        "A LITTLE FURTHER AFIELD",
        "Willowbrook square",
        "Tap a path to walk · drag to explore · pinch to zoom",
      ],
      "pirate-island": [
        "OVER THE HORIZON",
        "Pirate Island",
        "Explore the beach · your pet is right beside you · Outside sails back",
      ],
    } as const;
    const [label, title, detail] = copy[space];
    this.ui("space-label").textContent = label;
    this.ui("space-title").textContent = title;
    this.ui("space-detail").textContent = detail;
    const descriptor =
      this.root.querySelector<HTMLElement>(".space-descriptor")!;
    descriptor.classList.remove("show-space-descriptor");
    void descriptor.offsetWidth;
    descriptor.classList.add("show-space-descriptor");
  }
  private hideSpaceDescriptor() {
    this.root
      .querySelector<HTMLElement>(".space-descriptor")!
      .classList.remove("show-space-descriptor");
  }
  private refreshNavigation() {
    const space = this.game ? "games" : this.town ? "outside" : "clubhouse";
    const buttons =
      this.root.querySelectorAll<HTMLButtonElement>(".app-nav button");
    setCurrentNavigation(buttons, this.panel ?? space);
    for (const button of buttons) {
      const action = button.dataset.action!;
      const unavailable = action === "decorate" && !!this.town;
      button.disabled = unavailable;
      button.title = unavailable
        ? "Decorate inside the clubhouse"
        : (button.getAttribute("aria-label") ?? "");
    }
    this.root.querySelector<HTMLElement>(".world-actions")!.hidden =
      this.activeGameId !== null;
  }
  private async fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (this.root.requestFullscreen) await this.root.requestFullscreen();
      else
        this.notify(
          "This browser uses its regular full-window view. Add to your home screen for more room.",
        );
    } catch {
      this.notify(
        "Fullscreen is unavailable here. You can keep playing in this view.",
      );
    }
  }
}
try {
  new ChapterHouse(document.querySelector("#app")!);
} catch (error) {
  console.error(error);
  new GamesShelf(document.querySelector("#app")!);
}
