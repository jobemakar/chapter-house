import assert from "node:assert/strict";
import { test } from "node:test";
import { setCurrentNavigation } from "../src/core/navigation-ui";

class ButtonStub {
  readonly dataset: DOMStringMap;
  readonly attributes = new Map<string, string>();
  constructor(action: string) {
    this.dataset = { action } as DOMStringMap;
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
}

test("only the selected top navigation button has aria-current", () => {
  const buttons = ["clubhouse", "collection", "games", "shop"].map(
    (action) => new ButtonStub(action),
  );
  for (const button of buttons) button.setAttribute("aria-current", "false");

  setCurrentNavigation(buttons, "shop");

  assert.deepEqual(
    buttons.map((button) => button.attributes.get("aria-current") ?? null),
    [null, null, null, "page"],
  );
});
