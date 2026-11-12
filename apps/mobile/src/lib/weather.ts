import {
  planWeatherRequests,
  readForecast,
  readTypical,
  toFahrenheit,
  type DayWeather,
  type Trip,
} from "@trip/core";
import { useEffect, useRef } from "react";

import { todayIso } from "@/lib/format";
import { tripKey, useStore, type Unit } from "@/state/trip-store";

const REFRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 10 * 60 * 1000;
const wait = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/**
 * Weather for each day of the trip, straight from Open-Meteo on the phone (WX-01, WX-02). Requests go one at a
 * time with a short pause, each retried once, and a failed one only leaves its days empty.
 */
export async function fetchTripWeather(trip: Trip, today: string): Promise<Record<string, DayWeather>> {
  const byDate: Record<string, DayWeather> = {};
  for (const request of planWeatherRequests(trip, today)) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 20_000);
        const res = await fetch(request.url, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(String(res.status));
        const json: unknown = await res.json();
        const days = request.kind === "forecast" ? readForecast(request, json) : readTypical(request, json);
        for (const d of days) byDate[d.date] = d;
        break;
      } catch {
        await wait(2500);
      }
    }
    await wait(700);
  }
  return byDate;
}

/**
 * Keeps the open trip's weather fresh: fetches after an import, and again when it's more than six hours old. A
 * failed attempt waits ten minutes before the next, so editing looks doesn't hammer the weather service.
 */
export function useWeatherSync() {
  const { active, updateTrip } = useStore();
  const running = useRef(false);
  const lastTry = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!active || running.current) return;
    const { id, trip, weather } = active;
    const key = tripKey(trip);
    const fresh =
      weather && weather.tripKey === key && Date.now() - Date.parse(weather.fetchedAt) < REFRESH_MS;
    if (fresh || Date.now() - (lastTry.current[key] ?? 0) < RETRY_MS) return;
    running.current = true;
    lastTry.current[key] = Date.now();
    fetchTripWeather(trip, todayIso())
      .then((byDate) =>
        updateTrip(id, (t) => {
          // Keep earlier days we already had when a refresh comes back partial.
          const merged = t.weather?.tripKey === key ? { ...t.weather.byDate, ...byDate } : byDate;
          if (!Object.keys(merged).length) return t;
          return { ...t, weather: { byDate: merged, fetchedAt: new Date().toISOString(), tripKey: key } };
        }),
      )
      .catch(() => {})
      .finally(() => {
        running.current = false;
      });
  }, [active, updateTrip]);
}

export function temp(c: number, unit: Unit): string {
  return `${unit === "F" ? toFahrenheit(c) : c}°`;
}
