import { assetUrl } from "./asset-url.ts";

export interface GamePreview {
  id: string;
  title: string;
  book: string;
  description: string;
  source: string;
  assets?: readonly string[];
  alternate?: boolean;
}

/** Existing standalone artifacts only: these are not GameHost integrations. */
export class GamePreviews {
  static readonly entries: readonly GamePreview[] = [
    {
      id: "stormglide",
      title: "Stormglide",
      book: "The Miscalculations of Lightning Girl",
      description: "Glide, collect and dash through a watercolor sky.",
      source: "the-miscalculations-of-lightning-girl/playable/Stormglide.html",
    },
    {
      id: "pocket-funhouse",
      title: "Pocket Funhouse",
      book: "The Mystery of Locked Rooms",
      description: "Explore a little house of playful mechanisms.",
      source: "the-mystery-of-locked-rooms/playable/Pocket-Funhouse.html",
    },
    {
      id: "backyard-ruckus",
      title: "Wishbone’s Big Fetch",
      book: "Wish",
      description: "The original sock-launching, dog-chasing comparison.",
      source: "wish/playable/Wishbones-Big-Fetch.html",
      alternate: true,
    },
    {
      id: "midnight-snow-jam",
      title: "Midnight Snow Jam",
      book: "The Very, Very Far North",
      description: "Make music with a cozy Arctic ensemble.",
      source: "the-very-very-far-north/playable/Midnight-Snow-Jam.html",
    },
    {
      id: "arctic-duet",
      title: "Arctic Duet",
      book: "The Very, Very Far North",
      description: "Guide two Arctic friends beneath musical snacks.",
      source: "the-very-very-far-north/playable/Arctic-Duet.html",
      alternate: true,
    },
    {
      id: "midnight-merienda",
      title: "Midnight Merienda",
      book: "Mabuhay!",
      description: "Cook and serve a colorful little night market.",
      source: "mabuhay/playable/Midnight-Merienda.html",
    },
    {
      id: "gummy-nook",
      title: "Gummy Nook",
      book: "Not If I Can Help It",
      description: "Swap candy, cascade matches and try playful powers.",
      source: "not-if-i-can-help-it/playable/Gummy-Nook.html",
    },
    {
      id: "bureau-after-dark",
      title: "Bureau After Dark",
      book: "Amari and the Night Brothers",
      description: "Explore a whimsical supernatural bureau after hours.",
      source: "application/preview-sources/bureau-after-dark/index.html",
    },
    {
      id: "vedas-great-escape",
      title: "Veda’s Great Escape",
      book: "The Elephant in the Room",
      description: "Help Veda through the existing elephant escape puzzles.",
      source: "application/preview-sources/vedas-great-escape/index.html",
      assets: ["style.css", "game.js", "sanctuary.png"],
    },
    {
      id: "emberwatch",
      title: "Little Lantern Keeper · Emberwatch",
      book: "Wildfire",
      description: "Look after a cozy lantern-lit woodland clearing.",
      source: "application/preview-sources/emberwatch/index.html",
      assets: ["style.css", "game.js", "clearing.png"],
    },
    {
      id: "picture-day-parade",
      title: "Picture Day Parade",
      book: "Popcorn",
      description: "Frame and capture wonderfully chaotic photos.",
      source: "popcorn/playable/picture-day-parade.html",
    },
    {
      id: "contraption-club",
      title: "Popcorn Contraption Club",
      book: "Popcorn",
      description: "Build popcorn machines across six puzzle levels.",
      source:
        "popcorn/experiments/contraption-club/playable/popcorn-contraption-club.html",
      alternate: true,
    },
  ];

  static fileName(preview: GamePreview) {
    return `assets/previews/${preview.id}/index.html`;
  }
  static url(preview: GamePreview) {
    return assetUrl(`previews/${preview.id}/index.html`);
  }
  static markup() {
    const escape = (value: string) =>
      value.replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c]!,
      );
    return `<h3>Explore the other demos</h3><p class="preview-note">Standalone previews open in a new tab. Their saves and rewards stay separate from Chapter House; these games are not integrated yet.</p><div class="game-preview-list">${this.entries.map((p) => `<a class="game-preview-card" href="${this.url(p)}" target="_blank" rel="noopener noreferrer"><small>${p.alternate ? "ALTERNATE DEMO" : "STANDALONE PREVIEW"}</small><h4>${escape(p.title)}</h4><span class="preview-book">${escape(p.book)}</span><p>${escape(p.description)}</p><span class="preview-open">Open preview ↗ · New tab</span></a>`).join("")}</div>`;
  }
}
