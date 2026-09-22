import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Connect, Plugin } from "vite";
import {
  isSafeLevelId,
  levelIssues,
  parseLevelFile,
  parseLevelIndex,
  type LevelFile,
  type LevelIndex,
} from "../src/level-files";

export const MAX_LEVEL_PAYLOAD_BYTES = 512 * 1024;
const API_ROOT = "/api/wishbone";
const DEFAULT_LEVELS_DIRECTORY = fileURLToPath(new URL("../public/levels", import.meta.url));

export type LevelStoreOptions = { levelsDirectory?: string };

export function createLevelStorePlugin(options: LevelStoreOptions = {}): Plugin {
  const handler = createLevelStoreHandler(options);
  return {
    name: "wishbone-local-level-store",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export function createLevelStoreHandler(options: LevelStoreOptions = {}): Connect.NextHandleFunction {
  const configuredRoot = path.resolve(options.levelsDirectory ?? DEFAULT_LEVELS_DIRECTORY);
  return (request, response, next) => {
    void handleRequest(request, response, next, configuredRoot);
  };
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  next: Connect.NextFunction,
  configuredRoot: string,
): Promise<void> {
  let pathname: string;
  try {
    pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
  } catch {
    sendError(response, 400, "Malformed request URL");
    return;
  }
  if (pathname !== API_ROOT && !pathname.startsWith(`${API_ROOT}/`)) {
    next();
    return;
  }

  try {
    validateLocalRequest(request, request.method === "PUT");
    const root = await prepareRoot(configuredRoot);
    if (request.method === "GET" && pathname === `${API_ROOT}/levels`) {
      sendJson(response, 200, await listLevels(root));
      return;
    }
    if (request.method === "GET" && pathname === `${API_ROOT}/index`) {
      sendJson(response, 200, await readIndex(root));
      return;
    }
    if (request.method === "PUT" && pathname === `${API_ROOT}/index`) {
      requireJson(request);
      const index = parseClientValue(await readJsonBody(request), parseLevelIndex);
      await validatePlayableFiles(root, index);
      await atomicWrite(root, "index.json", index);
      sendJson(response, 200, { ok: true });
      return;
    }
    const match = /^\/api\/wishbone\/levels\/([^/]+)$/.exec(pathname);
    if (match) {
      const id = decodeLevelId(match[1]);
      if (request.method === "GET") {
        const file = await readLevel(root, `${id}.json`);
        if (file.yard.id !== id) throw new HttpError(400, `Document id ${file.yard.id} does not match filename ${id}`);
        sendJson(response, 200, file);
        return;
      }
      if (request.method === "PUT") {
        requireJson(request);
        const incoming = parseClientValue(await readJsonBody(request), parseLevelFile);
        if (incoming.yard.id !== id) throw new HttpError(400, `URL id ${id} does not match document id ${incoming.yard.id}`);
        const previous = await readExistingLevel(root, `${id}.json`);
        const file = previous && previous.nextPieceId > incoming.nextPieceId
          ? { ...incoming, nextPieceId: previous.nextPieceId }
          : incoming;
        await atomicWrite(root, `${id}.json`, file);
        sendJson(response, 200, { ok: true, level: file });
        return;
      }
    }
    throw new HttpError(405, "Method or Wishbone API route is not supported");
  } catch (error) {
    const status = error instanceof HttpError ? error.status : error instanceof SyntaxError ? 400 : 500;
    sendError(response, status, errorMessage(error));
  }
}

async function prepareRoot(configuredRoot: string): Promise<string> {
  await fs.mkdir(configuredRoot, { recursive: true });
  const stat = await fs.lstat(configuredRoot);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new HttpError(500, "Configured levels directory must be a real directory");
  const realRoot = await fs.realpath(configuredRoot);
  if (path.resolve(realRoot) !== configuredRoot) throw new HttpError(500, "Configured levels directory cannot traverse a symbolic link");
  return realRoot;
}

async function listLevels(root: string): Promise<{ levels: LevelFile[]; errors: string[] }> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const filenames = entries
    .filter((entry) => entry.name.endsWith(".json") && entry.name !== "index.json")
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const levels: LevelFile[] = [];
  const errors: string[] = [];
  for (const filename of filenames) {
    const id = filename.slice(0, -".json".length);
    try {
      if (!isSafeLevelId(id)) throw new Error("filename is not a safe level id");
      const file = await readLevel(root, filename);
      if (file.yard.id !== id) throw new Error(`document id ${file.yard.id} does not match filename`);
      levels.push(file);
    } catch (error) {
      errors.push(`${filename}: ${errorMessage(error)}`);
    }
  }
  return { levels, errors };
}

async function readIndex(root: string): Promise<LevelIndex> {
  return parseLevelIndex(await readJsonFile(root, "index.json"));
}

async function validatePlayableFiles(root: string, index: LevelIndex): Promise<void> {
  for (const id of index.levels) {
    let file: LevelFile;
    try {
      file = await readLevel(root, `${id}.json`);
    } catch (error) {
      throw new HttpError(400, `Cannot include ${id}: ${errorMessage(error)}`);
    }
    if (file.yard.id !== id) throw new HttpError(400, `Cannot include ${id}: document id is ${file.yard.id}`);
    const issues = levelIssues(file);
    if (issues.length > 0) throw new HttpError(400, `Cannot include ${id}: ${issues.join(" ")}`);
  }
}

async function readExistingLevel(root: string, filename: string): Promise<LevelFile | null> {
  try {
    return await readLevel(root, filename);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

async function readLevel(root: string, filename: string): Promise<LevelFile> {
  return parseLevelFile(await readJsonFile(root, filename));
}

async function readJsonFile(root: string, filename: string): Promise<unknown> {
  const target = safeTarget(root, filename);
  let stat;
  try {
    stat = await fs.lstat(target);
  } catch (error) {
    if (isNodeError(error, "ENOENT")) throw new HttpError(404, `${filename} does not exist`);
    throw error;
  }
  if (stat.isSymbolicLink() || !stat.isFile()) throw new HttpError(400, `${filename} must be a regular file`);
  if (stat.size > MAX_LEVEL_PAYLOAD_BYTES) throw new HttpError(413, `${filename} exceeds the 512 KB limit`);
  const contents = await fs.readFile(target, "utf8");
  try {
    return JSON.parse(contents) as unknown;
  } catch {
    throw new HttpError(400, `${filename} is not valid JSON`);
  }
}

async function atomicWrite(root: string, filename: string, value: LevelFile | LevelIndex): Promise<void> {
  const target = safeTarget(root, filename);
  try {
    const existing = await fs.lstat(target);
    if (existing.isSymbolicLink() || !existing.isFile()) throw new HttpError(400, `${filename} must be a regular file`);
  } catch (error) {
    if (!isNodeError(error, "ENOENT")) throw error;
  }
  const temporary = safeTarget(root, `.${filename}.${randomUUID()}.tmp`);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (Buffer.byteLength(serialized) > MAX_LEVEL_PAYLOAD_BYTES) throw new HttpError(413, "Serialized document exceeds the 512 KB limit");
  try {
    await fs.writeFile(temporary, serialized, { encoding: "utf8", flag: "wx" });
    await fs.rename(temporary, target);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

function safeTarget(root: string, filename: string): string {
  if (path.basename(filename) !== filename) throw new HttpError(400, "Nested paths are not allowed");
  const target = path.resolve(root, filename);
  if (path.dirname(target) !== root) throw new HttpError(400, "File path escapes the levels directory");
  return target;
}

function decodeLevelId(encoded: string): string {
  let id: string;
  try {
    id = decodeURIComponent(encoded);
  } catch {
    throw new HttpError(400, "Level id has invalid URL encoding");
  }
  if (!isSafeLevelId(id)) throw new HttpError(400, "Level id is unsafe");
  return id;
}

function validateLocalRequest(request: IncomingMessage, requireOrigin: boolean): void {
  const host = request.headers.host;
  if (!host) throw new HttpError(403, "A local Host header is required");
  let hostUrl: URL;
  try {
    hostUrl = new URL(`http://${host}`);
  } catch {
    throw new HttpError(403, "Host header is invalid");
  }
  const hostname = hostUrl.hostname.toLowerCase();
  if (hostname !== "127.0.0.1" && hostname !== "localhost" && hostname !== "[::1]") {
    throw new HttpError(403, "Wishbone level storage is available only on the local host");
  }
  const originHeader = request.headers.origin;
  if (Array.isArray(originHeader)) throw new HttpError(403, "Origin header is invalid");
  if (!originHeader) {
    if (requireOrigin) throw new HttpError(403, "A same-origin request is required for writes");
    return;
  }
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    throw new HttpError(403, "Origin header is invalid");
  }
  if (origin.protocol !== hostUrl.protocol || origin.host.toLowerCase() !== host.toLowerCase()) {
    throw new HttpError(403, "Cross-origin level storage requests are not allowed");
  }
}

function requireJson(request: IncomingMessage): void {
  const type = request.headers["content-type"];
  if (typeof type !== "string" || type.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    throw new HttpError(415, "Content-Type must be application/json");
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const declaredLength = request.headers["content-length"];
  if (declaredLength !== undefined) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) throw new HttpError(400, "Content-Length is invalid");
    if (parsedLength > MAX_LEVEL_PAYLOAD_BYTES) {
      request.resume();
      throw new HttpError(413, "Request body exceeds the 512 KB limit");
    }
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    size += buffer.length;
    if (size > MAX_LEVEL_PAYLOAD_BYTES) {
      request.resume();
      throw new HttpError(413, "Request body exceeds the 512 KB limit");
    }
    chunks.push(buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    throw new HttpError(400, "Request body is not valid JSON");
  }
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.headersSent) return;
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(body));
}

function sendError(response: ServerResponse, status: number, message: string): void {
  sendJson(response, status, { error: message });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseClientValue<T>(value: unknown, parser: (input: unknown) => T): T {
  try {
    return parser(value);
  } catch (error) {
    throw new HttpError(400, errorMessage(error));
  }
}

function isNodeError(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === code;
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}
