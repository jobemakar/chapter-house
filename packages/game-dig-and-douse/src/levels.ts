import { CAMPAIGN_DOCUMENTS_JSON } from "../levels/catalog.generated";
import {
  ContentCompiler,
  parseCampaignDocument,
  parseLevelDocument,
} from "./content";
import type { LevelDocument } from "./content-types";
import type { LevelDefinition } from "./types";

const documentsById = new Map<string, LevelDocument>();
for (const source of CAMPAIGN_DOCUMENTS_JSON) {
  const document = parseLevelDocument(source);
  if (documentsById.has(document.id))
    throw new Error(`Duplicate Dig & Douse level id: ${document.id}.`);
  documentsById.set(document.id, document);
}

export const LEVEL_DOCUMENTS: LevelDocument[] = [...documentsById.values()];
export const LEVELS: LevelDefinition[] = LEVEL_DOCUMENTS.map((document) =>
  ContentCompiler.compile(document),
);
export let DEFAULT_LEVEL_ID = LEVEL_DOCUMENTS[0]?.id ?? "painted-hillside";

export function getLevel(id = DEFAULT_LEVEL_ID): LevelDefinition {
  const level = LEVELS.find((candidate) => candidate.id === id);
  if (!level) throw new Error(`Unknown Dig & Douse level: ${id}`);
  return level;
}

export function getNextLevel(id: string): LevelDefinition | undefined {
  const index = LEVELS.findIndex((candidate) => candidate.id === id);
  return index >= 0 ? LEVELS[index + 1] : undefined;
}

/**
 * Loads the deployable JSON campaign. Call once during normal browser startup;
 * editor-injected test levels intentionally bypass this boundary.
 */
export async function loadCampaignLevels(): Promise<void> {
  if (typeof document === "undefined") return;
  const root = new URL("douse-levels/", document.baseURI);
  const campaign = parseCampaignDocument(
    await fetchJson(new URL("campaign.json", root)),
  );
  const nextDocuments: LevelDocument[] = [];
  const seen = new Set<string>();
  for (const id of campaign.levels) {
    const authored = parseLevelDocument(
      await fetchJson(new URL(`${encodeURIComponent(id)}.json`, root)),
    );
    if (authored.id !== id)
      throw new Error(
        `Dig & Douse level file ${id}.json contains id ${authored.id}.`,
      );
    if (seen.has(id))
      throw new Error(`Duplicate Dig & Douse campaign level: ${id}.`);
    const issues = ContentCompiler.validate(authored);
    if (issues.length)
      throw new Error(
        `Dig & Douse level ${id} is invalid: ${issues.join(" ")}`,
      );
    seen.add(id);
    nextDocuments.push(authored);
  }
  const nextLevels = nextDocuments.map((authored) =>
    ContentCompiler.compile(authored),
  );
  LEVEL_DOCUMENTS.splice(0, LEVEL_DOCUMENTS.length, ...nextDocuments);
  LEVELS.splice(0, LEVELS.length, ...nextLevels);
  DEFAULT_LEVEL_ID = nextDocuments[0]?.id ?? "painted-hillside";
}

async function fetchJson(url: URL): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error(
      `Could not load Dig & Douse content ${url.pathname}: HTTP ${response.status}.`,
    );
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new Error(`Dig & Douse content ${url.pathname} is not valid JSON.`);
  }
}
