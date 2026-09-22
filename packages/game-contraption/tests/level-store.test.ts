import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, test } from "node:test";
import type { AddressInfo } from "node:net";
import type { LevelFile } from "../src/level-files";
import {
  createLevelStoreHandler,
  MAX_LEVEL_PAYLOAD_BYTES,
} from "../tools/level-store";
import viteConfig from "../vite.config";

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (cleanups.length) await cleanups.pop()?.();
});

function level(id: string, draft = false): LevelFile {
  return {
    version: 1,
    level: {
      id,
      name: draft ? "" : `Level ${id}`,
      tag: "A local storage fixture.",
      sources: draft ? [] : [{ x: 180, y: 100, vx: 0 }],
      period: 0.6,
      bowl: { x: 850, y: 550 },
      initial: [],
      spares: [],
    },
  };
}

async function fixture(): Promise<{ base: string; levelsDirectory: string }> {
  const parent = await fs.mkdtemp(
    path.join(tmpdir(), "contraption-level-store-"),
  );
  const levelsDirectory = path.join(parent, "levels");
  await fs.mkdir(levelsDirectory, { recursive: true });
  await fs.writeFile(
    path.join(levelsDirectory, "index.json"),
    JSON.stringify({ version: 1, levels: [] }),
  );
  const handler = createLevelStoreHandler({ levelsDirectory });
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
  const port = (server.address() as AddressInfo).port;
  cleanups.push(async () => {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await fs.rm(parent, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${port}`, levelsDirectory };
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
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("Contraption local level store", { concurrency: false }, () => {
  test("Vite serves two relative-base entries on loopback and excludes level edits from HMR", () => {
    assert.equal(viteConfig.base, "./");
    assert.equal(viteConfig.server?.host, "127.0.0.1");
    assert.equal(viteConfig.server?.port, 5197);
    assert.equal(viteConfig.server?.strictPort, true);
    assert.deepEqual(viteConfig.server?.watch?.ignored, [
      "**/public/levels/**",
    ]);
    assert.equal(
      viteConfig.build?.rollupOptions?.input &&
        Object.keys(viteConfig.build.rollupOptions.input as object)
          .sort()
          .join(","),
      "editor,game",
    );
    const configuredPlugins = viteConfig.plugins as unknown as Array<{
      name?: string;
      apply?: string;
    }>;
    assert.equal(
      configuredPlugins.some(
        (plugin) =>
          plugin?.name === "contraption-local-level-store" &&
          plugin.apply === "serve",
      ),
      true,
    );
  });

  test("saves drafts, lists diagnostics, reopens files, and stores playable order", async () => {
    const { base, levelsDirectory } = await fixture();
    assert.deepEqual(
      await (await fetch(`${base}/api/contraption/index`)).json(),
      { version: 1, levels: [] },
    );
    assert.deepEqual(
      await (await fetch(`${base}/api/contraption/levels`)).json(),
      { levels: [] },
    );

    assert.deepEqual(
      await (
        await put(
          base,
          "/api/contraption/levels/draft-level",
          level("draft-level", true),
        )
      ).json(),
      { ok: true },
    );
    const draftList = (await (
      await fetch(`${base}/api/contraption/levels`)
    ).json()) as {
      levels: Array<{ id: string; name: string; issues: string[] }>;
    };
    assert.deepEqual(draftList.levels, [
      {
        id: "draft-level",
        name: "",
        issues: ["Give the level a name", "Add at least one inlet"],
      },
    ]);
    const rejected = await put(base, "/api/contraption/index", {
      version: 1,
      levels: ["draft-level"],
    });
    assert.equal(rejected.status, 400);
    assert.match(
      ((await rejected.json()) as { error: string }).error,
      /Give the level a name/,
    );

    assert.deepEqual(
      await (
        await put(
          base,
          "/api/contraption/levels/first-level",
          level("first-level"),
        )
      ).json(),
      { ok: true },
    );
    assert.deepEqual(
      await (
        await put(
          base,
          "/api/contraption/levels/second-level",
          level("second-level"),
        )
      ).json(),
      { ok: true },
    );
    assert.deepEqual(
      await (
        await put(base, "/api/contraption/index", {
          version: 1,
          levels: ["second-level", "first-level"],
        })
      ).json(),
      { ok: true },
    );
    assert.deepEqual(
      await (await fetch(`${base}/api/contraption/levels/first-level`)).json(),
      level("first-level"),
    );
    assert.deepEqual(
      await (await fetch(`${base}/api/contraption/index`)).json(),
      { version: 1, levels: ["second-level", "first-level"] },
    );
    assert.deepEqual(
      JSON.parse(
        await fs.readFile(
          path.join(levelsDirectory, "first-level.json"),
          "utf8",
        ),
      ),
      level("first-level"),
    );
    const listing = (await (
      await fetch(`${base}/api/contraption/levels`)
    ).json()) as { levels: Array<{ id: string; issues: string[] }> };
    assert.deepEqual(
      listing.levels.map(({ id }) => id),
      ["draft-level", "first-level", "second-level"],
    );
    assert.deepEqual(
      listing.levels.find(({ id }) => id === "first-level")?.issues,
      [],
    );
  });

  test("rejects traversal, mismatched IDs, foreign origins, malformed data, and oversized bodies", async () => {
    const { base, levelsDirectory } = await fixture();
    assert.equal(
      (
        await put(
          base,
          "/api/contraption/levels/bad%2Fescape",
          level("bad-escape"),
        )
      ).status,
      400,
    );
    assert.equal(
      (await put(base, "/api/contraption/levels/con", level("con"))).status,
      400,
    );
    assert.equal(
      (
        await put(
          base,
          "/api/contraption/levels/expected-level",
          level("different-level"),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await put(
          base,
          "/api/contraption/levels/good-level",
          level("good-level"),
          "https://foreign.example",
        )
      ).status,
      403,
    );
    const malformed = await put(base, "/api/contraption/levels/broken-level", {
      version: 1,
      level: {},
    });
    assert.equal(malformed.status, 400);
    assert.match(
      ((await malformed.json()) as { error: string }).error,
      /inlets/,
    );
    const oversized = await put(
      base,
      "/api/contraption/levels/huge-level",
      `{"padding":"${"x".repeat(MAX_LEVEL_PAYLOAD_BYTES)}"}`,
    );
    assert.equal(oversized.status, 413);
    await fs.writeFile(
      path.join(levelsDirectory, "broken-file.json"),
      "not JSON",
    );
    const listing = (await (
      await fetch(`${base}/api/contraption/levels`)
    ).json()) as { levels: Array<{ id: string; issues: string[] }> };
    assert.equal(
      listing.levels.find(({ id }) => id === "broken-file")?.issues[0],
      "broken-file.json is not valid JSON",
    );
  });

  test("rejects symlinked files", async (context) => {
    const { base, levelsDirectory } = await fixture();
    await fs.mkdir(levelsDirectory, { recursive: true });
    const outside = path.join(path.dirname(levelsDirectory), "outside.json");
    await fs.writeFile(outside, JSON.stringify(level("linked-level")));
    try {
      await fs.symlink(
        outside,
        path.join(levelsDirectory, "linked-level.json"),
        "file",
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") {
        context.skip(
          "Windows symlink creation is unavailable without Developer Mode",
        );
        return;
      }
      throw error;
    }
    assert.equal(
      (await fetch(`${base}/api/contraption/levels/linked-level`)).status,
      400,
    );
    assert.equal(
      (
        await put(
          base,
          "/api/contraption/levels/linked-level",
          level("linked-level"),
        )
      ).status,
      400,
    );
    assert.deepEqual(
      JSON.parse(await fs.readFile(outside, "utf8")),
      level("linked-level"),
    );
  });

  test("does not replace a directory or leave temporary files after a failed atomic save", async () => {
    const { base, levelsDirectory } = await fixture();
    await fs.mkdir(path.join(levelsDirectory, "blocked-level.json"));
    const failed = await put(
      base,
      "/api/contraption/levels/blocked-level",
      level("blocked-level"),
    );
    assert.equal(failed.status, 400);
    assert.equal(
      (
        await fs.stat(path.join(levelsDirectory, "blocked-level.json"))
      ).isDirectory(),
      true,
    );
    assert.deepEqual((await fs.readdir(levelsDirectory)).sort(), [
      "blocked-level.json",
      "index.json",
    ]);
  });
});
