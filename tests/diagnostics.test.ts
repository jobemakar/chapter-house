import { test } from "node:test";
import assert from "node:assert/strict";
import { LocalDiagnostics } from "../src/core/diagnostics";

test("read-only status rejects invalid inputs before reading state", () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document");
  let tool:
    | {
        execute: (input?: unknown) => unknown;
        annotations: { readOnlyHint: boolean };
      }
    | undefined;
  let reads = 0;
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      modelContext: {
        registerTool: (registered: typeof tool) => {
          tool = registered;
        },
      },
    },
  });
  try {
    new LocalDiagnostics(() => {
      reads++;
      return { screen: "room" };
    });
    assert.equal(tool!.annotations.readOnlyHint, true);
    assert.deepEqual(tool!.execute({}), { screen: "room" });
    for (const input of [null, [], "", { unknown: true }])
      assert.throws(() => tool!.execute(input), /empty object/);
    assert.equal(reads, 1);
  } finally {
    if (previous) Object.defineProperty(globalThis, "document", previous);
    else Reflect.deleteProperty(globalThis, "document");
  }
});
