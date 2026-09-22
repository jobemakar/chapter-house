import "./editor.css";
import { KeyfallEditorController } from "./controller";

const root = document.getElementById("keyfall-editor");
if (!root) throw new Error("Missing #keyfall-editor");
const editor = new KeyfallEditorController(root);
window.addEventListener("pagehide", () => editor.dispose(), { once: true });
