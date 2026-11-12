import { countryName, dueSoon, requirementsFor, type Requirement } from "@trip/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon } from "@/components/icons";
import { Body, Button, Chip, Eyebrow, Muted, Rule, Strong, Tag, type Tone } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dayLabel } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

/** Things to DO before and during the trip, per traveler (REQ-02 to REQ-04). Bringing things lives in the suitcase. */
export function Ready() {
  const c = usePalette();
  const { trip, done, toggleDone } = useTrip();
  const [who, setWho] = useState<string | null>(null);
  const all = useMemo(() => (trip ? requirementsFor(trip) : []), [trip]);
  if (!trip) return null;
  if (trip.travelers.length === 0) {
    return (
      <View style={{ gap: Space.md, marginTop: Space.md }}>
        <Body>Entry rules depend on the passport. Add who’s traveling and their nationality.</Body>
        <Button label="Add travelers" onPress={() => router.push("/trip-settings")} />
      </View>
    );
  }

  const current = who ?? trip.travelers[0]?.name ?? "";
  const mine = all.filter((r) => r.traveler === current);
  const toDo = dueSoon(mine);
  const doneCount = mine.filter((r) => r.status === "ok" || done[r.id]).length;
  const countries = [...new Set(mine.map((r) => r.country))];
  const pct = mine.length ? doneCount / mine.length : 0;

  return (
    <View style={{ gap: Space.md, marginTop: Space.sm }}>
      {trip.travelers.length > 1 && (
        <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
          {trip.travelers.map((t) => (
            <Chip
              key={t.name}
              label={`${t.name} · ${t.nationalities.join("/")}`}
              on={t.name === current}
              onPress={() => setWho(t.name)}
            />
          ))}
        </View>
      )}
      <View style={{ gap: 6 }}>
        <Muted>
          {doneCount} of {mine.length} ready
        </Muted>
        <View style={{ height: 2, backgroundColor: c.line }}>
          <View style={{ width: `${pct * 100}%`, height: 2, backgroundColor: c.accent }} />
        </View>
      </View>

      <Eyebrow style={{ marginTop: Space.md }}>To do</Eyebrow>
      <Rule strong />
      {toDo.length === 0 && <Muted>Nothing left. Have a wonderful trip.</Muted>}
      {toDo.map((r, i) => (
        <Task
          key={r.id}
          r={r}
          done={!!done[r.id]}
          last={i === toDo.length - 1}
          onToggle={() => toggleDone(r.id)}
        />
      ))}

      <Eyebrow style={{ marginTop: Space.lg }}>By country</Eyebrow>
      <Rule strong />
      {countries.map((country) =>
        mine
          .filter((r) => r.country === country && (r.kind === "visa" || r.kind === "passport"))
          .map((r) => (
            <View
              key={r.id}
              style={{
                flexDirection: "row",
                gap: Space.md,
                alignItems: "flex-start",
                paddingVertical: 12,
                borderBottomWidth: StyleSheet.hairlineWidth * 2,
                borderBottomColor: c.line,
              }}
            >
              <View style={{ width: 96 }}>
                <Eyebrow style={{ fontSize: 9.5 }}>{countryName(country)}</Eyebrow>
                <Strong style={{ fontSize: 14 }}>{r.title}</Strong>
              </View>
              <Body style={{ flex: 1, fontSize: 12.5, lineHeight: 17, color: c.muted }}>{r.summary}</Body>
              <Tag tone={toneOf(r, !!done[r.id])}>{labelOf(r, !!done[r.id])}</Tag>
            </View>
          )),
      )}
      <Muted style={{ marginTop: Space.xs }}>
        Rules checked {mine[0]?.checkedOn ?? ""}. Always confirm on the official site linked on each item.
      </Muted>
    </View>
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

function Task({
  r,
  done,
  last,
  onToggle,
}: {
  r: Requirement;
  done: boolean;
  last: boolean;
  onToggle: () => void;
}) {
  const c = usePalette();
  const when =
    r.dueFrom && r.dueBy
      ? `${dayLabel(r.dueFrom)} – ${dayLabel(r.dueBy)}`
      : r.dueBy
        ? `By ${dayLabel(r.dueBy)}`
        : null;
  return (
    <View
      style={{
        flexDirection: "row",
        gap: Space.md,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth * 2,
        borderBottomColor: c.line,
        opacity: done ? 0.55 : 1,
      }}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Mark ${r.title} done`}
        onPress={onToggle}
        hitSlop={12}
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 1,
          borderColor: done ? c.ink : c.faint,
          backgroundColor: done ? c.ink : "transparent",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 1,
        }}
      >
        {done && <Icon name="check" color={c.paper} size={13} strokeWidth={2.4} />}
      </Pressable>
      <View style={{ flex: 1, gap: 4 }}>
        <Strong style={{ textDecorationLine: done ? "line-through" : "none" }}>{r.title}</Strong>
        {when && <Tag tone={r.status === "todo" ? "soon" : "check"}>{when}</Tag>}
        <Body style={{ fontSize: 13.5, lineHeight: 19, color: c.muted }}>{r.summary}</Body>
        {r.sources.map((s) => (
          <Pressable key={s.url} accessibilityRole="link" onPress={() => Linking.openURL(s.url)}>
            <Text
              style={{ fontFamily: Fonts.body, fontSize: 12, color: c.ink, textDecorationLine: "underline" }}
            >
              {s.title}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
