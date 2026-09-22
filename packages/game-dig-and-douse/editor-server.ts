import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin } from "vite";
import {
  ContentCompiler,
  isSafeLevelId,
  parseCampaignDocument,
  parseLevelDocument,
} from "./src/content";
import type { CampaignDocument, LevelDocument } from "./src/content-types";

export const MAX_EDITOR_PAYLOAD_BYTES = 1024 * 1024;
export const EDITOR_API_ROOT = "/__douse_editor";
const DEFAULT_LEVELS_DIRECTORY = fileURLToPath(
  new URL("./levels", import.meta.url),
);

export interface EditorServerOptions {
  levelsDirectory?: string;
  /** Invalidates Vite transforms without broadcasting a destructive reload. */
  onSaved?: () => void;
}

export function createEditorServerPlugin(
  options: EditorServerOptions = {},
): Plugin {
  const levelsDirectory = path.resolve(
    options.levelsDirectory ?? DEFAULT_LEVELS_DIRECTORY,
  );
  return {
    name: "dig-and-douse-editor-files",
    apply: "serve",
    async configureServer(server) {
      await generateLevelCatalog(levelsDirectory);
      server.middlewares.use(
        createEditorServerHandler({
          levelsDirectory,
          onSaved: () => server.moduleGraph.invalidateAll(),
        }),
      );
    },
    handleHotUpdate(context) {
      const normalized = context.file.replace(/\\/g, "/");
      if (normalized.includes("/game-dig-and-douse/levels/")) return [];
    },
  };
}

export function createLevelCatalogPlugin(
  options: EditorServerOptions = {},
): Plugin {
  const levelsDirectory = path.resolve(
    options.levelsDirectory ?? DEFAULT_LEVELS_DIRECTORY,
  );
  return {
    name: "dig-and-douse-level-catalog",
    async buildStart() {
      await generateLevelCatalog(levelsDirectory);
    },
    async configureServer(server) {
      await generateLevelCatalog(levelsDirectory);
      server.middlewares.use(createPublishedLevelHandler(levelsDirectory));
    },
    async generateBundle() {
      const root = await prepareRoot(levelsDirectory);
      const campaign = await readCampaign(root);
      const filenames = [
        "campaign.json",
        ...campaign.levels.map((id) => `${id}.json`),
      ];
      for (const filename of filenames) {
        const source = await fs.readFile(safeTarget(root, filename), "utf8");
        this.emitFile({
          type: "asset",
          fileName: `douse-levels/${filename}`,
          source,
        });
      }
    },
  };
}

function createPublishedLevelHandler(
  levelsDirectory: string,
): Connect.NextHandleFunction {
  return (request, response, next) => {
    void (async () => {
      let pathname: string;
      try {
        pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      } catch {
        next();
        return;
      }
      const match =
        /^\/douse-levels\/(campaign|[a-z0-9]+(?:-[a-z0-9]+)*)\.json$/.exec(
          pathname,
        );
      if (!match || request.method !== "GET") {
        next();
        return;
      }
      try {
        const root = await prepareRoot(levelsDirectory);
        const filename = `${match[1]}.json`;
        const contents = await fs.readFile(safeTarget(root, filename), "utf8");
        response.statusCode = 200;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(contents);
      } catch (error) {
        if (isNodeError(error, "ENOENT")) {
          response.statusCode = 404;
          response.end();
          return;
        }
        response.statusCode = 500;
        response.end(errorMessage(error));
      }
    })();
  };
}

export function createEditorServerHandler(
  options: EditorServerOptions = {},
): Connect.NextHandleFunction {
  const configuredRoot = path.resolve(
    options.levelsDirectory ?? DEFAULT_LEVELS_DIRECTORY,
  );
  return (request, response, next) => {
    void handle(request, response, next, configuredRoot, options.onSaved);
  };
}

export async function generateLevelCatalog(
  levelsDirectory = DEFAULT_LEVELS_DIRECTORY,
): Promise<void> {
  const root = await prepareRoot(path.resolve(levelsDirectory));
  const campaign = await readCampaign(root);
  const imports: string[] = [];
  const names: string[] = [];
  for (const [index, id] of campaign.levels.entries()) {
    // Reading here catches a missing or malformed campaign entry during build.
    const document = await readLevel(root, id);
    if (document.id !== id)
      throw new Error(`${id}.json contains level id ${document.id}.`);
    const issues = ContentCompiler.validate(document);
    if (issues.length)
      throw new Error(`${id}.json is not campaign-ready: ${issues.join(" ")}`);
    const name = `level${index}`;
    imports.push(`import ${name} from "./${id}.json";`);
    names.push(name);
  }
  const source = `${imports.join("\n")}\n\n// Generated from campaign.json. Do not edit by hand.\nexport const CAMPAIGN_DOCUMENTS_JSON: readonly unknown[] = [${names.join(", ")}];\n`;
  await atomicTextWrite(root, "catalog.generated.ts", source);
}

async function handle(
  request: IncomingMessage,
  response: ServerResponse,
  next: Connect.NextFunction,
  configuredRoot: string,
  onSaved?: () => void,
): Promise<void> {
  let pathname: string;
  try {
    pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    sendError(response, 400, "Malformed request URL");
    return;
  }
  if (
    pathname !== EDITOR_API_ROOT &&
    !pathname.startsWith(`${EDITOR_API_ROOT}/`)
  ) {
    next();
    return;
  }
  try {
    validateLocalRequest(request, request.method === "PUT");
    const root = await prepareRoot(configuredRoot);
    if (request.method === "GET" && pathname === `${EDITOR_API_ROOT}/levels`) {
      sendJson(response, 200, await listLevels(root));
      return;
    }
    if (
      request.method === "GET" &&
      pathname === `${EDITOR_API_ROOT}/campaign`
    ) {
      sendJson(response, 200, await readCampaign(root));
      return;
    }
    if (
      request.method === "PUT" &&
      pathname === `${EDITOR_API_ROOT}/campaign`
    ) {
      requireJson(request);
      const campaign = parseClient(
        await readJsonBody(request),
        parseCampaignDocument,
      );
      await validateCampaign(root, campaign);
      await atomicJsonWrite(root, "campaign.json", campaign);
      await generateLevelCatalog(root);
      onSaved?.();
      sendJson(response, 200, { ok: true });
      return;
    }
    const match = /^\/__douse_editor\/levels\/([^/]+)$/.exec(pathname);
    if (match && (request.method === "GET" || request.method === "PUT")) {
      const id = decodeId(match[1]);
      if (request.method === "GET") {
        sendJson(response, 200, await readLevel(root, id));
        return;
      }
      requireJson(request);
      const document = parseClient(
        await readJsonBody(request),
        parseLevelDocument,
      );
      if (document.id !== id)
        throw new HttpError(
          400,
          `URL id ${id} does not match document id ${document.id}.`,
        );
      let inCampaign = false;
      try {
        inCampaign = (await readCampaign(root)).levels.includes(id);
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 404)) throw error;
      }
      const issues = ContentCompiler.validate(document);
      if (inCampaign && issues.length)
        throw new HttpError(
          400,
          `Remove ${id} from the campaign before saving it as an incomplete draft: ${issues.join(" ")}`,
        );
      await atomicJsonWrite(root, `${id}.json`, document);
      onSaved?.();
      sendJson(response, 200, { ok: true, issues });
      return;
    }
    throw new HttpError(
      405,
      "Method or Dig & Douse editor route is not supported.",
    );
  } catch (error) {
    const status =
      error instanceof HttpError
        ? error.status
        : error instanceof SyntaxError
          ? 400
          : 500;
    sendError(
      response,
      status,
      error instanceof Error ? error.message : "Unexpected editor file error.",
    );
  }
}

async function prepareRoot(configuredRoot: string): Promise<string> {
  await fs.mkdir(configuredRoot, { recursive: true });
  const stat = await fs.lstat(configuredRoot);
  if (stat.isSymbolicLink() || !stat.isDirectory())
    throw new HttpError(500, "Levels directory must be a real directory.");
  const realRoot = await fs.realpath(configuredRoot);
  if (path.resolve(realRoot) !== configuredRoot)
    throw new HttpError(
      500,
      "Levels directory cannot traverse a symbolic link.",
    );
  return realRoot;
}

async function listLevels(
  root: string,
): Promise<{ levels: LevelDocument[]; errors: string[] }> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const filenames = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith(".json") &&
        entry.name !== "campaign.json",
    )
    .map((entry) => entry.name)
    .sort();
  const levels: LevelDocument[] = [],
    errors: string[] = [];
  for (const filename of filenames) {
    const id = filename.slice(0, -5);
    try {
      if (!isSafeLevelId(id))
        throw new Error("filename is not a safe level id");
      const document = await readLevel(root, id);
      if (document.id !== id) throw new Error(`document id is ${document.id}`);
      levels.push(document);
    } catch (error) {
      errors.push(`${filename}: ${errorMessage(error)}`);
    }
  }
  return { levels, errors };
}

async function validateCampaign(
  root: string,
  campaign: CampaignDocument,
): Promise<void> {
  for (const id of campaign.levels) {
    let document: LevelDocument;
    try {
      document = await readLevel(root, id);
    } catch (error) {
      throw new HttpError(400, `Cannot include ${id}: ${errorMessage(error)}`);
    }
    if (document.id !== id)
      throw new HttpError(
        400,
        `Cannot include ${id}: document id is ${document.id}.`,
      );
    const issues = ContentCompiler.validate(document);
    if (issues.length)
      throw new HttpError(400, `Cannot include ${id}: ${issues.join(" ")}`);
  }
}

async function readCampaign(root: string): Promise<CampaignDocument> {
  return parseCampaignDocument(await readJsonFile(root, "campaign.json"));
}
async function readLevel(root: string, id: string): Promise<LevelDocument> {
  return parseLevelDocument(await readJsonFile(root, `${id}.json`));
}
async function readJsonFile(root: string, filename: string): Promise<unknown> {
  const target = safeTarget(root, filename);
  let stat;
  try {
    stat = await fs.lstat(target);
  } catch (error) {
    if (isNodeError(error, "ENOENT"))
      throw new HttpError(404, `${filename} does not exist.`);
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile())
    throw new HttpError(400, `${filename} must be a regular file.`);
  if (stat.size > MAX_EDITOR_PAYLOAD_BYTES)
    throw new HttpError(413, `${filename} exceeds the 1 MB limit.`);
  try {
    return JSON.parse(await fs.readFile(target, "utf8")) as unknown;
  } catch {
    throw new HttpError(400, `${filename} is not valid JSON.`);
  }
}

async function atomicJsonWrite(
  root: string,
  filename: string,
  value: LevelDocument | CampaignDocument,
): Promise<void> {
  await atomicTextWrite(root, filename, `${JSON.stringify(value, null, 2)}\n`);
}
async function atomicTextWrite(
  root: string,
  filename: string,
  contents: string,
): Promise<void> {
  if (Buffer.byteLength(contents) > MAX_EDITOR_PAYLOAD_BYTES)
    throw new HttpError(413, "Serialized file exceeds the 1 MB limit.");
  const target = safeTarget(root, filename);
  try {
    const stat = await fs.lstat(target);
    if (stat.isSymbolicLink() || !stat.isFile())
      throw new HttpError(400, `${filename} must be a regular file.`);
  } catch (error) {
    if (!isNodeError(error, "ENOENT")) throw error;
  }
  const temporary = safeTarget(root, `.${filename}.${randomUUID()}.tmp`);
  try {
    await fs.writeFile(temporary, contents, { encoding: "utf8", flag: "wx" });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}
function safeTarget(root: string, filename: string): string {
  if (path.basename(filename) !== filename)
    throw new HttpError(400, "Nested paths are not allowed.");
  const target = path.resolve(root, filename);
  if (path.dirname(target) !== root)
    throw new HttpError(400, "File path escapes the levels directory.");
  return target;
}
function decodeId(encoded: string): string {
  let id: string;
  try {
    id = decodeURIComponent(encoded);
  } catch {
    throw new HttpError(400, "Level id has invalid URL encoding.");
  }
  if (!isSafeLevelId(id)) throw new HttpError(400, "Level id is unsafe.");
  return id;
}
function validateLocalRequest(request: IncomingMessage, write: boolean): void {
  const host = request.headers.host;
  if (!host) throw new HttpError(403, "A local Host header is required.");
  let hostUrl: URL;
  try {
    hostUrl = new URL(`http://${host}`);
  } catch {
    throw new HttpError(403, "Host header is invalid.");
  }
  if (
    !["127.0.0.1", "localhost", "[::1]"].includes(
      hostUrl.hostname.toLowerCase(),
    )
  )
    throw new HttpError(403, "Editor file access is local only.");
  const rawOrigin = request.headers.origin;
  if (Array.isArray(rawOrigin))
    throw new HttpError(403, "Origin header is invalid.");
  if (!rawOrigin) {
    if (write)
      throw new HttpError(403, "A same-origin request is required for writes.");
    return;
  }
  let origin: URL;
  try {
    origin = new URL(rawOrigin);
  } catch {
    throw new HttpError(403, "Origin header is invalid.");
  }
  if (
    !/^https?:$/.test(origin.protocol) ||
    origin.host.toLowerCase() !== host.toLowerCase()
  )
    throw new HttpError(403, "Cross-origin editor requests are not allowed.");
}
function requireJson(request: IncomingMessage): void {
  const type = request.headers["content-type"];
  if (
    typeof type !== "string" ||
    type.split(";", 1)[0].trim().toLowerCase() !== "application/json"
  )
    throw new HttpError(415, "Content-Type must be application/json.");
}
async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > MAX_EDITOR_PAYLOAD_BYTES) {
      request.resume();
      throw new HttpError(413, "Request body exceeds the 1 MB limit.");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "Request body is not valid JSON.");
  }
}
function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}
function sendError(
  response: ServerResponse,
  status: number,
  message: string,
): void {
  sendJson(response, status, { error: message });
}
function parseClient<T>(value: unknown, parser: (input: unknown) => T): T {
  try {
    return parser(value);
  } catch (error) {
    throw new HttpError(400, errorMessage(error));
  }
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
function isNodeError(error: unknown, code: string): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === code
  );
}
class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
