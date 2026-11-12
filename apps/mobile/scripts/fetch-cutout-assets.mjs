// Puts the sticker cut-out runtime where the web build serves it: MediaPipe and its WebAssembly from node_modules, and the
// Magic Touch model (Apache-2.0) from Google's model store. Run before `expo export --platform web`.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "cutout");
mkdirSync(out, { recursive: true });

const pkg = dirname(createRequire(import.meta.url).resolve("@mediapipe/tasks-vision"));
// The library itself is served as a plain script too: Metro can't bundle it (it has a dynamic import). Only the SIMD
// build of the WebAssembly is shipped: every browser the app supports has SIMD.
copyFileSync(join(pkg, "vision_bundle.js"), join(out, "vision_bundle.js"));
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"])
  copyFileSync(join(pkg, "wasm", f), join(out, f));

// The model goes out as base64 text: the artifact host serves only web media types, and .tflite isn't one.
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/interactive_segmenter/magic_touch/float32/1/magic_touch.tflite";
const model = join(out, "magic_touch.b64.txt");
if (!existsSync(model)) {
  const res = await fetch(MODEL);
  if (!res.ok) throw new Error(`Downloading the cut-out model failed: ${res.status}`);
  writeFileSync(model, Buffer.from(await res.arrayBuffer()).toString("base64"));
}
console.log(`Cut-out assets ready in ${out}`);
