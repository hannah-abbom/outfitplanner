import { clothingHints, weatherKind, weatherLabel, type DayWeather } from "@trip/core";
import { Text, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Card, Eyebrow, Muted, Tag } from "@/components/ui";
import { Fonts, Space, usePalette, type Palette } from "@/constants/theme";
import { temp } from "@/lib/weather";
import { useTrip } from "@/state/trip-store";

function skyColor(w: DayWeather, c: Palette): string {
  const kind = weatherKind(w.code);
  if (kind === "sun" || kind === "partly") return c.brass;
  if (kind === "rain" || kind === "storm") return c.accent;
  return c.muted;
}

/** Icon and high/low for a day card. Renders nothing until the weather has loaded. */
export function WeatherBadge({ date }: { date: string }) {
  const c = usePalette();
  const { weather, unit } = useTrip();
  const w = weather?.byDate[date];
  if (!w) return null;
  return (
    <View
      style={{ alignItems: "flex-end", gap: 2, minWidth: 54 }}
      accessibilityLabel={`${weatherLabel(w.code)}, high ${temp(w.hi, unit)}, low ${temp(w.lo, unit)}`}
    >
      <Icon name={weatherKind(w.code)} color={skyColor(w, c)} size={22} />
      <Text style={{ fontFamily: Fonts.mono, fontSize: 12, color: c.ink }}>
        {temp(w.hi, unit)}
        <Text style={{ color: c.muted }}>/{temp(w.lo, unit)}</Text>
      </Text>
    </View>
  );
}

/** The day's weather, where it comes from, and what it means for what to wear (WX-01, WX-02). */
export function WeatherCard({ date }: { date: string }) {
  const c = usePalette();
  const { weather, unit } = useTrip();
  const w = weather?.byDate[date];
  if (!w) {
    return (
      <Card>
        <Muted>Weather appears here once it has loaded. It needs a connection the first time.</Muted>
      </Card>
    );
  }
  const typical = w.source === "typical";
  return (
    <Card style={{ gap: Space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}>
        <Icon name={weatherKind(w.code)} color={skyColor(w, c)} size={40} strokeWidth={1.6} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Fonts.mono, fontSize: 22, color: c.ink }}>
            {temp(w.hi, unit)}
            <Text style={{ color: c.muted }}> / {temp(w.lo, unit)}</Text>
          </Text>
          <Muted>
            {typical
              ? `Usually ${weatherLabel(w.code).toLowerCase()} · rain on ${w.rainChance}% of days`
              : `${weatherLabel(w.code)} · ${w.rainChance}% chance of rain`}
          </Muted>
        </View>
        <Tag tone={typical ? "check" : "accent"}>{typical ? "Typical" : "Forecast"}</Tag>
      </View>
      <View style={{ gap: 4, paddingTop: Space.sm, borderTopWidth: 1, borderTopColor: c.sunk }}>
        <Eyebrow>What to wear</Eyebrow>
        {clothingHints(w).map((h) => (
          <Body key={h} style={{ fontSize: 14 }}>
            {h}
          </Body>
        ))}
      </View>
      <Muted style={{ fontSize: 11.5 }}>
        {typical ? "Average of the same dates over the last five years, at " : "Forecast for "}
        {w.place}. Open-Meteo.
      </Muted>
    </Card>
  );
}
