"use strict";
(() => {
  // src/levels.ts
  var paintedHillside = {
    id: "painted-hillside",
    name: "The forest relay",
    required: 100,
    floor: 14.7,
    reservoir: { left: 3.55, right: 8.25, height: 3.25, centerX: 5.9, centerY: 1.65, halfW: 2.05, halfH: 1.25 },
    soil: [[[0, 3.25], [12, 3.25], [12, 14.7], [7.25, 14.7], [6.9, 14.15], [0, 14.15]].map(([x, y]) => ({ x, y }))],
    protected: [{ x: 0, y: 3.2, w: 0.3, h: 11.5 }, { x: 11.7, y: 3.2, w: 0.3, h: 11.5 }],
    pockets: [{ x: 5.65, y: 12.65, w: 1, h: 1.15 }, { x: 7.25, y: 11.45, w: 4.75, h: 3.55 }],
    rocks: [
      { x: 1.05, y: 5.25, w: 2.15, h: 1.55, inset: 0.12 },
      { x: 6.45, y: 5.05, w: 2.4, h: 1.45, inset: 0.12 },
      { x: 2.4, y: 8.25, w: 2.15, h: 1.6, inset: 0.12 },
      { x: 6.75, y: 9.35, w: 2.35, h: 1.5, inset: 0.12 }
    ],
    fixtures: [{ x: 6.55, y: 12.55, w: 0.7, h: 1.35 }, { x: 9.55, y: 7.05, w: 1.1, h: 2.15 }, { x: 7.25, y: 11.45, w: 4.75, h: 3.25 }],
    canteens: [{ x: 5.15, y: 4.65 }, { x: 4.6, y: 7.35 }, { x: 5.15, y: 10.65 }],
    intakes: [
      {
        id: "hose",
        x: 7.05,
        y: 13.25,
        facing: "left",
        dummy: false,
        sensor: { x: 6.15, y: 13.35, r: 0.34 },
        pull: { x: 4.5, y: 11.55, w: 2.75, h: 2.35, targetX: 6.15, targetY: 13.35, strength: 1.05, maxSpeed: 10 }
      },
      { id: "sealed", x: 10.1, y: 8.15, facing: "up", dummy: true, sealed: true }
    ],
    hint: [[5.9, 3.15], [5.15, 4.65], [4.6, 7.35], [5.8, 8.6], [5.15, 10.65], [5.65, 12.1], [5.8, 13.18], [6.12, 13.28]],
    target: { x: 7.25, y: 11.45, w: 4.75, h: 3.2 },
    fire: { x: 9.7, y: 13.75 },
    hose: { x: 10.35, y: 12.65 }
  };
  var LEVELS = [paintedHillside];
  var DEFAULT_LEVEL_ID = paintedHillside.id;
  function getLevel(id = DEFAULT_LEVEL_ID) {
    const level = LEVELS.find((candidate) => candidate.id === id);
    if (!level) throw new Error(`Unknown Wildfire level: ${id}`);
    return level;
  }

  // src/physics.ts
  var WORLD_WIDTH = 12;
  var WORLD_HEIGHT = 15;
  var CELL_SIZE = 0.15;
  var COLS = 80;
  var ROWS = 100;
  var WaterSimulation = class _WaterSimulation {
    constructor(B, config) {
      this.bodies = /* @__PURE__ */ new Set();
      this.rows = [];
      this.grid = new Uint8Array(COLS * ROWS);
      this.colliders = [];
      this.rocks = [];
      this.rockColliders = [];
      this.protected = [];
      this.canteens = [];
      this.collected = 0;
      this.required = 0;
      this.initialCount = 0;
      this.won = false;
      this.steps = 0;
      this.dug = 0;
      this.dirty = true;
      this.wasted = 0;
      this.lastDelivery = -999;
      this.lastWaste = -999;
      this.lastBlocked = -999;
      this.B = B;
      this.config = config;
      this.reset();
    }
    reset() {
      const B = this.B;
      if (this.world) this.disposeWorld();
      this.bodies = /* @__PURE__ */ new Set();
      this.rows = [];
      this.collected = 0;
      this.won = false;
      this.steps = 0;
      this.dug = 0;
      this.dirty = true;
      this.wasted = 0;
      this.lastDelivery = -999;
      this.lastWaste = -999;
      this.lastBlocked = -999;
      this.canteens = this.config.canteens.map((canteen) => ({ ...canteen, filled: false, filledAt: -1 }));
      this.rocks = this.config.rocks;
      this.rockColliders = this.rocks.map((rock) => {
        const inset = rock.inset ?? 0;
        return { x: rock.x + inset, y: rock.y + inset, w: rock.w - 2 * inset, h: rock.h - 2 * inset };
      });
      this.protected = this.config.protected;
      const reservoir = this.config.reservoir;
      this.colliders = [
        { x: -0.3, y: -0.3, w: 0.3, h: WORLD_HEIGHT + 0.3 },
        { x: WORLD_WIDTH, y: -0.3, w: 0.3, h: WORLD_HEIGHT + 0.3 },
        { x: -0.3, y: -0.3, w: WORLD_WIDTH + 0.6, h: 0.3 },
        { x: 0, y: this.config.floor, w: WORLD_WIDTH, h: 0.3 },
        { x: reservoir.left, y: 0, w: 0.2, h: reservoir.height },
        { x: reservoir.right, y: 0, w: 0.2, h: reservoir.height },
        ...this.rockColliders,
        ...this.protected,
        ...this.config.fixtures
      ];
      const gravity = new B.b2Vec2(0, 10);
      this.world = new B.b2World(gravity);
      B.destroy(gravity);
      this.grid = new Uint8Array(COLS * ROWS);
      for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
        const point = { x: (col + 0.5) * CELL_SIZE, y: (row + 0.5) * CELL_SIZE };
        this.grid[row * COLS + col] = this.config.soil.some((polygon) => _WaterSimulation.inPolygon(point, polygon)) && !this.config.pockets.some((pocket) => _WaterSimulation.inRect(point, pocket)) ? 1 : 0;
      }
      this.colliders.forEach((collider) => this.rect(collider));
      for (let row = 0; row < ROWS; row++) this.rebuildRow(row);
      const definition = new B.b2ParticleSystemDef();
      definition.set_radius(0.073);
      definition.set_dampingStrength(0.7);
      definition.set_gravityScale(1);
      definition.set_strictContactCheck(true);
      this.water = this.world.CreateParticleSystem(definition);
      B.destroy(definition);
      this.createReservoir(reservoir);
      this.initialCount = this.water.GetParticleCount();
      this.required = this.config.required;
    }
    disposeWorld() {
      const B = this.B;
      for (const body of this.bodies) delete B.getCache(B.b2Body)[B.getPointer(body)];
      delete B.getCache(B.b2ParticleSystem)[B.getPointer(this.water)];
      B.destroy(this.world);
    }
    createReservoir(reservoir) {
      const B = this.B;
      const shape = new B.b2PolygonShape();
      const center = new B.b2Vec2(reservoir.centerX, reservoir.centerY);
      shape.SetAsBox(reservoir.halfW, reservoir.halfH, center, 0);
      const group = new B.b2ParticleGroupDef();
      group.set_shape(shape);
      group.set_flags(B.b2_waterParticle);
      const created = this.water.CreateParticleGroup(group);
      delete B.getCache(B.b2ParticleGroup)[B.getPointer(created)];
      B.destroy(group);
      B.destroy(shape);
      B.destroy(center);
    }
    rect(rect, body) {
      const B = this.B;
      if (!body) {
        const definition = new B.b2BodyDef();
        body = this.world.CreateBody(definition);
        B.destroy(definition);
        this.bodies.add(body);
      }
      const shape = new B.b2PolygonShape();
      const center = new B.b2Vec2(rect.x + rect.w / 2, rect.y + rect.h / 2);
      shape.SetAsBox(rect.w / 2, rect.h / 2, center, 0);
      const fixture = body.CreateFixture(shape, 0);
      delete B.getCache(B.b2Fixture)[B.getPointer(fixture)];
      B.destroy(shape);
      B.destroy(center);
      return body;
    }
    rebuildRow(row) {
      const old = this.rows[row];
      if (old) {
        this.world.DestroyBody(old);
        this.bodies.delete(old);
        delete this.B.getCache(this.B.b2Body)[this.B.getPointer(old)];
      }
      let body;
      for (let col = 0; col < COLS; ) {
        if (!this.grid[row * COLS + col]) {
          col++;
          continue;
        }
        const start = col;
        while (col < COLS && this.grid[row * COLS + col]) col++;
        body = this.rect({ x: start * CELL_SIZE, y: row * CELL_SIZE, w: (col - start) * CELL_SIZE, h: CELL_SIZE }, body);
      }
      this.rows[row] = body;
    }
    digLine(ax, ay, bx, by, radius = 0.46) {
      if (this.won) return 0;
      const changed = /* @__PURE__ */ new Set();
      const dx = bx - ax;
      const dy = by - ay;
      const length2 = dx * dx + dy * dy;
      const row0 = Math.max(0, Math.floor((Math.min(ay, by) - radius) / CELL_SIZE));
      const row1 = Math.min(ROWS - 1, Math.ceil((Math.max(ay, by) + radius) / CELL_SIZE));
      const col0 = Math.max(0, Math.floor((Math.min(ax, bx) - radius) / CELL_SIZE));
      const col1 = Math.min(COLS - 1, Math.ceil((Math.max(ax, bx) + radius) / CELL_SIZE));
      let removed = 0;
      for (let row = row0; row <= row1; row++) for (let col = col0; col <= col1; col++) {
        const point = { x: (col + 0.5) * CELL_SIZE, y: (row + 0.5) * CELL_SIZE };
        if (this.rockColliders.some((rock) => _WaterSimulation.inRect(point, rock)) || this.protected.some((strip) => _WaterSimulation.inRect(point, strip))) continue;
        const progress = length2 ? Math.max(0, Math.min(1, ((point.x - ax) * dx + (point.y - ay) * dy) / length2)) : 0;
        const distance2 = (point.x - ax - progress * dx) ** 2 + (point.y - ay - progress * dy) ** 2;
        if (distance2 <= radius * radius && this.grid[row * COLS + col]) {
          this.grid[row * COLS + col] = 0;
          changed.add(row);
          removed++;
        }
      }
      changed.forEach((row) => this.rebuildRow(row));
      if (removed) {
        this.dug += removed;
        this.dirty = true;
      }
      return removed;
    }
    positions() {
      return this.buffer(this.water.GetPositionBuffer());
    }
    velocities() {
      return this.buffer(this.water.GetVelocityBuffer());
    }
    buffer(pointer) {
      const offset = this.B.getPointer(pointer) >>> 2;
      delete this.B.getCache(this.B.b2Vec2)[this.B.getPointer(pointer)];
      return this.B.HEAPF32.subarray(offset, offset + 2 * this.water.GetParticleCount());
    }
    solidAt(x, y) {
      const row = Math.floor(y / CELL_SIZE);
      const col = Math.floor(x / CELL_SIZE);
      return Boolean(row >= 0 && row < ROWS && col >= 0 && col < COLS && this.grid[row * COLS + col] || this.colliders.some((collider) => _WaterSimulation.inRect({ x, y }, collider)));
    }
    step() {
      this.world.Step(1 / 60, 6, 3, 3);
      this.steps++;
      const positions = this.positions();
      const velocities = this.velocities();
      for (let index = 0; index < positions.length / 2; index++) {
        const point = { x: positions[2 * index], y: positions[2 * index + 1] };
        for (const canteen of this.canteens) if (!canteen.filled && (point.x - canteen.x) ** 2 + (point.y - canteen.y) ** 2 < 0.44 ** 2) {
          canteen.filled = true;
          canteen.filledAt = this.steps;
        }
        if (this.config.intakes.some((intake2) => intake2.sealed && Math.abs(point.x - intake2.x) < 0.75 && Math.abs(point.y - intake2.y) < 1.35)) this.lastBlocked = this.steps;
        const pull = this.config.intakes.find((intake2) => intake2.pull && _WaterSimulation.inRect(point, intake2.pull))?.pull;
        if (pull) {
          const dx = pull.targetX - point.x;
          const dy = pull.targetY - point.y;
          const strength = pull.strength ?? 0.12;
          const max = pull.maxSpeed ?? 3;
          velocities[2 * index] = Math.max(-max, Math.min(max, velocities[2 * index] + dx * strength));
          velocities[2 * index + 1] = Math.max(-max, Math.min(max, velocities[2 * index + 1] + dy * strength));
        }
        const intake = this.config.intakes.find((candidate) => candidate.sensor && _WaterSimulation.inSensor(point, candidate.sensor));
        if (intake) {
          if (intake.dummy) {
            this.wasted++;
            this.lastWaste = this.steps;
          } else {
            this.collected++;
            this.lastDelivery = this.steps;
          }
          this.water.DestroyParticle(index);
        }
      }
      if (this.collected >= this.required) this.won = true;
    }
    snapshot() {
      return { water: this.water.GetParticleCount(), initialWater: this.initialCount, collected: this.collected, required: this.required, won: this.won, dug: this.dug, steps: this.steps, wasted: this.wasted, canteens: this.canteens.map((canteen) => canteen.filled), canteenFillSteps: this.canteens.map((canteen) => canteen.filledAt), lastDelivery: this.lastDelivery, lastWaste: this.lastWaste, lastBlocked: this.lastBlocked, level: this.config.id };
    }
    static inRect(point, rect) {
      return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
    }
    static inSensor(point, sensor) {
      return sensor.r === void 0 ? _WaterSimulation.inRect(point, sensor) : (point.x - sensor.x) ** 2 + (point.y - sensor.y) ** 2 <= sensor.r ** 2;
    }
    static inPolygon(point, polygon) {
      let inside = false;
      for (let index = 0, last = polygon.length - 1; index < polygon.length; last = index++) {
        const a = polygon[index];
        const b = polygon[last];
        if (a.y > point.y !== b.y > point.y && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
      }
      return inside;
    }
  };

  // src/water-renderer.ts
  var LOW = 0.45;
  var HIGH = 0.65;
  var SIGMA = 2.3;
  var SUPPORT = 7;
  var kernel = [];
  for (let y = -SUPPORT; y <= SUPPORT; y++) for (let x = -SUPPORT; x <= SUPPORT; x++) {
    const weight = Math.exp(-(x * x + y * y) / (2 * SIGMA * SIGMA));
    if (weight > 8e-3) kernel.push([x, y, weight]);
  }
  function coverage(density) {
    const t = Math.max(0, Math.min(1, (density - LOW) / (HIGH - LOW)));
    return t * t * (3 - 2 * t);
  }
  function splat(field, width, height, x, y) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const a = (1 - fx) * (1 - fy);
    const b = fx * (1 - fy);
    const c = (1 - fx) * fy;
    const d = fx * fy;
    for (const [offsetX, offsetY, value] of kernel) {
      const px = ix + offsetX;
      const py = iy + offsetY;
      if (px < 0 || py < 0 || px + 1 >= width || py + 1 >= height) continue;
      const index = py * width + px;
      field[index] += value * a;
      field[index + 1] += value * b;
      field[index + width] += value * c;
      field[index + width + 1] += value * d;
    }
  }
  var WaterSurfaceRenderer = class {
    constructor(width, height, worldScale) {
      this.samples = 0;
      this.totalMs = 0;
      this.maxMs = 0;
      this.width = width / 2;
      this.height = height / 2;
      this.scale = worldScale / 2;
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.context = this.canvas.getContext("2d");
      this.image = this.context.createImageData(this.width, this.height);
      this.field = new Float32Array(this.width * this.height);
      this.solid = new Uint8Array(this.field.length);
    }
    updateMask(_simulation, visualMask) {
      this.context.clearRect(0, 0, this.width, this.height);
      this.context.drawImage(visualMask, 0, 0, this.width, this.height);
      const data = this.context.getImageData(0, 0, this.width, this.height).data;
      for (let index = 0; index < this.solid.length; index++) this.solid[index] = data[index * 4 + 3] > 100 ? 1 : 0;
    }
    draw(target, positions) {
      const started = performance.now();
      const pixels = this.image.data;
      this.field.fill(0);
      pixels.fill(0);
      for (let index = 0; index < positions.length; index += 2) splat(this.field, this.width, this.height, positions[index] * this.scale - 0.5, positions[index + 1] * this.scale - 0.5);
      for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const density = this.field[index];
        if (this.solid[index] || density <= LOW) continue;
        const alpha = coverage(density);
        const above = y > 1 ? coverage(this.field[index - 2 * this.width]) : 0;
        const rim = Math.max(0, alpha - above) * 0.8;
        const depth = y / this.height;
        const offset = index * 4;
        pixels[offset] = 49 + rim * 100 - depth * 12;
        pixels[offset + 1] = 187 + rim * 53 - depth * 18;
        pixels[offset + 2] = 218 + rim * 30 - depth * 12;
        pixels[offset + 3] = Math.round(alpha * 255);
      }
      this.context.putImageData(this.image, 0, 0);
      target.save();
      target.imageSmoothingEnabled = true;
      target.drawImage(this.canvas, 0, 0, this.width * 2, this.height * 2);
      target.restore();
      const elapsed = performance.now() - started;
      this.samples++;
      this.totalMs += elapsed;
      this.maxMs = Math.max(this.maxMs, elapsed);
    }
    stats() {
      return { mode: "gaussian-metaballs", resolution: [this.width, this.height], frames: this.samples, averageMs: this.samples ? this.totalMs / this.samples : 0, maxMs: this.maxMs };
    }
  };

  // src/game.ts
  var SCALE = 50;
  var WIDTH = 600;
  var HEIGHT = 750;
  var assetPaths = { background: "assets/v3/forest-frame.png", soil: "assets/v3/soil-texture.png", rocks: "assets/v3/bedrock-cluster.png", canteen: "assets/v3/canteen-buddy.png", reservoir: "assets/v3/reservoir-frame.png", working: "assets/v3/intake-working.png", dummy: "assets/v3/intake-dummy-capped.png", target: "assets/v3/campsite-target.png" };
  function required(selector) {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing required game element: ${selector}`);
    return element;
  }
  function layer() {
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    return canvas;
  }
  function pointFromEvent(canvas, event) {
    const box = canvas.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width * 12, y: (event.clientY - box.top) / box.height * 15 };
  }
  var AssetLoader = class {
    async load() {
      const entries = await Promise.all(Object.keys(assetPaths).map(async (key) => [key, await this.image(assetPaths[key])]));
      return Object.fromEntries(entries);
    }
    image(url) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Unable to load ${url}`));
        image.src = url;
      });
    }
  };
  var HudController = class {
    constructor() {
      this.reset = required("#reset");
      this.hint = required("#hint");
      this.state = required("#state");
      this.drops = required("#drops");
      this.progress = required("#progress");
      this.victory = required("#win");
      this.buddies = required("#buddies");
      this.victoryBuddies = required("#win-buddies");
      this.reported = "";
    }
    bind(restart, toggleHint) {
      this.reset.addEventListener("click", restart);
      required("#again").addEventListener("click", restart);
      this.hint.addEventListener("click", toggleHint);
    }
    setReady() {
      this.reset.disabled = false;
      required("#loading").hidden = true;
    }
    setFailure() {
      required("#loading").querySelector("h2").textContent = "The water couldn\u2019t load";
      required("#loading").querySelector("p").textContent = "Please reload. This game needs WebAssembly.";
      this.state.textContent = "Physics unavailable";
    }
    setHint(showing) {
      this.hint.setAttribute("aria-pressed", String(showing));
      this.hint.textContent = showing ? "Hide the hint" : "Show a hint";
    }
    resetReport() {
      this.reported = "";
    }
    update(level) {
      const filled = level.canteens.filter((canteen) => canteen.filled).length;
      const blockedRecent = level.steps - level.lastBlocked < 120;
      const next = `${level.collected}/${filled}/${level.wasted}/${blockedRecent}/${level.won}`;
      if (next === this.reported) return;
      this.reported = next;
      this.progress.max = level.required;
      this.progress.value = Math.min(level.required, level.collected);
      this.drops.textContent = `${Math.min(100, Math.round(100 * level.collected / level.required))}% doused`;
      this.buddies.textContent = `Canteen buddies ${filled} / ${level.canteens.length}`;
      this.state.textContent = level.won ? "Campsite fire extinguished!" : blockedRecent ? "That pipe is capped \u2014 redirect the water" : level.collected ? "Intake working \u2014 the hose is spraying!" : "Guide water into the large open pipe mouth";
      this.victory.hidden = !level.won;
      this.victoryBuddies.textContent = `${filled} of ${level.canteens.length} canteen buddies filled`;
    }
  };
  var InputController = class {
    constructor(canvas, level) {
      this.canvas = canvas;
      this.level = level;
      this.pointer = null;
      this.activeId = null;
      this.keyboardDig = false;
      this.keyPosition = { x: 2.5, y: 3.7 };
      this.onPointerDown = (event) => {
        const level = this.level();
        if (!level || level.won || this.activeId !== null) return;
        event.preventDefault();
        this.canvas.setPointerCapture(event.pointerId);
        this.activeId = event.pointerId;
        this.pointer = pointFromEvent(this.canvas, event);
        level.digLine(this.pointer.x, this.pointer.y, this.pointer.x, this.pointer.y);
      };
      this.onPointerMove = (event) => {
        const level = this.level();
        if (!level) return;
        const next = pointFromEvent(this.canvas, event);
        if (event.pointerId === this.activeId && this.pointer) {
          event.preventDefault();
          level.digLine(this.pointer.x, this.pointer.y, next.x, next.y);
        }
        if (this.activeId === null || event.pointerId === this.activeId) this.pointer = next;
      };
      this.endPointer = (event) => {
        if (event.pointerId === this.activeId) {
          this.activeId = null;
          this.pointer = null;
        }
      };
      this.onKeyDown = (event) => {
        const level = this.level();
        if (!level || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) return;
        event.preventDefault();
        if (event.key === " ") this.keyboardDig = true;
        const old = { ...this.keyPosition };
        if (event.key === "ArrowLeft") this.keyPosition.x -= 0.25;
        if (event.key === "ArrowRight") this.keyPosition.x += 0.25;
        if (event.key === "ArrowUp") this.keyPosition.y -= 0.25;
        if (event.key === "ArrowDown") this.keyPosition.y += 0.25;
        this.keyPosition.x = Math.max(0.4, Math.min(11.6, this.keyPosition.x));
        this.keyPosition.y = Math.max(0.4, Math.min(11.3, this.keyPosition.y));
        this.pointer = { ...this.keyPosition };
        if (this.keyboardDig) level.digLine(old.x, old.y, this.keyPosition.x, this.keyPosition.y);
      };
      canvas.addEventListener("pointerdown", this.onPointerDown);
      canvas.addEventListener("pointermove", this.onPointerMove);
      canvas.addEventListener("pointerup", this.endPointer);
      canvas.addEventListener("pointercancel", this.endPointer);
      canvas.addEventListener("lostpointercapture", this.endPointer);
      canvas.addEventListener("pointerleave", () => {
        if (this.activeId === null) this.pointer = null;
      });
      canvas.addEventListener("keydown", this.onKeyDown);
      canvas.addEventListener("keyup", (event) => {
        if (event.key === " ") this.keyboardDig = false;
      });
      canvas.addEventListener("blur", () => this.clear());
    }
    reset() {
      this.activeId = null;
      this.keyboardDig = false;
      this.keyPosition = { x: 2.5, y: 3.7 };
      this.pointer = null;
    }
    clear() {
      this.activeId = null;
      this.keyboardDig = false;
      this.pointer = null;
    }
  };
  var SceneRenderer = class {
    constructor(assets, config) {
      this.assets = assets;
      this.config = config;
      this.canvas = required("#game");
      this.context = this.canvas.getContext("2d");
      this.terrain = layer();
      this.terrainContext = this.terrain.getContext("2d");
      this.mask = layer();
      this.maskContext = this.mask.getContext("2d");
      this.waterClip = layer();
      this.waterClipContext = this.waterClip.getContext("2d");
      this.waterSurface = layer();
      this.waterSurfaceContext = this.waterSurface.getContext("2d");
      this.water = new WaterSurfaceRenderer(WIDTH, HEIGHT, SCALE);
      this.soilFallback = layer();
      this.soilFallbackContext = this.soilFallback.getContext("2d");
      this.originalGrid = new Uint8Array(COLS * ROWS);
      this.makeFallbackSoil();
    }
    diagnostics() {
      return this.water;
    }
    setOriginalGrid(grid) {
      this.originalGrid = grid.slice();
    }
    draw(level, time, showHint, pointer) {
      this.context.drawImage(this.assets.background, 0, 0, WIDTH, HEIGHT);
      if (level.dirty) this.updateTerrain(level);
      this.context.drawImage(this.terrain, 0, 0);
      level.rocks.forEach((rock, index) => {
        this.context.save();
        if (index % 2) {
          this.context.translate((rock.x * 2 + rock.w) * SCALE, 0);
          this.context.scale(-1, 1);
          this.context.drawImage(this.assets.rocks, 150, 105, 1120, 910, rock.x * SCALE, rock.y * SCALE, rock.w * SCALE, rock.h * SCALE);
        } else this.context.drawImage(this.assets.rocks, 150, 105, 1120, 910, rock.x * SCALE, rock.y * SCALE, rock.w * SCALE, rock.h * SCALE);
        this.context.restore();
      });
      this.waterSurfaceContext.clearRect(0, 0, WIDTH, HEIGHT);
      this.water.draw(this.waterSurfaceContext, level.positions());
      this.waterSurfaceContext.globalCompositeOperation = "destination-out";
      this.waterSurfaceContext.drawImage(this.waterClip, 0, 0);
      this.waterSurfaceContext.globalCompositeOperation = "source-atop";
      this.drawWaterGlints(time);
      this.waterSurfaceContext.globalCompositeOperation = "source-over";
      this.context.drawImage(this.waterSurface, 0, 0);
      this.context.drawImage(this.assets.reservoir, 170, 0, 260, 190);
      level.canteens.forEach((canteen) => this.drawCanteen(canteen, level, time));
      this.config.intakes.forEach((intake) => this.drawPipe(intake, level, time));
      this.drawCamp(level, time);
      if (!level.dug) this.roundRect(215, 176, 170, 29, 15, "#4e371dd6"), this.text("DRAG TO CLEAR A PATH", 300, 196, 10, "#ffedc1");
      if (showHint && !level.won) {
        this.context.strokeStyle = "#ffffcba6";
        this.context.lineWidth = 3;
        this.context.setLineDash([6, 9]);
        this.context.beginPath();
        this.config.hint.forEach(([x, y], index) => index ? this.context.lineTo(x * SCALE, y * SCALE) : this.context.moveTo(x * SCALE, y * SCALE));
        this.context.stroke();
        this.context.setLineDash([]);
      }
      if (pointer && !level.won) {
        this.context.strokeStyle = "#fff0bcbb";
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.arc(pointer.x * SCALE, pointer.y * SCALE, 0.46 * SCALE, 0, Math.PI * 2);
        this.context.stroke();
      }
    }
    makeFallbackSoil() {
      const gradient = this.soilFallbackContext.createLinearGradient(0, 180, 0, 580);
      gradient.addColorStop(0, "#c6924d");
      gradient.addColorStop(0.5, "#b27b3e");
      gradient.addColorStop(1, "#93612f");
      this.soilFallbackContext.fillStyle = gradient;
      this.soilFallbackContext.fillRect(0, 0, WIDTH, HEIGHT);
      let seed = 7919;
      const random = () => {
        seed = Math.imul(seed, 1664525) + 1013904223 >>> 0;
        return seed / 4294967296;
      };
      for (let index = 0; index < 12500; index++) {
        const x = random() * WIDTH;
        const y = random() * HEIGHT;
        const radius = 0.3 + random() * 1.3;
        this.soilFallbackContext.fillStyle = index % 3 ? "#f2c77b20" : "#3c281926";
        this.soilFallbackContext.beginPath();
        this.soilFallbackContext.ellipse(x, y, radius * 1.7, radius, 0.3, 0, Math.PI * 2);
        this.soilFallbackContext.fill();
      }
      for (let index = 0; index < 260; index++) {
        const x = random() * WIDTH;
        const y = random() * HEIGHT;
        this.soilFallbackContext.fillStyle = "#734c30";
        this.soilFallbackContext.beginPath();
        this.soilFallbackContext.ellipse(x, y, 2 + index % 3, 1.5 + index % 2, 0.5, 0, Math.PI * 2);
        this.soilFallbackContext.fill();
        this.soilFallbackContext.fillStyle = "#d2aa71";
        this.soilFallbackContext.beginPath();
        this.soilFallbackContext.ellipse(x - 0.6, y - 0.7, 1.5 + index % 3, 1 + index % 2, 0.5, 0, Math.PI * 2);
        this.soilFallbackContext.fill();
      }
    }
    updateTerrain(level) {
      const tc = this.terrainContext;
      const mc = this.maskContext;
      const wc = this.waterClipContext;
      mc.clearRect(0, 0, WIDTH, HEIGHT);
      mc.fillStyle = "#fff";
      for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; ) {
        if (!level.grid[row * COLS + col]) {
          col++;
          continue;
        }
        const start = col;
        while (col < COLS && level.grid[row * COLS + col]) col++;
        mc.fillRect(start * 7.5, row * 7.5, (col - start) * 7.5, 7.5);
      }
      tc.clearRect(0, 0, WIDTH, HEIGHT);
      tc.filter = "blur(4px)";
      tc.drawImage(this.mask, 0, 0);
      tc.filter = "none";
      const pixels = tc.getImageData(0, 0, WIDTH, HEIGHT);
      for (let index = 3; index < pixels.data.length; index += 4) pixels.data[index] = Math.max(0, Math.min(255, (pixels.data[index] - 110) * 6));
      tc.putImageData(pixels, 0, 0);
      wc.clearRect(0, 0, WIDTH, HEIGHT);
      wc.drawImage(this.terrain, 0, 0);
      tc.globalCompositeOperation = "source-in";
      tc.fillStyle = tc.createPattern(this.assets.soil, "repeat");
      tc.fillRect(0, 0, WIDTH, HEIGHT);
      tc.globalCompositeOperation = "source-over";
      mc.clearRect(0, 0, WIDTH, HEIGHT);
      mc.drawImage(this.waterClip, 0, 2);
      mc.globalCompositeOperation = "destination-out";
      mc.drawImage(this.waterClip, 0, 0);
      mc.globalCompositeOperation = "source-in";
      mc.fillStyle = "#5b3b2959";
      mc.fillRect(0, 0, WIDTH, HEIGHT);
      mc.globalCompositeOperation = "source-over";
      tc.drawImage(this.mask, 0, 0);
      for (let row = 1; row < 75; row++) for (let col = 0; col < COLS; col++) {
        if (!level.grid[row * COLS + col] || !this.originalGrid[row * COLS + col] || this.originalGrid[(row - 1) * COLS + col]) continue;
        const x = col * 7.5;
        const y = row * 7.5;
        tc.fillStyle = "#567f34";
        tc.fillRect(x, y - 3, 7.7, 4);
        for (let blade = 0; blade < 3; blade++) {
          tc.fillStyle = blade % 2 ? "#9caf4c" : "#6d983e";
          tc.beginPath();
          tc.moveTo(x + blade * 3, y + 4);
          tc.lineTo(x + blade * 3 - 2, y - 6 - (col + blade) % 5);
          tc.lineTo(x + blade * 3 + 3, y - 1);
          tc.fill();
        }
      }
      wc.fillStyle = "#fff";
      level.colliders.forEach((collider) => wc.fillRect(collider.x * SCALE, collider.y * SCALE, collider.w * SCALE, collider.h * SCALE));
      this.water.updateMask(level, this.waterClip);
      level.dirty = false;
    }
    text(label, x, y, size = 12, color = "#ebdfb7") {
      this.context.font = `600 ${size}px system-ui,sans-serif`;
      this.context.fillStyle = color;
      this.context.textAlign = "center";
      this.context.fillText(label, x, y);
    }
    roundRect(x, y, w, h, radius, fill) {
      this.context.fillStyle = fill;
      this.context.beginPath();
      this.context.roundRect(x, y, w, h, radius);
      this.context.fill();
    }
    drawCanteen(canteen, level, _time) {
      const x = canteen.x * SCALE;
      const y = canteen.y * SCALE;
      const age = canteen.filled ? Math.max(0, level.steps - canteen.filledAt) : 0;
      if (canteen.filled && age >= 78) return;
      this.context.save();
      this.context.translate(x, y);
      if (canteen.filled) {
        const u = Math.min(1, age / 78);
        const burst = Math.min(1, age / 24);
        const fade = 1 - Math.max(0, (u - 0.45) / 0.55);
        this.context.translate(0, -18 * u);
        const scale = 1 + 0.2 * Math.sin(Math.min(1, u / 0.58) * Math.PI);
        this.context.scale(scale, scale);
        const glow = this.context.createRadialGradient(0, 0, 3, 0, 0, 24 + 32 * burst);
        glow.addColorStop(0, `rgba(93,231,246,${0.65 * fade})`);
        glow.addColorStop(0.45, `rgba(255,226,111,${0.42 * fade})`);
        glow.addColorStop(1, "rgba(255,226,111,0)");
        this.context.fillStyle = glow;
        this.context.fillRect(-62, -62, 124, 124);
        this.context.strokeStyle = `rgba(192,255,252,${0.8 * (1 - burst) * fade})`;
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.arc(0, 0, 22 + 28 * burst, 0, Math.PI * 2);
        this.context.stroke();
        for (let index = 0; index < 8; index++) {
          const angle = index * Math.PI / 4 + 0.25;
          const travel = 12 + 34 * burst;
          this.context.fillStyle = `rgba(${index % 2 ? "255,224,111" : "107,232,244"},${0.9 * fade})`;
          this.context.beginPath();
          this.context.arc(Math.cos(angle) * travel, Math.sin(angle) * travel, 2.6 - 1.3 * burst, 0, Math.PI * 2);
          this.context.fill();
        }
        this.context.globalAlpha = fade;
      }
      this.context.shadowColor = "#24160b99";
      this.context.shadowBlur = 7;
      this.context.shadowOffsetY = 3;
      this.context.drawImage(this.assets.canteen, -29, -30, 58, 56);
      this.context.restore();
    }
    drawPipe(intake, level, time) {
      const x = intake.x * SCALE;
      const y = intake.y * SCALE;
      if (intake.dummy) {
        this.context.save();
        this.context.shadowColor = "#17120baa";
        this.context.shadowBlur = 7;
        this.context.shadowOffsetY = 4;
        this.context.drawImage(this.assets.dummy, x - 32, y - 48, 64, 96);
        this.context.restore();
        if (level.steps - level.lastWaste < 120) this.text("LEAK \u2014 NO HOSE", x, y - 47, 10, "#eed59f");
        return;
      }
      this.context.save();
      this.context.translate(x, y);
      if (intake.facing === "right") this.context.scale(-1, 1);
      this.context.shadowColor = "#17120baa";
      this.context.shadowBlur = 7;
      this.context.shadowOffsetY = 4;
      this.context.drawImage(this.assets.working, -55, -36, 110, 73);
      this.context.restore();
      const mouthX = x + (intake.facing === "right" ? 45 : -45);
      if (level.steps - level.lastDelivery < 35) {
        const pulse = 0.35 + 0.3 * Math.sin(time / 130);
        this.context.strokeStyle = `rgba(107,235,242,${pulse})`;
        this.context.lineWidth = 3;
        this.context.beginPath();
        this.context.arc(mouthX, y, 24, 0, Math.PI * 2);
        this.context.stroke();
        this.context.fillStyle = `rgba(76,215,238,${0.55 + pulse * 0.35})`;
        this.context.beginPath();
        this.context.ellipse(mouthX + 2, y, 12 + 3 * Math.sin(time / 90), 16, 0, 0, Math.PI * 2);
        this.context.fill();
      }
    }
    drawCamp(level, time) {
      const fireX = this.config.fire.x * SCALE;
      const fireY = this.config.fire.y * SCALE;
      const strength = Math.max(0, 1 - level.collected / level.required);
      const target = this.config.target;
      this.context.save();
      this.context.shadowColor = "#071a18cc";
      this.context.shadowBlur = 14;
      this.context.drawImage(this.assets.target, target.x * SCALE, target.y * SCALE, target.w * SCALE, target.h * SCALE);
      this.context.restore();
      const glow = this.context.createRadialGradient(fireX, fireY - 12, 2, fireX, fireY - 12, 45);
      glow.addColorStop(0, `rgba(255,168,58,${0.35 * strength})`);
      glow.addColorStop(1, "#f4893500");
      this.context.fillStyle = glow;
      this.context.fillRect(fireX - 48, fireY - 60, 96, 75);
      if (!level.won) {
        const flicker = Math.sin(time / 90) * 4;
        this.context.save();
        this.context.translate(fireX, fireY);
        this.context.scale(0.55 + 0.45 * strength, 0.25 + 0.75 * strength);
        this.context.fillStyle = "#ed8131";
        this.context.beginPath();
        this.context.moveTo(-13, 2);
        this.context.bezierCurveTo(-21, -13, -3, -20, -4, -39 + flicker);
        this.context.bezierCurveTo(10, -27, 1, -20, 13, -29 - flicker);
        this.context.bezierCurveTo(12, -11, 22, -2, 9, 3);
        this.context.closePath();
        this.context.fill();
        this.context.fillStyle = "#ffe4a0";
        this.context.beginPath();
        this.context.moveTo(-6, 2);
        this.context.quadraticCurveTo(-8, -10, 3, -22);
        this.context.quadraticCurveTo(1, -9, 8, -5);
        this.context.quadraticCurveTo(10, 3, -6, 2);
        this.context.fill();
        this.context.restore();
      }
      const hoseX = this.config.hose.x * SCALE;
      const hoseY = this.config.hose.y * SCALE;
      if (level.steps - level.lastDelivery < 50) {
        this.context.strokeStyle = "#35b8d8c7";
        this.context.lineWidth = 12;
        this.context.beginPath();
        this.context.moveTo(hoseX, hoseY);
        this.context.quadraticCurveTo(hoseX - 24, hoseY + 28, fireX, fireY);
        this.context.stroke();
        this.context.strokeStyle = "#b8f8f3dd";
        this.context.lineWidth = 4;
        this.context.beginPath();
        this.context.moveTo(hoseX, hoseY);
        this.context.quadraticCurveTo(hoseX - 24, hoseY + 24, fireX, fireY - 2);
        this.context.stroke();
      }
      if (level.won) this.text("FIRE OUT!", fireX, fireY - 32, 12, "#e9facb");
    }
    drawWaterGlints(time) {
      this.waterSurfaceContext.strokeStyle = "#dcffff4a";
      this.waterSurfaceContext.lineWidth = 1.5;
      this.waterSurfaceContext.lineCap = "round";
      this.waterSurfaceContext.beginPath();
      for (let index = 0; index < 85; index++) {
        const x = index * 83.77 % WIDTH + Math.sin(time / 900 + index) * 4;
        const y = 55 + index * 47.13 % 505;
        this.waterSurfaceContext.moveTo(x, y);
        this.waterSurfaceContext.quadraticCurveTo(x + 8, y + Math.sin(time / 800 + index) * 2, x + 15 + index % 3 * 7, y);
      }
      this.waterSurfaceContext.stroke();
    }
  };
  var WildfireGame = class {
    constructor() {
      this.canvas = required("#game");
      this.hud = new HudController();
      this.input = new InputController(this.canvas, () => this.level);
      this.showHint = false;
      this.last = 0;
      this.accumulator = 0;
    }
    async start() {
      this.hud.bind(() => this.restart(), () => {
        this.showHint = !this.showHint;
        this.hud.setHint(this.showHint);
      });
      document.addEventListener("visibilitychange", () => {
        this.last = 0;
        this.accumulator = 0;
        this.input.clear();
      });
      try {
        const config = getLevel();
        const assets = await new AssetLoader().load();
        const Box2D = await window.Box2D({ locateFile: (name) => `vendor/${name}` });
        this.level = new WaterSimulation(Box2D, config);
        this.renderer = new SceneRenderer(assets, config);
        this.renderer.setOriginalGrid(this.level.grid);
        this.hud.setReady();
        this.hud.update(this.level);
        window.gameDiagnostics = { snapshot: () => this.level.snapshot(), positions: () => Array.from(this.level.positions()), waterRendering: () => this.renderer.diagnostics().stats() };
        requestAnimationFrame((time) => this.frame(time));
      } catch (error) {
        this.hud.setFailure();
        console.error(error);
      }
    }
    restart() {
      if (!this.level || !this.renderer) return;
      this.level.reset();
      this.renderer.setOriginalGrid(this.level.grid);
      this.input.reset();
      this.accumulator = 0;
      this.last = 0;
      this.hud.resetReport();
      this.hud.update(this.level);
    }
    frame(time) {
      if (this.level && this.renderer && !document.hidden) {
        this.accumulator += this.last ? Math.min((time - this.last) / 1e3, 0.05) : 0;
        let steps = 0;
        while (this.accumulator >= 1 / 60 && steps < 3) {
          this.level.step();
          this.accumulator -= 1 / 60;
          steps++;
        }
        this.hud.update(this.level);
        this.renderer.draw(this.level, time, this.showHint, this.input.pointer);
      }
      this.last = time;
      requestAnimationFrame((next) => this.frame(next));
    }
  };

  // src/main.ts
  void new WildfireGame().start();
})();
//# sourceMappingURL=game.js.map
