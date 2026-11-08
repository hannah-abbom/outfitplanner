import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addToLook,
  ClosetItem,
  forgetPiece,
  removeFromLook,
  Trip,
  type DayWeather,
  type IsoDate,
  type Looks,
  type LookSlot,
  type Traveler,
} from "@trip/core";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/*
 * Your trips, your closet and each trip's looks, kept on the phone only (PLT-06). Trips come from the agent's link;
 * the closet is yours and carries over from trip to trip.
 */

const KEY = "trip-wardrobe/v2";
const OLD_KEY = "trip-wardrobe/v1";

export type Unit = "C" | "F";

export interface SavedWeather {
  byDate: Record<string, DayWeather>;
  fetchedAt: string;
  /** The trip the weather was fetched for, so a new import fetches again. */
  tripKey: string;
}

export interface TripState {
  id: string;
  trip: Trip;
  done: Record<string, boolean>;
  packed: Record<string, boolean>;
  weather: SavedWeather | null;
  looks: Looks;
  /** What's planned each day, like "Game drive" or "Dinner out". */
  plans: Record<IsoDate, string[]>;
}

interface Saved {
  trips: TripState[];
  activeId: string | null;
  closet: ClosetItem[];
  unit: Unit;
}

interface Store extends Saved {
  ready: boolean;
  active: TripState | null;
  /** Adds a trip and opens it. Importing the same link again replaces the trip and keeps its looks and ticks. */
  addTrip: (trip: Trip) => void;
  removeTrip: (id: string) => void;
  setActive: (id: string) => void;
  updateTrip: (id: string, fn: (t: TripState) => TripState) => void;
  savePiece: (item: ClosetItem) => void;
  removePiece: (id: string) => void;
  setUnit: (unit: Unit) => void;
}

const empty: Saved = { trips: [], activeId: null, closet: [], unit: "C" };
const Ctx = createContext<Store | null>(null);

export function tripKey(trip: Trip): string {
  return `${trip.source.importedAt}|${trip.start}|${trip.end}`;
}

export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function freshTrip(trip: Trip): TripState {
  return { id: newId("t"), trip, done: {}, packed: {}, weather: null, looks: {}, plans: {} };
}

const obj = <T,>(v: unknown, fallback: T): T => (v && typeof v === "object" ? (v as T) : fallback);

function readTrip(raw: unknown): TripState | null {
  const r = obj<Partial<TripState>>(raw, {});
  const trip = Trip.safeParse(r.trip);
  if (!trip.success || typeof r.id !== "string") return null;
  const weather = obj<SavedWeather | null>(r.weather, null);
  return {
    id: r.id,
    trip: trip.data,
    done: obj(r.done, {}),
    packed: obj(r.packed, {}),
    weather: weather && "byDate" in weather ? weather : null,
    looks: obj(r.looks, {}),
    plans: obj(r.plans, {}),
  };
}

export function parseSaved(raw: string | null, old: string | null): Saved {
  try {
    if (raw) {
      const j = JSON.parse(raw) as Partial<Saved>;
      const trips = (Array.isArray(j.trips) ? j.trips : []).flatMap((t) => readTrip(t) ?? []);
      const closet = (Array.isArray(j.closet) ? j.closet : []).flatMap((i) => {
        const p = ClosetItem.safeParse(i);
        return p.success ? [p.data] : [];
      });
      const activeId = trips.some((t) => t.id === j.activeId) ? (j.activeId as string) : (trips[0]?.id ?? null);
      return { trips, activeId, closet, unit: j.unit === "F" ? "F" : "C" };
    }
    if (old) {
      // The first build kept one trip under the old key.
      const j = JSON.parse(old) as { trip?: unknown; done?: unknown; packed?: unknown; weather?: unknown; unit?: unknown };
      const t = readTrip({ ...j, id: "t_first" });
      return { trips: t ? [t] : [], activeId: t?.id ?? null, closet: [], unit: j.unit === "F" ? "F" : "C" };
    }
  } catch {
    return empty;
  }
  return empty;
}

export function TripProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(OLD_KEY)])
      .then(([raw, old]) => setSaved(parseSaved(raw, old)))
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

  const store = useMemo<Store>(
    () => ({
      ...saved,
      ready,
      active: saved.trips.find((t) => t.id === saved.activeId) ?? null,
      addTrip: (trip) =>
        update((s) => {
          const same = trip.source.url ? s.trips.find((t) => t.trip.source.url === trip.source.url) : undefined;
          if (same) {
            const replaced = { ...same, trip: { ...trip, travelers: same.trip.travelers }, weather: null };
            return { ...s, trips: s.trips.map((t) => (t.id === same.id ? replaced : t)), activeId: same.id };
          }
          const t = freshTrip(trip);
          return { ...s, trips: [...s.trips, t], activeId: t.id };
        }),
      removeTrip: (id) =>
        update((s) => {
          const trips = s.trips.filter((t) => t.id !== id);
          return { ...s, trips, activeId: s.activeId === id ? (trips[0]?.id ?? null) : s.activeId };
        }),
      setActive: (id) => update((s) => (s.trips.some((t) => t.id === id) ? { ...s, activeId: id } : s)),
      updateTrip: (id, fn) => update((s) => ({ ...s, trips: s.trips.map((t) => (t.id === id ? fn(t) : t)) })),
      savePiece: (item) =>
        update((s) => ({
          ...s,
          closet: s.closet.some((i) => i.id === item.id)
            ? s.closet.map((i) => (i.id === item.id ? item : i))
            : [item, ...s.closet],
        })),
      removePiece: (id) =>
        update((s) => ({
          ...s,
          closet: s.closet.filter((i) => i.id !== id),
          trips: s.trips.map((t) => ({ ...t, looks: forgetPiece(t.looks, id) })),
        })),
      setUnit: (unit) => update((s) => ({ ...s, unit })),
    }),
    [saved, ready, update],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside TripProvider");
  return s;
}

/** The open trip, with everything that changes it. */
export function useTrip() {
  const s = useStore();
  const a = s.active;
  const up = (fn: (t: TripState) => TripState) => {
    if (a) s.updateTrip(a.id, fn);
  };
  return {
    ready: s.ready,
    id: a?.id ?? null,
    trip: a?.trip ?? null,
    done: a?.done ?? {},
    packed: a?.packed ?? {},
    weather: a?.weather ?? null,
    looks: a?.looks ?? {},
    plans: a?.plans ?? {},
    closet: s.closet,
    unit: s.unit,
    setUnit: s.setUnit,
    setTrip: (trip: Trip | null) => (trip ? s.addTrip(trip) : a && s.removeTrip(a.id)),
    setTravelers: (travelers: Traveler[]) => up((t) => ({ ...t, trip: { ...t.trip, travelers } })),
    toggleDone: (id: string) => up((t) => ({ ...t, done: { ...t.done, [id]: !t.done[id] } })),
    togglePacked: (id: string) => up((t) => ({ ...t, packed: { ...t.packed, [id]: !t.packed[id] } })),
    setWeather: (weather: SavedWeather) => up((t) => ({ ...t, weather })),
    addToLook: (date: IsoDate, slot: LookSlot, itemId: string) =>
      up((t) => ({ ...t, looks: addToLook(t.looks, date, slot, itemId) })),
    removeFromLook: (date: IsoDate, slot: LookSlot, itemId: string) =>
      up((t) => ({ ...t, looks: removeFromLook(t.looks, date, slot, itemId) })),
    togglePlan: (date: IsoDate, plan: string) =>
      up((t) => {
        const current = t.plans[date] ?? [];
        const next = current.includes(plan) ? current.filter((p) => p !== plan) : [...current, plan];
        return { ...t, plans: { ...t.plans, [date]: next } };
      }),
  };
}
