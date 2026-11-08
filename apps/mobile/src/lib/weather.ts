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
import { tripKey, useTrip, type Unit } from "@/state/trip-store";

const REFRESH_MS = 6 * 60 * 60 * 1000;
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

/** Keeps the saved weather fresh: fetches after an import, and again when it's more than six hours old. */
export function useWeatherSync() {
  const { trip, weather, setWeather } = useTrip();
  const running = useRef(false);
  useEffect(() => {
    if (!trip || running.current) return;
    const key = tripKey(trip);
    const fresh =
      weather && weather.tripKey === key && Date.now() - Date.parse(weather.fetchedAt) < REFRESH_MS;
    if (fresh) return;
    running.current = true;
    fetchTripWeather(trip, todayIso())
      .then((byDate) => {
        // Keep earlier days we already had when a refresh comes back partial.
        const merged = weather?.tripKey === key ? { ...weather.byDate, ...byDate } : byDate;
        if (Object.keys(merged).length)
          setWeather({ byDate: merged, fetchedAt: new Date().toISOString(), tripKey: key });
      })
      .catch(() => {})
      .finally(() => {
        running.current = false;
      });
  }, [trip, weather, setWeather]);
}

export function temp(c: number, unit: Unit): string {
  return `${unit === "F" ? toFahrenheit(c) : c}°`;
}
