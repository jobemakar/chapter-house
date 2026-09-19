import objectsUrl from "./assets/bureau-objects.png";
import floorUrl from "./assets/bureau-floor.webp";

/** Generated furniture atlas: neutral objects never reveal the hidden sigil. */
export class BureauWorldArt {
  static readonly cells: Record<string, number> = {
    alcove: 0, desk: 1, drawer: 2, tray: 3, niche: 4, cabinet: 5,
    window: 6, case: 7, stand: 8, bench: 9, box: 10, ledger: 11,
    bookshelf: 12, archive: 13, elevator: 14, lamp: 15,
  };
  private readonly atlas = new Image();
  private readonly floor = new Image();
  constructor(private readonly root: HTMLElement) {
    this.atlas.src = objectsUrl;
    this.floor.src = floorUrl;
    this.root.style.setProperty('--bureau-object-atlas', `url("${objectsUrl}")`);
  }
  static sprite(id: string): string {
    const cell = this.cells[id];
    if (cell === undefined) throw new Error(`Unknown Bureau object: ${id}`);
    return `<span class="spot-sprite" aria-hidden="true" style="background-position:${cell % 4 * 100 / 3}% ${Math.floor(cell / 4) * 100 / 3}%"></span>`;
  }
  drawFloor(c: CanvasRenderingContext2D): void {
    if (!this.floor.complete || !this.floor.naturalWidth) return;
    c.save(); c.globalAlpha = .65; c.drawImage(this.floor, 35, 60, 890, 590); c.restore();
  }
  draw(c: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number): boolean {
    if (!this.atlas.complete || !this.atlas.naturalWidth) return false;
    const cell = BureauWorldArt.cells[id], cw = this.atlas.naturalWidth / 4, ch = this.atlas.naturalHeight / 4;
    // Inspectable crop accommodates the generated wide bookcase's oversize cell.
    // Other cells retain their full gutter so crowns/feet are never clipped.
    if (id === 'bookshelf') {
      c.drawImage(this.atlas, this.atlas.naturalWidth * .024, this.atlas.naturalHeight * .79,
        this.atlas.naturalWidth * .255, this.atlas.naturalHeight * .14, x, y, w, h);
    } else c.drawImage(this.atlas, cell % 4 * cw, Math.floor(cell / 4) * ch, cw, ch, x, y, w, h);
    return true;
  }
}
