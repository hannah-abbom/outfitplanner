/*
 * Cutting a piece out of its photo, as a sticker. The web build does it on the device with MediaPipe (cutout.web.ts).
 * The phone app will use the system's own subject lifting (Apple Vision, Google ML Kit) once it has a development
 * build; until then there is no cut-out on the phone and photos show framed.
 */

export interface Point {
  /** 0 to 1 across the photo. */
  x: number;
  y: number;
}

export const canCutOut = false;

/** A transparent PNG of the piece with a white die-cut border, or null when nothing could be lifted out. */
export async function cutOut(_src: string, _at?: Point): Promise<string | null> {
  return null;
}

/** Starts loading the cut-out runtime ahead of time, so the first sticker is quicker. */
export function warmUpCutOut(): void {}
