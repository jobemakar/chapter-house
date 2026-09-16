import assert from "node:assert/strict";
import { test } from "node:test";
import { TownContextMenu } from "../src/town/context-menu";

test("the context view always lists Fish and Dig with current availability", () => {
  const menu = new TownContextMenu();
  menu.setAvailability({ streamBank: false, digAllowed: true });
  assert.deepEqual(menu.view, {
    open: false,
    actions: [
      { id: "fish", label: "Fish", enabled: false },
      { id: "dig", label: "Dig", enabled: true },
    ],
  });

  menu.setAvailability({ streamBank: true, digAllowed: false });
  assert.deepEqual(
    menu.view.actions.map((action) => action.enabled),
    [true, false],
  );
});

test("a stationary idle avatar tap toggles the radial menu", () => {
  const menu = new TownContextMenu();
  assert.equal(menu.toggleAvatarTap(true, "idle"), true);
  assert.equal(menu.open, true);
  assert.equal(menu.toggleAvatarTap(true, "idle"), true);
  assert.equal(menu.open, false);
});

test("moving or active-avatar taps cannot open or dismiss the radial menu", () => {
  const menu = new TownContextMenu();
  assert.equal(menu.toggleAvatarTap(true, "idle"), true);
  assert.equal(menu.toggleAvatarTap(false, "idle"), false);
  assert.equal(menu.open, true);
  assert.equal(menu.toggleAvatarTap(true, "casting"), false);
  assert.equal(menu.open, true);
});

test("walking, starting an action, and reset each close the radial menu", () => {
  const menu = new TownContextMenu();
  menu.toggleAvatarTap(true, "idle");
  menu.closeForWalk();
  assert.equal(menu.open, false);

  menu.toggleAvatarTap(true, "idle");
  menu.closeForAction();
  assert.equal(menu.open, false);

  menu.toggleAvatarTap(true, "idle");
  menu.reset();
  assert.equal(menu.open, false);
});
