import { useEffect, useState } from "react";

/*
 * On the web, photos and stickers go into IndexedDB and pieces keep an `idb:` reference, so a closet of photos
 * doesn't overflow the few megabytes the browser gives saved settings. Where IndexedDB isn't available, the image
 * stays inline as a data URL, as before.
 */

const DB = "trip-wardrobe-images";
const STORE = "images";
const PREFIX = "idb:";
const urls = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  return new Promise((ok, fail) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => ok(req.result);
    req.onerror = () => fail(req.error);
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((ok, fail) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => ok(req.result);
        req.onerror = () => fail(req.error);
      }),
  );
}

/** Decodes a data URL by hand: pages with a strict content policy (like the artifact viewer) can't fetch one. */
async function toBlob(uri: string): Promise<Blob> {
  const m = /^data:([^;,]*)((?:;[^;,]*)*?)(;base64)?,(.*)$/s.exec(uri);
  if (!m) return (await fetch(uri)).blob();
  const body = m[3] ? atob(m[4]) : decodeURIComponent(m[4]);
  const bytes = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) bytes[i] = body.charCodeAt(i);
  return new Blob([bytes], { type: m[1] || "application/octet-stream" });
}

export async function storeImage(uri: string): Promise<string> {
  try {
    const blob = await toBlob(uri);
    const key = `img_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
    await run("readwrite", (s) => s.put(blob, key));
    urls.set(key, URL.createObjectURL(blob));
    return PREFIX + key;
  } catch {
    return uri;
  }
}

export function useImageUri(ref: string | null | undefined): string | null {
  const key = ref?.startsWith(PREFIX) ? ref.slice(PREFIX.length) : null;
  const [loaded, setLoaded] = useState<{ key: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!key || urls.has(key)) return;
    let live = true;
    run<Blob | undefined>("readonly", (s) => s.get(key))
      .then((blob) => {
        const url = blob ? URL.createObjectURL(blob) : null;
        if (url) urls.set(key, url);
        if (live) setLoaded({ key, url });
      })
      .catch(() => live && setLoaded({ key, url: null }));
    return () => {
      live = false;
    };
  }, [key]);
  if (!ref) return null;
  if (!key) return ref;
  return urls.get(key) ?? (loaded?.key === key ? loaded.url : null);
}
