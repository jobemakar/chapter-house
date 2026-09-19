import { assetUrl } from "./asset-url.ts";

export interface GamePreview {
  id: string;
  title: string;
  book: string;
  description: string;
  source: string;
  assets?: readonly string[];
  alternate?: boolean;
  technology: "TypeScript" | "JavaScript";
  version?: string;
}

/** Existing standalone artifacts only: these are not GameHost integrations. */
export class GamePreviews {
  static readonly entries: readonly GamePreview[] = [];

  static fileName(preview: GamePreview) {
    return `assets/previews/${preview.id}/index.html`;
  }
  static url(preview: GamePreview) {
    return assetUrl(`previews/${preview.id}/index.html`);
  }
  static markup() {
    if (!this.entries.length) return "";
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
    return `<h3>Standalone previews</h3><p class="preview-note">Standalone preview saves and rewards stay separate from Chapter House.</p><div class="game-preview-list">${this.entries.map((p) => `<a class="game-preview-card" href="${this.url(p)}" target="_blank" rel="noopener noreferrer"><small>${p.technology.toUpperCase()} PREVIEW${p.version ? ` · v${escape(p.version)}` : ""}</small><h4>${escape(p.title)}</h4><span class="preview-book">${escape(p.book)}</span><p>${escape(p.description)}</p><span class="preview-open">Open preview ↗ · New tab</span></a>`).join("")}</div>`;
  }
}
