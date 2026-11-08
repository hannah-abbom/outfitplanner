import { toEpochMs } from "@trip/core";
import { useLocalSearchParams } from "expo-router";
import { Linking, Text, View } from "react-native";

import { BackHeader } from "@/components/back-header";
import { Icon } from "@/components/icons";
import { Card, Eyebrow, Muted, Screen, Strong } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { dayLabel } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** A flight as a boarding pass, readable at the counter (FLT-01). */
export default function FlightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip();
  const c = usePalette();
  const flight = trip?.flights.find((f) => f.id === id);

  if (!trip || !flight) {
    return (
      <Screen tabs={false}>
        <BackHeader label="Back" />
        <Muted>This flight isn’t in your trip.</Muted>
      </Screen>
    );
  }

  const dep = toEpochMs(flight.departs, flight.from.timeZone);
  const arr = flight.arrives ? toEpochMs(flight.arrives, flight.to.timeZone) : null;
  const duration = dep !== null && arr !== null ? Math.round((arr - dep) / 60_000) : null;
  const vouchers = trip.vouchers.filter((v) => flight.voucherIds.includes(v.id));
  const white = c.onPass;

  return (
    <Screen tabs={false}>
      <BackHeader label="Back" />
      <View style={{ backgroundColor: c.pass, borderRadius: Radius.lg, overflow: "hidden" }}>
        <View style={{ padding: Space.xl, gap: Space.lg }}>
          <Text style={{ fontFamily: Fonts.mono, fontSize: 13, letterSpacing: 0.6, color: white }}>
            {[flight.airline, flight.flightNumber].filter(Boolean).join(" · ") || "Flight"}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 40, color: white }}>
                {flight.from.code}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: white, opacity: 0.85 }}>
                {flight.from.city ?? flight.from.name}
              </Text>
            </View>
            <View style={{ paddingBottom: 18, alignItems: "center" }}>
              <Icon name="plane" color={white} size={26} />
              {duration !== null && (
                <Text style={{ fontFamily: Fonts.mono, fontSize: 11, color: white, opacity: 0.85 }}>
                  {Math.floor(duration / 60)}h {duration % 60}m
                </Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 40, color: white }}>
                {flight.to.code}
              </Text>
              <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: white, opacity: 0.85 }}>
                {flight.to.city ?? flight.to.name}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Time
              label="Departs"
              time={flight.departs.slice(11)}
              date={dayLabel(flight.departs.slice(0, 10))}
            />
            {flight.arrives && (
              <Time
                label="Arrives"
                time={flight.arrives.slice(11)}
                date={dayLabel(flight.arrives.slice(0, 10))}
                right
              />
            )}
          </View>
        </View>
        <View style={{ borderTopWidth: 2, borderStyle: "dashed", borderColor: c.passRule }} />
        <View style={{ padding: Space.xl, flexDirection: "row", gap: Space.xl }}>
          <Time label="Terminal" time={flight.terminal ?? "–"} />
          <Time label="Times" time="Local" />
        </View>
      </View>

      <Muted>Each time is in the local time of its airport.</Muted>

      {vouchers.length > 0 && (
        <View style={{ gap: Space.sm }}>
          <Eyebrow>Tickets</Eyebrow>
          {vouchers.map((v) => (
            <Card
              key={v.id}
              onPress={v.url ? () => Linking.openURL(v.url as string) : undefined}
              style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}
            >
              <Icon name="file" color={c.accent} size={20} />
              <Strong style={{ flex: 1 }} numberOfLines={2}>
                {v.name}
              </Strong>
              {v.url && <Icon name="chevronRight" color={c.muted} size={18} />}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function Time({ label, time, date, right }: { label: string; time: string; date?: string; right?: boolean }) {
  const white = usePalette().onPass;
  return (
    <View style={{ alignItems: right ? "flex-end" : "flex-start" }}>
      <Text
        style={{ fontFamily: Fonts.mono, fontSize: 10.5, letterSpacing: 1.2, color: white, opacity: 0.75 }}
      >
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontFamily: Fonts.mono, fontSize: 22, color: white }}>{time}</Text>
      {date && (
        <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: white, opacity: 0.85 }}>{date}</Text>
      )}
    </View>
  );
}
