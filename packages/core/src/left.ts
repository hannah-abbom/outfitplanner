import { isDressed, suitcase, type ClosetItem, type Looks } from "./closet";
import { addDays, dateRange } from "./dates";
import type { Gap, IsoDate, Trip } from "./model";
import { dueSoon, requirementsFor, type RequirementStatus } from "./requirements";

/*
 * Everything still to sort out for a trip, in one list for Home: things to do, holes in the bookings, days without
 * outfits, and pieces the looks use that you don't own yet. Most urgent first.
 */

export type LeftItem = { id: string; urgent: boolean; date: IsoDate | null } & (
  | {
      kind: "task";
      title: string;
      travelers: string[];
      status: RequirementStatus;
      dueFrom: IsoDate | null;
      dueBy: IsoDate | null;
    }
  | { kind: "gap"; gap: Gap }
  | { kind: "outfits"; days: IsoDate[] }
  | { kind: "buy"; items: ClosetItem[] }
);

export interface TripProgress {
  trip: Trip;
  done: Record<string, boolean>;
  looks: Looks;
}

/** Deadlines this close count as urgent. */
const URGENT_DAYS = 3;

export function whatsLeft(
  { trip, done, looks }: TripProgress,
  closet: ClosetItem[],
  today: IsoDate,
): LeftItem[] {
  if (trip.end < today) return [];
  const soon = addDays(today, URGENT_DAYS);
  const out: LeftItem[] = [];

  // One line per task, even when it applies to both travelers.
  const tasks = new Map<string, Extract<LeftItem, { kind: "task" }>>();
  for (const r of dueSoon(requirementsFor(trip))) {
    if (done[r.id]) continue;
    const key = r.id.slice(r.traveler.length + 1);
    const seen = tasks.get(key);
    if (seen) {
      seen.travelers.push(r.traveler);
      continue;
    }
    tasks.set(key, {
      id: `task:${key}`,
      kind: "task",
      title: r.title,
      travelers: [r.traveler],
      status: r.status,
      dueFrom: r.dueFrom,
      dueBy: r.dueBy,
      date: r.dueBy,
      urgent: r.status === "todo" && r.dueBy !== null && r.dueBy <= soon,
    });
  }
  out.push(...tasks.values());

  for (const gap of trip.gaps) {
    if (gap.date < today) continue;
    out.push({
      id: `gap:${gap.kind}:${gap.date}`,
      kind: "gap",
      gap,
      date: gap.date,
      urgent: gap.date <= soon,
    });
  }

  const days = dateRange(trip.start > today ? trip.start : today, trip.end);
  const bare = days.filter((d) => !isDressed(looks[d]));
  if (bare.length > 0)
    out.push({
      id: "outfits",
      kind: "outfits",
      days: bare,
      date: bare[0] ?? null,
      urgent: (bare[0] ?? "9999") <= soon,
    });

  const toGet = suitcase(looks, closet, dateRange(trip.start, trip.end))
    .map((l) => l.item)
    .filter((i) => i.status === "to-get");
  if (toGet.length > 0)
    out.push({ id: "buy", kind: "buy", items: toGet, date: trip.start, urgent: trip.start <= soon });

  return out.sort(
    (a, b) => Number(b.urgent) - Number(a.urgent) || (a.date ?? "9999").localeCompare(b.date ?? "9999"),
  );
}
