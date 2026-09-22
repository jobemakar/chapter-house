import "../style.css";
import "./editor.css";
import { ContraptionEditorController } from "./controller";

const root = document.getElementById("contraption-editor");
if (!root) throw new Error("Missing #contraption-editor");
const editor = new ContraptionEditorController(root);
window.addEventListener("pagehide", () => editor.dispose(), { once: true });
