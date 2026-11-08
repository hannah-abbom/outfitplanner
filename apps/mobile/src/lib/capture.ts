import { readProductPage, type ClosetItem, type ProductPage } from "@trip/core";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

/*
 * Getting clothes in (WRD-01 to WRD-03): a photo of the piece, a screenshot of an order or a product page, or a link
 * to the product. Photos are copied into the app's own folder so they stay when the camera roll changes.
 */

export class CaptureError extends Error {}

export type Draft = Partial<ClosetItem>;

let pending: Draft | null = null;
/** Hands a new piece to the editor screen without squeezing a photo into the URL. */
export const setDraft = (d: Draft) => {
  pending = d;
};
export const takeDraft = (): Draft | null => {
  const d = pending;
  pending = null;
  return d;
};

async function keep(a: ImagePicker.ImagePickerAsset): Promise<string> {
  if (Platform.OS === "web") return a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri;
  const dir = new Directory(Paths.document, "closet");
  if (!dir.exists) dir.create({ intermediates: true });
  const ext = (a.fileName?.split(".").pop() ?? "jpg").toLowerCase();
  const dest = new File(dir, `${Date.now().toString(36)}.${ext}`);
  await new File(a.uri).copy(dest);
  return dest.uri;
}

/** A photo from the camera, or a photo or screenshot from the library. Null when cancelled. */
export async function pickImage(from: "library" | "camera"): Promise<Draft | null> {
  if (from === "camera" && Platform.OS !== "web") {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new CaptureError("Allow camera access in Settings to photograph your clothes.");
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.7,
    allowsEditing: true,
    aspect: [4, 5],
    base64: Platform.OS === "web",
  };
  const res =
    from === "camera" ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const asset = res.canceled ? undefined : res.assets[0];
  if (!asset) return null;
  const screenshot =
    from === "library" && (/screenshot/i.test(asset.fileName ?? "") || asset.mimeType === "image/png");
  return { image: await keep(asset), source: screenshot ? "screenshot" : "photo" };
}

/**
 * What a product link says the piece is. Works for shops whose pages carry product data, which most do; some
 * block apps entirely, and then a screenshot is the way in.
 */
export async function readLink(raw: string): Promise<Draft & ProductPage> {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new CaptureError("That doesn’t look like a link. Copy it from the shop’s Share button.");
  }
  if (Platform.OS === "web") throw new CaptureError("Links work in the phone app. Here, add a screenshot instead.");
  let html: string;
  try {
    const res = await fetch(url.toString(), { headers: { Accept: "text/html" } });
    if (!res.ok) throw new CaptureError(`The shop answered ${res.status}. A screenshot of the product works too.`);
    html = await res.text();
  } catch (e) {
    if (e instanceof CaptureError) throw e;
    throw new CaptureError("Couldn’t reach that shop. Check your connection, or add a screenshot.");
  }
  const page = readProductPage(html, url.toString());
  if (!page) throw new CaptureError("That page didn’t say what the product is. A screenshot works for any shop.");
  return { ...page, link: url.toString(), source: "link" };
}
