import { z } from "zod";
import { addDays, dateOf, daysBetween } from "./dates";
import type { IsoDate, Trip } from "./model";
import { AIRPORTS } from "./places";

/*
 * Weather for every day of a trip (WX-01, WX-02), from Open-Meteo. Days within the forecast range get the
 * forecast; later days get what's typical: the same dates over the last five years, from the historical archive.
 * Each day says which of the two it is. Open-Meteo is free for non-commercial use; a paid plan is needed before
 * the app is public.
 */

/** Open-Meteo forecasts 16 days, but the last days often come back incomplete, so we use 14. */
export const FORECAST_DAYS = 14;
export const ARCHIVE_YEARS = 5;

export interface WeatherPlace {
  key: string;
  lat: number;
  lng: number;
  label: string;
}

export interface DayWeather {
  date: IsoDate;
  place: string;
  hi: number;
  lo: number;
  /** Chance of rain that day, 0 to 100. */
  rainChance: number;
  /** WMO weather code. */
  code: number;
  source: "forecast" | "typical";
}

/** Where to read the weather for each day: where you sleep, else where you land, else where you leave from. */
export function weatherPlaces(trip: Trip): { date: IsoDate; place: WeatherPlace }[] {
  const out: { date: IsoDate; place: WeatherPlace }[] = [];
  for (let date = trip.start; date <= trip.end; date = addDays(date, 1)) {
    const stay = trip.stays.find((s) => s.checkIn <= date && date < s.checkOut);
    const arrival = [...trip.flights].reverse().find((f) => f.arrives && dateOf(f.arrives) === date);
    const departure = trip.flights.find((f) => dateOf(f.departs) === date);
    let point: { lat: number; lng: number; label: string } | null = null;
    const stayAirport = stay?.nearAirport ? AIRPORTS[stay.nearAirport] : undefined;
    if (stay?.location) point = { ...stay.location, label: stay.name };
    else if (stay && stayAirport) {
      point = { lat: stayAirport.lat, lng: stayAirport.lng, label: stay.name };
    } else {
      const code = arrival?.to.code ?? departure?.from.code;
      const a = code ? AIRPORTS[code] : undefined;
      if (a) point = { lat: a.lat, lng: a.lng, label: a.city };
    }
    if (!point) continue;
    // Places within about 25 km share one request; their weather is the same for our purposes.
    const key = `${Math.round(point.lat * 4) / 4},${Math.round(point.lng * 4) / 4}`;
    out.push({ date, place: { key, lat: point.lat, lng: point.lng, label: point.label } });
  }
  return out;
}

export interface WeatherRequest {
  kind: "forecast" | "archive";
  url: string;
  placeKey: string;
  /** The trip dates this request answers, with each one's place label. */
  dates: { date: IsoDate; label: string }[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** The requests to make, fewest possible: one forecast and one archive range per place at most. */
export function planWeatherRequests(trip: Trip, today: IsoDate): WeatherRequest[] {
  const lastForecastDay = addDays(today, FORECAST_DAYS - 1);
  const byPlace = new Map<string, { place: WeatherPlace; dates: { date: IsoDate; label: string }[] }>();
  for (const { date, place } of weatherPlaces(trip)) {
    if (date < today) continue;
    const entry = byPlace.get(place.key) ?? { place, dates: [] };
    entry.dates.push({ date, label: place.label });
    byPlace.set(place.key, entry);
  }
  const requests: WeatherRequest[] = [];
  for (const [key, { place, dates }] of byPlace) {
    const near = dates.filter((d) => d.date <= lastForecastDay);
    const far = dates.filter((d) => d.date > lastForecastDay);
    const coords = `latitude=${r2(place.lat)}&longitude=${r2(place.lng)}`;
    if (near.length) {
      const start = near[0]?.date as IsoDate;
      const end = near[near.length - 1]?.date as IsoDate;
      requests.push({
        kind: "forecast",
        placeKey: key,
        dates: near,
        url: `https://api.open-meteo.com/v1/forecast?${coords}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&start_date=${start}&end_date=${end}`,
      });
    }
    if (far.length) {
      const first = far[0]?.date as IsoDate;
      const last = far[far.length - 1]?.date as IsoDate;
      const year = Number(first.slice(0, 4));
      const start = addDays(`${year - ARCHIVE_YEARS}${first.slice(4)}`, -2);
      const end = addDays(`${year - 1}${last.slice(4)}`, 2);
      requests.push({
        kind: "archive",
        placeKey: key,
        dates: far,
        url: `https://archive-api.open-meteo.com/v1/archive?${coords}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&start_date=${start}&end_date=${end}`,
      });
    }
  }
  return requests;
}

const nums = z.array(z.number().nullable());

export const ForecastResponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: nums,
    temperature_2m_min: nums,
    precipitation_probability_max: nums.optional(),
    weather_code: nums,
  }),
});

export const ArchiveResponse = z.object({
  daily: z.object({
    time: z.array(z.string()),
    temperature_2m_max: nums,
    temperature_2m_min: nums,
    precipitation_sum: nums,
    weather_code: nums,
  }),
});

/** Days from a forecast response, for the dates the request was made for. */
export function readForecast(request: WeatherRequest, raw: unknown): DayWeather[] {
  const d = ForecastResponse.parse(raw).daily;
  return request.dates.flatMap(({ date, label }) => {
    const i = d.time.indexOf(date);
    const hi = d.temperature_2m_max[i];
    const lo = d.temperature_2m_min[i];
    const code = d.weather_code[i];
    if (i < 0 || hi == null || lo == null || code == null) return [];
    return [
      {
        date,
        place: label,
        hi: Math.round(hi),
        lo: Math.round(lo),
        rainChance: Math.round(d.precipitation_probability_max?.[i] ?? 0),
        code,
        source: "forecast" as const,
      },
    ];
  });
}

/** Typical weather for each date: the same calendar days, two either side, over the years in the response. */
export function readTypical(request: WeatherRequest, raw: unknown): DayWeather[] {
  const d = ArchiveResponse.parse(raw).daily;
  return request.dates.flatMap(({ date, label }) => {
    const samples: { hi: number; lo: number; rain: number; code: number }[] = [];
    d.time.forEach((t, i) => {
      const sameYearDate = `${date.slice(0, 4)}${t.slice(4)}`;
      if (Math.abs(daysBetween(date, sameYearDate)) > 2) return;
      const hi = d.temperature_2m_max[i];
      const lo = d.temperature_2m_min[i];
      const rain = d.precipitation_sum[i];
      const code = d.weather_code[i];
      if (hi == null || lo == null || rain == null || code == null) return;
      samples.push({ hi, lo, rain, code });
    });
    if (samples.length === 0) return [];
    const mean = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) / xs.length);
    const counts = new Map<string, number>();
    for (const s of samples) counts.set(weatherKind(s.code), (counts.get(weatherKind(s.code)) ?? 0) + 1);
    const commonKind = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as WeatherKind;
    return [
      {
        date,
        place: label,
        hi: mean(samples.map((s) => s.hi)),
        lo: mean(samples.map((s) => s.lo)),
        rainChance: Math.round((samples.filter((s) => s.rain >= 1).length / samples.length) * 100),
        code: KIND_CODE[commonKind],
        source: "typical" as const,
      },
    ];
  });
}

export type WeatherKind = "sun" | "partly" | "cloud" | "fog" | "rain" | "storm" | "snow";

const KIND_CODE: Record<WeatherKind, number> = {
  sun: 0,
  partly: 2,
  cloud: 3,
  fog: 45,
  rain: 61,
  storm: 95,
  snow: 71,
};

/** WMO weather codes grouped into what a traveler cares about. */
export function weatherKind(code: number): WeatherKind {
  if (code <= 1) return "sun";
  if (code === 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  return "rain";
}

const KIND_LABEL: Record<WeatherKind, string> = {
  sun: "Sunny",
  partly: "Partly cloudy",
  cloud: "Cloudy",
  fog: "Foggy",
  rain: "Rain likely",
  storm: "Thunderstorms",
  snow: "Snow",
};

export function weatherLabel(code: number): string {
  return KIND_LABEL[weatherKind(code)];
}

/** What the weather means for what to wear and bring, in plain words. */
export function clothingHints(w: DayWeather): string[] {
  const hints: string[] = [];
  if (w.hi >= 30) hints.push("Hot: breathable fabrics, a hat and sunscreen");
  else if (w.hi >= 24) hints.push("Warm: light clothes, sunglasses and sunscreen");
  else if (w.hi >= 16) hints.push("Mild: light layers");
  else hints.push("Cool: a warm layer and closed shoes");
  if (w.lo <= 15) hints.push(`Cool morning and evening, down to ${w.lo}°: bring a layer`);
  if (w.rainChance >= 40 || weatherKind(w.code) === "storm") hints.push("Pack a light rain jacket");
  return hints;
}

export const toFahrenheit = (c: number) => Math.round((c * 9) / 5 + 32);
