import { buildDays, type DayItem } from "@trip/core";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { BackHeader } from "@/components/back-header";
import { Card, Eyebrow, Mono, Muted, Screen, Strong, Title } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { longDay } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { trip } = useTrip();
  const c = usePalette();
  const days = trip ? buildDays(trip) : [];
  const day = days.find((d) => d.date === date);

  if (!trip || !day) {
    return (
      <Screen tabs={false}>
        <BackHeader label="Itinerary" />
        <Muted>This day isn’t in your trip.</Muted>
      </Screen>
    );
  }

  return (
    <Screen tabs={false}>
      <BackHeader label="Itinerary" />
      <View style={{ gap: 4 }}>
        <Eyebrow style={{ color: c.brass }}>
          Day {String(day.number).padStart(2, "0")} / {String(days.length).padStart(2, "0")}
        </Eyebrow>
        <Title>{longDay(day.date)}</Title>
        <Muted>{day.sleep ? `Tonight: ${day.sleep.name}` : "No bed tonight: you’re traveling"}</Muted>
      </View>
      {day.items.length === 0 && <Muted>Nothing booked. A free day.</Muted>}
      <View>
        {day.items.map((item, i) => (
          <Step key={i} item={item} last={i === day.items.length - 1} />
        ))}
      </View>
    </Screen>
  );
}

function Step({ item, last }: { item: DayItem; last: boolean }) {
  const c = usePalette();
  const time = item.kind === "depart" || item.kind === "arrive" ? item.time : "";
  const dot =
    item.kind === "gap" ? c.warn : item.kind === "check-in" || item.kind === "check-out" ? c.brass : c.accent;
  return (
    <View style={{ flexDirection: "row", gap: Space.sm }}>
      <Mono style={{ width: 44, paddingTop: 14 }}>{time}</Mono>
      <View style={{ width: 16, alignItems: "center" }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dot, marginTop: 18 }} />
        {!last && <View style={{ flex: 1, width: 2, backgroundColor: c.line }} />}
      </View>
      <View style={{ flex: 1, paddingVertical: 6 }}>
        <Content item={item} />
      </View>
    </View>
  );
}

function Content({ item }: { item: DayItem }) {
  const c = usePalette();
  switch (item.kind) {
    case "depart":
    case "arrive": {
      const f = item.flight;
      return (
        <Card onPress={() => router.push({ pathname: "/flight/[id]", params: { id: f.id } })}>
          <Strong>
            {item.kind === "depart"
              ? `Fly ${f.from.code} → ${f.to.code}`
              : `Land in ${f.to.city ?? f.to.code}`}
          </Strong>
          <Muted>{[f.airline, f.flightNumber].filter(Boolean).join(" ") || "Flight"} · local time</Muted>
        </Card>
      );
    }
    case "check-in":
    case "check-out":
      return (
        <Card onPress={() => router.push({ pathname: "/stay/[id]", params: { id: item.stay.id } })}>
          <Strong>
            {item.kind === "check-in" ? `Check in at ${item.stay.name}` : `Check out of ${item.stay.name}`}
          </Strong>
          {item.kind === "check-in" && item.stay.room && <Muted>{item.stay.room}</Muted>}
        </Card>
      );
    case "gap":
      return (
        <Card style={{ backgroundColor: c.warnSoft, borderColor: c.warn, borderStyle: "dashed" }}>
          <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: c.warn }}>
            {item.gap.kind === "no-transfer" ? "No transfer booked" : "No place to stay booked"}
          </Text>
          <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.warn }}>
            {item.gap.kind === "no-transfer"
              ? `From ${item.gap.airport} airport to ${item.gap.stayName}. Ask the hotel or your agent.`
              : "Check with your agent where you’re sleeping."}
          </Text>
        </Card>
      );
  }
}
