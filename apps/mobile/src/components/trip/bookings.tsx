import { dateOf, type Flight, type Gap, type IsoDate, type Stay } from "@trip/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Icon, type IconName } from "@/components/icons";
import { Chip, Eyebrow, Mono, Muted, Row, Rule, Serif } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dayLabel, nights } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

type Item = { date: IsoDate; order: string } & (
  { kind: "flight"; flight: Flight } | { kind: "stay"; stay: Stay } | { kind: "gap"; gap: Gap }
);
type Filter = "all" | "flights" | "stays";

/** Every reservation by date, saved on the phone for when there's no signal (BKG-01). */
export function Bookings() {
  const c = usePalette();
  const { trip } = useTrip();
  const [filter, setFilter] = useState<Filter>("all");

  const items = useMemo<Item[]>(() => {
    if (!trip) return [];
    const all: Item[] = [
      ...trip.flights.map((f) => ({
        kind: "flight" as const,
        flight: f,
        date: dateOf(f.departs),
        order: f.departs.slice(11),
      })),
      ...trip.stays.map((s) => ({ kind: "stay" as const, stay: s, date: s.checkIn, order: "23:59" })),
      ...trip.gaps
        .filter((g) => g.kind === "no-transfer")
        .map((g) => ({ kind: "gap" as const, gap: g, date: g.date, order: "23:58" })),
    ];
    return all
      .filter((x) => filter === "all" || (filter === "flights" ? x.kind === "flight" : x.kind === "stay"))
      .sort((a, b) => a.date.localeCompare(b.date) || a.order.localeCompare(b.order));
  }, [trip, filter]);
  if (!trip) return null;

  const dates = [...new Set(items.map((r) => r.date))];
  return (
    <View style={{ gap: Space.sm, marginTop: Space.sm }}>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Chip
          label={`All ${trip.flights.length + trip.stays.length}`}
          on={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <Chip
          label={`Flights ${trip.flights.length}`}
          on={filter === "flights"}
          onPress={() => setFilter("flights")}
        />
        <Chip
          label={`Stays ${trip.stays.length}`}
          on={filter === "stays"}
          onPress={() => setFilter("stays")}
        />
      </View>
      {dates.map((date) => {
        const mine = items.filter((r) => r.date === date);
        return (
          <View key={date} style={{ marginTop: Space.md }}>
            <Eyebrow style={{ marginBottom: 6 }}>{dayLabel(date)}</Eyebrow>
            <Rule strong />
            {mine.map((r, i) => {
              const last = i === mine.length - 1;
              if (r.kind === "flight") {
                const f = r.flight;
                return (
                  <Line
                    key={f.id}
                    icon="plane"
                    title={`${f.from.city ?? f.from.code} to ${f.to.city ?? f.to.code}`}
                    detail={`${f.departs.slice(11)}${f.airline || f.flightNumber ? ` · ${[f.airline, f.flightNumber].filter(Boolean).join(" ")}` : ""}`}
                    pdf={f.voucherIds.length > 0}
                    last={last}
                    onPress={() => router.push({ pathname: "/flight/[id]", params: { id: f.id } })}
                  />
                );
              }
              if (r.kind === "stay") {
                const s = r.stay;
                return (
                  <Line
                    key={s.id}
                    icon="bed"
                    title={s.name}
                    detail={`${nights(s.nights)}${s.room ? ` · ${s.room}` : ""}`}
                    pdf={s.voucherIds.length > 0}
                    last={last}
                    onPress={() => router.push({ pathname: "/stay/[id]", params: { id: s.id } })}
                  />
                );
              }
              const g = r.gap;
              if (g.kind !== "no-transfer") return null;
              return (
                <Row key={`gap-${g.date}-${g.airport}`} last={last}>
                  <Icon name="alert" color={c.accent} size={20} strokeWidth={1.4} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: c.accent }}>
                      No transfer booked
                    </Text>
                    <Muted>
                      {g.airport} airport to {g.stayName}. Ask the hotel or your agent.
                    </Muted>
                  </View>
                </Row>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

function Line({
  icon,
  title,
  detail,
  pdf,
  last,
  onPress,
}: {
  icon: IconName;
  title: string;
  detail: string;
  pdf: boolean;
  last: boolean;
  onPress: () => void;
}) {
  const c = usePalette();
  return (
    <Row onPress={onPress} last={last}>
      <Icon name={icon} color={c.ink} size={20} strokeWidth={1.3} />
      <View style={{ flex: 1 }}>
        <Serif size={18} numberOfLines={2}>
          {title}
        </Serif>
        <Muted>{detail}</Muted>
      </View>
      {pdf && <Mono>PDF</Mono>}
    </Row>
  );
}
