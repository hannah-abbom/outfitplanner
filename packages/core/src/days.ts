import { addDays, dateOf, dateRange, daysBetween } from "./dates";
import type { Flight, Gap, IsoDate, Stay, Trip } from "./model";

export type DayItem =
  | { kind: "check-out"; stay: Stay }
  | { kind: "depart"; time: string; flight: Flight }
  | { kind: "arrive"; time: string; flight: Flight }
  | { kind: "gap"; gap: Gap }
  | { kind: "check-in"; stay: Stay };

export interface TripDay {
  date: IsoDate;
  /** 1-based day of the trip. */
  number: number;
  /** Where you sleep that night, if anywhere. */
  sleep: Stay | null;
  items: DayItem[];
}

const timeOf = (local: string) => local.slice(11, 16);

/** Every day of the trip, with what happens on it in local time and where you sleep that night. */
export function buildDays(trip: Trip): TripDay[] {
  return dateRange(trip.start, trip.end).map((date, i) => {
    const keyed: { key: string; item: DayItem }[] = [];
    for (const s of trip.stays) {
      if (s.checkOut === date) keyed.push({ key: "00:00a", item: { kind: "check-out", stay: s } });
      if (s.checkIn === date) keyed.push({ key: "23:59", item: { kind: "check-in", stay: s } });
    }
    for (const f of trip.flights) {
      if (dateOf(f.departs) === date)
        keyed.push({
          key: `${timeOf(f.departs)}a`,
          item: { kind: "depart", time: timeOf(f.departs), flight: f },
        });
      if (f.arrives && dateOf(f.arrives) === date)
        keyed.push({
          key: `${timeOf(f.arrives)}b`,
          item: { kind: "arrive", time: timeOf(f.arrives), flight: f },
        });
    }
    for (const g of trip.gaps) {
      if (g.date !== date) continue;
      const arrival =
        g.kind === "no-transfer"
          ? trip.flights.find((f) => f.arrives && dateOf(f.arrives) === date && f.to.code === g.airport)
          : undefined;
      keyed.push({
        key: arrival?.arrives ? `${timeOf(arrival.arrives)}c` : "23:58",
        item: { kind: "gap", gap: g },
      });
    }
    keyed.sort((a, b) => a.key.localeCompare(b.key));
    return {
      date,
      number: i + 1,
      sleep: trip.stays.find((s) => s.checkIn <= date && date < s.checkOut) ?? null,
      items: keyed.map((k) => k.item),
    };
  });
}

/** Consecutive days that share where you sleep: one stay, or the days spent getting somewhere. */
export interface DayGroup {
  stay: Stay | null;
  days: TripDay[];
}

export function groupDays(days: TripDay[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && last.stay?.id === day.sleep?.id) last.days.push(day);
    else groups.push({ stay: day.sleep, days: [day] });
  }
  return groups;
}

/** Days until the trip starts (0 on the first day, negative once it has started). */
export function daysUntil(trip: Trip, today: IsoDate): number {
  return daysBetween(today, trip.start);
}

export { addDays };
