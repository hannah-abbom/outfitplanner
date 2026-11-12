import { z } from "zod";
import { CATEGORY_LABEL, isDressed, LOOK_SLOTS, type ClosetItem, type Looks, type LookSlot } from "./closet";
import type { IsoDate } from "./model";
import type { TrendBrief } from "./trends";
import { weatherLabel, type DayWeather } from "./weather";

/*
 * The stylist (OUT-05): Claude suggests looks for each day from the pieces the person owns, the day's weather and
 * plans, where each piece was packed for, and this season's trends. The prompt carries everything, because the
 * model sees nothing else; the answer is checked here so a look can only use real pieces on real days.
 */

export interface StylistDay {
  date: IsoDate;
  /** "Wed 18 Nov" */
  label: string;
  /** Where you sleep, or how you're travelling. */
  place: string;
  weather: DayWeather | null;
  plans: string[];
  travel: boolean;
}

export interface StylistRequest {
  tripName: string;
  days: StylistDay[];
  closet: ClosetItem[];
  looks: Looks;
  trends: TrendBrief;
  /** "empty": only days without a look; "all": every day, replacing what's there. */
  mode: "empty" | "all";
  /** Anything the person typed for this request. */
  wish?: string;
}

export function daysToPlan(req: Pick<StylistRequest, "days" | "looks" | "mode">): StylistDay[] {
  return req.mode === "all" ? req.days : req.days.filter((d) => !isDressed(req.looks[d.date]));
}

/** One line of plain text: no line breaks or column bars to confuse the tables in the prompt. */
const clean = (s: string) =>
  s
    .replace(/[\r\n|]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

function pieceLine(i: ClosetItem): string {
  return [
    i.id,
    clean(i.name),
    CATEGORY_LABEL[i.category],
    i.color ?? "-",
    i.warmth,
    i.tags.join(", ") || "-",
    i.status === "to-get" ? "TO GET (not owned yet)" : "owned",
    i.note ? clean(i.note) : "-",
  ].join(" | ");
}

function dayLine(d: StylistDay, looks: Looks): string {
  const w = d.weather;
  const weather = w
    ? `${w.hi}°C / ${w.lo}°C, ${w.source === "typical" ? "usually " : ""}${weatherLabel(w.code).toLowerCase()}, ${w.rainChance}% rain`
    : "weather unknown";
  const already = LOOK_SLOTS.map((s) => `${s}=[${(looks[d.date]?.[s] ?? []).join(", ")}]`).join(" ");
  return `${d.date} (${d.label}) | ${clean(d.place)}${d.travel ? " | travel day" : ""} | ${weather} | plans: ${
    d.plans.length ? d.plans.map(clean).join(", ") : "none yet"
  } | already planned: ${already}`;
}

export function stylistPrompt(req: StylistRequest): string {
  const plan = daysToPlan(req);
  const trends = req.trends.trends.map((t) => `- ${t.name}: ${t.wear}`).join("\n");
  return `You are a personal stylist planning outfits for "${clean(req.tripName)}", a honeymoon. Plan a day look and an evening look for each day listed under DAYS TO PLAN, using only the pieces in the CLOSET.

How to choose:
- Use pieces by their id. Never invent a piece. Prefer owned pieces; use a "TO GET" piece only where it is clearly the best fit.
- A piece's note says where on the trip it was packed for or what it goes with. Keep it to those days, and keep pareos and pants with the swimsuit they match.
- Dress for the weather: light fabrics on hot days, a layer when the evening drops below about 17°C, something for rain when rain is likely.
- Dress for the plans: swim and a cover-up for beach or pool, a layer and neutral colours for dawn game drives, fitted activewear for skydiving, something dressy for dinner out, comfortable layers for long flights.
- A look is complete: a dress or a set, or a top with a bottom, plus a layer or swim when the day needs it. Sets and dresses stand alone.
- Re-wear pieces across days as a real capsule would, and spread the favourites so no day feels like a repeat.
- Use this season's trends where they fit what's in the closet, and name the trend in "why" when you lean on one. Trends never outrank weather, plans or the notes.
${req.wish?.trim() ? `\nThe traveller asked: "${clean(req.wish).slice(0, 500)}"\n` : ""}
THIS SEASON (${req.trends.season}):
${trends}

CLOSET (id | name | kind | colour | warmth | good for | owned? | note):
${req.closet.map(pieceLine).join("\n")}

THE TRIP (date | where | weather | plans | already planned):
${req.days.map((d) => dayLine(d, req.looks)).join("\n")}

DAYS TO PLAN: ${plan.map((d) => d.date).join(", ") || "none"}

Reply with only a JSON object, no other text:
{"looks":[{"date":"YYYY-MM-DD","day":["piece id"],"evening":["piece id"],"why":"one or two warm, specific sentences"}],"missing":[{"name":"what to bring or buy","for":"which day or part of the trip","why":"one sentence"}],"note":"one or two sentences on the plan as a whole"}
Include one entry in "looks" for every date in DAYS TO PLAN. "missing" may be empty.`;
}

const Answer = z.object({
  looks: z
    .array(
      z.object({
        date: z.string(),
        day: z.array(z.unknown()).optional(),
        evening: z.array(z.unknown()).optional(),
        why: z.unknown().optional(),
      }),
    )
    .default([]),
  missing: z
    .array(z.object({ name: z.unknown(), for: z.unknown().optional(), why: z.unknown().optional() }))
    .default([]),
  note: z.unknown().optional(),
});

export interface SuggestedLook {
  date: IsoDate;
  pieces: Record<LookSlot, string[]>;
  why: string;
}

export interface StylistAnswer {
  looks: SuggestedLook[];
  missing: { name: string; for: string; why: string }[];
  note: string;
  /** Pieces the answer named that aren't in the closet, dropped. */
  dropped: number;
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Keeps only real pieces on the days that were asked for, each once per look. Null when the answer isn't usable. */
export function readStylistAnswer(
  raw: unknown,
  closet: ClosetItem[],
  planned: IsoDate[],
): StylistAnswer | null {
  const parsed = Answer.safeParse(raw);
  if (!parsed.success) return null;
  const ids = new Set(closet.map((i) => i.id));
  const wanted = new Set(planned);
  const seen = new Set<string>();
  let dropped = 0;
  const looks: SuggestedLook[] = [];
  for (const l of parsed.data.looks) {
    if (!wanted.has(l.date) || seen.has(l.date)) continue;
    const pick = (list: unknown[] | undefined) => {
      const out: string[] = [];
      for (const v of list ?? []) {
        const id = typeof v === "string" ? v.trim() : "";
        if (!ids.has(id)) {
          dropped += 1;
          continue;
        }
        if (!out.includes(id) && out.length < 8) out.push(id);
      }
      return out;
    };
    const pieces = { day: pick(l.day), evening: pick(l.evening) };
    if (!pieces.day.length && !pieces.evening.length) continue;
    seen.add(l.date);
    looks.push({ date: l.date, pieces, why: text(l.why, 400) });
  }
  looks.sort((a, b) => a.date.localeCompare(b.date));
  const missing = parsed.data.missing
    .map((m) => ({ name: text(m.name, 80), for: text(m.for, 80), why: text(m.why, 200) }))
    .filter((m) => m.name)
    .slice(0, 8);
  return { looks, missing, note: text(parsed.data.note, 400), dropped };
}
