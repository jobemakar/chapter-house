import "../style.css";
import "./editor.css";
import { WishboneEditorController } from "./controller";

const root = document.getElementById("wishbone-editor");
if (!root) throw new Error("Missing #wishbone-editor");
const editor = new WishboneEditorController(root);
window.addEventListener("pagehide", () => editor.dispose(), { once: true });
