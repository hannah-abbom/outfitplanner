import { z } from "zod";
import { Category } from "./closet";
import { IsoDate } from "./model";

/*
 * The trends data model (OUT-05). Three shapes, from raw to finished:
 *
 *   mention  one source saying one thing this week, as read by the weekly job
 *   record   one trend, built by merging the mentions that mean the same thing, with a count per week
 *   brief    the short list the stylist reads, drafted from the records and approved by a person
 *
 * Text here is always our own description of a trend, never copied from the page it was found on. See
 * docs/engineering/trends.md.
 */

/** How hot the days are. A trend names the climates it suits; none named means any. */
export const CLIMATES = ["hot", "warm", "mild", "cold"] as const;
export const Climate = z.enum(CLIMATES);
export type Climate = z.infer<typeof Climate>;

/** What the day is for. Kept short and close to the plans a day can have. */
export const OCCASIONS = [
  "everyday",
  "beach",
  "dinner",
  "safari",
  "city",
  "active",
  "travel",
  "party",
] as const;
export const Occasion = z.enum(OCCASIONS);
export type Occasion = z.infer<typeof Occasion>;

export const SOURCE_KINDS = ["editorial", "runway", "retailer", "search-data", "provider"] as const;
export const SourceKind = z.enum(SOURCE_KINDS);
export type SourceKind = z.infer<typeof SourceKind>;

/** Where a trend was seen. `publisher` is what momentum counts, so one outlet can't vote twice in a week. */
export const TrendSource = z.object({
  url: z.url({ protocol: /^https$/ }),
  title: z.string().min(1).max(200),
  publisher: z.string().min(1).max(80),
  kind: SourceKind,
  /** When the page says it was published, if it says. */
  publishedOn: IsoDate.nullable(),
  /** The day we read it. */
  seenOn: IsoDate,
});
export type TrendSource = z.infer<typeof TrendSource>;

const terms = z.array(z.string().min(1).max(40)).max(12);

/** What a trend looks like, in a fixed vocabulary where there is one, so trends can be compared and matched. */
export const TrendAttributes = z.object({
  /** Colour families from the closet's palette ("yellow", not "butter yellow"). */
  colors: terms,
  silhouettes: terms,
  fabrics: terms,
  patterns: terms,
  categories: z.array(Category).max(9),
  occasions: z.array(Occasion).max(8),
  climates: z.array(Climate).max(4),
  /** Fashion seasons it belongs to, such as "ss27" or "resort 2027". */
  seasons: terms,
  /** Where it's been seen: "global" or a lower-case country or region name. */
  regions: terms,
});
export type TrendAttributes = z.infer<typeof TrendAttributes>;

export const NO_ATTRIBUTES: TrendAttributes = {
  colors: [],
  silhouettes: [],
  fabrics: [],
  patterns: [],
  categories: [],
  occasions: [],
  climates: [],
  seasons: [],
  regions: [],
};

/**
 * A piece that makes the trend recognisable, such as the field jacket in a safari look. A closet piece counts as
 * this one when it's one of these kinds of thing, its name has one of `words` (when there are any) and its colour
 * is one of `colors` (when there are any).
 */
export const KeyPiece = z.object({
  name: z.string().min(1).max(60),
  categories: z.array(Category).min(1).max(3),
  words: terms,
  colors: terms,
});
export type KeyPiece = z.infer<typeof KeyPiece>;

const described = {
  name: z.string().min(1).max(80),
  /** What it is, in a sentence of our own. */
  description: z.string().min(1).max(400),
  /** How to wear it, in a sentence the stylist can act on. */
  wear: z.string().min(1).max(300),
  attributes: TrendAttributes,
  keyPieces: z.array(KeyPiece).max(5),
};

export const TrendMention = z.object({
  ...described,
  source: TrendSource,
  /** The id of a trend we already track that the reader thinks this is. Checked in code before it's believed. */
  sameAs: z.string().nullable(),
});
export type TrendMention = z.infer<typeof TrendMention>;

export const WeekCount = z.object({
  /** The Monday the week starts on. */
  week: IsoDate,
  /** Who mentioned it that week, each once. */
  publishers: z.array(z.string()),
});
export type WeekCount = z.infer<typeof WeekCount>;

export const TrendRecord = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  ...described,
  /** Other names the same trend has gone by. */
  aliases: z.array(z.string()),
  firstSeen: IsoDate,
  lastSeen: IsoDate,
  sources: z.array(TrendSource),
  weeks: z.array(WeekCount),
});
export type TrendRecord = z.infer<typeof TrendRecord>;

export const MOMENTUM_STATES = ["new", "rising", "peaking", "steady", "fading"] as const;
export const MomentumState = z.enum(MOMENTUM_STATES);
export type MomentumState = z.infer<typeof MomentumState>;

/** One line of the brief: what the stylist reads, plus what closet matching needs. */
export const Trend = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** What it looks like, in a sentence the stylist can act on. */
  wear: z.string().min(1),
  sources: z.array(z.object({ title: z.string(), url: z.string() })),
  attributes: TrendAttributes.optional(),
  keyPieces: z.array(KeyPiece).optional(),
  momentum: MomentumState.optional(),
});
export type Trend = z.infer<typeof Trend>;

export const TrendBrief = z.object({
  season: z.string(),
  checkedOn: IsoDate,
  caveat: z.string(),
  trends: z.array(Trend),
});
export type TrendBrief = z.infer<typeof TrendBrief>;

/** A brief with its history: nothing reaches the stylist until a person has approved that version. */
export const BriefVersion = z.object({
  version: z.number().int().positive(),
  status: z.enum(["draft", "approved", "rejected"]),
  createdOn: IsoDate,
  /** Who looked it over, and when. Null while it's a draft. */
  reviewedBy: z.string().nullable(),
  reviewedOn: IsoDate.nullable(),
  /** Anything the reviewer changed or wants remembered. */
  reviewNote: z.string().nullable(),
  brief: TrendBrief,
});
export type BriefVersion = z.infer<typeof BriefVersion>;

/*
 * What to log from day one so suggestions can later be personalised (see "Personalisation" in the doc). One event
 * per thing a person does with a suggested look. It names pieces and trends by id and carries no free text, no
 * photos and nothing about where the person is beyond the climate of the day.
 */
export const LOOK_ACTIONS = ["shown", "kept", "edited", "skipped", "worn", "not-worn"] as const;
export const LookEvent = z.object({
  /** The instant it happened, in UTC. */
  at: z.iso.datetime(),
  /** A random id for the person, not their account or email. */
  person: z.string().min(1),
  /** A random id for the trip. */
  trip: z.string().min(1),
  date: IsoDate,
  slot: z.enum(["day", "evening"]),
  action: z.enum(LOOK_ACTIONS),
  /** The pieces in the look as suggested. */
  pieces: z.array(z.string()),
  /** The pieces after the person's changes, for "edited" and "worn". */
  finalPieces: z.array(z.string()).nullable(),
  /** The trends the suggestion leaned on. */
  trends: z.array(z.string()),
  briefVersion: z.number().int().nullable(),
  /** What the day was like, so a skip in the rain isn't read as a dislike. */
  climate: Climate.nullable(),
  occasions: z.array(Occasion),
  /** Which prompt and model made the suggestion, so versions can be compared. */
  promptVersion: z.string(),
  model: z.string(),
});
export type LookEvent = z.infer<typeof LookEvent>;
