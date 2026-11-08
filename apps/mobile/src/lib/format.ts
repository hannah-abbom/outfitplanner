import type { IsoDate } from "@trip/core";

function asUtc(date: IsoDate): Date {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

const opts = (o: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({ ...o, timeZone: "UTC" });

/** "Wed, Nov 18" */
export function dayLabel(date: IsoDate): string {
  return asUtc(date).toLocaleDateString("en-US", opts({ weekday: "short", month: "short", day: "numeric" }));
}

/** "Wednesday, November 18" */
export function longDay(date: IsoDate): string {
  return asUtc(date).toLocaleDateString("en-US", opts({ weekday: "long", month: "long", day: "numeric" }));
}

/** { weekday: "WED", day: "18" } */
export function dateBlock(date: IsoDate): { weekday: string; day: string } {
  const d = asUtc(date);
  return {
    weekday: d.toLocaleDateString("en-US", opts({ weekday: "short" })).toUpperCase(),
    day: String(d.getUTCDate()),
  };
}

/** "Nov 16 – Dec 2" */
export function rangeLabel(start: IsoDate, end: IsoDate): string {
  const f = (d: IsoDate) => asUtc(d).toLocaleDateString("en-US", opts({ month: "short", day: "numeric" }));
  return `${f(start)} – ${f(end)}`;
}

export function nights(n: number): string {
  return `${n} night${n === 1 ? "" : "s"}`;
}

/** Today in the phone's own calendar. */
export function todayIso(): IsoDate {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 1 → "I", 4 → "IV": chapter numbers. */
export function roman(n: number): string {
  const table: [number, string][] = [
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let left = n;
  for (const [v, s] of table) {
    while (left >= v) {
      out += s;
      left -= v;
    }
  }
  return out;
}

/** "Sunday, 8 November" */
export function todayLong(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
