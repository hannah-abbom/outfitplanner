import { colorIn, COLORS } from "./closet";
import { addDays, daysBetween } from "./dates";
import type { IsoDate } from "./model";
import type {
  BriefVersion,
  KeyPiece,
  MomentumState,
  Trend,
  TrendAttributes,
  TrendMention,
  TrendRecord,
  TrendSource,
} from "./trend-model";

/*
 * Turning a week's mentions into trends (OUT-05): put every word into one vocabulary, merge mentions that mean the
 * same thing, count who mentioned what each week, and read momentum off the counts. All of it is plain, checkable
 * code; the model only reads pages and proposes mentions. See docs/engineering/trends.md for why merging is rules
 * first and embeddings later.
 */

/** Shades the fashion press names, mapped to a colour family from the closet's palette. */
const SHADES: Readonly<Record<string, string>> = {
  butter: "yellow",
  canary: "yellow",
  lemon: "yellow",
  mustard: "yellow",
  cobalt: "blue",
  azure: "blue",
  "ocean blue": "blue",
  "royal blue": "blue",
  turquoise: "light blue",
  aqua: "light blue",
  "baby blue": "light blue",
  "powder blue": "light blue",
  midnight: "navy",
  indigo: "navy",
  teal: "green",
  emerald: "green",
  forest: "green",
  pistachio: "sage",
  mint: "sage",
  scarlet: "red",
  cherry: "red",
  tomato: "red",
  crimson: "red",
  fuchsia: "pink",
  bubblegum: "pink",
  magenta: "pink",
  rose: "blush",
  lavender: "lilac",
  violet: "purple",
  plum: "purple",
  chocolate: "brown",
  mocha: "brown",
  espresso: "brown",
  oatmeal: "beige",
  clay: "terracotta",
  tangerine: "orange",
  apricot: "coral",
  peach: "coral",
};
const SHADE_NAMES = Object.keys(SHADES).sort((a, b) => b.length - a.length);

/** The colour family a shade belongs to: "butter yellow" and "pale yellow" are both "yellow". */
export function colorFamily(shade: string): string {
  const s = ` ${shade.toLowerCase().replace(/[^a-z\s-]/g, " ")} `;
  const named = SHADE_NAMES.find((n) => s.includes(` ${n} `) || s.includes(` ${n}-`));
  if (named) return SHADES[named] ?? named;
  return colorIn(s) ?? s.trim().replace(/\s+/g, " ");
}

/** Different words for the same thing, so "ruffles", "ruffled" and "frills" compare equal. */
const SAME: Readonly<Record<string, string>> = {
  crocheted: "crochet",
  gauzy: "gauze",
  terrycloth: "terry",
  towelling: "terry",
  "terry cloth": "terry",
  transparent: "sheer",
  "see through": "sheer",
  diaphanous: "sheer",
  metallics: "metallic",
  foil: "metallic",
  chrome: "metallic",
  "high shine": "metallic",
  dots: "polka dot",
  dotted: "polka dot",
  spots: "polka dot",
  "polka dots": "polka dot",
  polkadot: "polka dot",
  polkadots: "polka dot",
  striped: "stripe",
  stripes: "stripe",
  checked: "check",
  checks: "check",
  gingham: "check",
  florals: "floral",
  flowers: "floral",
  "animal print": "animal",
  zebra: "animal",
  leopard: "animal",
  ruffled: "ruffle",
  ruffles: "ruffle",
  frills: "ruffle",
  frilled: "ruffle",
  fringed: "fringe",
  fringing: "fringe",
  tassels: "fringe",
  tassel: "fringe",
  "co ord": "set",
  coord: "set",
  "matching set": "set",
  "two piece": "set",
  sets: "set",
  caftan: "kaftan",
  caftans: "kaftan",
  kaftans: "kaftan",
  capris: "capri",
  bermudas: "bermuda",
  cargos: "cargo",
  billowing: "airy",
  floaty: "airy",
  voluminous: "airy",
  belted: "belt",
  utilitarian: "utility",
  dresses: "dress",
};

const plain = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** One term in the shared vocabulary: lower case, known synonyms folded, simple plurals dropped. */
export function normalizeTerm(term: string): string {
  const t = plain(term);
  const same = SAME[t];
  if (same) return same;
  const words = t.split(" ").map((w) => SAME[w] ?? w);
  const last = words[words.length - 1] ?? "";
  if (last.length > 2 && last.endsWith("s") && !/(ss|us|is)$/.test(last))
    words[words.length - 1] = last.slice(0, -1);
  const joined = words.join(" ");
  return SAME[joined] ?? joined;
}

const unique = <T>(list: T[]) => [...new Set(list)];
const cleanList = (list: string[], fn: (s: string) => string) => unique(list.map(fn).filter(Boolean)).sort();

export function normalizeAttributes(a: TrendAttributes): TrendAttributes {
  return {
    colors: cleanList(a.colors, colorFamily),
    silhouettes: cleanList(a.silhouettes, normalizeTerm),
    fabrics: cleanList(a.fabrics, normalizeTerm),
    patterns: cleanList(a.patterns, normalizeTerm),
    categories: unique(a.categories).sort(),
    occasions: unique(a.occasions).sort(),
    climates: unique(a.climates).sort(),
    seasons: cleanList(a.seasons, plain),
    regions: cleanList(a.regions, plain),
  };
}

const normalizeKeyPiece = (k: KeyPiece): KeyPiece => ({
  name: k.name.trim(),
  categories: unique(k.categories).sort(),
  words: cleanList(k.words, normalizeTerm),
  colors: cleanList(k.colors, colorFamily),
});

const FILLER = new Set(["a", "an", "and", "as", "for", "in", "of", "on", "or", "the", "to", "with", "trend"]);
const MODIFIERS = new Set([
  "pale",
  "soft",
  "light",
  "bright",
  "bold",
  "deep",
  "dark",
  "vivid",
  "rich",
  "true",
]);

/** The words of a name that carry meaning, in the shared vocabulary, with shades folded into their family. */
export function nameTerms(name: string): string[] {
  const words = plain(name)
    .split(" ")
    .filter((w) => w && !FILLER.has(w));
  const out: string[] = [];
  for (const w of words) {
    if (MODIFIERS.has(w)) continue;
    const family = SHADES[w] ?? (w in COLORS ? w : null);
    out.push(family ?? normalizeTerm(w));
  }
  return unique(out);
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 0;
  const set = new Set(a);
  const both = b.filter((x) => set.has(x)).length;
  return both / (set.size + new Set(b).size - both);
}

/** A trend's identity for comparing: its name and what it looks like. Where and when it's worn don't count. */
export interface Comparable {
  name: string;
  attributes: TrendAttributes;
}

const LOOK_FACETS = ["colors", "silhouettes", "fabrics", "patterns"] as const;

/**
 * How alike two trends are, from 0 to 1. The larger of two readings: how much their names share, and a blend of
 * names with how much their look shares (colours, shapes, fabrics and patterns, each counted when either side
 * names any). Expects attributes already normalised.
 */
export function trendSimilarity(a: Comparable, b: Comparable): number {
  const names = jaccard(nameTerms(a.name), nameTerms(b.name));
  let total = 0;
  let facets = 0;
  for (const f of LOOK_FACETS) {
    if (!a.attributes[f].length && !b.attributes[f].length) continue;
    total += jaccard(a.attributes[f], b.attributes[f]);
    facets += 1;
  }
  if (!facets) return names;
  return Math.max(names, 0.4 * names + 0.6 * (total / facets));
}

/** At or above this, two trends are one. */
export const MERGE_AT = 0.6;
/** When the reader says "this is trend X", believe it from here up. Below it, the hint is ignored. */
export const HINT_AT = 0.3;

/** The Monday of the week a date falls in. */
export function weekOf(date: IsoDate): IsoDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

function slug(name: string, taken: Set<string>): string {
  const base = plain(name).split(" ").slice(0, 6).join("-") || "trend";
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

const union = (a: string[], b: string[]) => unique([...a, ...b]).sort();

function mergeAttributes(a: TrendAttributes, b: TrendAttributes): TrendAttributes {
  return {
    colors: union(a.colors, b.colors),
    silhouettes: union(a.silhouettes, b.silhouettes),
    fabrics: union(a.fabrics, b.fabrics),
    patterns: union(a.patterns, b.patterns),
    categories: unique([...a.categories, ...b.categories]).sort(),
    occasions: unique([...a.occasions, ...b.occasions]).sort(),
    climates: unique([...a.climates, ...b.climates]).sort(),
    seasons: union(a.seasons, b.seasons),
    regions: union(a.regions, b.regions),
  };
}

function withMention(record: TrendRecord, m: TrendMention, source: TrendSource): TrendRecord {
  const week = weekOf(source.seenOn);
  const weeks = record.weeks.some((w) => w.week === week)
    ? record.weeks.map((w) =>
        w.week === week ? { week, publishers: union(w.publishers, [source.publisher]) } : w,
      )
    : [...record.weeks, { week, publishers: [source.publisher] }].sort((a, b) =>
        a.week.localeCompare(b.week),
      );
  const known = [record.name, ...record.aliases].map(plain);
  const pieces = [...record.keyPieces];
  for (const k of m.keyPieces)
    if (pieces.length < 5 && !pieces.some((p) => plain(p.name) === plain(k.name))) pieces.push(k);
  return {
    ...record,
    aliases: known.includes(plain(m.name)) ? record.aliases : [...record.aliases, m.name],
    attributes: mergeAttributes(record.attributes, m.attributes),
    keyPieces: pieces,
    firstSeen: source.seenOn < record.firstSeen ? source.seenOn : record.firstSeen,
    lastSeen: source.seenOn > record.lastSeen ? source.seenOn : record.lastSeen,
    sources: record.sources.some((s) => s.url === source.url) ? record.sources : [...record.sources, source],
    weeks,
  };
}

export interface MergeStep {
  mention: string;
  url: string;
  action: "merged" | "new";
  into: string;
  /** How alike the mention and the trend it joined were; 0 for a new trend. */
  score: number;
}

export interface MergeOptions {
  /** Swap in another measure, such as embedding similarity, without changing anything else. */
  similarity?: (a: Comparable, b: Comparable) => number;
  mergeAt?: number;
  hintAt?: number;
}

/**
 * Folds mentions into the trends we track. A mention joins the trend it's most like when they're alike enough, or
 * the trend the reader named when that's at least plausible; otherwise it starts a new trend. The same page counts
 * once per trend, and a publisher once per week. Returns new records and a step-by-step log for the reviewer.
 */
export function mergeMentions(
  records: TrendRecord[],
  mentions: TrendMention[],
  options: MergeOptions = {},
): { records: TrendRecord[]; log: MergeStep[] } {
  const similarity = options.similarity ?? trendSimilarity;
  const mergeAt = options.mergeAt ?? MERGE_AT;
  const hintAt = options.hintAt ?? HINT_AT;
  const out = [...records];
  const log: MergeStep[] = [];
  for (const raw of mentions) {
    const m: TrendMention = {
      ...raw,
      name: raw.name.trim(),
      attributes: normalizeAttributes(raw.attributes),
      keyPieces: raw.keyPieces.map(normalizeKeyPiece),
    };
    let best = -1;
    let bestScore = 0;
    out.forEach((r, i) => {
      const score = Math.max(
        similarity(m, r),
        ...r.aliases.map((alias) => similarity(m, { name: alias, attributes: r.attributes })),
      );
      if (score > bestScore) [best, bestScore] = [i, score];
    });
    const hinted = m.sameAs ? out.findIndex((r) => r.id === m.sameAs) : -1;
    const hintScore = hinted >= 0 ? similarity(m, out[hinted] as TrendRecord) : 0;
    let target = bestScore >= mergeAt ? best : -1;
    let score = bestScore;
    if (target < 0 && hinted >= 0 && hintScore >= hintAt) [target, score] = [hinted, hintScore];
    const existing = target >= 0 ? out[target] : undefined;
    if (existing) {
      out[target] = withMention(existing, m, m.source);
      log.push({ mention: m.name, url: m.source.url, action: "merged", into: existing.id, score });
      continue;
    }
    const id = slug(m.name, new Set(out.map((r) => r.id)));
    out.push({
      id,
      name: m.name,
      description: m.description,
      wear: m.wear,
      attributes: m.attributes,
      keyPieces: m.keyPieces,
      aliases: [],
      firstSeen: m.source.seenOn,
      lastSeen: m.source.seenOn,
      sources: [m.source],
      weeks: [{ week: weekOf(m.source.seenOn), publishers: [m.source.publisher] }],
    });
    log.push({ mention: m.name, url: m.source.url, action: "new", into: id, score: 0 });
  }
  return { records: out, log };
}

export interface Momentum {
  state: MomentumState;
  /** Publisher-weeks in the last `window` weeks, and in the `window` before that. */
  recent: number;
  prior: number;
  /** For ranking: recent attention, nudged by which way it's heading. Never below 0. */
  score: number;
}

/** How many weeks each half of the comparison covers. */
export const MOMENTUM_WINDOW = 4;

/**
 * Where a trend is heading as of a week, from how many publishers mentioned it each week. It compares the last
 * four weeks with the four before:
 *   new      first seen less than four weeks ago, so there's nothing to compare yet
 *   rising   at least half as much again as before, and by at least two mentions
 *   fading   half as much as before or less
 *   peaking  about level, and at or near the most attention it has ever had
 *   steady   about level, below its high
 */
export function momentum(record: TrendRecord, asOf: IsoDate, window = MOMENTUM_WINDOW): Momentum {
  const now = weekOf(asOf);
  const sumBack = (from: number, to: number) =>
    record.weeks
      .filter((w) => {
        const age = daysBetween(w.week, now) / 7;
        return age >= from && age < to;
      })
      .reduce((n, w) => n + w.publishers.length, 0);
  const recent = sumBack(0, window);
  const prior = sumBack(window, window * 2);
  const score = Math.max(0, recent + 0.5 * (recent - prior));
  const age = daysBetween(weekOf(record.firstSeen), now) / 7;
  let state: MomentumState;
  if (age < window) state = "new";
  else if (recent >= prior * 1.5 && recent - prior >= 2) state = "rising";
  else if (recent <= prior * 0.5) state = "fading";
  else {
    let high = 0;
    for (let back = 0; back <= age; back++) high = Math.max(high, sumBack(back, back + window));
    state = recent >= high * 0.8 ? "peaking" : "steady";
  }
  return { state, recent, prior, score };
}

export interface DraftOptions {
  version: number;
  /** The day the draft is made. */
  today: IsoDate;
  season: string;
  caveat: string;
  /** At most this many trends. */
  max?: number;
  /** A trend needs this many different publishers behind it, ever, to be offered. */
  minPublishers?: number;
}

const ORDER: Record<MomentumState, number> = { rising: 0, peaking: 1, new: 2, steady: 3, fading: 4 };

/**
 * A draft brief from the records: trends more than one publisher has mentioned and that aren't fading, most
 * momentum first. It stays a draft until `reviewBrief` marks it approved.
 */
export function draftBrief(records: TrendRecord[], options: DraftOptions): BriefVersion {
  const { max = 10, minPublishers = 2 } = options;
  const trends: Trend[] = records
    .map((r) => ({ r, m: momentum(r, options.today) }))
    .filter(({ r, m }) => {
      const publishers = new Set(r.sources.map((s) => s.publisher));
      return publishers.size >= minPublishers && m.state !== "fading" && m.recent > 0;
    })
    .sort(
      (a, b) => ORDER[a.m.state] - ORDER[b.m.state] || b.m.score - a.m.score || a.r.id.localeCompare(b.r.id),
    )
    .slice(0, max)
    .map(({ r, m }) => ({
      id: r.id,
      name: r.name,
      wear: r.wear,
      sources: [...r.sources]
        .sort((a, b) => b.seenOn.localeCompare(a.seenOn))
        .slice(0, 3)
        .map((s) => ({ title: `${s.publisher}: ${s.title}`, url: s.url })),
      attributes: r.attributes,
      keyPieces: r.keyPieces,
      momentum: m.state,
    }));
  return {
    version: options.version,
    status: "draft",
    createdOn: options.today,
    reviewedBy: null,
    reviewedOn: null,
    reviewNote: null,
    brief: { season: options.season, checkedOn: options.today, caveat: options.caveat, trends },
  };
}

/** A person's decision on a draft. Only drafts can be decided, and it takes a name. */
export function reviewBrief(
  draft: BriefVersion,
  decision: "approved" | "rejected",
  by: string,
  on: IsoDate,
  note: string | null = null,
): BriefVersion {
  if (draft.status !== "draft") throw new Error(`Brief v${draft.version} was already ${draft.status}.`);
  if (!by.trim()) throw new Error("A review needs the reviewer's name.");
  return { ...draft, status: decision, reviewedBy: by.trim(), reviewedOn: on, reviewNote: note };
}

/** The brief the stylist should read: the newest approved version, or null when none has been approved. */
export function latestApproved(versions: BriefVersion[]): BriefVersion | null {
  return versions.filter((v) => v.status === "approved").sort((a, b) => b.version - a.version)[0] ?? null;
}
