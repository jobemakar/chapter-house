import assert from "node:assert/strict";
import { WishboneCamera } from "../src/camera";
const camera = new WishboneCamera(); camera.setWorld({ width: 2400, height: 720 });
const point = { x: 480, y: 390 };
for (const zoom of [0.5, 1, 1.5]) { camera.zoomAt(zoom); assert.deepEqual(camera.toWorld(camera.toScreen(point)), point); }
