import type { ClosetItem } from "./closet";
import { colorFamily, normalizeTerm } from "./trend-merge";
import { NO_ATTRIBUTES, type Climate, type KeyPiece, type Occasion, type Trend } from "./trend-model";
import type { DayWeather } from "./weather";

/*
 * Trends against a closet (OUT-05, and later OUT-06): which of a person's pieces are on trend for this trip, and
 * the one piece that would complete a trend they nearly have. Rules only: a piece is on trend because of something
 * you can point at (its kind, its colour, a word in its name), and every match says why.
 */

/** How hot a day is, from its high in °C. */
export function climateOf(hi: number): Climate {
  return hi >= 27 ? "hot" : hi >= 20 ? "warm" : hi >= 12 ? "mild" : "cold";
}

const PLAN_OCCASIONS: [Occasion, RegExp][] = [
  ["beach", /beach|pool|swim|snorkel|boat|lagoon/i],
  ["safari", /game drive|safari|bush walk/i],
  ["dinner", /dinner|restaurant|tasting menu/i],
  ["city", /city|museum|market|wine|tasting|shopping|sightseeing/i],
  ["active", /hik|walk|run|climb|skydiv|cycle|kayak|gym/i],
  ["travel", /travel|flight|transfer|drive to/i],
  ["party", /party|wedding|celebrat/i],
];

export interface TripContext {
  climates: Climate[];
  occasions: Occasion[];
}

/** The climates and occasions a trip covers, from its days' weather and plans. */
export function tripContext(
  days: { weather: Pick<DayWeather, "hi"> | null; plans: string[]; travel?: boolean }[],
): TripContext {
  const climates = new Set<Climate>();
  const occasions = new Set<Occasion>(["everyday"]);
  for (const d of days) {
    if (d.weather) climates.add(climateOf(d.weather.hi));
    if (d.travel) occasions.add("travel");
    for (const plan of d.plans)
      for (const [occasion, re] of PLAN_OCCASIONS) if (re.test(plan)) occasions.add(occasion);
  }
  return { climates: [...climates], occasions: [...occasions] };
}

/** Whether a trend belongs on this trip. A trend that names no climate or no occasion suits any. */
export function suitsTrip(trend: Trend, trip: TripContext): boolean {
  const a = trend.attributes ?? NO_ATTRIBUTES;
  const climateOk =
    !a.climates.length || !trip.climates.length || a.climates.some((c) => trip.climates.includes(c));
  const occasionOk =
    !a.occasions.length || !trip.occasions.length || a.occasions.some((o) => trip.occasions.includes(o));
  return climateOk && occasionOk;
}

/** The words of a piece's name in the trend vocabulary, singly and in pairs ("polka dot"). */
function nameWords(item: ClosetItem): Set<string> {
  const words = item.name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const out = new Set<string>();
  words.forEach((w, i) => {
    out.add(normalizeTerm(w));
    const next = words[i + 1];
    if (next) out.add(normalizeTerm(`${w} ${next}`));
  });
  return out;
}

const itemColor = (item: ClosetItem) => (item.color ? colorFamily(item.color) : null);

/** Whether a closet piece is the key piece: a listed kind, a naming word if any are asked, a listed colour if any. */
export function isKeyPiece(item: ClosetItem, key: KeyPiece): boolean {
  if (!key.categories.includes(item.category)) return false;
  if (key.words.length) {
    const words = nameWords(item);
    if (!key.words.some((w) => words.has(normalizeTerm(w)))) return false;
  }
  if (key.colors.length) {
    const color = itemColor(item);
    if (!color || !key.colors.map(colorFamily).includes(color)) return false;
  }
  return true;
}

export interface TrendPiece {
  id: string;
  /** Why it counts, in words a person can read: "is the field jacket", "linen", "in yellow". */
  reasons: string[];
  /** On the list to get, not owned yet. */
  toGet: boolean;
}

/** Why a piece is on trend, or an empty list when it isn't. */
export function trendReasons(item: ClosetItem, trend: Trend): string[] {
  const a = trend.attributes ?? NO_ATTRIBUTES;
  const reasons: string[] = [];
  for (const key of trend.keyPieces ?? []) if (isKeyPiece(item, key)) reasons.push(`is the ${key.name}`);
  if (a.categories.length && !a.categories.includes(item.category)) return reasons;
  const words = nameWords(item);
  const named = [...a.fabrics, ...a.patterns, ...a.silhouettes].filter((t) => words.has(normalizeTerm(t)));
  const color = itemColor(item);
  const inColor = color !== null && a.colors.map(colorFamily).includes(color);
  const lookOnly = !a.fabrics.length && !a.patterns.length && !a.silhouettes.length;
  // A colour alone makes a piece on trend only when the trend is about colour; otherwise it backs up a word.
  if (reasons.length || named.length || (inColor && lookOnly)) {
    reasons.push(...named);
    if (inColor) reasons.push(`in ${color}`);
  }
  return [...new Set(reasons)];
}

export interface TrendMatch {
  trend: Trend;
  /** The person's pieces that are on this trend, strongest first. */
  pieces: TrendPiece[];
  /** Each key piece with the closet pieces that fill it. */
  keyPieces: { piece: KeyPiece; have: string[] }[];
  /** The key pieces nothing in the closet fills. */
  missing: KeyPiece[];
  /** Set when the person has part of the trend and exactly one key piece is missing: the piece to complete it. */
  completes: KeyPiece | null;
}

/**
 * Every trend that suits the trip, matched against the closet. Trends come back in the order given (the brief is
 * already ranked), leaving out trends nothing in the closet touches unless `includeEmpty` is set.
 */
export function matchCloset(
  trends: Trend[],
  closet: ClosetItem[],
  trip: TripContext = { climates: [], occasions: [] },
  options: { includeEmpty?: boolean } = {},
): TrendMatch[] {
  const matches: TrendMatch[] = [];
  for (const trend of trends) {
    if (!suitsTrip(trend, trip)) continue;
    const pieces: TrendPiece[] = closet
      .map((item) => ({ id: item.id, reasons: trendReasons(item, trend), toGet: item.status === "to-get" }))
      .filter((p) => p.reasons.length > 0)
      .sort((a, b) => Number(a.toGet) - Number(b.toGet) || b.reasons.length - a.reasons.length);
    const keyPieces = (trend.keyPieces ?? []).map((piece) => ({
      piece,
      have: closet.filter((item) => isKeyPiece(item, piece)).map((item) => item.id),
    }));
    const missing = keyPieces.filter((k) => !k.have.length).map((k) => k.piece);
    const completes = missing.length === 1 && pieces.length > 0 ? (missing[0] ?? null) : null;
    if (pieces.length || options.includeEmpty) matches.push({ trend, pieces, keyPieces, missing, completes });
  }
  return matches;
}

export interface MissingPiece {
  trend: Trend;
  piece: KeyPiece;
  /** The pieces the person already has that it would be worn with. */
  goesWith: string[];
  why: string;
}

/**
 * The one piece to suggest: among trends a single key piece short, the one the person already has the most of,
 * ties going to the trend ranked higher in the brief. Null when no trend is one piece away.
 */
export function pieceToComplete(matches: TrendMatch[]): MissingPiece | null {
  let best: { match: TrendMatch; piece: KeyPiece; owned: number } | null = null;
  for (const match of matches) {
    if (!match.completes) continue;
    const owned = match.pieces.filter((p) => !p.toGet).length;
    if (!owned) continue;
    if (!best || owned > best.owned) best = { match, piece: match.completes, owned };
  }
  if (!best) return null;
  const goesWith = best.match.pieces.filter((p) => !p.toGet).map((p) => p.id);
  const n = goesWith.length;
  return {
    trend: best.match.trend,
    piece: best.piece,
    goesWith,
    why: `You already have ${n} ${n === 1 ? "piece" : "pieces"} of "${best.match.trend.name}"; adding ${best.piece.name} would complete it.`,
  };
}
