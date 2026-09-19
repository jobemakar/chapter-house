import assert from "node:assert/strict";
import { WishboneCamera } from "../src/camera";
import { WishboneScenery } from "../src/scenery";
const camera = new WishboneCamera(); camera.setWorld({ width: 2400, height: 720 }); camera.zoomAt(.65);
const scenery = WishboneScenery.layout(camera, 2400, false);
assert.equal(scenery.groundY, camera.toScreen({ x: 0, y: 602 }).y);
