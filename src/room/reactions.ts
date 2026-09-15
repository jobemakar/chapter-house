import * as THREE from "three";
export type ReactionKind = "heart" | "surprise" | "question" | "hello" | "nom";
/** Camera-facing illustrated bubbles. One reusable bubble per actor, no DOM overlays. */
export class ActorReaction {
  readonly sprite = new THREE.Sprite();
  private time = 0;
  private texture: THREE.CanvasTexture | null = null;
  constructor(private style: "avatar" | "pet") {
    this.sprite.visible = false;
    this.sprite.position.y = style === "avatar" ? 2.35 : 1.6;
    this.sprite.scale.set(
      style === "avatar" ? 1.25 : 0.95,
      style === "avatar" ? 1.25 : 0.95,
      1,
    );
  }
  show(kind: ReactionKind) {
    const canvas = document.createElement("canvas");
    canvas.width = 192;
    canvas.height = 192;
    const c = canvas.getContext("2d")!;
    c.fillStyle = this.style === "avatar" ? "#fff5d8" : "#fff9ef";
    c.strokeStyle = this.style === "avatar" ? "#98794f" : "#a98574";
    c.lineWidth = 5;
    c.beginPath();
    if (this.style === "avatar") {
      for (let i = 0; i <= 120; i++) {
        const a = (i / 120) * Math.PI * 2,
          r = 64 + 7 * Math.cos(a * 8);
        const x = 96 + Math.cos(a) * r,
          y = 78 + Math.sin(a) * r;
        if (i === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
    } else c.ellipse(96, 78, 75, 54, 0, 0, Math.PI * 2);
    c.closePath();
    c.fill();
    c.stroke();
    c.beginPath();
    if (this.style === "avatar") {
      c.arc(92, 160, 8, 0, Math.PI * 2);
    } else {
      c.moveTo(73, 125);
      c.lineTo(58, 152);
      c.lineTo(104, 130);
    }
    c.fill();
    c.stroke();
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = `bold ${kind === "nom" ? 34 : kind === "hello" ? 37 : 66}px Georgia`;
    c.fillStyle =
      kind === "heart"
        ? "#da7e84"
        : this.style === "avatar"
          ? "#d19a35"
          : "#886352";
    c.fillText(
      { heart: "♥", surprise: "!", question: "?", hello: "Hi!", nom: "nom" }[
        kind
      ],
      96,
      78,
    );
    if (kind === "nom") {
      c.font = "23px Georgia";
      c.fillText("♥ ♥", 96, 113);
    }
    this.texture?.dispose();
    this.texture = new THREE.CanvasTexture(canvas);
    (this.sprite.material as THREE.SpriteMaterial).dispose();
    this.sprite.material = new THREE.SpriteMaterial({
      map: this.texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });
    this.time = 2.6;
    this.sprite.visible = true;
  }
  update(dt: number, reduced: boolean) {
    this.time = Math.max(0, this.time - dt);
    this.sprite.visible = this.time > 0;
    this.sprite.position.y =
      (this.style === "avatar" ? 2.35 : 1.6) +
      (reduced ? 0 : Math.sin(this.time * 4) * 0.045);
    (this.sprite.material as THREE.SpriteMaterial).opacity = Math.min(
      1,
      this.time * 4,
    );
  }
  dispose() {
    this.texture?.dispose();
    this.sprite.material.dispose();
    this.sprite.removeFromParent();
  }
}
