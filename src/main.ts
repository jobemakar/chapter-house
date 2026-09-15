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
import { WishboneGame } from "./games/wishbone/game";
import { TownWorld } from "./town/world";
import { furniture, pets, getFurniture } from "./core/catalog";
import "./styles.css";
import "./room/actions.css";
import "./games/wishbone/ui.css";
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
};
function icon(name: string) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] ?? paths.book}"/></svg>`;
}
class ChapterHouse {
  private profile = new ProfileRepository(browserStorage());
  private audio = new RoomAudio(this.profile.state.muted);
  private petAssets = new PetAssets();
  private room: ClubhouseRoom;
  private portraits = new CatalogPortraits();
  private game: WishboneGame | null = null;
  private town: TownWorld | null = null;
  private panel: string | null = null;
  private toastTimer = 0;
  private panelFocus: HTMLElement | null = null;
  constructor(private root: HTMLElement) {
    root.innerHTML = `<header class="topbar">
<a class="brand" href="#" aria-label="Chapter House home">${icon("book")}<span>chapter house<small>BATTLE OF THE BOOKS</small>
</span>
</a>
<div class="identity">
<span class="name">
</span>
<span class="save-dot" title="Saved on this device">
</span>
</div>
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
<main class="room-page">
<div class="room-intro">
<span class="eyebrow">MAKE YOURSELF AT HOME</span>
<h1>Your little<br>story corner.</h1>
<p>Good books. Small adventures.<br>A space that’s all yours.</p>
</div>
<div class="room-world">
</div>
<div class="room-caption">
<span class="leaf-dot">
</span> Tap an open spot to wander</div>
<div class="view-controls">
<button data-action="zoomout" aria-label="Zoom out">−</button>
<button data-action="zoomin" aria-label="Zoom in">+</button>
</div>
<div class="emotes">
<button data-action="reactions" aria-label="Reactions"><span style="font-size:26px">☺</span><span>React</span></button>
<button data-action="wave" aria-label="Wave">${icon("wave")}<span>Wave</span>
</button>
<button data-action="jump" aria-label="Jump">${icon("jump")}<span>Jump</span>
</button>
<button data-action="call" aria-label="Call pet">${icon("paw")}<span>Call pet</span>
</button>
</div>
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
<nav class="dock" aria-label="Clubhouse activities">${[
      ["games", "game", "Games"],
      ["outside", "book", "Outside"],
      ["decorate", "sofa", "Decorate"],
      ["pets", "paw", "Pets"],
      ["style", "style", "Your look"],
      ["shop", "shop", "Shop"],
    ]
      .map(
        ([
          id,
          i,
          label,
        ]) => `<button data-action="${id}">${icon(i)}<span>${label}</span>
<i>
</i>
</button>`,
      )
      .join("")}</nav>
</main>
<main class="game-host" hidden>
</main>
<main class="town-page" hidden><div class="town-world"></div>
<div class="town-heading"><span class="eyebrow">A LITTLE FURTHER AFIELD</span><h2>Willowbrook square</h2><p>Tap a path to walk · drag to explore</p></div>
<div class="town-controls"><button data-action="inside">← Clubhouse</button><button data-action="plaza">Fountain square</button><button data-action="town-center" aria-label="Center on avatar">◎</button><button data-action="town-out" aria-label="Town zoom out">−</button><button data-action="town-in" aria-label="Town zoom in">+</button></div>
<div class="town-emotes"><button data-action="town-wave">Wave</button><button data-action="town-jump">Jump</button><button data-action="town-heart" aria-label="Heart reaction">♥</button><button data-action="town-question" aria-label="Curious reaction">?</button><button data-action="fountain-coin">Toss a coin</button></div>
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
    });
    this.refreshHeader();
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
      screen: this.game ? "wishbone" : this.town ? "town" : "clubhouse",
      profile: structuredClone(this.profile.state),
      saved: this.profile.saved,
      room: this.room.status(),
      audio: this.audio.status(),
      game: this.game?.status() ?? null,
      town: this.town?.status() ?? null,
    });
    new LocalDiagnostics(debug.chapterHouseStatus);
  }
  private ui<T extends HTMLElement = HTMLElement>(name: string): T {
    return this.root.querySelector(`[data-ui="${name}"]`)!;
  }
  private refreshHeader() {
    this.root.querySelector<HTMLElement>(".save-warning")!.hidden =
      this.profile.saved;
    this.ui("coins").textContent = String(this.profile.state.currency);
    this.root.querySelector(".name")!.textContent = this.profile.state.name;
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
        "reactions",
      ].includes(action!)
    ) {
      this.openPanel(action!);
      return;
    }
    switch (action) {
      case "outside":
        this.enterTown();
        break;
      case "inside":
        this.leaveTown();
        break;
      case "plaza":
        this.town?.visitSquare();
        break;
      case "town-center":
        this.town?.center();
        break;
      case "town-out":
        this.town?.setZoom(-0.15);
        break;
      case "town-in":
        this.town?.setZoom(0.15);
        break;
      case "town-wave":
        this.town?.wave();
        break;
      case "town-jump":
        this.town?.jump();
        break;
      case "town-heart":
        this.town?.react("heart");
        break;
      case "town-question":
        this.town?.react("question");
        break;
      case "fountain-coin":
        this.town?.tossCoin();
        break;
      case "react-heart":
        this.closePanel();
        this.room.react("heart");
        break;
      case "react-question":
        this.closePanel();
        this.room.react("question");
        break;
      case "react-surprise":
        this.closePanel();
        this.room.react("surprise");
        break;
      case "close-panel":
        this.closePanel();
        break;
      case "play":
        this.enterGame();
        break;
      case "starter":
        if (this.profile.chooseStarter(id)) {
          this.root.querySelector("dialog")!.close();
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
        this.room.wave();
        break;
      case "jump":
        this.room.jump();
        break;
      case "call":
        this.room.callPets();
        break;
      case "zoomin":
        this.room.zoomBy(1.12);
        break;
      case "zoomout":
        this.room.zoomBy(1 / 1.12);
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
        this.profile.state.avatar.color = id;
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
  private change = (event: Event) => {
    const el = event.target as HTMLInputElement;
    if (el.dataset.action === "reduced") {
      this.profile.state.reduced = el.checked;
      this.profile.save();
    }
  };
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
    this.root.querySelector<HTMLElement>(".panel")!.hidden = true;
    this.root.classList.remove("panel-open");
    this.root
      .querySelectorAll(".dock button")
      .forEach((b) => b.removeAttribute("aria-current"));
    if (stopEdit) this.room?.setEditing(false);
    this.panelFocus?.focus();
    this.panelFocus = null;
  }
  private renderPanel() {
    const name = this.panel;
    if (!name) return;
    const content = this.root.querySelector(".panel-content")!;
    const labels: Record<string, [string, string]> = {
      games: ["A NEW CHAPTER", "A little adventure?"],
      decorate: ["MAKE ROOM FOR YOU", "Your things"],
      pets: ["GOOD COMPANY", "Little friends"],
      style: ["HELLO, YOU", "Make yourself at home"],
      shop: ["THE CORNER SHOP", "Something lovely"],
      help: ["SETTLE RIGHT IN", "A little help"],
      reactions: ["SAY IT WITH A LITTLE FEELING", "How do you feel?"],
    };
    this.ui("panel-label").textContent = labels[name][0];
    this.ui("panel-title").textContent = labels[name][1];
    this.root
      .querySelectorAll(".dock button")
      .forEach((b) =>
        b.setAttribute(
          "aria-current",
          String((b as HTMLElement).dataset.action === name),
        ),
      );
    if (name === "games")
      content.innerHTML = `<button class="game-card" data-action="play"><div class="game-card-art"><img src="/assets/backdrop.png" alt="A sunny backyard"><span>WISH</span></div><div><span class="eyebrow">WISHBONE FLING</span><h3>Big tumbles.<br>Happy little dog.</h3><p>Pull back, let go, and see what wobbles.</p><span class="primary faux-button">Let’s play →</span></div></button><div class="reward-note"><span>✦</span><div><b>A keepsake for your corner</b><p>${Math.min(14, this.profile.state.wishbone.throws)} / 14 throws toward your Patchwork dog bed.</p></div></div><p class="quiet">The first of ten book-inspired adventures. More games will join the house later.</p>`;
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
    if (name === "pets") {
      content.innerHTML += `<h3>A little pet corner</h3><p>Fill an empty bowl, then tap it again to send an available pet over for a little nom nom.</p><div class="accessories">${this.profile.state.items
        .filter(
          (i) =>
            i.placement &&
            ["bowl", "aquarium", "trampoline"].includes(
              getFurniture(i.definitionId)!.kind,
            ),
        )
        .map(
          (i) =>
            `<button data-action="interact-furniture" data-id="${i.id}">${getFurniture(i.definitionId)!.kind === "bowl" ? (i.filled ? "Feed pet" : "Fill bowl") : getFurniture(i.definitionId)!.kind === "aquarium" ? "Watch fish dart" : "Trampoline time"}</button>`,
        )
        .join("")}</div>`;
    }
    if (name === "style")
      content.innerHTML = `<div class="style-preview"><img src="${this.portraits.avatar(this.profile.state.avatar.color, this.profile.state.avatar.accessory)}" alt="Fox avatar"></div><h3>A little color</h3><div class="swatches">${["#cc8957", "#8e9eae", "#d3ad85", "#af96b3"].map((c, i) => `<button style="--swatch:${c}" data-action="color" data-id="${c}" aria-label="${["Autumn", "Slate", "Honey", "Lilac"][i]} fur" aria-pressed="${this.profile.state.avatar.color === c}"></button>`).join("")}</div><h3>The finishing touch</h3><div class="accessories">${["scarf", "bow", "none"].map((a) => `<button data-action="accessory" data-id="${a}" aria-pressed="${this.profile.state.avatar.accessory === a}">${a === "none" ? "Just me" : a[0].toUpperCase() + a.slice(1)}</button>`).join("")}</div><p class="quiet">These starter looks are free. More animal species and outfits will come in later iterations.</p>`;
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
    if (name === "help")
      content.innerHTML = `<p>This is your local clubhouse. Tap the floor to walk, or focus the room and use the arrow keys. Drag the room to pan; use + and − to zoom. Wave, jump, and call your pet with the buttons by the room.</p><h3>Make a little space</h3><p>Open Decorate to move, rotate, or store furniture. Choose a spot on the floor, then Place here. Undo reverses your last room change.</p><h3>Play. Collect. Come home.</h3><p>Open Games for Wishbone Fling. Earn coins through active play and special keepsakes through game progress. Your collection and room save automatically on this device.</p><label class="setting"><input type="checkbox" data-action="reduced" ${this.profile.state.reduced ? "checked" : ""}> Reduce motion</label><p class="quiet">${this.profile.saved ? "Saved on this device." : "Saving is unavailable in this browser. Keep this tab open to retain this session."} Accounts and shared visits are planned for the next checkpoint.</p>`;
  }
  private enterGame() {
    this.leaveTown();
    this.closePanel();
    this.audio.setRoomActive(false);
    this.room.setPaused(true);
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = true;
    const host = this.root.querySelector<HTMLElement>(".game-host")!;
    host.hidden = false;
    this.game = new WishboneGame(
      host,
      this.profile,
      () => this.leaveGame(),
      this.notify,
      {
        toggleSound: () => this.toggleSound(),
        fullscreen: () => {
          void this.fullscreen();
        },
      },
    );
    this.root.classList.add("playing");
  }
  private leaveGame() {
    if (!this.game) return;
    this.closePanel();
    this.game.dispose();
    this.game = null;
    this.root.querySelector<HTMLElement>(".game-host")!.hidden = true;
    this.root.querySelector<HTMLElement>(".room-page")!.hidden = false;
    this.root.classList.remove("playing");
    this.room.setPaused(false);
    this.audio.setRoomActive(true);
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
    this.town = new TownWorld(
      this.root.querySelector<HTMLElement>(".town-world")!,
      this.profile,
      () => this.leaveTown(),
      this.notify,
      this.petAssets,
    );
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
  document.querySelector("#app")!.innerHTML =
    '<section class="startup-error"><h1>The clubhouse needs a fresh start.</h1><p>This view needs WebGL. Try reopening it in an up-to-date browser with graphics acceleration enabled.</p><button onclick="location.reload()">Try again</button></section>';
}
