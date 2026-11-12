import { buildDays, daysUntil, isDressed, piecesOf, whatsLeft, type LeftItem } from "@trip/core";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { PieceThumb } from "@/components/piece";
import { Scrim } from "@/components/scrim";
import {
  Body,
  Button,
  Eyebrow,
  Muted,
  ProgressLine,
  Row,
  Rule,
  Screen,
  SectionHeader,
  Serif,
  Title,
} from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dayLabel, nights, rangeLabel, todayIso, todayLong } from "@/lib/format";
import { sampleTrip } from "@/lib/import";
import { sampleCloset } from "@/lib/sample";
import { useStore, type TripState } from "@/state/trip-store";

const LEFT_SHOWN = 5;

/** Every trip, the next one up front, and everything still to sort out across them. */
export default function HomeScreen() {
  const c = usePalette();
  const s = useStore();
  const today = todayIso();
  const [allLeft, setAllLeft] = useState(false);

  const upcoming = useMemo(
    () => s.trips.filter((t) => t.trip.end >= today).sort((a, b) => a.trip.start.localeCompare(b.trip.start)),
    [s.trips, today],
  );
  const past = s.trips.filter((t) => t.trip.end < today);
  const hero = (s.active && s.active.trip.end >= today ? s.active : null) ?? upcoming[0] ?? s.active ?? null;

  const left = useMemo(
    () =>
      upcoming.flatMap((t) =>
        whatsLeft({ trip: t.trip, done: t.done, looks: t.looks }, s.closet, today).map((item) => ({
          t,
          item,
        })),
      ),
    [upcoming, s.closet, today],
  );

  if (!hero) {
    return (
      <Screen>
        <Eyebrow>{todayLong()}</Eyebrow>
        <Title>Dress every day of the trip</Title>
        <Body style={{ color: c.muted }}>
          Import your travel agent’s itinerary and we lay out every day with its weather and plans. Add your
          clothes, drag them onto each day, and the packing list writes itself.
        </Body>
        <View style={{ gap: Space.sm, marginTop: Space.md }}>
          <Button label="Import my itinerary" onPress={() => router.push("/trip-settings")} />
          <Button
            label="Look around with a sample trip"
            kind="secondary"
            onPress={() => {
              s.addTrip(sampleTrip());
              if (s.closet.length === 0) sampleCloset().forEach(s.savePiece);
            }}
          />
        </View>
      </Screen>
    );
  }

  const open = (t: TripState, path: "/outfits" | "/closet" | "/trip", params?: Record<string, string>) => {
    s.setActive(t.id);
    router.push(params ? { pathname: path, params } : path);
  };

  return (
    <Screen hero={<Hero t={hero} onPress={() => open(hero, "/outfits")} />}>
      <Eyebrow>{todayLong()}</Eyebrow>
      <Outfits t={hero} onPlan={() => open(hero, "/outfits")} />

      <SectionHeader title={left.length ? `Left to do · ${left.length}` : "Left to do"} />
      <Rule strong />
      {left.length === 0 && (
        <Muted style={{ paddingVertical: Space.md }}>Nothing left. Enjoy the trip.</Muted>
      )}
      {(allLeft ? left : left.slice(0, LEFT_SHOWN)).map(({ t, item }, i, shown) => (
        <LeftRow
          key={`${t.id}:${item.id}`}
          item={item}
          tripName={upcoming.length > 1 ? t.trip.name : null}
          last={i === shown.length - 1}
          onPress={() => {
            if (item.kind === "task") open(t, "/trip", { view: "ready" });
            else if (item.kind === "gap") {
              s.setActive(t.id);
              router.push({ pathname: "/day/[date]", params: { date: item.gap.date } });
            } else if (item.kind === "outfits") open(t, "/outfits");
            else open(t, "/closet");
          }}
        />
      ))}

      {left.length > LEFT_SHOWN && (
        <Pressable
          accessibilityRole="button"
          onPress={() => setAllLeft(!allLeft)}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Eyebrow style={{ color: c.ink }}>{allLeft ? "Show fewer" : `Show all ${left.length}`}</Eyebrow>
        </Pressable>
      )}

      <SectionHeader title="Your trips" action="Add" onAction={() => router.push("/trip-settings")} />
      <Rule strong />
      {[...upcoming, ...past].map((t, i, all) => {
        const until = daysUntil(t.trip, today);
        return (
          <Row
            key={t.id}
            onPress={() => open(t, "/outfits")}
            last={i === all.length - 1}
            accessibilityLabel={`Open ${t.trip.name}`}
          >
            <View style={{ flex: 1 }}>
              <Serif size={19} numberOfLines={1}>
                {t.trip.name}
              </Serif>
              <Muted>
                {rangeLabel(t.trip.start, t.trip.end)} ·{" "}
                {nights(t.trip.stays.reduce((n, x) => n + x.nights, 0))}
              </Muted>
            </View>
            <Eyebrow style={{ color: t.id === hero.id ? c.accent : c.muted }}>
              {t.trip.end < today ? "Past" : until > 0 ? `${until} days` : "Now"}
            </Eyebrow>
          </Row>
        );
      })}
    </Screen>
  );
}

function Hero({ t, onPress }: { t: TripState; onPress: () => void }) {
  const insets = useSafeAreaInsets();
  const until = daysUntil(t.trip, todayIso());
  const names = t.trip.travelers.map((x) => x.name).join(" & ");
  const label =
    until > 1 ? `${until} days to go` : until === 1 ? "Tomorrow" : until === 0 ? "Today" : "Under way";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t.trip.name}, ${label}`}
      onPress={onPress}
      style={{ height: 420 + insets.top, backgroundColor: "#2a2622", justifyContent: "flex-end" }}
    >
      {t.trip.cover && (
        <Image
          source={{ uri: t.trip.cover }}
          style={{ position: "absolute", inset: 0 }}
          contentFit="cover"
          transition={200}
        />
      )}
      <Scrim />
      <View
        style={{
          position: "absolute",
          top: insets.top + 18,
          left: Space.xl,
          right: Space.xl,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Eyebrow style={{ color: "#fff" }} numberOfLines={1}>
          {names || "Your next trip"}
        </Eyebrow>
        <Eyebrow style={{ color: "#fff" }}>{label}</Eyebrow>
      </View>
      <View style={{ padding: Space.xl, gap: 10 }}>
        <Eyebrow style={{ color: "rgba(255,255,255,0.85)" }}>{until > 0 ? "Next trip" : "This trip"}</Eyebrow>
        <Text
          style={{
            fontFamily: Fonts.serif,
            fontSize: 46,
            lineHeight: 48,
            letterSpacing: -0.5,
            color: "#fff",
          }}
          numberOfLines={3}
        >
          {t.trip.name}
        </Text>
        <Text style={{ fontFamily: Fonts.light, fontSize: 13, letterSpacing: 0.3, color: "#fff" }}>
          {rangeLabel(t.trip.start, t.trip.end)} · {nights(t.trip.stays.reduce((n, x) => n + x.nights, 0))} ·{" "}
          {t.trip.stays.length} stays
        </Text>
      </View>
    </Pressable>
  );
}

/** The planner, front and centre: how far along the looks are, and a way in. */
function Outfits({ t, onPlan }: { t: TripState; onPlan: () => void }) {
  const c = usePalette();
  const { closet } = useStore();
  const days = buildDays(t.trip);
  const dressed = days.filter((d) => isDressed(t.looks[d.date]));
  const pct = days.length ? dressed.length / days.length : 0;
  const pieces = [
    ...new Map(
      dressed
        .flatMap((d) => [
          ...piecesOf(t.looks[d.date]?.day, closet),
          ...piecesOf(t.looks[d.date]?.evening, closet),
        ])
        .map((p) => [p.id, p]),
    ).values(),
  ].slice(0, 5);
  const firstBare = days.find((d) => !isDressed(t.looks[d.date]));
  return (
    <View style={{ gap: Space.md, marginTop: Space.sm }}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <Title style={{ fontSize: 34, lineHeight: 38 }}>The looks</Title>
        <Text style={{ fontFamily: Fonts.light, fontSize: 28, letterSpacing: -0.6, color: c.ink }}>
          {dressed.length}
          <Text style={{ fontSize: 16, color: c.muted }}> / {days.length} days</Text>
        </Text>
      </View>
      <ProgressLine value={pct} />
      {pieces.length > 0 ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {pieces.map((p) => (
            <PieceThumb key={p.id} item={p} width={56} />
          ))}
        </View>
      ) : (
        <Muted>
          {closet.length
            ? "Drag pieces from your closet onto each day, with the weather and plans in view."
            : "Add your clothes, then drag them onto each day, with the weather and plans in view."}
        </Muted>
      )}
      <Button
        label={firstBare ? `Plan from ${dayLabel(firstBare.date)}` : "See the looks"}
        onPress={onPlan}
      />
    </View>
  );
}

function leftText(item: LeftItem): { title: string; detail: string } {
  switch (item.kind) {
    case "task": {
      const when =
        item.dueFrom && item.dueBy
          ? `${dayLabel(item.dueFrom)} – ${dayLabel(item.dueBy)}`
          : item.dueBy
            ? `By ${dayLabel(item.dueBy)}`
            : item.status === "check"
              ? "Check before you go"
              : "Before you go";
      return { title: item.title, detail: `${when} · ${item.travelers.join(" & ")}` };
    }
    case "gap":
      return item.gap.kind === "no-transfer"
        ? {
            title: `No transfer from ${item.gap.airport}`,
            detail: `To ${item.gap.stayName} · ${dayLabel(item.gap.date)}`,
          }
        : { title: "No bed booked", detail: dayLabel(item.gap.date) };
    case "outfits":
      return {
        title: `${item.days.length} day${item.days.length === 1 ? "" : "s"} without a look`,
        detail: `Next: ${dayLabel(item.days[0] ?? "")}`,
      };
    case "buy":
      return {
        title: `${item.items.length} piece${item.items.length === 1 ? "" : "s"} to get`,
        detail: item.items.map((i) => i.name).join(", "),
      };
  }
}

function LeftRow({
  item,
  tripName,
  last,
  onPress,
}: {
  item: LeftItem;
  tripName: string | null;
  last: boolean;
  onPress: () => void;
}) {
  const c = usePalette();
  const { title, detail } = leftText(item);
  return (
    <Row onPress={onPress} last={last} accessibilityLabel={`${title}. ${detail}`}>
      <View
        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.urgent ? c.accent : c.line }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{ fontFamily: Fonts.medium, fontSize: 15, color: item.urgent ? c.accent : c.ink }}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Muted numberOfLines={2}>{tripName ? `${tripName} · ${detail}` : detail}</Muted>
      </View>
      <Icon name="chevronRight" color={c.faint} size={16} strokeWidth={1.4} />
    </Row>
  );
}
