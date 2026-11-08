import type { IsoDate, LocalDateTime } from "./model";

/** Adds whole days to a calendar date, without involving any time zone. */
export function addDays(date: IsoDate, days: number): IsoDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

/** Whole days from `a` to `b` (positive when `b` is later). */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  const toUtc = (s: IsoDate) => {
    const [y, m, d] = s.split("-").map(Number) as [number, number, number];
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/** Every date from `start` to `end`, both included. */
export function dateRange(start: IsoDate, end: IsoDate): IsoDate[] {
  const out: IsoDate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}

export function dateOf(local: LocalDateTime): IsoDate {
  return local.slice(0, 10);
}

/** `YYYY-MM-DDTHH:MM` from a date and minutes after midnight. */
export function localAt(date: IsoDate, minutes: number): LocalDateTime {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Milliseconds since the epoch for a wall-clock time in an IANA time zone, or null when the zone is unknown or
 * the runtime has no time-zone data. Accurate except within the hour of a daylight-saving change.
 */
export function toEpochMs(local: LocalDateTime, timeZone: string | null): number | null {
  if (!timeZone) return null;
  const [datePart, timePart] = local.split("T") as [string, string];
  const [y, mo, d] = datePart.split("-").map(Number) as [number, number, number];
  const [h, mi] = timePart.split(":").map(Number) as [number, number];
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    const parts = Object.fromEntries(fmt.formatToParts(new Date(asUtc)).map((p) => [p.type, p.value]));
    const shown = Date.UTC(
      Number(parts["year"]),
      Number(parts["month"]) - 1,
      Number(parts["day"]),
      Number(parts["hour"]),
      Number(parts["minute"]),
    );
    if (Number.isNaN(shown)) return null;
    return asUtc - (shown - asUtc);
  } catch {
    return null;
  }
}
