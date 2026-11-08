import { buildDays, LOOK_SLOTS, piecesOf, type DayItem } from "@trip/core";
import { router, useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { BackHeader } from "@/components/back-header";
import { PieceThumb } from "@/components/piece";
import { Button, Card, Eyebrow, Mono, Muted, Rule, Screen, Serif, Strong, Title } from "@/components/ui";
import { WeatherCard } from "@/components/weather";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { longDay } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** Everything about one day: the weather, what you're wearing, and what happens, in local time. */
export default function DayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const { trip, looks, closet } = useTrip();
  const days = trip ? buildDays(trip) : [];
  const day = days.find((d) => d.date === date);

  if (!trip || !day) {
    return (
      <Screen tabs={false}>
        <BackHeader label="Back" />
        <Muted>This day isn’t in your trip.</Muted>
      </Screen>
    );
  }

  const travel = day.items.some((i) => i.kind === "depart" || i.kind === "arrive");
  return (
    <Screen tabs={false}>
      <BackHeader label="Back" />
      <View style={{ gap: 4 }}>
        <Eyebrow>
          Day {String(day.number).padStart(2, "0")} / {String(days.length).padStart(2, "0")}
        </Eyebrow>
        <Title>{longDay(day.date)}</Title>
        <Muted>{day.sleep ? `Tonight: ${day.sleep.name}` : "No bed tonight: you’re traveling"}</Muted>
      </View>
      <WeatherCard date={day.date} />

      <Eyebrow style={{ marginTop: Space.md }}>The looks</Eyebrow>
      <Rule strong />
      {LOOK_SLOTS.map((slot) => {
        const pieces = piecesOf(looks[day.date]?.[slot], closet);
        return (
          <View key={slot} style={{ gap: 6 }}>
            <Eyebrow style={{ fontSize: 9.5 }}>{slot === "day" ? (travel ? "Travel" : "Day") : "Evening"}</Eyebrow>
            {pieces.length ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {pieces.map((p) => (
                  <View key={p.id} style={{ width: 64, gap: 4 }}>
                    <PieceThumb item={p} width={64} />
                    <Muted numberOfLines={2} style={{ fontSize: 11, lineHeight: 14 }}>
                      {p.name}
                    </Muted>
                  </View>
                ))}
              </View>
            ) : (
              <Muted>Nothing yet.</Muted>
            )}
          </View>
        );
      })}
      <Button label="Plan in Outfits" kind="secondary" onPress={() => router.push("/outfits")} />

      <Eyebrow style={{ marginTop: Space.lg }}>The day</Eyebrow>
      <Rule strong />
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
  return (
    <View style={{ flexDirection: "row", gap: Space.sm }}>
      <Mono style={{ width: 44, paddingTop: 16 }}>{time}</Mono>
      <View style={{ width: 12, alignItems: "center" }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: item.kind === "gap" ? c.accent : c.ink, marginTop: 20 }} />
        {!last && <View style={{ flex: 1, width: 1, backgroundColor: c.line }} />}
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
          <Serif size={18}>{item.kind === "depart" ? `Fly ${f.from.code} to ${f.to.code}` : `Land in ${f.to.city ?? f.to.code}`}</Serif>
          <Muted>{[f.airline, f.flightNumber].filter(Boolean).join(" ") || "Flight"} · local time</Muted>
        </Card>
      );
    }
    case "check-in":
    case "check-out":
      return (
        <Card onPress={() => router.push({ pathname: "/stay/[id]", params: { id: item.stay.id } })}>
          <Serif size={18}>{item.kind === "check-in" ? `Check in at ${item.stay.name}` : `Check out of ${item.stay.name}`}</Serif>
          {item.kind === "check-in" && item.stay.room && <Muted>{item.stay.room}</Muted>}
        </Card>
      );
    case "gap":
      return (
        <View style={{ borderLeftWidth: 2, borderLeftColor: c.accent, paddingLeft: 14, paddingVertical: 8 }}>
          <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: c.accent }}>
            {item.gap.kind === "no-transfer" ? "No transfer booked" : "No place to stay booked"}
          </Text>
          <Strong style={{ fontFamily: Fonts.body, fontSize: 13, color: c.muted }}>
            {item.gap.kind === "no-transfer"
              ? `From ${item.gap.airport} airport to ${item.gap.stayName}. Ask the hotel or your agent.`
              : "Check with your agent where you’re sleeping."}
          </Strong>
        </View>
      );
  }
}
