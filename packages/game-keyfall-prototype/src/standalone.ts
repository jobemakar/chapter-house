import { KeyfallGame } from "./game";
import { emptyProgress, normalizeProgress, SAVE_KEY } from "./progress";
import "./style.css";
const root = document.getElementById("keyfall-root");
if (!root) throw new Error("Missing #keyfall-root");
new KeyfallGame(root, { load: () => { try { return normalizeProgress(JSON.parse(localStorage.getItem(SAVE_KEY) ?? "null")); } catch { return emptyProgress(); } }, save: (progress) => localStorage.setItem(SAVE_KEY, JSON.stringify(progress)) });
