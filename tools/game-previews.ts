import { readFile } from "node:fs/promises";
import { resolve, sep, dirname, extname } from "node:path";
import type { Plugin } from "vite";
import { GamePreviews, type GamePreview } from "../src/core/game-previews.ts";

/** Serves/emits exact standalone builds through a fixed catalog, never arbitrary paths. */
export class GamePreviewBridge {
  constructor(private collectionRoot: string) {}
  async read(preview: GamePreview, asset?: string) {
    if (asset && !preview.assets?.includes(asset))
      throw new Error(
        `Asset is not allowlisted for preview: ${preview.id}/${asset}`,
      );
    const path = resolve(
      this.collectionRoot,
      asset ? `${dirname(preview.source)}/${asset}` : preview.source,
    );
    if (!path.startsWith(resolve(this.collectionRoot) + sep))
      throw new Error(`Preview source escapes collection: ${preview.id}`);
    const body = await readFile(path);
    if (!asset && !/<html[\s>]/i.test(body.toString("utf8")))
      throw new Error(`Preview is not a standalone HTML build: ${preview.id}`);
    return body;
  }
  plugin(): Plugin {
    const bridge = this;
    const routes = GamePreviews.entries.flatMap((preview) => [
      {
        preview,
        asset: undefined as string | undefined,
        fileName: GamePreviews.fileName(preview),
      },
      ...(preview.assets ?? []).map((asset) => ({
        preview,
        asset,
        fileName: `assets/previews/${preview.id}/${asset}`,
      })),
    ]);
    return {
      name: "chapter-house-standalone-previews",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
          const route = routes.find((r) => pathname === `/${r.fileName}`);
          if (!route) {
            if (pathname.startsWith("/assets/previews/")) {
              res.statusCode = 404;
              res.end("Preview not found");
              return;
            }
            return next();
          }
          try {
            const body = await bridge.read(route.preview, route.asset);
            res.statusCode = 200;
            const types: Record<string, string> = {
              ".html": "text/html; charset=utf-8",
              ".css": "text/css; charset=utf-8",
              ".js": "text/javascript; charset=utf-8",
              ".png": "image/png",
              ".wasm": "application/wasm",
              ".txt": "text/plain; charset=utf-8",
            };
            res.setHeader(
              "Content-Type",
              types[extname(route.fileName)] ?? "application/octet-stream",
            );
            res.setHeader("Cache-Control", "no-cache");
            res.end(body);
          } catch (error) {
            server.config.logger.error(String(error));
            res.statusCode = 404;
            res.end(
              "This standalone preview build is unavailable. Return to Chapter House.",
            );
          }
        });
      },
      async generateBundle() {
        for (const route of routes)
          this.emitFile({
            type: "asset",
            fileName: route.fileName,
            source: await bridge.read(route.preview, route.asset),
          });
      },
    };
  }
}
