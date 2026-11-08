import { dateOf, type Flight, type Gap, type IsoDate, type Stay } from "@trip/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Card, Eyebrow, Mono, Muted, Screen, Segmented, Strong, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { dayLabel, nights } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

type Row = { date: IsoDate; order: string } & (
  { kind: "flight"; flight: Flight } | { kind: "stay"; stay: Stay } | { kind: "gap"; gap: Gap }
);
type Filter = "all" | "flights" | "stays";

export default function BookingsScreen() {
  const { trip } = useTrip();
  const c = usePalette();
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo<Row[]>(() => {
    if (!trip) return [];
    const r: Row[] = [
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
    return r
      .filter((x) => filter === "all" || (filter === "flights" ? x.kind === "flight" : x.kind === "stay"))
      .sort((a, b) => a.date.localeCompare(b.date) || a.order.localeCompare(b.order));
  }, [trip, filter]);

  if (!trip) {
    return (
      <Screen>
        <Title>Bookings</Title>
        <Muted>Import your itinerary to see every flight and stay here, saved on your phone.</Muted>
      </Screen>
    );
  }

  const dates = [...new Set(rows.map((r) => r.date))];
  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <Title>Bookings</Title>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 6 }}>
          <Icon name="check" color={c.good} size={14} strokeWidth={2.4} />
          <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: c.good }}>Saved on this phone</Text>
        </View>
      </View>
      <Segmented<Filter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All ${trip.flights.length + trip.stays.length}` },
          { value: "flights", label: `Flights ${trip.flights.length}` },
          { value: "stays", label: `Stays ${trip.stays.length}` },
        ]}
      />
      {dates.map((date) => (
        <View key={date} style={{ gap: Space.sm, marginTop: Space.xs }}>
          <Eyebrow>{dayLabel(date)}</Eyebrow>
          {rows
            .filter((r) => r.date === date)
            .map((r) => {
              if (r.kind === "flight") {
                const f = r.flight;
                return (
                  <Card
                    key={f.id}
                    onPress={() => router.push({ pathname: "/flight/[id]", params: { id: f.id } })}
                    style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}
                  >
                    <IconTile name="plane" bg={c.accentSoft} fg={c.accent} />
                    <View style={{ flex: 1 }}>
                      <Strong>
                        {f.from.city ?? f.from.code} → {f.to.city ?? f.to.code}
                      </Strong>
                      <Muted>
                        Departs {f.departs.slice(11)}
                        {f.airline || f.flightNumber
                          ? ` · ${[f.airline, f.flightNumber].filter(Boolean).join(" ")}`
                          : ""}
                      </Muted>
                    </View>
                    {f.voucherIds.length > 0 && <Mono>PDF</Mono>}
                  </Card>
                );
              }
              if (r.kind === "stay") {
                const s = r.stay;
                return (
                  <Card
                    key={s.id}
                    onPress={() => router.push({ pathname: "/stay/[id]", params: { id: s.id } })}
                    style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}
                  >
                    <IconTile name="bed" bg={c.brassSoft} fg={c.brass} />
                    <View style={{ flex: 1 }}>
                      <Strong numberOfLines={2}>{s.name}</Strong>
                      <Muted>
                        {nights(s.nights)}
                        {s.room ? ` · ${s.room}` : ""}
                      </Muted>
                    </View>
                    {s.voucherIds.length > 0 && <Mono>PDF</Mono>}
                  </Card>
                );
              }
              const g = r.gap;
              if (g.kind !== "no-transfer") return null;
              return (
                <View
                  key={`gap-${g.date}-${g.airport}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Space.md,
                    padding: Space.md,
                    borderRadius: Radius.md,
                    borderWidth: 1.5,
                    borderStyle: "dashed",
                    borderColor: c.warn,
                    backgroundColor: c.warnSoft,
                  }}
                >
                  <IconTile name="alert" bg={c.surface} fg={c.warn} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: c.warn }}>
                      No transfer booked
                    </Text>
                    <Body style={{ fontSize: 13, color: c.warn }}>
                      {g.airport} airport → {g.stayName}. Ask the hotel or your agent.
                    </Body>
                  </View>
                </View>
              );
            })}
        </View>
      ))}
    </Screen>
  );
}

function IconTile({ name, bg, fg }: { name: "plane" | "bed" | "alert"; bg: string; fg: string }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon name={name} color={fg} size={20} />
    </View>
  );
}
