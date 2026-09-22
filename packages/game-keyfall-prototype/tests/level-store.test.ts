import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { LevelFile } from "../src/level-files";
import { createLevelStoreHandler, MAX_LEVEL_PAYLOAD_BYTES } from "../tools/level-store";
import viteConfig from "../vite.config";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanups.length > 0) await cleanups.pop()?.();
});

function level(id: string, draft = false): LevelFile {
  return {
    version: 1,
    playtested: false,
    room: {
      id,
      title: "Storage Fixture",
      subtitle: "A local-only fixture",
      wing: "campaign",
      source: { kind: "original" },
      kind: "drop",
      keyStart: draft ? null : { x: 280, y: 180 },
      cords: [{ id: "cord-a", anchor: { x: 280, y: 80 }, length: 100, angle: 0 }],
      tickets: draft ? [] : [
        { id: "ticket-a", position: { x: 220, y: 300 } },
        { id: "ticket-b", position: { x: 280, y: 400 } },
        { id: "ticket-c", position: { x: 340, y: 500 } },
      ],
      goal: draft ? null : { x: 280, y: 700 },
      props: [{ kind: "platform", position: { x: 280, y: 560 }, radius: 52, angle: 0.2 }],
    },
  };
}

async function fixture(): Promise<{ base: string; levelsDirectory: string }> {
  const parent = await fs.mkdtemp(path.join(tmpdir(), "keyfall-level-store-"));
  const levelsDirectory = path.join(parent, "levels");
  const handler = createLevelStoreHandler({ levelsDirectory });
  const server = createServer((request, response) => handler(request, response, () => {
    response.statusCode = 404;
    response.end();
  }));
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const port = (server.address() as AddressInfo).port;
  cleanups.push(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await fs.rm(parent, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${port}`, levelsDirectory };
}

async function put(base: string, route: string, body: unknown, origin = base): Promise<Response> {
  return fetch(`${base}${route}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("Keyfall local level store", { concurrency: false }, () => {
  test("keeps level-file writes out of Vite's reload watcher", () => {
    assert.deepEqual(viteConfig.server?.watch?.ignored, ["**/public/levels/**"]);
  });

  test("saves drafts, lists files, and persists a validated ordered campaign", async () => {
    const { base, levelsDirectory } = await fixture();
    const draftResponse = await put(base, "/api/keyfall/levels/room-draft", level("room-draft", true));
    assert.equal(draftResponse.status, 200);
    assert.deepEqual(await draftResponse.json(), { ok: true });

    const rejectedIndex = await put(base, "/api/keyfall/index", { version: 1, levels: ["room-draft"] });
    assert.equal(rejectedIndex.status, 400);
    assert.match((await rejectedIndex.json() as { error: string }).error, /Place one key/);

    assert.equal((await put(base, "/api/keyfall/levels/room-one", level("room-one"))).status, 200);
    assert.equal((await put(base, "/api/keyfall/levels/room-two", level("room-two"))).status, 200);
    assert.equal((await put(base, "/api/keyfall/index", { version: 1, levels: ["room-two", "room-one"] })).status, 200);

    // An indexed file may later become a draft. Saving it must not rewrite the
    // separate campaign order, and a later correction atomically replaces it.
    assert.equal((await put(base, "/api/keyfall/levels/room-one", level("room-one", true))).status, 200);
    assert.deepEqual(await (await fetch(`${base}/api/keyfall/index`)).json(), { version: 1, levels: ["room-two", "room-one"] });
    assert.equal((await put(base, "/api/keyfall/levels/room-one", level("room-one"))).status, 200);

    const listing = await (await fetch(`${base}/api/keyfall/levels`)).json() as { levels: LevelFile[]; errors: string[] };
    assert.deepEqual(listing.levels.map((entry) => entry.room.id), ["room-draft", "room-one", "room-two"]);
    assert.deepEqual(listing.errors, []);
    assert.deepEqual(await (await fetch(`${base}/api/keyfall/index`)).json(), { version: 1, levels: ["room-two", "room-one"] });
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(levelsDirectory, "room-one.json"), "utf8")), level("room-one"));
  });

  test("rejects unsafe paths, document mismatches, malformed shapes, large bodies, and foreign origins", async () => {
    const { base } = await fixture();
    assert.equal((await put(base, "/api/keyfall/levels/bad%2Fescape", level("bad-escape"))).status, 400);
    assert.equal((await put(base, "/api/keyfall/levels/expected", level("different"))).status, 400);
    assert.equal((await put(base, "/api/keyfall/levels/con", level("con"))).status, 400);
    const malformed = await put(base, "/api/keyfall/levels/broken", { version: 1, room: {}, playtested: false });
    assert.equal(malformed.status, 400);
    assert.match((await malformed.json() as { error: string }).error, /room id/);
    assert.equal((await put(base, "/api/keyfall/levels/good", level("good"), "https://foreign.example")).status, 403);
    const oversized = await put(base, "/api/keyfall/levels/huge", `{"padding":"${"x".repeat(MAX_LEVEL_PAYLOAD_BYTES)}"}`);
    assert.equal(oversized.status, 413);
  });

  test("does not follow a symlinked level file outside the configured directory", async (context) => {
    const { base, levelsDirectory } = await fixture();
    const outside = path.join(path.dirname(levelsDirectory), "outside.json");
    await fs.mkdir(levelsDirectory, { recursive: true });
    await fs.writeFile(outside, JSON.stringify(level("linked-room")));
    try {
      await fs.symlink(outside, path.join(levelsDirectory, "linked-room.json"), "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") {
        context.skip("Windows symlink creation is unavailable without Developer Mode");
        return;
      }
      throw error;
    }
    const listing = await (await fetch(`${base}/api/keyfall/levels`)).json() as { levels: LevelFile[]; errors: string[] };
    assert.deepEqual(listing.levels, []);
    assert.match(listing.errors[0], /regular file/);
    assert.equal((await put(base, "/api/keyfall/levels/linked-room", level("linked-room"))).status, 400);
    assert.deepEqual(JSON.parse(await fs.readFile(outside, "utf8")), level("linked-room"));
  });
});
