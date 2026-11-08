import AsyncStorage from "@react-native-async-storage/async-storage";
import { Trip, type DayWeather, type Traveler } from "@trip/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/*
 * The trip, what's been ticked and the weather, kept on the phone only (PLT-06). Nothing about the trip is sent
 * anywhere; it comes from the agent's link and lives in AsyncStorage.
 */

const KEY = "trip-wardrobe/v1";

export type Unit = "C" | "F";

export interface SavedWeather {
  byDate: Record<string, DayWeather>;
  fetchedAt: string;
  /** The trip the weather was fetched for, so a new import fetches again. */
  tripKey: string;
}

interface Saved {
  trip: Trip | null;
  done: Record<string, boolean>;
  packed: Record<string, boolean>;
  weather: SavedWeather | null;
  unit: Unit;
}

interface TripStore extends Saved {
  ready: boolean;
  setTrip: (trip: Trip | null) => void;
  setTravelers: (travelers: Traveler[]) => void;
  toggleDone: (id: string) => void;
  togglePacked: (id: string) => void;
  setWeather: (weather: SavedWeather) => void;
  setUnit: (unit: Unit) => void;
}

const empty: Saved = { trip: null, done: {}, packed: {}, weather: null, unit: "C" };
const Ctx = createContext<TripStore | null>(null);

export function tripKey(trip: Trip): string {
  return `${trip.source.importedAt}|${trip.start}|${trip.end}`;
}

function parseSaved(raw: string | null): Saved {
  if (!raw) return empty;
  try {
    const j = JSON.parse(raw) as Partial<Saved>;
    const trip = j.trip ? Trip.safeParse(j.trip) : null;
    return {
      trip: trip?.success ? trip.data : null,
      done: j.done ?? {},
      packed: j.packed ?? {},
      weather: j.weather && typeof j.weather === "object" && "byDate" in j.weather ? j.weather : null,
      unit: j.unit === "F" ? "F" : "C",
    };
  } catch {
    return empty;
  }
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => setSaved(parseSaved(raw)))
      .catch(() => setSaved(empty))
      .finally(() => setReady(true));
  }, []);

  const update = useCallback((fn: (s: Saved) => Saved) => {
    setSaved((prev) => {
      const next = fn(prev);
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const store = useMemo<TripStore>(
    () => ({
      ...saved,
      ready,
      setTrip: (trip) => update((s) => ({ ...empty, unit: s.unit, trip })),
      setTravelers: (travelers) => update((s) => (s.trip ? { ...s, trip: { ...s.trip, travelers } } : s)),
      toggleDone: (id) => update((s) => ({ ...s, done: { ...s.done, [id]: !s.done[id] } })),
      togglePacked: (id) => update((s) => ({ ...s, packed: { ...s.packed, [id]: !s.packed[id] } })),
      setWeather: (weather) => update((s) => ({ ...s, weather })),
      setUnit: (unit) => update((s) => ({ ...s, unit })),
    }),
    [saved, ready, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useTrip(): TripStore {
  const s = useContext(Ctx);
  if (!s) throw new Error("useTrip must be used inside TripProvider");
  return s;
}
