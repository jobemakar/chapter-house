import "../packages/game-wishbone-fling/tests/legacy-catalog";
import { test } from "node:test";
import assert from "node:assert/strict";
import M from "matter-js";
import { yards } from "../packages/game-wishbone-fling/src/levels";
import { PowerYard } from "../packages/game-wishbone-fling/src/powers";

const campaign = [
  ["cushion-corner", "The Cushion Corner", "classic"],
  ["bucket-steps", "The Bucket Steps", "classic"],
  ["seesaw-orchard", "The Seesaw Orchard", "classic"],
  ["twin-towers", "The Twin Toy Towers", "classic"],
  ["garden-gatehouse", "The Garden Gatehouse", "lever"],
  ["spring-clean", "The Spring Clean", "bellows"],
  ["horseshoe-huddle", "The Horseshoe Huddle", "magnet"],
  ["porch-parade", "The Porch Parade", "classic"],
  ["picnic-arch", "The Picnic Arch", "classic"],
  ["lantern-lever", "The Lantern Lever", "lever"],
  ["cushion-cascade", "The Cushion Cascade", "classic"],
  ["springboard-lane", "The Springboard Lane", "bellows"],
  ["magnet-maze", "The Magnet Maze", "magnet"],
  ["double-decker", "The Double Decker", "classic"],
  ["hedge-gate", "The Hedge Gate", "lever"],
  ["breezy-buckets", "The Breezy Buckets", "bellows"],
  ["iron-orchard", "The Iron Orchard", "magnet"],
  ["three-towers", "The Three Little Towers", "classic"],
  ["meadow-mile", "The Meadow Mile", "wide"],
  ["grand-garden", "The Grand Garden", "wide lever"],
] as const;

const step = (yard: PowerYard, seconds: number) => {
  for (let n = 0; n < seconds * 120; n++) yard.step(1 / 120);
};

const yardFor = (id: string) =>
  new PowerYard(yards.findIndex((layout) => layout.id === id));

const trigger = (yard: PowerYard, device: M.Body) => {
  const body = M.Bodies.circle(device.position.x, device.position.y - 48, 12, {
    density: 0.001,
  });
  M.Composite.add(yard.engine.world, body);
  M.Body.setVelocity(body, { x: 0, y: 7 });
  step(yard, 0.15);
};

test("Wishbone's append-only campaign catalog has its exact 28-yard contract", () => {
  assert.equal(yards.length, 28);
  assert.deepEqual(
    yards.slice(0, 8).map((yard) => yard.id),
    [
      "teeter",
      "domino",
      "bridge-nudge",
      "domino-run",
      "gate-release",
      "bellows-hop",
      "magnet-picnic",
      "long-yard",
    ],
  );
  assert.deepEqual(
    yards
      .slice(8)
      .map((yard) => [
        yard.id,
        yard.name,
        yard.id === "grand-garden"
          ? "wide lever"
          : yard.id === "meadow-mile"
            ? "wide"
            : yard.deviceInstances?.some((d) => d.kind === "lever")
              ? "lever"
              : yard.deviceInstances?.some((d) => d.kind === "bellows")
                ? "bellows"
                : yard.deviceInstances?.some((d) => d.kind === "field")
                  ? "magnet"
                  : "classic",
      ]),
    campaign,
  );
  assert.equal(new Set(yards.map((yard) => yard.id)).size, yards.length);
  for (const yard of yards.slice(8)) {
    const width = yard.world?.width ?? 1200;
    assert.match(yard.id, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(yard.subtitle.length > 0);
    assert.ok(yard.pieces.some((piece) => piece.kind === "target"));
    for (const piece of yard.pieces) {
      const halfWidth = piece.r ?? piece.w / 2;
      const halfHeight = piece.r ?? piece.h / 2;
      assert.ok(
        piece.x - halfWidth > 0 && piece.x + halfWidth < width,
        yard.id,
      );
      assert.ok(
        piece.y - halfHeight > 0 && piece.y + halfHeight < 638,
        yard.id,
      );
    }
    for (const point of yard.deviceInstances ?? []) {
      assert.ok(point.x > 0 && point.x < width, yard.id);
      assert.ok(point.y > 0 && point.y < 638, yard.id);
    }
  }
  assert.deepEqual(
    yards
      .filter((yard) => (yard.world?.width ?? 1200) > 1200)
      .map((yard) => yard.id),
    ["long-yard", "meadow-mile", "grand-garden"],
  );
});

test("campaign checkpoints preserve rescued IDs, piece poses, and saved mechanism state", () => {
  const lever = yardFor("garden-gatehouse");
  trigger(lever, lever.lever);
  lever.throwToy({ x: 2, y: -2 });
  const target = lever.pieces.find((piece) => piece.game.kind === "target")!;
  M.Body.setPosition(target, {
    x: target.game.home.x + 70,
    y: target.game.home.y,
  });
  step(lever, 1 / 60);
  assert.deepEqual([...lever.rescued], [target.game.id]);
  const leverCheckpoint = lever.checkpoint();
  const restoredLever = new PowerYard(
    yards.findIndex((layout) => layout.id === "garden-gatehouse"),
    leverCheckpoint,
  );
  const restoredLeverCheckpoint = restoredLever.checkpoint();
  assert.deepEqual(restoredLeverCheckpoint.rescued, leverCheckpoint.rescued);
  assert.deepEqual(
    restoredLeverCheckpoint.pieces.map((piece) => piece.id),
    leverCheckpoint.pieces.map((piece) => piece.id),
  );
  assert.deepEqual(restoredLeverCheckpoint.pieces, leverCheckpoint.pieces);
  assert.equal(restoredLeverCheckpoint.gadgets?.gateOpen, true);
  restoredLever.dispose();
  lever.dispose();

  const magnet = yardFor("horseshoe-huddle");
  trigger(magnet, magnet.button);
  const magnetCheckpoint = magnet.checkpoint();
  const restoredMagnet = new PowerYard(
    yards.findIndex((layout) => layout.id === "horseshoe-huddle"),
    magnetCheckpoint,
  );
  const restoredMagnetCheckpoint = restoredMagnet.checkpoint();
  assert.deepEqual(restoredMagnetCheckpoint.pieces, magnetCheckpoint.pieces);
  assert.equal(restoredMagnetCheckpoint.gadgets?.polarity, 1);
  restoredMagnet.dispose();
  magnet.dispose();
});

test("ordinary legal shots rescue targets across the new wide yards", () => {
  const cases: [string, { x: number; y: number }[], number][] = [
    [
      "meadow-mile",
      [
        { x: 23, y: -4 },
        { x: 23, y: -7 },
        { x: 23, y: -10 },
        { x: 23, y: -13 },
      ],
      1800,
    ],
    [
      "grand-garden",
      [
        { x: 23, y: -4 },
        { x: 23, y: -7 },
      ],
      1600,
    ],
  ];
  for (const [id, throws, farX] of cases) {
    const yard = yardFor(id);
    step(yard, 3);
    assert.equal(yard.rescued.size, 0, `${id} settles without a rescue`);
    for (const velocity of throws) {
      assert.ok(
        yard.throwToy(velocity),
        `${id} accepts ${JSON.stringify(velocity)}`,
      );
      step(yard, 8.4);
    }
    assert.ok(yard.rescued.size > 0, `${id} has an ordinary-shot rescue`);
    assert.ok(
      yard.pieces.some(
        (piece) =>
          piece.game.kind === "target" &&
          piece.game.home.x > farX &&
          yard.rescued.has(piece.game.id),
      ),
      `${id} rescues a far target`,
    );
    yard.dispose();
  }
});

test("ordinary legal shots rescue new classic and mechanism yards", () => {
  const representatives = [
    { id: "cushion-corner", kind: "classic", velocity: { x: 10, y: -8 } },
    { id: "garden-gatehouse", kind: "lever", velocity: { x: 16, y: -4 } },
    { id: "spring-clean", kind: "bellows", velocity: { x: 8, y: -8 } },
    { id: "horseshoe-huddle", kind: "magnet", velocity: { x: 12, y: -4 } },
  ] as const;
  for (const { id, kind, velocity } of representatives) {
    const yard = yardFor(id);
    const gateY =
      yard.layout.deviceInstances?.find((d) => d.kind === "gate")?.y ?? 0;
    const bucket = yard.pieces.find((piece) => piece.game.kind === "bucket");
    const bucketStart = bucket && { ...bucket.position };
    assert.ok(yard.throwToy(velocity), `${id} accepts its legal launch`);
    let gateLifted = false,
      gusted = false,
      magnetized = false,
      bucketMoved = false;
    for (let n = 0; n < 5 * 120; n++) {
      yard.step(1 / 120);
      gateLifted ||= yard.gateOpen && yard.gate.position.y < gateY;
      gusted ||= yard.gustUntil > yard.time;
      magnetized ||= yard.polarity === 1;
      bucketMoved ||= !!(
        bucket &&
        bucketStart &&
        Math.hypot(
          bucket.position.x - bucketStart.x,
          bucket.position.y - bucketStart.y,
        ) > 8
      );
    }
    assert.ok(yard.rescued.size > 0, `${id} rescues a target from that launch`);
    if (kind === "lever") {
      assert.equal(yard.gateOpen, true, `${id} opens its gate`);
      assert.ok(gateLifted, `${id} lifts its gate`);
    }
    if (kind === "bellows") assert.ok(gusted, `${id} activates its gust`);
    if (kind === "magnet") {
      assert.ok(magnetized, `${id} switches its polarity`);
      assert.ok(bucketMoved, `${id} moves a bucket during the launch`);
    }
    yard.dispose();
  }
});

test("bellows and magnet forces change isolated props relative to identical controls", () => {
  const gust = yardFor("spring-clean");
  const stillAir = yardFor("spring-clean");
  const inColumn = (yard: PowerYard) =>
    yard.pieces.find(
      (piece) =>
        Math.abs(piece.position.x - yard.bellows.position.x) < 85 &&
        piece.position.y > 320 &&
        piece.position.y < 610,
    )!;
  const gustProp = inColumn(gust);
  const stillAirProp = inColumn(stillAir);
  assert.equal(gustProp.game.id, stillAirProp.game.id);
  // The fresh yards are otherwise identical and no plush is launched. This
  // isolates PowerYard.tick's gust force from incidental launch collisions.
  gust.gustUntil = gust.time + 0.6;
  step(gust, 0.25);
  step(stillAir, 0.25);
  assert.ok(gustProp.position.y < stillAirProp.position.y - 20);
  assert.ok(gustProp.velocity.y < stillAirProp.velocity.y - 1);
  gust.dispose();
  stillAir.dispose();

  const pulled = yardFor("horseshoe-huddle");
  const neutral = yardFor("horseshoe-huddle");
  const nearestBucket = (yard: PowerYard) =>
    yard.pieces
      .filter((piece) => piece.game.kind === "bucket")
      .sort(
        (a, b) =>
          Math.hypot(a.position.x - yard.field.x, a.position.y - yard.field.y) -
          Math.hypot(b.position.x - yard.field.x, b.position.y - yard.field.y),
      )[0];
  const pulledBucket = nearestBucket(pulled);
  const neutralBucket = nearestBucket(neutral);
  assert.equal(pulledBucket.game.id, neutralBucket.game.id);
  const distance = (yard: PowerYard, piece: typeof pulledBucket) =>
    Math.hypot(
      piece.position.x - yard.field.x,
      piece.position.y - yard.field.y,
    );
  // As above, no launch occurs: the only difference is active polarity, so a
  // disabled magnetic pull cannot satisfy this comparison.
  pulled.polarity = 1;
  step(pulled, 0.5);
  step(neutral, 0.5);
  assert.ok(
    distance(pulled, pulledBucket) < distance(neutral, neutralBucket) - 1,
  );
  pulled.dispose();
  neutral.dispose();
});

test("every new focused mechanism yard triggers its authored device", () => {
  for (const id of [
    "garden-gatehouse",
    "lantern-lever",
    "hedge-gate",
    "grand-garden",
  ]) {
    const yard = yardFor(id);
    const gateY = yard.layout.deviceInstances!.find(
      (d) => d.kind === "gate",
    )!.y;
    trigger(yard, yard.lever);
    step(yard, 0.5);
    assert.equal(yard.gateOpen, true, id);
    assert.ok(yard.gate.position.y < gateY, id);
    yard.dispose();
  }
  for (const id of ["spring-clean", "springboard-lane", "breezy-buckets"]) {
    const yard = yardFor(id);
    trigger(yard, yard.bellows);
    assert.ok(yard.gustUntil > yard.time, id);
    assert.ok(
      yard.pieces.some(
        (piece) =>
          Math.abs(piece.position.x - yard.bellows.position.x) < 85 &&
          piece.position.y > 320 &&
          piece.position.y < 610,
      ),
      `${id} has a prop in its gust column`,
    );
    yard.dispose();
  }
  for (const id of ["horseshoe-huddle", "magnet-maze", "iron-orchard"]) {
    const yard = yardFor(id);
    trigger(yard, yard.button);
    assert.equal(yard.polarity, 1, id);
    assert.ok(
      yard.pieces.some(
        (piece) =>
          piece.game.kind === "bucket" &&
          Math.hypot(
            piece.position.x - yard.field.x,
            piece.position.y - yard.field.y,
          ) < yard.field.r,
      ),
      `${id} has a bucket in its magnetic field`,
    );
    yard.dispose();
  }
});
