import {
  buildDays,
  CATEGORIES,
  CATEGORY_LABEL,
  essentialsFor,
  groupDays,
  isDressed,
  lookNotes,
  LOOK_SLOTS,
  piecesOf,
  PLAN_CHOICES,
  requirementsFor,
  suitcase,
  weatherKind,
  weatherLabel,
  type Category,
  type ClosetItem,
  type IsoDate,
  type LookSlot,
  type PackItem,
  type TripDay,
} from "@trip/core";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DraggablePiece, DropZone } from "@/components/drag";
import { Icon } from "@/components/icons";
import { PieceThumb } from "@/components/piece";
import { StylistSheet } from "@/components/stylist-sheet";
import {
  Body,
  Button,
  Chip,
  Eyebrow,
  Mono,
  Muted,
  Rule,
  Segmented,
  Serif,
  Strong,
  Tag,
  Title,
} from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { dateBlock, dayLabel, nights, roman } from "@/lib/format";
import { sampleCloset } from "@/lib/sample";
import { temp } from "@/lib/weather";
import { useStore, useTrip } from "@/state/trip-store";

type View2 = "plan" | "suitcase";

/** The planner (OUT-01 to OUT-04): every day with its weather and plans, and the pieces you put on its looks. */
export default function OutfitsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const t = useTrip();
  const [mode, setMode] = useState<View2>("plan");
  const [selected, setSelected] = useState<string | null>(null);
  const [planFor, setPlanFor] = useState<IsoDate | null>(null);
  const [styling, setStyling] = useState(false);

  const days = useMemo(() => (t.trip ? buildDays(t.trip) : []), [t.trip]);
  const tabH = 54 + Math.max(insets.bottom, 12);
  const trayH = t.closet.length ? 168 : 132;

  if (!t.trip) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.paper,
          paddingTop: insets.top + Space.xl,
          paddingHorizontal: Space.xl,
          gap: Space.md,
        }}
      >
        <Eyebrow>Outfits</Eyebrow>
        <Title>Dress every day of the trip</Title>
        <Body style={{ color: c.muted }}>
          Add a trip first: its days, weather and plans are what the looks are built around.
        </Body>
        <Button label="Add a trip" onPress={() => router.push("/trip-settings")} />
      </View>
    );
  }

  const dressed = days.filter((d) => isDressed(t.looks[d.date])).length;
  const toGet = suitcase(
    t.looks,
    t.closet,
    days.map((d) => d.date),
  ).filter((l) => l.item.status === "to-get").length;
  const selectedItem = t.closet.find((i) => i.id === selected) ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + Space.lg,
          paddingHorizontal: Space.xl,
          paddingBottom: tabH + (mode === "plan" ? trayH : 0) + Space.xl,
          gap: Space.md,
        }}
      >
        <Eyebrow numberOfLines={1}>{t.trip.name}</Eyebrow>
        <Title>Outfits</Title>
        <Muted>
          {dressed} of {days.length} days dressed
          {toGet > 0 ? ` · ${toGet} piece${toGet === 1 ? "" : "s"} to get` : ""}
        </Muted>
        <Button label="Suggest looks" kind="accent" onPress={() => setStyling(true)} />
        <Segmented<View2>
          value={mode}
          onChange={setMode}
          options={[
            { value: "plan", label: "By day" },
            { value: "suitcase", label: "Suitcase" },
          ]}
        />
        {mode === "plan" ? (
          <Plan days={days} selected={selectedItem} onPlaced={() => setSelected(null)} onPlans={setPlanFor} />
        ) : (
          <Suitcase days={days} />
        )}
      </ScrollView>

      {mode === "plan" && (
        <Tray
          bottom={tabH}
          height={trayH}
          closet={t.closet}
          selected={selected}
          onSelect={(id) => setSelected(selected === id ? null : id)}
        />
      )}

      <PlanPicker date={planFor} onClose={() => setPlanFor(null)} />
      <StylistSheet visible={styling} days={days} onClose={() => setStyling(false)} />
    </View>
  );
}

function Plan({
  days,
  selected,
  onPlaced,
  onPlans,
}: {
  days: TripDay[];
  selected: ClosetItem | null;
  onPlaced: () => void;
  onPlans: (date: IsoDate) => void;
}) {
  const groups = groupDays(days);
  return (
    <View style={{ gap: Space.xl, marginTop: Space.sm }}>
      {groups.map((g, gi) => {
        const chapter = groups.slice(0, gi + 1).filter((x) => x.stay).length;
        return (
          <View key={`${g.stay?.id ?? "way"}-${g.days[0]?.date}`} style={{ gap: Space.md }}>
            <View style={{ gap: 2 }}>
              <Eyebrow>
                {g.stay ? `Chapter ${roman(chapter)} · ${nights(g.stay.nights)}` : "On the way"}
              </Eyebrow>
              <Serif size={24} numberOfLines={2}>
                {g.stay ? g.stay.name : "Travel days"}
              </Serif>
            </View>
            {g.days.map((d) => (
              <DayLooks
                key={d.date}
                day={d}
                selected={selected}
                onPlaced={onPlaced}
                onPlans={() => onPlans(d.date)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function travelDay(day: TripDay): boolean {
  return day.items.some((i) => i.kind === "depart" || i.kind === "arrive");
}

function dayLine(day: TripDay): string {
  const dep = day.items.find((i) => i.kind === "depart");
  if (dep?.kind === "depart") return `${dep.flight.from.code} → ${dep.flight.to.code} · ${dep.time}`;
  const arr = day.items.find((i) => i.kind === "arrive");
  if (arr?.kind === "arrive") return `Land in ${arr.flight.to.city ?? arr.flight.to.code} · ${arr.time}`;
  return day.sleep ? `At ${day.sleep.name}` : "On the move";
}

function DayLooks({
  day,
  selected,
  onPlaced,
  onPlans,
}: {
  day: TripDay;
  selected: ClosetItem | null;
  onPlaced: () => void;
  onPlans: () => void;
}) {
  const c = usePalette();
  const t = useTrip();
  const w = t.weather?.byDate[day.date];
  const block = dateBlock(day.date);
  const travel = travelDay(day);
  const plans = [...(travel ? ["Travel day"] : []), ...(t.plans[day.date] ?? [])];
  const fmt = (n: number) => temp(n, t.unit);

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: c.ink, paddingTop: Space.md, gap: Space.sm }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${dayLabel(day.date)}`}
        onPress={() => router.push({ pathname: "/day/[date]", params: { date: day.date } })}
        style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}
      >
        <View style={{ width: 44 }}>
          <Eyebrow>{block.weekday}</Eyebrow>
          <Text style={{ fontFamily: Fonts.serifUpright, fontSize: 30, lineHeight: 34, color: c.ink }}>
            {block.day}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Muted numberOfLines={1}>{dayLine(day)}</Muted>
        </View>
        {w && (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: Fonts.light, fontSize: 22, letterSpacing: -0.4, color: c.ink }}>
              {temp(w.hi, t.unit)}
              <Text style={{ fontSize: 14, color: c.muted }}> {temp(w.lo, t.unit)}</Text>
            </Text>
            <Eyebrow style={{ fontSize: 9 }}>
              {w.source === "typical" ? "Usually " : ""}
              {weatherLabel(w.code)}
              {w.rainChance >= 40 && weatherKind(w.code) !== "rain" ? ` · ${w.rainChance}% rain` : ""}
            </Eyebrow>
          </View>
        )}
      </Pressable>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {plans.map((p) => (
          <Chip key={p} label={p} on onPress={p === "Travel day" ? undefined : onPlans} />
        ))}
        <Chip label="+ Plan" onPress={onPlans} accessibilityLabel={`Add plans for ${dayLabel(day.date)}`} />
      </View>

      {LOOK_SLOTS.map((slot) => (
        <Look
          key={slot}
          day={day}
          slot={slot}
          label={slot === "day" ? (travel ? "Travel" : "Day") : "Evening"}
          plans={plans}
          selected={selected}
          onPlaced={onPlaced}
          fmt={fmt}
        />
      ))}
    </View>
  );
}

function Look({
  day,
  slot,
  label,
  plans,
  selected,
  onPlaced,
  fmt,
}: {
  day: TripDay;
  slot: LookSlot;
  label: string;
  plans: string[];
  selected: ClosetItem | null;
  onPlaced: () => void;
  fmt: (c: number) => string;
}) {
  const c = usePalette();
  const t = useTrip();
  const pieces = piecesOf(t.looks[day.date]?.[slot], t.closet);
  const notes = lookNotes(pieces, slot, t.weather?.byDate[day.date], plans, fmt);
  const name = `${label} look, ${dayLabel(day.date)}`;

  return (
    <View style={{ gap: 6 }}>
      <Eyebrow style={{ fontSize: 9.5 }}>{label}</Eyebrow>
      <DropZone
        id={`${day.date}:${slot}`}
        onDrop={(itemId) => t.addToLook(day.date, slot, itemId)}
        accessibilityLabel={name}
        style={{
          minHeight: 72,
          borderWidth: 1,
          borderColor: c.line,
          borderStyle: pieces.length ? "solid" : "dashed",
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selected ? `Add ${selected.name} to the ${name}` : name}
          disabled={!selected}
          onPress={() => {
            if (!selected) return;
            t.addToLook(day.date, slot, selected.id);
            onPlaced();
          }}
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            padding: 6,
            minHeight: 70,
            alignItems: "center",
          }}
        >
          {pieces.map((p) => (
            <View key={p.id}>
              <PieceThumb item={p} width={46} onPress={() => t.removeFromLook(day.date, slot, p.id)} />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: c.paper,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="close" color={c.ink} size={9} strokeWidth={2.2} />
              </View>
            </View>
          ))}
          {pieces.length === 0 && (
            <Text
              style={{
                fontFamily: Fonts.body,
                fontSize: 12,
                color: selected ? c.accent : c.faint,
                paddingHorizontal: 6,
              }}
            >
              {selected ? `Tap to add ${selected.name}` : "Drag pieces here"}
            </Text>
          )}
          {pieces.length > 0 && selected && (
            <Text style={{ fontFamily: Fonts.medium, fontSize: 18, color: c.accent, paddingHorizontal: 8 }}>
              +
            </Text>
          )}
        </Pressable>
      </DropZone>
      {notes.map((n) => (
        <Text key={n} style={{ fontFamily: Fonts.body, fontSize: 12, lineHeight: 16, color: c.accent }}>
          {n}
        </Text>
      ))}
    </View>
  );
}

function Tray({
  bottom,
  height,
  closet,
  selected,
  onSelect,
}: {
  bottom: number;
  height: number;
  closet: ClosetItem[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const c = usePalette();
  const { savePiece } = useStore();
  const [cat, setCat] = useState<Category | "all">("all");
  const present = CATEGORIES.filter((k) => closet.some((i) => i.category === k));
  const shown = closet.filter((i) => cat === "all" || i.category === cat);
  const sel = closet.find((i) => i.id === selected);

  return (
    <View
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        height,
        backgroundColor: c.paper,
        borderTopWidth: 1,
        borderTopColor: c.ink,
        paddingTop: 10,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: Space.xl }}>
        <Eyebrow style={{ color: c.ink }}>Your closet · {closet.length}</Eyebrow>
        <Eyebrow numberOfLines={1} style={{ color: sel ? c.accent : c.muted, flexShrink: 1, marginLeft: 12 }}>
          {sel ? "Now tap a look" : closet.length ? "Drag onto a look" : ""}
        </Eyebrow>
      </View>
      {closet.length === 0 ? (
        <View style={{ paddingHorizontal: Space.xl, gap: 8 }}>
          <Muted>
            Add photos, screenshots or links of what you’re bringing, then drag them onto each day.
          </Muted>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label="Add clothes"
              onPress={() => router.push("/add")}
              style={{ flex: 1, minHeight: 42 }}
            />
            <Button
              label="Try samples"
              kind="secondary"
              onPress={() => sampleCloset().forEach(savePiece)}
              style={{ flex: 1, minHeight: 42 }}
            />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 6, paddingHorizontal: Space.xl }}
          >
            <Chip label="All" on={cat === "all"} onPress={() => setCat("all")} />
            {present.map((k) => (
              <Chip key={k} label={CATEGORY_LABEL[k]} on={cat === k} onPress={() => setCat(k)} />
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: Space.xl }}
          >
            {shown.map((i) => (
              <DraggablePiece
                key={i.id}
                item={i}
                width={56}
                selected={i.id === selected}
                onPress={() => onSelect(i.id)}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add clothes"
              onPress={() => router.push("/add")}
              style={{
                width: 56,
                height: 70,
                borderWidth: 1,
                borderColor: c.line,
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="plus" color={c.ink} size={18} strokeWidth={1.4} />
            </Pressable>
          </ScrollView>
        </>
      )}
    </View>
  );
}

function PlanPicker({ date, onClose }: { date: IsoDate | null; onClose: () => void }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const t = useTrip();
  const current = date ? (t.plans[date] ?? []) : [];
  return (
    <Modal visible={date !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1, backgroundColor: c.scrim }} />
      <View
        style={{
          backgroundColor: c.paper,
          padding: Space.xl,
          paddingBottom: insets.bottom + Space.xl,
          gap: Space.md,
        }}
      >
        <Eyebrow>{date ? dayLabel(date) : ""}</Eyebrow>
        <Serif size={28}>What’s the plan?</Serif>
        <Muted>
          Plans shape the looks: swim for the beach, a layer for dawn game drives, something dressy for
          dinner.
        </Muted>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {PLAN_CHOICES.filter((p) => p !== "Travel day").map((p) => (
            <Chip key={p} label={p} on={current.includes(p)} onPress={() => date && t.togglePlan(date, p)} />
          ))}
        </View>
        <Button label="Done" onPress={onClose} />
      </View>
    </Modal>
  );
}

/** What the looks add up to, plus the essentials and documents for the route (PCK-01, PCK-02). */
function Suitcase({ days }: { days: TripDay[] }) {
  const c = usePalette();
  const t = useTrip();
  const lines = suitcase(
    t.looks,
    t.closet,
    days.map((d) => d.date),
  );
  const extras = t.trip ? essentialsFor(t.trip, requirementsFor(t.trip)) : [];
  const bare = days.filter((d) => !isDressed(t.looks[d.date])).length;
  const ids = [...lines.map((l) => `piece:${l.item.id}`), ...extras.map((e) => e.id)];
  const packedCount = ids.filter((id) => t.packed[id]).length;
  const pct = ids.length ? packedCount / ids.length : 0;

  return (
    <View style={{ gap: Space.md, marginTop: Space.sm }}>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Muted>
            {packedCount} of {ids.length} packed
          </Muted>
          <Mono>{Math.round(pct * 100)}%</Mono>
        </View>
        <View style={{ height: 2, backgroundColor: c.line }}>
          <View style={{ width: `${pct * 100}%`, height: 2, backgroundColor: c.accent }} />
        </View>
      </View>

      {bare > 0 && (
        <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent }}>
          {bare} day{bare === 1 ? "" : "s"} still without a look. Their pieces join this list as you plan
          them.
        </Text>
      )}

      {lines.length === 0 && (
        <Muted>Put pieces on your looks and they’ll appear here, each once, with how often it’s worn.</Muted>
      )}

      {CATEGORIES.map((k) => {
        const mine = lines.filter((l) => l.item.category === k);
        if (!mine.length) return null;
        return (
          <View key={k}>
            <Eyebrow style={{ marginTop: Space.md, marginBottom: 4 }}>
              {CATEGORY_LABEL[k]} · {mine.length}
            </Eyebrow>
            <Rule strong />
            {mine.map((l) => {
              const id = `piece:${l.item.id}`;
              const on = !!t.packed[id];
              return (
                <Pressable
                  key={id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  accessibilityLabel={`${l.item.name}, worn ${l.wears} times`}
                  onPress={() => t.togglePacked(id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Space.md,
                    paddingVertical: 10,
                    borderBottomWidth: StyleSheet.hairlineWidth * 2,
                    borderBottomColor: c.line,
                  }}
                >
                  <PieceThumb item={l.item} width={40} showToGet={false} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Serif
                      size={17}
                      numberOfLines={1}
                      style={on ? { color: c.faint, textDecorationLine: "line-through" } : undefined}
                    >
                      {l.item.name}
                    </Serif>
                    <Mono>
                      Worn {l.wears}× · {l.dates.map((d) => dateBlock(d).day).join(", ")}
                    </Mono>
                  </View>
                  {l.item.status === "to-get" && <Tag tone="todo">To get</Tag>}
                  <Box on={on} />
                </Pressable>
              );
            })}
          </View>
        );
      })}

      <Extras title="Documents" items={extras.filter((i) => i.category === "documents")} />
      <Extras title="Essentials" items={extras.filter((i) => i.category === "essentials")} />
    </View>
  );
}

function Extras({ title, items }: { title: string; items: PackItem[] }) {
  const c = usePalette();
  const t = useTrip();
  if (!items.length) return null;
  return (
    <View>
      <Eyebrow style={{ marginTop: Space.md, marginBottom: 4 }}>{title}</Eyebrow>
      <Rule strong />
      {items.map((item) => {
        const on = !!t.packed[item.id];
        return (
          <Pressable
            key={item.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            onPress={() => t.togglePacked(item.id)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: Space.md,
              paddingVertical: 12,
              minHeight: 52,
              borderBottomWidth: StyleSheet.hairlineWidth * 2,
              borderBottomColor: c.line,
            }}
          >
            <View style={{ flex: 1 }}>
              <Strong style={on ? { color: c.faint, textDecorationLine: "line-through" } : undefined}>
                {item.label}
              </Strong>
              {item.detail && <Muted>{item.detail}</Muted>}
            </View>
            {item.quantity > 1 && <Mono>×{item.quantity}</Mono>}
            <Box on={on} />
          </Pressable>
        );
      })}
    </View>
  );
}

function Box({ on }: { on: boolean }) {
  const c = usePalette();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: on ? c.ink : c.faint,
        backgroundColor: on ? c.ink : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on && <Icon name="check" color={c.paper} size={13} strokeWidth={2.4} />}
    </View>
  );
}
