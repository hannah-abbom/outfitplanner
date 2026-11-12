/*
 * Where piece photos live. On the phone they are files in the app's own folder (see capture.ts), so a reference is
 * already a usable URI. The web build keeps them in the browser's database instead: see images.web.ts.
 */

export async function storeImage(uri: string): Promise<string> {
  return uri;
}

export function useImageUri(ref: string | null | undefined): string | null {
  return ref ?? null;
}
