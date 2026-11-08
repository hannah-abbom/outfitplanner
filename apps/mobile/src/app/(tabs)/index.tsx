import {
  buildDays,
  daysUntil,
  dueSoon,
  groupDays,
  requirementsFor,
  type DayItem,
  type TripDay,
} from "@trip/core";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Button, Card, Eyebrow, Mono, Muted, Screen, Strong, Title } from "@/components/ui";
import { Fonts, Radius, Space, STOP_COLORS, usePalette } from "@/constants/theme";
import { dateBlock, nights, rangeLabel, todayIso } from "@/lib/format";
import { sampleTrip } from "@/lib/import";
import { useTrip } from "@/state/trip-store";

export default function ItineraryScreen() {
  const { trip, done, setTrip } = useTrip();
  const c = usePalette();

  const view = useMemo(() => {
    if (!trip) return null;
    const days = buildDays(trip);
    // One line per task, even when it applies to both travelers.
    const seen = new Set<string>();
    const due = dueSoon(requirementsFor(trip))
      .filter((r) => !done[r.id])
      .filter((r) => {
        const key = r.id.slice(r.traveler.length + 1);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    return { days, groups: groupDays(days), due, countdown: daysUntil(trip, todayIso()) };
  }, [trip, done]);

  if (!trip || !view) {
    return (
      <Screen>
        <Eyebrow>Trip Wardrobe</Eyebrow>
        <Title>Your whole trip, in one place</Title>
        <Body style={{ color: c.muted }}>
          Paste your travel agent’s itinerary link. We lay out every flight and night, check what each
          passport needs, and build your packing list.
        </Body>
        <View style={{ gap: Space.sm, marginTop: Space.md }}>
          <Button label="Import my itinerary" onPress={() => router.push("/add")} />
          <Button
            label="Look around with a sample trip"
            kind="secondary"
            onPress={() => setTrip(sampleTrip())}
          />
        </View>
      </Screen>
    );
  }

  const stays = trip.stays;
  const firstDue = view.due[0];
  return (
    <Screen>
      <View style={{ gap: 6 }}>
        <Eyebrow>{rangeLabel(trip.start, trip.end)}</Eyebrow>
        <Title>{trip.name}</Title>
        <View style={{ flexDirection: "row", alignItems: "center", gap: Space.sm, flexWrap: "wrap" }}>
          <Muted>
            {trip.travelers.length ? trip.travelers.map((t) => t.name).join(" & ") : "Add who’s traveling"} ·{" "}
            {nights(stays.reduce((n, s) => n + s.nights, 0))}
          </Muted>
          {view.countdown > 0 && (
            <View
              style={{
                backgroundColor: c.accentSoft,
                borderRadius: Radius.pill,
                paddingHorizontal: 9,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 12, color: c.accent }}>
                {view.countdown} day{view.countdown === 1 ? "" : "s"} to go
              </Text>
            </View>
          )}
        </View>
      </View>

      {stays.length > 0 && (
        <Card style={{ gap: Space.sm }}>
          <View style={{ flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", gap: 3 }}>
            {stays.map((s, i) => (
              <View
                key={s.id}
                style={{ flex: Math.max(1, s.nights), backgroundColor: STOP_COLORS[i % STOP_COLORS.length] }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: Space.md, rowGap: 6 }}>
            {stays.map((s, i) => (
              <View
                key={s.id}
                style={{ flexDirection: "row", alignItems: "center", gap: 5, maxWidth: "100%" }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: STOP_COLORS[i % STOP_COLORS.length],
                  }}
                />
                <Text
                  numberOfLines={1}
                  style={{ fontFamily: Fonts.medium, fontSize: 12, color: c.ink, flexShrink: 1 }}
                >
                  {s.name}
                </Text>
                <Mono>{s.nights}n</Mono>
              </View>
            ))}
          </View>
        </Card>
      )}

      {trip.travelers.length === 0 ? (
        <Banner
          tone="bad"
          title="Add who’s traveling"
          detail="Entry rules depend on each passport."
          onPress={() => router.push("/add")}
        />
      ) : (
        firstDue && (
          <Banner
            tone={firstDue.status === "todo" ? "bad" : "soon"}
            title={firstDue.title}
            detail={
              view.due.length > 1 ? `${view.due.length - 1} more to do before you go` : "Last thing to do"
            }
            onPress={() => router.push("/ready")}
          />
        )
      )}

      {view.groups.map((g) => {
        const color = g.stay
          ? STOP_COLORS[stays.findIndex((s) => s.id === g.stay?.id) % STOP_COLORS.length]
          : c.muted;
        return (
          <View
            key={`${g.stay?.id ?? "travel"}-${g.days[0]?.date}`}
            style={{ gap: Space.sm, marginTop: Space.xs }}
          >
            <Eyebrow style={{ color }}>
              {g.stay ? `${g.stay.name} · ${nights(g.stay.nights)}` : "On the way"}
            </Eyebrow>
            {g.days.map((d) => (
              <DayCard key={d.date} day={d} />
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

function Banner({
  tone,
  title,
  detail,
  onPress,
}: {
  tone: "bad" | "soon";
  title: string;
  detail: string;
  onPress: () => void;
}) {
  const c = usePalette();
  const [bg, fg] = tone === "bad" ? [c.badSoft, c.bad] : [c.brassSoft, c.brass];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: Radius.md,
        backgroundColor: bg,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Icon name="shield" color={fg} size={20} />
      <Text style={{ flex: 1, fontFamily: Fonts.body, fontSize: 14, color: fg }}>
        <Text style={{ fontFamily: Fonts.bold }}>{title}</Text> · {detail}
      </Text>
      <Icon name="chevronRight" color={fg} size={18} />
    </Pressable>
  );
}

function itemLine(item: DayItem): { time: string | null; text: string; warn?: boolean } {
  switch (item.kind) {
    case "depart":
      return {
        time: item.time,
        text: `${item.flight.from.code} → ${item.flight.to.code}${item.flight.flightNumber ? ` · ${item.flight.flightNumber}` : ""}`,
      };
    case "arrive":
      return { time: item.time, text: `Land in ${item.flight.to.city ?? item.flight.to.code}` };
    case "check-in":
      return { time: null, text: `Check in at ${item.stay.name}` };
    case "check-out":
      return { time: null, text: `Check out of ${item.stay.name}` };
    case "gap":
      return item.gap.kind === "no-transfer"
        ? { time: null, text: `No transfer booked to ${item.gap.stayName}`, warn: true }
        : { time: null, text: "No place to stay booked tonight", warn: true };
  }
}

function DayCard({ day }: { day: TripDay }) {
  const c = usePalette();
  const block = dateBlock(day.date);
  const lines = day.items.filter((i) => i.kind !== "check-out" || day.items.length === 1).map(itemLine);
  return (
    <Card
      onPress={() => router.push({ pathname: "/day/[date]", params: { date: day.date } })}
      style={{ flexDirection: "row", gap: Space.md }}
    >
      <View style={{ width: 44, alignItems: "center" }}>
        <Mono style={{ fontSize: 11 }}>{block.weekday}</Mono>
        <Text style={{ fontFamily: Fonts.display, fontSize: 26, lineHeight: 30, color: c.ink }}>
          {block.day}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3, justifyContent: "center" }}>
        {lines.length === 0 && <Muted>{day.sleep ? `At ${day.sleep.name}` : "Nothing booked"}</Muted>}
        {lines.map((l, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8 }}>
            {l.time && <Mono style={{ paddingTop: 2 }}>{l.time}</Mono>}
            {l.warn ? (
              <Text style={{ flex: 1, fontFamily: Fonts.semibold, fontSize: 13, color: c.warn }}>
                {l.text}
              </Text>
            ) : (
              <Strong style={{ flex: 1, fontFamily: Fonts.body, fontSize: 14 }}>{l.text}</Strong>
            )}
          </View>
        ))}
      </View>
    </Card>
  );
}
