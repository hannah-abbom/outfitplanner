import { buildDays, groupDays, type DayItem, type TripDay } from "@trip/core";
import { router } from "expo-router";
import { Text, View } from "react-native";

import { WeatherBadge } from "@/components/weather";
import { Eyebrow, Mono, Muted, Row, Rule, Serif, Strong } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dateBlock, dayLabel, nights, roman } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** The shape of the trip: its chapters, then every day in local time with the weather (TRP-03, TRP-04). */
export function Itinerary() {
  const { trip } = useTrip();
  if (!trip) return null;
  const groups = groupDays(buildDays(trip));
  const chapterOf = (i: number) => groups.slice(0, i + 1).filter((g) => g.stay).length;
  return (
    <View style={{ gap: Space.md }}>
      <Eyebrow style={{ marginTop: Space.sm }}>Chapters</Eyebrow>
      <Rule strong />
      {trip.stays.map((s, i) => (
        <Row
          key={s.id}
          last={i === trip.stays.length - 1}
          onPress={() => router.push({ pathname: "/stay/[id]", params: { id: s.id } })}
        >
          <Mono style={{ width: 28 }}>{roman(i + 1)}</Mono>
          <View style={{ flex: 1 }}>
            <Serif size={18} numberOfLines={1}>
              {s.name}
            </Serif>
            <Muted>
              {dayLabel(s.checkIn)} · {nights(s.nights)}
            </Muted>
          </View>
        </Row>
      ))}

      {groups.map((g, gi) => {
        const chapter = chapterOf(gi);
        return (
          <View key={`${g.stay?.id ?? "travel"}-${g.days[0]?.date}`} style={{ marginTop: Space.lg }}>
            <Eyebrow>
              {g.stay ? `Chapter ${roman(chapter)} · ${nights(g.stay.nights)}` : "On the way"}
            </Eyebrow>
            <Serif size={22} style={{ marginTop: 2, marginBottom: Space.sm }} numberOfLines={2}>
              {g.stay ? g.stay.name : "Travel days"}
            </Serif>
            <Rule strong />
            {g.days.map((d, i) => (
              <DayRow key={d.date} day={d} last={i === g.days.length - 1} />
            ))}
          </View>
        );
      })}
    </View>
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

function DayRow({ day, last }: { day: TripDay; last: boolean }) {
  const c = usePalette();
  const block = dateBlock(day.date);
  const lines = day.items.filter((i) => i.kind !== "check-out" || day.items.length === 1).map(itemLine);
  return (
    <Row
      last={last}
      onPress={() => router.push({ pathname: "/day/[date]", params: { date: day.date } })}
      style={{ alignItems: "flex-start" }}
    >
      <View style={{ width: 40 }}>
        <Eyebrow style={{ fontSize: 9.5 }}>{block.weekday}</Eyebrow>
        <Text style={{ fontFamily: Fonts.serifUpright, fontSize: 26, lineHeight: 30, color: c.ink }}>
          {block.day}
        </Text>
      </View>
      <View style={{ flex: 1, gap: 3, paddingTop: 2 }}>
        {lines.length === 0 && <Muted>{day.sleep ? `At ${day.sleep.name}` : "Nothing booked"}</Muted>}
        {lines.map((l, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 8 }}>
            {l.time && <Mono style={{ paddingTop: 2 }}>{l.time}</Mono>}
            {l.warn ? (
              <Text style={{ flex: 1, fontFamily: Fonts.medium, fontSize: 13, color: c.accent }}>
                {l.text}
              </Text>
            ) : (
              <Strong style={{ flex: 1, fontFamily: Fonts.body, fontSize: 14 }}>{l.text}</Strong>
            )}
          </View>
        ))}
      </View>
      <WeatherBadge date={day.date} />
    </Row>
  );
}
