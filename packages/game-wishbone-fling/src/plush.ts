import M from "matter-js";
import type { PlushBody, Life } from "./types";
const { Bodies, Body, Composite, Constraint } = M;
export class Plush {
  world: M.Composite;
  parts: PlushBody[];
  joints: M.Constraint[];
  clock: number;
  body: PlushBody;
  head: PlushBody;
  facing = 1;
  constructor(world: M.Composite, x: number, y: number) {
    this.world = world;
    this.parts = [];
    this.joints = [];
    this.clock = 0;
    const group = Body.nextGroup(true);
    const part = (
      name: string,
      dx: number,
      dy: number,
      w: number,
      h: number,
      color: string,
      density = 0.0018,
    ) => {
      const b = Bodies.rectangle(x + dx, y + dy, w, h, {
        chamfer: { radius: Math.min(w, h) * 0.44 },
        density,
        friction: 0.38,
        frictionAir: 0.003,
        restitution: 0.32,
        collisionFilter: { group, category: 0x0001, mask: 0xffffffff },
      }) as PlushBody;
      b.game = { id: -1, kind: "plush", name, w, h, color, dx, dy };
      this.parts.push(b);
      return b;
    };
    this.body = part("body", 0, 0, 76, 44, "#c99559", 0.0058);
    this.head = part("head", 38, -19, 49, 46, "#e6bf87", 0.0035);
    const attach = (
      a: M.Body,
      b: M.Body,
      pa: M.Vector,
      pb: M.Vector,
      stiffness = 0.8,
    ) => {
      const joint = Constraint.create({
        bodyA: a,
        bodyB: b,
        pointA: pa,
        pointB: pb,
        length: 0,
        stiffness,
        damping: 0.13,
      });
      this.joints.push(joint);
    };
    attach(this.body, this.head, { x: 27, y: -12 }, { x: -11, y: 7 });
    attach(this.body, this.head, { x: 28, y: 6 }, { x: -10, y: 25 }, 0.28);
    for (const [name, dx, dy, color] of [
      ["back-paw", -26, 28, "#ac7949"],
      ["far-paw", 23, 27, "#b88756"],
      ["front-paw", 29, 32, "#ead2a8"],
      ["near-paw", -21, 34, "#f0dcba"],
    ] as const) {
      const p = part(name, dx, dy, 16, 32, color, 0.0012);
      attach(this.body, p, { x: dx, y: 16 }, { x: 0, y: 16 - dy }, 0.75);
    }
    const tail = part("tail", -46, -18, 14, 37, "#ddbd89", 0.0007);
    attach(this.body, tail, { x: -32, y: -4 }, { x: 14, y: 14 }, 0.6);
    for (const [name, dx, dy] of [
      ["far-ear", 11, -24],
      ["ear", 19, -21],
    ] as const) {
      const ear = part(
        name,
        dx,
        dy,
        18,
        37,
        name === "ear" ? "#b47f4a" : "#aa7444",
        0.0008,
      );
      // Root at the back/top of the skull, not beneath the eye.
      attach(this.head, ear, { x: dx - 38, y: dy + 1 }, { x: 0, y: -18 }, 0.72);
    }
    Composite.add(world, [...this.parts, ...this.joints]);
    this.pose(x, y, 0, 1);
  }
  pose(x: number, y: number, phase = 0, facing = 1) {
    for (const b of this.parts) {
      Body.setStatic(b, true);
      const p = b.game;
      let dy = p.dy,
        angle = 0;
      if (p.name.includes("paw")) {
        angle = Math.sin(phase + (p.dx < 0 ? Math.PI : 0)) * 0.65;
        dy -= Math.max(0, Math.cos(phase + (p.dx < 0 ? Math.PI : 0))) * 5;
      }
      if (p.name === "tail") angle = -0.5 + Math.sin(phase * 0.8) * 0.3;
      if (p.name.includes("ear")) angle = Math.sin(phase) * 0.1;
      Body.setPosition(b, { x: x + p.dx * facing, y: y + dy });
      Body.setAngle(b, angle * facing);
      b.collisionFilter.mask = 0;
    }
    this.facing = facing;
  }
  launch(velocity: M.Vector) {
    this.facing = 1;
    for (const b of this.parts) {
      Body.setStatic(b, false);
      b.collisionFilter.mask = 0xffffffff;
      Body.setVelocity(b, velocity);
      Body.setAngularVelocity(b, b === this.body ? -0.035 : 0.035);
    }
  }
  dispose() {
    Composite.remove(this.world, this.parts);
    Composite.remove(this.world, this.joints);
  }
}
export function drawPlush(
  c: CanvasRenderingContext2D,
  plush: Plush,
  offset = { x: 0, y: 0 },
  squash = 0,
  life: Life = {},
) {
  const order = [
    "tail",
    "back-paw",
    "far-paw",
    "far-ear",
    "body",
    "near-paw",
    "front-paw",
    "head",
    "ear",
  ];
  const shape = (b: PlushBody) => {
    const p = b.game;
    c.save();
    c.translate(b.position.x + offset.x, b.position.y + offset.y);
    c.rotate(b.angle);
    const t = life.time || 0,
      power = life.power || 0;
    const wave = life.reduced ? 0 : Math.sin(t * (7 + power * 7));
    // Rotate appendages around their attachment, not their centers.
    let turn = 0,
      pivotX = 0,
      pivotY = 0;
    if (life.ready) {
      if (p.name.includes("paw")) {
        pivotY = 16 - p.dy;
        turn = life.held
          ? Math.sin(t * 10 + p.dx * 0.2) * 0.26 * (life.reduced ? 0 : 1) +
            0.38 * power +
            (life.sway || 0) * 0.3
          : 0;
      }
      if (p.name === "tail") {
        pivotX = 14;
        pivotY = 14;
        turn = wave * (0.18 + power * 0.38);
      }
      if (p.name.includes("ear")) {
        pivotY = -18;
        turn = (life.sway || 0) * 0.65 + wave * 0.09 * power;
      }
      if (p.name === "head") turn = (life.aim || 0) * 0.08;
      c.translate(pivotX, pivotY);
      c.rotate(turn);
      c.translate(-pivotX, -pivotY);
    }
    if (plush.facing < 0) c.scale(-1, 1);
    if (p.name === "body") c.scale(1 + squash * 0.1, 1 - squash * 0.08);
    c.beginPath();
    c.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, Math.min(p.w, p.h) * 0.44);
    c.fillStyle = p.color;
    c.fill();
    c.strokeStyle = "#805e3f";
    c.lineWidth = 1.8;
    c.stroke();
    if (p.name === "body") {
      c.beginPath();
      c.ellipse(12, 3, 23, 18, 0, 0, Math.PI * 2);
      c.fillStyle = "#f3dfb9";
      c.fill();
      c.setLineDash([2, 4]);
      c.beginPath();
      c.moveTo(-23, -12);
      c.quadraticCurveTo(-8, 3, -22, 14);
      c.strokeStyle = "#94704b";
      c.lineWidth = 1;
      c.stroke();
      c.setLineDash([]);
    }
    if (p.name.includes("paw")) {
      c.beginPath();
      c.ellipse(0, 9, 7, 7, 0, 0, Math.PI * 2);
      c.fillStyle = "#f5e1bd";
      c.fill();
      c.beginPath();
      c.moveTo(-3, 10);
      c.lineTo(-3, 14);
      c.moveTo(2, 10);
      c.lineTo(2, 14);
      c.lineWidth = 1;
      c.stroke();
    }
    if (p.name === "head") {
      // Soft muzzle, button eye, and cheerful mouth stay attached to the head.
      c.beginPath();
      c.ellipse(11, 8, 19, 12, 0, 0, Math.PI * 2);
      c.fillStyle = "#fff0cc";
      c.fill();
      c.beginPath();
      c.ellipse(23, 4, 7, 5, 0, 0, Math.PI * 2);
      c.fillStyle = "#544939";
      c.fill();
      c.beginPath();
      c.ellipse(
        6 + (life.held ? 1.2 : 0),
        -7,
        4.5,
        !life.reduced && t % 4.7 < 0.12 ? 0.7 : 4.5 + power,
        0,
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#403d30";
      c.fill();
      c.beginPath();
      c.arc(
        7.5,
        -8.5,
        !life.reduced && t % 4.7 < 0.12 ? 0 : 1.4,
        0,
        Math.PI * 2,
      );
      c.fillStyle = "#fff7dc";
      c.fill();
      c.beginPath();
      c.arc(11, 9, 8, 0.12, 1.65);
      c.strokeStyle = "#82513c";
      c.lineWidth = 2;
      c.stroke();
      c.beginPath();
      if (life.held && power > 0.3) {
        c.fillStyle = "#e99287";
        c.roundRect(12, 15, 7, 5 + power * 5, 3);
        c.fill();
        c.beginPath();
      }
      c.moveTo(-20, 13);
      c.lineTo(8, 20);
      c.lineTo(-8, 37);
      c.closePath();
      c.fillStyle = "#dc7350";
      c.fill();
      c.beginPath();
      c.arc(-7, 25, 2, 0, Math.PI * 2);
      c.fillStyle = "#ffd29b";
      c.fill();
    }
    if (p.name === "ear") {
      c.beginPath();
      c.roundRect(-4, -9, 8, 22, 4);
      c.fillStyle = "#dba986";
      c.fill();
    }
    c.restore();
  };
  for (const name of order)
    shape(plush.parts.find((b) => b.game.name === name)!);
}

