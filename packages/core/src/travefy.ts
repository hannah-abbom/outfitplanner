import { z } from "zod";
import { addDays, dateOf, daysBetween, localAt } from "./dates";
import type { Airport, Flight, Gap, IsoDate, Stay, Trip, Voucher } from "./model";
import { AIRPORTS } from "./places";

/*
 * Importer for travel agents' shared itineraries on Travefy (BKG-08).
 *
 * A shared link (travefy.com/trip/itinerary/<page id>) serves a page whose data comes from
 * GET /itinerary-rest-api/itineraryPages/<page id>, sent with X-TRIP-TOKEN (the trip id, embedded in the page's
 * HTML) and X-TRIP-AUTH-TOKEN (the page id). This module holds the pure parts: reading the link, reading the trip
 * id out of the HTML, and turning the JSON into a Trip. The app does the fetching. The endpoint is not a public
 * API and may change, so every field is parsed defensively and anything we can't read is left out, not guessed.
 */

const Attribute = z.object({ label: z.string().nullish(), value: z.string().nullish() });

const TravefyEvent = z.object({
  id: z.number(),
  isActive: z.boolean().nullish(),
  ordinal: z.number().nullish(),
  name: z.string().nullish(),
  description: z.string().nullish(),
  eventType: z.number().nullish(),
  startTimeInMinutes: z.number().nullish(),
  startTimeZoneIdHint: z.string().nullish(),
  attributes: z.array(Attribute).nullish(),
  tripIdeaIds: z.array(z.number()).nullish(),
});

const TravefyDay = z.object({
  id: z.number(),
  date: z.string().nullish(),
  ordinal: z.number().nullish(),
  isActive: z.boolean().nullish(),
  tripEventIds: z.array(z.number()),
});

const TravefyIdea = z.object({
  id: z.number(),
  name: z.string().nullish(),
  attachmentUrl: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

export const TravefyItinerary = z.object({
  itineraryPage: z.object({
    trip: z.object({ id: z.number().nullish(), name: z.string().nullish() }),
  }),
  tripDays: z.array(TravefyDay),
  tripEvents: z.array(TravefyEvent),
  tripIdeas: z.array(TravefyIdea).nullish(),
});
export type TravefyItinerary = z.infer<typeof TravefyItinerary>;

/** The page id from a shared Travefy link, or null when the link isn't one we can read. */
export function parseTravefyLink(link: string): string | null {
  const m = link.trim().match(/^https?:\/\/(?:www\.)?travefy\.com\/trip\/itinerary\/([A-Za-z0-9_-]{10,})/);
  return m?.[1] ?? null;
}

export function travefyApiUrl(pageId: string): string {
  return `https://travefy.com/itinerary-rest-api/itineraryPages/${encodeURIComponent(pageId)}`;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

const PageConfig = z.object({
  loadingModel: z.object({
    itineraryPage: z.object({ trip: z.object({ id: z.number() }) }),
  }),
});

/** The numeric trip id embedded in a shared itinerary page's HTML, needed to call the itinerary API. */
export function travefyTripIdFromHtml(html: string): number | null {
  for (const m of html.matchAll(/content="(\{[^"]*loadingModel[^"]*\})"/g)) {
    try {
      const parsed = PageConfig.safeParse(JSON.parse(decodeEntities(m[1] ?? "")));
      if (parsed.success) return parsed.data.loadingModel.itineraryPage.trip.id;
    } catch {
      // not the config block
    }
  }
  return null;
}

function stripHtml(s: string | null | undefined): string | null {
  if (!s) return null;
  const text = decodeEntities(s.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
  return text || null;
}

function attr(e: z.infer<typeof TravefyEvent>, label: string): string | null {
  const a = (e.attributes ?? []).find((x) => (x.label ?? "").trim().toLowerCase() === label.toLowerCase());
  const v = a?.value?.trim();
  return v ? v : null;
}

function airportFrom(name: string, timeZoneHint: string | null | undefined): Airport | null {
  const m = name.match(/^(?:Depart from|Arrive at)\s+(.+?)\s*\(([A-Z]{3})\)\s*$/);
  if (!m) return null;
  const code = m[2] as string;
  const known = AIRPORTS[code];
  return {
    code,
    name: (m[1] as string).trim(),
    city: known?.city ?? null,
    country: known?.country ?? null,
    timeZone: known?.timeZone ?? timeZoneHint ?? null,
  };
}

interface Placed {
  event: z.infer<typeof TravefyEvent>;
  date: IsoDate;
  order: number;
}

const TRANSFER_WORDS =
  /\b(transfer|traslado|pick[- ]?up|drop[- ]?off|shuttle|driver|chauffeur|car service)\b/i;

export interface ImportOptions {
  link?: string | null;
  importedAt?: string;
}

/** Turns a Travefy itinerary response into a Trip. Throws a ZodError when the response isn't an itinerary. */
export function importTravefy(raw: unknown, options: ImportOptions = {}): Trip {
  const data = TravefyItinerary.parse(raw);
  const events = new Map(data.tripEvents.filter((e) => e.isActive !== false).map((e) => [e.id, e]));
  const ideas = new Map((data.tripIdeas ?? []).map((i) => [i.id, i]));

  // Events in trip order, each once, with the date of its day.
  const placed: Placed[] = [];
  const seen = new Set<number>();
  const days = [...data.tripDays]
    .filter((d) => d.isActive !== false && d.date)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || (a.ordinal ?? 0) - (b.ordinal ?? 0));
  for (const day of days) {
    const date = (day.date as string).slice(0, 10);
    const ids = [...new Set(day.tripEventIds)].filter((id) => !seen.has(id) && events.has(id));
    const dayEvents = ids.map((id) => events.get(id) as z.infer<typeof TravefyEvent>);
    dayEvents.sort(
      (a, b) =>
        (a.startTimeInMinutes ?? 9_999) - (b.startTimeInMinutes ?? 9_999) ||
        (a.ordinal ?? 0) - (b.ordinal ?? 0),
    );
    for (const event of dayEvents) {
      seen.add(event.id);
      placed.push({ event, date, order: placed.length });
    }
  }
  if (days.length === 0) throw new Error("This itinerary has no dated days.");
  const start = (days[0]?.date as string).slice(0, 10);
  const end = (days[days.length - 1]?.date as string).slice(0, 10);

  // Vouchers: attached files (PDFs), linked to the events that list them.
  const vouchers: Voucher[] = [];
  const voucherIdFor = new Map<number, string>();
  for (const idea of ideas.values()) {
    const name = idea.name?.trim() ?? "";
    if (idea.attachmentUrl || /\.pdf$/i.test(name)) {
      const id = `v${idea.id}`;
      voucherIdFor.set(idea.id, id);
      vouchers.push({ id, name: name || "Attachment", url: idea.attachmentUrl ?? null });
    }
  }
  const vouchersOf = (e: z.infer<typeof TravefyEvent>) => [
    ...new Set((e.tripIdeaIds ?? []).map((i) => voucherIdFor.get(i)).filter((v): v is string => !!v)),
  ];

  // Flights: join each "Depart from" with the next "Arrive at" of the same flight number.
  const flights: Flight[] = [];
  const open: { flight: Flight; key: string }[] = [];
  for (const p of placed) {
    const name = p.event.name?.trim() ?? "";
    const airport = airportFrom(name, p.event.startTimeZoneIdHint);
    if (!airport) continue;
    const flightNumber = attr(p.event, "Flight Number");
    const key = (flightNumber ?? "").replace(/\s+/g, "").toUpperCase();
    const at =
      p.event.startTimeInMinutes != null ? localAt(p.date, p.event.startTimeInMinutes) : `${p.date}T00:00`;
    if (name.startsWith("Depart from")) {
      const flight: Flight = {
        id: `f${p.event.id}`,
        airline: attr(p.event, "Airline"),
        flightNumber,
        from: airport,
        to: airport,
        departs: at,
        arrives: null,
        terminal: attr(p.event, "Terminal"),
        voucherIds: vouchersOf(p.event),
      };
      flights.push(flight);
      open.push({ flight, key });
    } else {
      const i = open.findIndex((o) => o.key === key);
      if (i === -1) continue;
      const [{ flight }] = open.splice(i, 1) as [{ flight: Flight; key: string }];
      flight.to = airport;
      flight.arrives = at;
      flight.voucherIds = [...new Set([...flight.voucherIds, ...vouchersOf(p.event)])];
    }
  }
  const complete = flights.filter((f) => f.arrives !== null);

  // Stays: each "Check in at", until the next check-in or the next departure, whichever comes first.
  const checkIns = placed.filter((p) => /^check in at\s/i.test(p.event.name?.trim() ?? ""));
  const stays: Stay[] = checkIns.map((p, i) => {
    const next = checkIns[i + 1]?.date ?? null;
    const nextDeparture = complete.map((f) => dateOf(f.departs)).find((d) => d > p.date) ?? null;
    const candidates = [next, nextDeparture, end].filter((d): d is IsoDate => !!d && d > p.date);
    const checkOut = candidates.sort()[0] ?? addDays(p.date, 1);
    const lastArrival = [...complete].reverse().find((f) => f.arrives && dateOf(f.arrives) <= p.date);
    const name = (p.event.name ?? "").replace(/^check in at\s+/i, "").trim();
    const place = (p.event.tripIdeaIds ?? [])
      .map((id) => ideas.get(id))
      .find((idea) => idea && !voucherIdFor.has(idea.id) && idea.latitude != null && idea.longitude != null);
    return {
      id: `s${p.event.id}`,
      name,
      checkIn: p.date,
      checkOut,
      nights: daysBetween(p.date, checkOut),
      country: lastArrival?.to.country ?? null,
      nearAirport: lastArrival?.to.code ?? null,
      location: place ? { lat: place.latitude as number, lng: place.longitude as number } : null,
      room: attr(p.event, "Room / Bed Type"),
      notes: stripHtml(p.event.description),
      voucherIds: vouchersOf(p.event),
    };
  });

  const gaps: Gap[] = [...transferGaps(placed, complete, stays), ...stayGaps(start, end, complete, stays)];

  return {
    name: data.itineraryPage.trip.name?.trim() || "Imported trip",
    start,
    end,
    travelers: [],
    flights: complete,
    stays,
    vouchers,
    gaps,
    source: {
      kind: "travefy",
      url: options.link ?? null,
      importedAt: options.importedAt ?? new Date().toISOString(),
    },
  };
}

/** An arrival followed by a check-in, with no transfer listed between them and no onward flight first. */
function transferGaps(placed: Placed[], flights: Flight[], stays: Stay[]): Gap[] {
  const gaps: Gap[] = [];
  for (const flight of flights) {
    const arrives = flight.arrives as string;
    const nextFlight = flights.find((f) => f.departs > arrives);
    const stay = stays.find((s) => s.checkIn >= dateOf(arrives) && s.checkIn <= addDays(dateOf(arrives), 1));
    if (!stay) continue;
    if (nextFlight && dateOf(nextFlight.departs) <= stay.checkIn) continue; // a connection, not an arrival
    const between = placed.filter((p) => p.date >= dateOf(arrives) && p.date <= stay.checkIn);
    const hasTransfer = between.some((p) =>
      TRANSFER_WORDS.test(`${p.event.name ?? ""} ${p.event.description ?? ""}`),
    );
    if (!hasTransfer) {
      gaps.push({
        kind: "no-transfer",
        date: dateOf(arrives),
        airport: flight.to.code,
        stayId: stay.id,
        stayName: stay.name,
      });
    }
  }
  return gaps;
}

/** Nights with neither a stay nor a flight or connection overnight. The last day's night is the trip's end. */
function stayGaps(start: IsoDate, end: IsoDate, flights: Flight[], stays: Stay[]): Gap[] {
  const gaps: Gap[] = [];
  for (let night = start; night < end; night = addDays(night, 1)) {
    const inStay = stays.some((s) => s.checkIn <= night && night < s.checkOut);
    const overnightFlight = flights.some(
      (f) => dateOf(f.departs) <= night && f.arrives !== null && dateOf(f.arrives) > night,
    );
    const connection = flights.some((f, i) => {
      const next = flights[i + 1];
      return (
        f.arrives !== null &&
        dateOf(f.arrives) === night &&
        next !== undefined &&
        dateOf(next.departs) === addDays(night, 1) &&
        next.from.code === f.to.code
      );
    });
    if (!inStay && !overnightFlight && !connection) gaps.push({ kind: "no-stay", date: night });
  }
  return gaps;
}
