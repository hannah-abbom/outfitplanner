import { countryName, dueSoon, requirementsFor, type Requirement } from "@trip/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Icon } from "@/components/icons";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Muted,
  Screen,
  Segmented,
  Strong,
  Tag,
  Title,
  type Tone,
} from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dayLabel } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** Things to DO before and during the trip, per traveler (REQ-02 to REQ-04). Bringing things lives in Pack. */
export default function ReadyScreen() {
  const { trip, done, toggleDone } = useTrip();
  const c = usePalette();
  const [who, setWho] = useState<string | null>(null);

  const all = useMemo(() => (trip ? requirementsFor(trip) : []), [trip]);
  if (!trip) {
    return (
      <Screen>
        <Title>Ready</Title>
        <Muted>Import your itinerary to see what each passport needs.</Muted>
      </Screen>
    );
  }
  if (trip.travelers.length === 0) {
    return (
      <Screen>
        <Title>Ready</Title>
        <Body>Entry rules depend on the passport. Add who’s traveling and their nationality.</Body>
        <Button label="Add travelers" onPress={() => router.push("/add")} />
      </Screen>
    );
  }

  const current = who ?? trip.travelers[0]?.name ?? "";
  const mine = all.filter((r) => r.traveler === current);
  const toDo = dueSoon(mine);
  const doneCount = mine.filter((r) => r.status === "ok" || done[r.id]).length;
  const countries = [...new Set(mine.map((r) => r.country))];

  return (
    <Screen>
      <View style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}>
        <Ring done={doneCount} total={mine.length} />
        <View>
          <Title>Ready</Title>
          <Muted>
            {doneCount} of {mine.length} done before you go
          </Muted>
        </View>
      </View>

      {trip.travelers.length > 1 && (
        <Segmented
          value={current}
          onChange={setWho}
          options={trip.travelers.map((t) => ({
            value: t.name,
            label: `${t.name} · ${t.nationalities.join("/")}`,
          }))}
        />
      )}

      <Eyebrow style={{ marginTop: Space.xs }}>To do</Eyebrow>
      {toDo.length === 0 && <Muted>Nothing left. Have a wonderful trip.</Muted>}
      {toDo.map((r) => (
        <RequirementCard key={r.id} r={r} done={!!done[r.id]} onToggle={() => toggleDone(r.id)} />
      ))}

      <Eyebrow style={{ marginTop: Space.sm }}>By country</Eyebrow>
      <Card style={{ padding: 0 }}>
        {countries.map((country) =>
          mine
            .filter((r) => r.country === country && (r.kind === "visa" || r.kind === "passport"))
            .map((r, i, arr) => (
              <View
                key={r.id}
                style={{
                  flexDirection: "row",
                  gap: Space.md,
                  alignItems: "center",
                  padding: Space.md,
                  borderBottomWidth:
                    i === arr.length - 1 && country === countries[countries.length - 1] ? 0 : 1,
                  borderBottomColor: c.sunk,
                }}
              >
                <View style={{ width: 92 }}>
                  <Text
                    style={{
                      fontFamily: Fonts.monoMedium,
                      fontSize: 10,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: c.muted,
                    }}
                  >
                    {countryName(country)}
                  </Text>
                  <Strong style={{ fontSize: 14 }}>{r.title}</Strong>
                </View>
                <Body style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.muted }}>{r.summary}</Body>
                <Tag tone={toneOf(r, !!done[r.id])}>{labelOf(r, !!done[r.id])}</Tag>
              </View>
            )),
        )}
      </Card>
      <Muted style={{ marginTop: Space.xs }}>
        Rules checked {mine[0]?.checkedOn ?? ""}. Always confirm on the official site linked on each item.
      </Muted>
    </Screen>
  );
}

function toneOf(r: Requirement, done: boolean): Tone {
  if (done || r.status === "ok") return "ok";
  return r.status === "todo" ? "todo" : "check";
}
function labelOf(r: Requirement, done: boolean): string {
  if (done) return "Done";
  if (r.status === "ok") return "OK";
  return r.status === "todo" ? "To do" : "Check";
}

function RequirementCard({ r, done, onToggle }: { r: Requirement; done: boolean; onToggle: () => void }) {
  const c = usePalette();
  const when =
    r.dueFrom && r.dueBy
      ? `${dayLabel(r.dueFrom)} – ${dayLabel(r.dueBy)}`
      : r.dueBy
        ? `By ${dayLabel(r.dueBy)}`
        : null;
  return (
    <Card style={{ gap: 6, opacity: done ? 0.6 : 1 }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: Space.sm }}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Mark ${r.title} done`}
          onPress={onToggle}
          hitSlop={10}
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            borderWidth: 2,
            borderColor: done ? c.good : c.line,
            backgroundColor: done ? c.good : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          {done && <Icon name="check" color={c.surface} size={15} strokeWidth={3} />}
        </Pressable>
        <View style={{ flex: 1, gap: 4 }}>
          <Strong style={{ textDecorationLine: done ? "line-through" : "none" }}>{r.title}</Strong>
          {when && <Tag tone={r.status === "todo" ? "soon" : "check"}>{when}</Tag>}
          <Body style={{ fontSize: 13.5, lineHeight: 19, color: c.muted }}>{r.summary}</Body>
          {r.sources.map((s) => (
            <Pressable key={s.url} accessibilityRole="link" onPress={() => Linking.openURL(s.url)}>
              <Text
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 12,
                  color: c.accent,
                  textDecorationLine: "underline",
                }}
              >
                {s.title}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Card>
  );
}

function Ring({ done, total }: { done: number; total: number }) {
  const c = usePalette();
  const r = 22;
  const len = 2 * Math.PI * r;
  const filled = total ? (len * done) / total : 0;
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" accessibilityLabel={`${done} of ${total} done`}>
      <Circle cx={28} cy={28} r={r} stroke={c.sunk} strokeWidth={6} fill="none" />
      <Circle
        cx={28}
        cy={28}
        r={r}
        stroke={c.good}
        strokeWidth={6}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${len}`}
        transform="rotate(-90 28 28)"
      />
    </Svg>
  );
}
