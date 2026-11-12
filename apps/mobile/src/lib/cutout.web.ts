import type * as Vision from "@mediapipe/tasks-vision";

import type { Point } from "./cutout";

/*
 * Sticker cut-outs in the browser, on the device: MediaPipe's interactive segmenter (Magic Touch, Apache-2.0) lifts
 * out the object under a point, by default the middle of the photo, where a piece usually is. The mask's soft edge
 * becomes the alpha, the piece is cropped to its outline, and a white border is drawn around it like a die-cut
 * sticker. Nothing leaves the device.
 */

export type { Point };

export const canCutOut = typeof document !== "undefined" && typeof WebAssembly !== "undefined";

const WORK = 768; // longest side the mask is computed at
const OUT = 512; // longest side of the finished sticker

type Segmenter = Vision.InteractiveSegmenterLegacy;
let segmenter: Promise<Segmenter> | null = null;

function base(): string {
  const appBase = (globalThis as { __APP_BASE__?: unknown }).__APP_BASE__;
  return `${typeof appBase === "string" ? appBase : `${location.origin}/`}cutout`;
}

/**
 * MediaPipe is loaded as a plain script from the cut-out folder rather than bundled (Metro can't bundle it), and
 * only when a sticker is wanted, so the app itself stays small. The script defines `Vision`.
 */
function library(): Promise<typeof Vision> {
  const ready = () => (globalThis as { Vision?: typeof Vision }).Vision;
  const now = ready();
  if (now) return Promise.resolve(now);
  return new Promise((ok, fail) => {
    const s = document.createElement("script");
    s.src = `${base()}/vision_bundle.js`;
    s.onload = () => {
      const v = ready();
      if (v) ok(v);
      else fail(new Error("The cut-out library didn't load."));
    };
    s.onerror = () => {
      s.remove();
      fail(new Error("The cut-out library couldn't be fetched."));
    };
    document.head.appendChild(s);
  });
}

/** The Magic Touch model, shipped as base64 text because the artifact host only serves web media types. */
async function model(): Promise<Uint8Array> {
  const res = await fetch(`${base()}/magic_touch.b64.txt`);
  if (!res.ok) throw new Error(`The cut-out model couldn't be fetched (${res.status}).`);
  const text = atob((await res.text()).trim());
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}

function load(): Promise<Segmenter> {
  segmenter ??= Promise.all([library(), model()])
    .then(async ([v, bytes]) => ({ v, bytes, files: await v.FilesetResolver.forVisionTasks(base()) }))
    .then(({ v, bytes, files }) =>
      v.InteractiveSegmenterLegacy.createFromOptions(files, {
        baseOptions: { modelAssetBuffer: bytes, delegate: "CPU" },
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      }),
    )
    .catch((e: unknown) => {
      segmenter = null;
      throw e;
    });
  return segmenter;
}

export function warmUpCutOut(): void {
  if (canCutOut) load().catch(() => {});
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => fail(new Error("The photo couldn't be read."));
    img.src = src;
  });
}

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("No 2D canvas.");
  return [c, ctx];
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export async function cutOut(src: string, at: Point = { x: 0.5, y: 0.5 }): Promise<string | null> {
  if (!canCutOut) return null;
  const [seg, img] = await Promise.all([load(), loadImage(src)]);
  const scale = Math.min(1, WORK / Math.max(img.naturalWidth, img.naturalHeight));
  const [work, wctx] = canvas(img.naturalWidth * scale, img.naturalHeight * scale);
  wctx.drawImage(img, 0, 0, work.width, work.height);

  const result = seg.segment(work, { keypoint: { x: at.x, y: at.y } });
  const mask = result.confidenceMasks?.[0];
  if (!mask) {
    result.close();
    return null;
  }
  const conf = mask.getAsFloat32Array().slice();
  const mw = mask.width;
  const mh = mask.height;
  result.close();

  // Alpha from the mask's confidence, with a soft edge, and the outline's bounding box.
  const pixels = wctx.getImageData(0, 0, work.width, work.height);
  let x0 = mw;
  let y0 = mh;
  let x1 = -1;
  let y1 = -1;
  let kept = 0;
  for (let y = 0; y < work.height; y++) {
    const my = Math.min(mh - 1, Math.floor((y * mh) / work.height));
    for (let x = 0; x < work.width; x++) {
      const mx = Math.min(mw - 1, Math.floor((x * mw) / work.width));
      const a = smooth(0.3, 0.7, conf[my * mw + mx] ?? 0);
      pixels.data[(y * work.width + x) * 4 + 3] = Math.round(a * 255);
      if (a > 0.1) {
        kept++;
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const area = work.width * work.height;
  // Nothing found, or the whole photo: not a piece to lift out.
  if (x1 < 0 || kept < area * 0.01 || kept > area * 0.97) return null;
  wctx.putImageData(pixels, 0, 0);

  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const border = Math.max(6, Math.min(18, Math.round(Math.max(cw, ch) * 0.035)));
  const pad = border + 4;

  // The piece alone, cropped.
  const [piece, pctx] = canvas(cw + pad * 2, ch + pad * 2);
  pctx.drawImage(work, x0, y0, cw, ch, pad, pad, cw, ch);

  // Its silhouette in white, stamped in a ring to make the die-cut border.
  const [white, whctx] = canvas(piece.width, piece.height);
  whctx.drawImage(piece, 0, 0);
  whctx.globalCompositeOperation = "source-in";
  whctx.fillStyle = "#ffffff";
  whctx.fillRect(0, 0, white.width, white.height);

  const [sticker, sctx] = canvas(piece.width, piece.height);
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    sctx.drawImage(white, Math.cos(angle) * border, Math.sin(angle) * border);
  }
  sctx.drawImage(white, 0, 0);
  sctx.drawImage(piece, 0, 0);

  const outScale = Math.min(1, OUT / Math.max(sticker.width, sticker.height));
  const [final, fctx] = canvas(sticker.width * outScale, sticker.height * outScale);
  fctx.imageSmoothingQuality = "high";
  fctx.drawImage(sticker, 0, 0, final.width, final.height);
  return final.toDataURL("image/png");
}
