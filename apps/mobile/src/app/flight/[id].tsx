import { toEpochMs, type Flight } from "@trip/core";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackHeader } from "@/components/back-header";
import { Icon } from "@/components/icons";
import { Muted, Screen } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dayLabel } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** A flight you can read at a glance, dark like a departures board (FLT-01). */
export default function FlightScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip();
  const c = usePalette();
  const insets = useSafeAreaInsets();
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
  const minutes = dep !== null && arr !== null ? Math.round((arr - dep) / 60_000) : null;
  const shift = clockShift(flight);
  const vouchers = trip.vouchers.filter((v) => flight.voucherIds.includes(v.id));
  const fg = c.onPass;
  const dim = c.passMuted;
  const cap = { fontFamily: Fonts.medium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase" as const, color: dim };

  return (
    <View style={{ flex: 1, backgroundColor: c.pass }}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + Space.sm, paddingHorizontal: Space.xl, paddingBottom: insets.bottom + 40, gap: Space.md }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <BackHeader label="Back" color={fg} />
          <Text style={{ fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1, color: fg }}>{flight.flightNumber ?? ""}</Text>
        </View>

        <Text style={[cap, { marginTop: Space.md }]}>
          {dayLabel(flight.departs.slice(0, 10))}
          {flight.airline ? ` · ${flight.airline}` : ""}
        </Text>
        <Text style={{ fontFamily: Fonts.serif, fontSize: 44, lineHeight: 46, color: fg }}>
          {flight.from.city ?? flight.from.code}
          {"\n"}
          <Text style={{ color: "#6e6e6e" }}>to </Text>
          {flight.to.city ?? flight.to.code}
        </Text>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: Space.lg }}>
          <End code={flight.from.code} time={flight.departs.slice(11)} note="Local time" />
          {flight.arrives && <End code={flight.to.code} time={flight.arrives.slice(11)} note={flight.arrives.slice(0, 10) !== flight.departs.slice(0, 10) ? `Local · ${dayLabel(flight.arrives.slice(0, 10))}` : "Local time"} right />}
        </View>

        <View style={{ height: 20, marginTop: Space.md, justifyContent: "center" }} accessibilityElementsHidden>
          <View style={{ height: 1, backgroundColor: c.passLine }} />
          <View style={{ position: "absolute", left: 0, width: 9, height: 9, borderRadius: 5, backgroundColor: fg }} />
          <View style={{ position: "absolute", left: 16, transform: [{ rotate: "45deg" }] }}>
            <Icon name="plane" color={fg} size={16} strokeWidth={1.4} />
          </View>
          <View style={{ position: "absolute", right: 0, width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: fg }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[cap, { color: fg }]}>{flight.from.code}</Text>
          {minutes !== null && <Text style={cap}>{`${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} m in the air`}</Text>}
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: Space.xl, marginTop: Space.md }}>
          <Cell label="Terminal" value={flight.terminal ?? "—"} />
          <Cell label="Gate" value="—" />
          <Cell label="Seats" value="—" />
          <Cell label="Time change" value={shift} />
        </View>
        <Text style={{ fontFamily: Fonts.body, fontSize: 11.5, color: "#6e6e6e" }}>Gate and seats fill in once live flight status is connected.</Text>

        {vouchers.map((v) => (
          <Pressable
            key={v.id}
            accessibilityRole="link"
            disabled={!v.url}
            onPress={() => v.url && Linking.openURL(v.url)}
            style={{ flexDirection: "row", alignItems: "center", gap: Space.md, padding: Space.lg, borderRadius: 14, backgroundColor: "#171717" }}
          >
            <Icon name="file" color={fg} size={18} strokeWidth={1.4} />
            <Text style={{ flex: 1, fontFamily: Fonts.body, fontSize: 14, color: fg }} numberOfLines={2}>
              {v.name}
            </Text>
            {v.url && <Icon name="chevronRight" color={dim} size={16} strokeWidth={1.4} />}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function clockShift(f: Flight): string {
  if (!f.from.timeZone || !f.to.timeZone) return "—";
  const at = new Date(Date.parse(`${f.departs}:00Z`));
  const offset = (tz: string) => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(at);
    const m = /GMT([+-])(\d{2}):?(\d{2})?/.exec(parts.find((p) => p.type === "timeZoneName")?.value ?? "");
    if (!m) return 0;
    return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
  };
  const diff = (offset(f.to.timeZone) - offset(f.from.timeZone)) / 60;
  if (diff === 0) return "None";
  const h = Math.abs(diff);
  return `${diff > 0 ? "+" : "−"}${h} hour${h === 1 ? "" : "s"}`;
}

function End({ code, time, note, right }: { code: string; time: string; note: string; right?: boolean }) {
  const c = usePalette();
  return (
    <View style={{ alignItems: right ? "flex-end" : "flex-start" }}>
      <Text style={{ fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 1.2, color: c.passMuted }}>{code}</Text>
      <Text style={{ fontFamily: Fonts.light, fontSize: 52, letterSpacing: -2, lineHeight: 58, color: c.onPass }}>{time}</Text>
      <Text style={{ fontFamily: Fonts.body, fontSize: 12, color: c.passMuted }}>{note}</Text>
    </View>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  const c = usePalette();
  return (
    <View style={{ width: "45%", paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: c.passLine }}>
      <Text style={{ fontFamily: Fonts.medium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: c.passMuted }}>{label}</Text>
      <Text style={{ fontFamily: Fonts.light, fontSize: 22, letterSpacing: -0.4, color: c.onPass, marginTop: 6 }}>{value}</Text>
    </View>
  );
}
