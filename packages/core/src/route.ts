import { addDays, dateOf, daysBetween, toEpochMs } from "./dates";
import type { CountryCode, Flight, IsoDate, Trip } from "./model";

/** Flights joined at their connections: each next flight leaves the airport the last one landed at, within a day. */
export interface Journey {
  flights: Flight[];
  origin: CountryCode | null;
  destination: CountryCode | null;
  departs: IsoDate;
  arrives: IsoDate;
  /** Airports passed through on the way, with the wait when it can be worked out. */
  connections: { airport: string; country: CountryCode | null; hours: number | null }[];
}

function waitHours(prev: Flight, next: Flight): number | null {
  if (!prev.arrives) return null;
  const a = toEpochMs(prev.arrives, prev.to.timeZone);
  const b = toEpochMs(next.departs, next.from.timeZone);
  if (a !== null && b !== null) return Math.round(((b - a) / 3_600_000) * 10) / 10;
  return null;
}

function connects(prev: Flight, next: Flight, stays: Trip["stays"]): boolean {
  if (!prev.arrives || next.from.code !== prev.to.code) return false;
  // A booked night between the two flights makes it a stop, not a connection.
  const landed = dateOf(prev.arrives);
  const leaves = dateOf(next.departs);
  if (stays.some((s) => s.checkIn >= landed && s.checkIn < leaves)) return false;
  const hours = waitHours(prev, next);
  if (hours !== null) return hours >= 0 && hours < 24;
  return daysBetween(dateOf(prev.arrives), dateOf(next.departs)) <= 1;
}

export function journeys(trip: Trip): Journey[] {
  const out: Journey[] = [];
  let current: Flight[] = [];
  const close = () => {
    const first = current[0];
    const last = current[current.length - 1];
    if (!first || !last || !last.arrives) return;
    out.push({
      flights: current,
      origin: first.from.country,
      destination: last.to.country,
      departs: dateOf(first.departs),
      arrives: dateOf(last.arrives),
      connections: current.slice(1).map((f, i) => ({
        airport: f.from.code,
        country: f.from.country,
        hours: waitHours(current[i] as Flight, f),
      })),
    });
  };
  for (const flight of trip.flights) {
    const prev = current[current.length - 1];
    if (prev && connects(prev, flight, trip.stays)) current.push(flight);
    else {
      close();
      current = [flight];
    }
  }
  close();
  return out;
}

/** A stay in a country between crossing its border in and out, with the journey that brought the traveler in. */
export interface CountryVisit {
  country: CountryCode;
  entry: IsoDate;
  exit: IsoDate;
  arrivedBy: Journey;
}

export function countryVisits(trip: Trip): CountryVisit[] {
  const js = journeys(trip);
  const visits: CountryVisit[] = [];
  js.forEach((j, i) => {
    if (!j.destination || j.destination === j.origin) return;
    const leaving = js
      .slice(i + 1)
      .find((n) => n.origin === j.destination && n.destination !== j.destination);
    visits.push({
      country: j.destination,
      entry: j.arrives,
      exit: leaving?.departs ?? trip.end,
      arrivedBy: j,
    });
  });
  // Coming home is not a visit.
  const home = js[0]?.origin ?? null;
  return visits.filter((v) => v.country !== home);
}

export function addMonths(date: IsoDate, months: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1 + months, d));
  return t.toISOString().slice(0, 10);
}

export { addDays };
