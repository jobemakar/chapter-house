import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? 5190);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/__chapter_house") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ application: "chapter-house", version: "0.1.0" }),
      );
      return;
    }
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": types[extname(path)] ?? "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
server.listen(port, "127.0.0.1", () =>
  console.log(`Chapter House: http://127.0.0.1:${port}/`),
);
