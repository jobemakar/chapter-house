import { KeyfallGame } from "./game";
import { emptyProgress, normalizeProgress, SAVE_KEY } from "./progress";
import { loadLevelFiles } from "./level-loader";
import { CampaignCatalog, RoomValidator } from "./catalog";
import { GAME_VIEWPORT } from "./rooms";
import "./style.css";
const root = document.getElementById("keyfall-root");
if (!root) throw new Error("Missing #keyfall-root");

function showDiagnostics(messages: string[]): void {
  const panel = document.createElement("section");
  panel.className = "level-diagnostics";
  panel.setAttribute("role", "status");
  const heading = document.createElement("strong");
  heading.textContent = "Some levels could not be loaded";
  const text = document.createElement("pre"); text.textContent = messages.join("\n");
  panel.append(heading, text);
  document.body.append(panel);
}

async function start(): Promise<void> {
  const mount = root!;
  mount.className = "loading-levels";
  mount.textContent = "Opening the funhouse…";
  try {
    const loaded = await loadLevelFiles(new URL("levels/", document.baseURI));
    if (!loaded.rooms.length) {
      mount.textContent = "No playable rooms are included yet. Add a saved, valid level to the campaign in the local editor, then reload.";
    } else {
      const catalog = new CampaignCatalog(loaded.rooms, new RoomValidator(GAME_VIEWPORT), false);
      new KeyfallGame(mount, {
        load: () => { try { return normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null")); } catch { return emptyProgress(); } },
        save: (progress) => localStorage.setItem(SAVE_KEY, JSON.stringify(progress)),
      }, catalog);
    }
    if (loaded.errors.length) showDiagnostics(loaded.errors);
  } catch (error) {
    mount.textContent = "The level files could not be opened. Check levels/index.json and reload.";
    showDiagnostics([error instanceof Error ? error.message : String(error)]);
  }
  if (import.meta.env.DEV) {
    const editor = document.createElement("a");
    editor.href = "editor.html"; editor.textContent = "Open level editor";
    editor.className = "credits-link";
    (mount.querySelector("footer > div") ?? mount).append(editor);
  }
}
void start();
