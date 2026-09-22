import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { ContentCompiler } from "../src/content";
import {
  createEditorServerHandler,
  generateLevelCatalog,
} from "../editor-server";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

async function fixture(): Promise<{
  base: string;
  levelsDirectory: string;
  saves: () => number;
}> {
  const parent = await fs.mkdtemp(path.join(tmpdir(), "douse-editor-"));
  const levelsDirectory = path.join(parent, "levels");
  await fs.mkdir(levelsDirectory);
  await fs.writeFile(
    path.join(levelsDirectory, "campaign.json"),
    '{"version":1,"levels":[]}\n',
  );
  let saveCount = 0;
  const handler = createEditorServerHandler({
    levelsDirectory,
    onSaved: () => saveCount++,
  });
  const server = createServer((request, response) =>
    handler(request, response, () => {
      response.statusCode = 404;
      response.end();
    }),
  );
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  cleanups.push(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await fs.rm(parent, { recursive: true, force: true });
  });
  return {
    base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    levelsDirectory,
    saves: () => saveCount,
  };
}

async function put(
  base: string,
  route: string,
  body: unknown,
  origin = base,
): Promise<Response> {
  return fetch(`${base}${route}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(body),
  });
}

test("saves incomplete drafts separately from a structurally validated campaign", async () => {
  const { base, levelsDirectory, saves } = await fixture();
  const draft = ContentCompiler.createLevel("unfinished", "Unfinished");
  draft.reservoirs = [];
  const savedDraft = await put(
    base,
    "/__douse_editor/levels/unfinished",
    draft,
  );
  assert.equal(savedDraft.status, 200);
  assert.match(JSON.stringify(await savedDraft.json()), /reservoir/i);
  assert.equal(
    (
      await put(base, "/__douse_editor/campaign", {
        version: 1,
        levels: ["unfinished"],
      })
    ).status,
    400,
  );

  const first = ContentCompiler.createLevel("first", "First");
  const second = ContentCompiler.createLevel("second", "Second");
  assert.equal(
    (await put(base, "/__douse_editor/levels/first", first)).status,
    200,
  );
  assert.equal(
    (await put(base, "/__douse_editor/levels/second", second)).status,
    200,
  );
  assert.equal(
    (
      await put(base, "/__douse_editor/campaign", {
        version: 1,
        levels: ["second", "first"],
      })
    ).status,
    200,
  );
  assert.deepEqual(
    await (await fetch(`${base}/__douse_editor/campaign`)).json(),
    { version: 1, levels: ["second", "first"] },
  );
  assert.deepEqual(
    await (await fetch(`${base}/__douse_editor/levels/first`)).json(),
    first,
  );
  const generated = await fs.readFile(
    path.join(levelsDirectory, "catalog.generated.ts"),
    "utf8",
  );
  assert.match(generated, /second\.json/);
  assert(generated.indexOf("second.json") < generated.indexOf("first.json"));
  assert.equal(saves(), 4);

  first.reservoirs = [];
  const campaignDraft = await put(base, "/__douse_editor/levels/first", first);
  assert.equal(campaignDraft.status, 400);
  assert.match(
    JSON.stringify(await campaignDraft.json()),
    /Remove first from the campaign/,
  );
});

test("lists independent files and rejects traversal, mismatch, and foreign writes", async () => {
  const { base, levelsDirectory } = await fixture();
  const level = ContentCompiler.createLevel("safe-level", "Safe");
  assert.equal(
    (await put(base, "/__douse_editor/levels/safe-level", level)).status,
    200,
  );
  await fs.writeFile(path.join(levelsDirectory, "broken.json"), "not-json");
  const listing = (await (
    await fetch(`${base}/__douse_editor/levels`)
  ).json()) as { levels: Array<{ id: string }>; errors: string[] };
  assert.deepEqual(
    listing.levels.map((entry) => entry.id),
    ["safe-level"],
  );
  assert.match(listing.errors[0], /broken\.json/);
  assert.equal(
    (await put(base, "/__douse_editor/levels/bad%2Fescape", level)).status,
    400,
  );
  assert.equal(
    (await put(base, "/__douse_editor/levels/other", level)).status,
    400,
  );
  assert.equal(
    (
      await put(
        base,
        "/__douse_editor/levels/safe-level",
        level,
        "https://foreign.example",
      )
    ).status,
    403,
  );
});

test("catalog generator rejects missing campaign files", async () => {
  const { levelsDirectory } = await fixture();
  await fs.writeFile(
    path.join(levelsDirectory, "campaign.json"),
    '{"version":1,"levels":["missing"]}\n',
  );
  await assert.rejects(() => generateLevelCatalog(levelsDirectory), /missing/);
});
