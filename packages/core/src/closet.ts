import { z } from "zod";
import type { IsoDate } from "./model";
import { weatherKind, type DayWeather } from "./weather";

/*
 * The closet and the looks for each day (WRD, OUT). The closet belongs to the person and carries over between
 * trips; looks belong to a trip and a day. Pieces go in from a photo, a screenshot of something bought, or a link
 * to the product page. The planner then puts pieces on each day's looks, with the weather and the plans in view,
 * and the suitcase is whatever the looks use.
 */

export const CATEGORIES = ["top", "bottom", "dress", "layer", "shoes", "swim", "bag", "accessory"] as const;
export const Category = z.enum(CATEGORIES);
export type Category = z.infer<typeof Category>;

export const CATEGORY_LABEL: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  dress: "Dresses",
  layer: "Layers",
  shoes: "Shoes",
  swim: "Swim",
  bag: "Bags",
  accessory: "Accessories",
};

export const Warmth = z.enum(["light", "mid", "warm"]);
export type Warmth = z.infer<typeof Warmth>;

export const STYLE_TAGS = ["casual", "dressy", "active", "beach", "rain"] as const;
export const StyleTag = z.enum(STYLE_TAGS);
export type StyleTag = z.infer<typeof StyleTag>;

export const ClosetItem = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: Category,
  /** One main colour, from COLORS. */
  color: z.string().nullable(),
  warmth: Warmth,
  tags: z.array(StyleTag),
  /** A photo or screenshot saved on the phone, or the product image from a link. */
  image: z.string().nullable(),
  source: z.enum(["photo", "screenshot", "link", "manual"]),
  link: z.string().nullable(),
  brand: z.string().nullable(),
  /** "to-get" is something the plan needs that you don't own yet. */
  status: z.enum(["owned", "to-get"]),
  addedAt: z.string(),
});
export type ClosetItem = z.infer<typeof ClosetItem>;

/** Colour names a piece can have, with a swatch for drawing it when there's no photo. */
export const COLORS: Readonly<Record<string, string>> = {
  white: "#f7f6f2",
  ivory: "#efe8dc",
  cream: "#f1e7d0",
  beige: "#e3d5bd",
  sand: "#d9c7ad",
  camel: "#c19a6b",
  khaki: "#b9ad86",
  olive: "#6d7458",
  sage: "#9aa58c",
  green: "#3f6b4e",
  "light blue": "#a9c4de",
  blue: "#3a6ea5",
  denim: "#5b7fa6",
  navy: "#1f2a44",
  black: "#1c1c1c",
  charcoal: "#3b3b3b",
  grey: "#9a9a9a",
  brown: "#6b4a34",
  burgundy: "#6e1a32",
  red: "#b3261e",
  terracotta: "#b5603f",
  orange: "#d9772b",
  coral: "#e9846c",
  pink: "#e7b8c0",
  blush: "#e7c8c0",
  yellow: "#e6c34f",
  gold: "#c9a24a",
  silver: "#c0c0c0",
  lilac: "#c3b1d9",
  purple: "#6b4f8a",
};

const COLOR_ALIASES: Readonly<Record<string, string>> = {
  gray: "grey",
  "off-white": "ivory",
  "off white": "ivory",
  ecru: "ivory",
  nude: "beige",
  taupe: "beige",
  stone: "sand",
  tan: "camel",
  wine: "burgundy",
  maroon: "burgundy",
  rust: "terracotta",
  "sky blue": "light blue",
};

/** Colours that stand out on a game drive. */
const BRIGHT = new Set(["white", "red", "orange", "coral", "yellow", "pink", "blue", "light blue", "lilac", "purple"]);

const CATEGORY_WORDS: [Category, RegExp][] = [
  ["swim", /\b(swim\w*|bikini|one-piece|bathing suit|trunks|rash ?guard)\b/],
  ["dress", /\b(dress|gown|jumpsuit|romper|kaftan|caftan|playsuit)\b/],
  [
    "shoes",
    /\b(shoes?|sandals?|sneakers?|trainers?|boots?|heels?|loafers?|espadrilles?|flats|mules?|slides?|flip-?flops?|pumps?)\b/,
  ],
  ["bag", /\b(bag|tote|clutch|backpack|purse|crossbody|pouch)\b/],
  [
    "layer",
    /\b(jacket|coat|blazer|cardigan|sweater|jumper|knit|hoodie|sweatshirt|fleece|vest|gilet|shell|parka|trench|windbreaker|shacket|poncho|pullover)\b/,
  ],
  ["bottom", /\b(pants|trousers|jeans|shorts|skirt|leggings|chinos|culottes|joggers)\b/],
  ["top", /\b(top|tee|t-shirt|shirt|blouse|cami|camisole|tank|bodysuit|polo|tunic|bralette|henley)\b/],
  ["accessory", /\b(hat|cap|sunglasses|scarf|belt|earrings?|necklace|bracelet|ring|watch|sarong|headband)\b/],
];

const WARM = /\b(wool|cashmere|knit|sweater|jumper|fleece|coat|parka|puffer|hoodie|sweatshirt|thermal)\b/;
const LIGHT =
  /\b(linen|silk|cami|tank|shorts|sundress|tee|t-shirt|sandals?|espadrilles?|chiffon|crochet|mesh|slides?|flip-?flops?)\b/;
const TAG_WORDS: [StyleTag, RegExp][] = [
  ["dressy", /\b(silk|satin|heels?|blazer|gown|midi|maxi|clutch|pumps?|earrings?|necklace|sequin\w*)\b/],
  ["active", /\b(sneakers?|trainers?|leggings|sports?|running|hiking|athletic|fleece|joggers|walking)\b/],
  ["beach", /\b(sarong|kaftan|caftan|cover-?up|flip-?flops?|slides?|espadrilles?|sun ?hat|straw|crochet)\b/],
  ["rain", /\b(rain ?(coat|jacket|shell|wear|proof)?|waterproof|shell|trench|windbreaker|parka)\b/],
];

export interface Guess {
  category: Category;
  warmth: Warmth;
  color: string | null;
  tags: StyleTag[];
}

/** A first guess at what a piece is from its name, so adding one is a confirmation, not a form. */
export function guessFromName(name: string): Guess {
  const n = ` ${name.toLowerCase()} `;
  const category = CATEGORY_WORDS.find(([, re]) => re.test(n))?.[0] ?? "top";
  const warmth: Warmth = WARM.test(n) ? "warm" : LIGHT.test(n) || category === "swim" ? "light" : "mid";
  const tags = TAG_WORDS.filter(([, re]) => re.test(n)).map(([t]) => t);
  if (category === "swim" && !tags.includes("beach")) tags.push("beach");
  if (!tags.includes("dressy")) tags.unshift("casual");
  return { category, warmth, color: colorIn(n), tags };
}

/** The first colour word in a text, longest names first so "light blue" beats "blue". */
export function colorIn(text: string): string | null {
  const t = text.toLowerCase();
  const names = [...Object.keys(COLOR_ALIASES), ...Object.keys(COLORS)].sort((a, b) => b.length - a.length);
  let best: { at: number; name: string } | null = null;
  for (const name of names) {
    const m = new RegExp(`\\b${name.replace(/[-\s]/g, "[-\\s]")}\\b`).exec(t);
    if (m && (best === null || m.index < best.at)) best = { at: m.index, name };
  }
  if (!best) return null;
  return COLOR_ALIASES[best.name] ?? best.name;
}

export interface ProductPage {
  name: string;
  image: string | null;
  brand: string | null;
  color: string | null;
}

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", "#39": "'", lt: "<", gt: ">", nbsp: " " };
const decode = (s: string) =>
  s
    .replace(/&(amp|quot|apos|#39|lt|gt|nbsp);/g, (_, e: string) => ENTITIES[e] ?? "")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .trim();

function meta(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`,
    "i",
  );
  const m = re.exec(html);
  const v = m?.[1] ?? m?.[2];
  return v ? decode(v) : null;
}

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

function findProduct(node: Json): { [k: string]: Json } | null {
  if (Array.isArray(node)) {
    for (const n of node) {
      const p = findProduct(n);
      if (p) return p;
    }
    return null;
  }
  if (node && typeof node === "object") {
    const type = node["@type"];
    if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) return node;
    if (node["@graph"]) return findProduct(node["@graph"]);
  }
  return null;
}

const text = (v: Json | undefined): string | null => {
  if (typeof v === "string") return decode(v) || null;
  if (Array.isArray(v)) return text(v[0]);
  if (v && typeof v === "object") return text(v.name ?? v.url ?? undefined);
  return null;
};

/**
 * What a product page says about the piece: its schema.org Product data if it has any, else its Open Graph tags.
 * Returns null when the page names nothing, as bot checks and app-only pages do.
 */
export function readProductPage(html: string, pageUrl: string): ProductPage | null {
  let product: { [k: string]: Json } | null = null;
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      product = findProduct(JSON.parse(m[1] ?? "") as Json);
    } catch {
      continue;
    }
    if (product) break;
  }
  const site = meta(html, "og:site_name");
  let name = text(product?.name) ?? meta(html, "og:title");
  if (name && site) name = name.replace(new RegExp(`\\s*[|–-]\\s*${site.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*$`, "i"), "");
  name = name?.split(" | ")[0]?.trim() || null;
  if (!name) return null;
  const rawImage = text(product?.image) ?? meta(html, "og:image");
  let image: string | null = null;
  if (rawImage) {
    try {
      image = new URL(rawImage, pageUrl).toString();
    } catch {
      image = null;
    }
  }
  const brand = text(product?.brand) ?? meta(html, "product:brand") ?? site;
  const color = colorIn(text(product?.color) ?? meta(html, "product:color") ?? name);
  return { name, image, brand, color };
}

export const LOOK_SLOTS = ["day", "evening"] as const;
export type LookSlot = (typeof LOOK_SLOTS)[number];
/** The pieces in each look of a day, by closet item id. */
export type DayLooks = Partial<Record<LookSlot, string[]>>;
export type Looks = Record<IsoDate, DayLooks>;

const MAX_PIECES = 8;

export function addToLook(looks: Looks, date: IsoDate, slot: LookSlot, itemId: string): Looks {
  const current = looks[date]?.[slot] ?? [];
  if (current.includes(itemId) || current.length >= MAX_PIECES) return looks;
  return { ...looks, [date]: { ...looks[date], [slot]: [...current, itemId] } };
}

export function removeFromLook(looks: Looks, date: IsoDate, slot: LookSlot, itemId: string): Looks {
  const current = looks[date]?.[slot];
  if (!current?.includes(itemId)) return looks;
  return { ...looks, [date]: { ...looks[date], [slot]: current.filter((id) => id !== itemId) } };
}

/** Takes a piece out of every look, for when it leaves the closet. */
export function forgetPiece(looks: Looks, itemId: string): Looks {
  const out: Looks = {};
  for (const [date, day] of Object.entries(looks)) {
    out[date] = Object.fromEntries(
      Object.entries(day).map(([slot, ids]) => [slot, (ids ?? []).filter((id) => id !== itemId)]),
    ) as DayLooks;
  }
  return out;
}

export function piecesOf(ids: string[] | undefined, closet: ClosetItem[]): ClosetItem[] {
  return (ids ?? []).flatMap((id) => closet.find((i) => i.id === id) ?? []);
}

export function isDressed(day: DayLooks | undefined): boolean {
  return LOOK_SLOTS.some((s) => (day?.[s]?.length ?? 0) > 0);
}

/** Plans to pick from for a day; "Travel day" is added on its own when there's a flight. */
export const PLAN_CHOICES = [
  "Travel day",
  "Game drive",
  "Beach",
  "Pool",
  "Wine tasting",
  "Dinner out",
  "City walk",
  "Hike",
  "Boat trip",
  "Spa",
] as const;

/** What a look is missing for the day's weather and plans, in plain words. Empty when it works. */
export function lookNotes(
  pieces: ClosetItem[],
  slot: LookSlot,
  weather: DayWeather | undefined,
  plans: string[],
  fmt: (celsius: number) => string = (c) => `${c}°`,
): string[] {
  if (pieces.length === 0) return [];
  const notes: string[] = [];
  const has = (c: Category) => pieces.some((p) => p.category === c);
  const p = new Set(plans.map((x) => x.toLowerCase()));
  if (weather) {
    const t = slot === "day" ? weather.hi : weather.lo;
    const warm = pieces.find((x) => x.warmth === "warm");
    if (warm && t >= (slot === "day" ? 27 : 22)) notes.push(`${warm.name} is warm for ${fmt(t)}`);
    if (!has("layer") && (slot === "evening" ? weather.lo <= 16 : weather.hi <= 18))
      notes.push(`Down to ${fmt(slot === "evening" ? weather.lo : weather.hi)}: add a layer`);
    const wet = weather.rainChance >= 40 || weatherKind(weather.code) === "storm";
    if (wet && slot === "day" && !pieces.some((x) => x.tags.includes("rain")))
      notes.push(`${weather.rainChance}% chance of rain: add a rain layer`);
  }
  if (slot === "day" && (p.has("beach") || p.has("pool") || p.has("boat trip")) && !has("swim"))
    notes.push("Beach plans: add swim");
  if (p.has("game drive")) {
    if (slot === "day" && !has("layer")) notes.push("Game drives start at dawn in an open vehicle: add a layer");
    const bright = pieces.find((x) => x.color && BRIGHT.has(x.color));
    if (bright) notes.push(`${bright.name} stands out on a game drive; neutrals blend in and hide the dust`);
  }
  if (slot === "day" && p.has("hike") && !pieces.some((x) => x.category === "shoes" && x.tags.includes("active")))
    notes.push("Hike: add walking shoes");
  if (slot === "evening" && p.has("dinner out") && !pieces.some((x) => x.tags.includes("dressy")))
    notes.push("Dinner out: add something dressy");
  return notes;
}

export interface SuitcaseLine {
  item: ClosetItem;
  /** How many looks it's in. */
  wears: number;
  dates: IsoDate[];
}

/** Every piece the looks use, once, with how often it's worn: the clothes half of the packing list (PCK-02). */
export function suitcase(looks: Looks, closet: ClosetItem[], dates?: IsoDate[]): SuitcaseLine[] {
  const lines = new Map<string, SuitcaseLine>();
  const inTrip = dates ? new Set(dates) : null;
  for (const date of Object.keys(looks).sort()) {
    if (inTrip && !inTrip.has(date)) continue;
    for (const slot of LOOK_SLOTS) {
      for (const item of piecesOf(looks[date]?.[slot], closet)) {
        const line = lines.get(item.id) ?? { item, wears: 0, dates: [] };
        line.wears += 1;
        if (!line.dates.includes(date)) line.dates.push(date);
        lines.set(item.id, line);
      }
    }
  }
  const order = (c: Category) => CATEGORIES.indexOf(c);
  return [...lines.values()].sort(
    (a, b) => order(a.item.category) - order(b.item.category) || a.item.name.localeCompare(b.item.name),
  );
}
