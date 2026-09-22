import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";
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
    nextPieceId: 1,
    yard: {
      id,
      name: draft ? "" : "Storage Fixture",
      subtitle: "A local-only fixture",
      legacyIndex: null,
      world: { width: 1200, height: 720 },
      launcher: draft ? null : { x: 162, y: 478 },
      pieces: draft ? [] : [{ id: 0, kind: "target", x: 650, y: 400, w: 0, h: 0, r: 20, color: 0, angle: 0 }],
      terrain: [{ id: "ground", x: 600, y: 638, w: 1600, h: 76, angle: 0 }],
      devices: [],
    },
  };
}

async function fixture(): Promise<{ base: string; levelsDirectory: string }> {
  const parent = await fs.mkdtemp(path.join(tmpdir(), "wishbone-level-store-"));
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

describe("Wishbone local level store", { concurrency: false }, () => {
  test("keeps authored-file writes out of Vite reloads", () => {
    assert.deepEqual(viteConfig.server?.watch?.ignored, ["**/public/levels/**"]);
    assert.equal(viteConfig.plugins?.length, 1);
  });

  test("saves drafts, opens a file, lists drafts, and validates ordered inclusion", async () => {
    const { base, levelsDirectory } = await fixture();
    const draftResponse = await put(base, "/api/wishbone/levels/yard-draft", level("yard-draft", true));
    assert.equal(draftResponse.status, 200);
    assert.equal((await draftResponse.json() as { level: LevelFile }).level.yard.id, "yard-draft");

    const rejectedIndex = await put(base, "/api/wishbone/index", { version: 1, levels: ["yard-draft"] });
    assert.equal(rejectedIndex.status, 400);
    assert.match((await rejectedIndex.json() as { error: string }).error, /Place one launcher/);

    assert.equal((await put(base, "/api/wishbone/levels/yard-one", level("yard-one"))).status, 200);
    assert.equal((await put(base, "/api/wishbone/levels/yard-two", level("yard-two"))).status, 200);
    assert.equal((await put(base, "/api/wishbone/index", { version: 1, levels: ["yard-two", "yard-one"] })).status, 200);

    assert.deepEqual(await (await fetch(`${base}/api/wishbone/index`)).json(), { version: 1, levels: ["yard-two", "yard-one"] });
    assert.deepEqual(await (await fetch(`${base}/api/wishbone/levels/yard-one`)).json(), level("yard-one"));
    const listing = await (await fetch(`${base}/api/wishbone/levels`)).json() as { levels: LevelFile[]; errors: string[] };
    assert.deepEqual(listing.levels.map((entry) => entry.yard.id), ["yard-draft", "yard-one", "yard-two"]);
    assert.deepEqual(listing.errors, []);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(levelsDirectory, "yard-one.json"), "utf8")), level("yard-one"));
  });

  test("never lowers an existing file's stable piece-ID high-water mark", async () => {
    const { base } = await fixture();
    const first = { ...level("stable-yard"), nextPieceId: 9 };
    assert.equal((await put(base, "/api/wishbone/levels/stable-yard", first)).status, 200);
    const lower = level("stable-yard");
    const response = await put(base, "/api/wishbone/levels/stable-yard", lower);
    assert.equal(response.status, 200);
    assert.equal((await response.json() as { level: LevelFile }).level.nextPieceId, 9);
    assert.equal((await (await fetch(`${base}/api/wishbone/levels/stable-yard`)).json() as LevelFile).nextPieceId, 9);
  });

  test("rejects unsafe paths, document mismatches, malformed bodies, large payloads, and foreign origins", async () => {
    const { base } = await fixture();
    assert.equal((await put(base, "/api/wishbone/levels/bad%2Fescape", level("bad-escape"))).status, 400);
    assert.equal((await put(base, "/api/wishbone/levels/expected", level("different"))).status, 400);
    assert.equal((await put(base, "/api/wishbone/levels/con", level("con"))).status, 400);
    const malformed = await put(base, "/api/wishbone/levels/broken", { version: 1, yard: {} });
    assert.equal(malformed.status, 400);
    assert.match((await malformed.json() as { error: string }).error, /playtested/);
    assert.equal((await put(base, "/api/wishbone/levels/good", level("good"), "https://foreign.example")).status, 403);
    assert.equal((await put(base, "/api/wishbone/levels/good", level("good"), base.replace("http:", "https:"))).status, 403);
    const oversized = await put(base, "/api/wishbone/levels/huge", `{"padding":"${"x".repeat(MAX_LEVEL_PAYLOAD_BYTES)}"}`);
    assert.equal(oversized.status, 413);
  });

  test("does not follow a symlinked level file outside the configured directory", async (context) => {
    const { base, levelsDirectory } = await fixture();
    const outside = path.join(path.dirname(levelsDirectory), "outside.json");
    await fs.mkdir(levelsDirectory, { recursive: true });
    await fs.writeFile(outside, JSON.stringify(level("linked-yard")));
    try {
      await fs.symlink(outside, path.join(levelsDirectory, "linked-yard.json"), "file");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") {
        context.skip("Windows symlink creation is unavailable without Developer Mode");
        return;
      }
      throw error;
    }
    const listing = await (await fetch(`${base}/api/wishbone/levels`)).json() as { levels: LevelFile[]; errors: string[] };
    assert.deepEqual(listing.levels, []);
    assert.match(listing.errors[0], /regular file/);
    assert.equal((await put(base, "/api/wishbone/levels/linked-yard", level("linked-yard"))).status, 400);
    assert.deepEqual(JSON.parse(await fs.readFile(outside, "utf8")), level("linked-yard"));
  });
});
