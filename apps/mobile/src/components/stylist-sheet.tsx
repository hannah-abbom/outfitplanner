import {
  daysToPlan,
  LOOK_SLOTS,
  piecesOf,
  readStylistAnswer,
  stylistPrompt,
  TRENDS,
  type StylistAnswer,
  type StylistDay,
  type TripDay,
} from "@trip/core";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { PieceThumb } from "@/components/piece";
import { Body, Button, Chip, Eyebrow, Muted, Rule, Segmented, Serif, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { dayLabel } from "@/lib/format";
import { getStylist, stylistErrorText, type Sample } from "@/lib/stylist";
import { useTrip } from "@/state/trip-store";

type Mode = "empty" | "all";
type Phase =
  | { kind: "form" }
  | { kind: "asking"; count: number }
  | { kind: "done"; answer: StylistAnswer }
  | { kind: "error"; text: string };

function stylistDay(day: TripDay, plans: string[], weather: StylistDay["weather"]): StylistDay {
  const dep = day.items.find((i) => i.kind === "depart");
  const travel = day.items.some((i) => i.kind === "depart" || i.kind === "arrive");
  const place =
    day.sleep?.name ??
    (dep?.kind === "depart"
      ? `Flying ${dep.flight.from.city ?? dep.flight.from.code} to ${dep.flight.to.city ?? dep.flight.to.code}`
      : "Travelling");
  return {
    date: day.date,
    label: dayLabel(day.date),
    place,
    weather,
    plans: [...(travel ? ["Travel day"] : []), ...plans],
    travel,
  };
}

/** Ask Claude for looks, see each suggestion with its reason, keep the ones you like (OUT-05). */
export function StylistSheet({
  visible,
  days,
  onClose,
}: {
  visible: boolean;
  days: TripDay[];
  onClose: () => void;
}) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const t = useTrip();
  const [sample, setSample] = useState<Sample | null | "checking">("checking");
  const [mode, setMode] = useState<Mode>("empty");
  const [wish, setWish] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [skip, setSkip] = useState<Record<string, boolean>>({});
  const ctl = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!visible) return;
    let live = true;
    getStylist().then((s) => live && setSample(s));
    return () => {
      live = false;
    };
  }, [visible]);

  const stylistDays = useMemo(
    () => days.map((d) => stylistDay(d, t.plans[d.date] ?? [], t.weather?.byDate[d.date] ?? null)),
    [days, t.plans, t.weather],
  );
  const toPlan = daysToPlan({ days: stylistDays, looks: t.looks, mode });

  async function ask() {
    if (!sample || sample === "checking" || !t.trip) return;
    const planned = toPlan.map((d) => d.date);
    if (!planned.length) return;
    const controller = new AbortController();
    ctl.current = controller;
    setPhase({ kind: "asking", count: planned.length });
    try {
      const prompt = stylistPrompt({
        tripName: t.trip.name,
        days: stylistDays,
        closet: t.closet,
        looks: t.looks,
        trends: TRENDS,
        mode,
        wish,
      });
      const raw = await sample.json(prompt, {
        signal: controller.signal,
        modelTier: "default",
        cache: false,
      });
      const answer = readStylistAnswer(raw, t.closet, planned);
      if (!answer || !answer.looks.length) {
        setPhase({
          kind: "error",
          text: "The suggestions came back empty. Try again, or add more pieces to your closet first.",
        });
        return;
      }
      setSkip({});
      setPhase({ kind: "done", answer });
    } catch (e) {
      const text = stylistErrorText(e);
      setPhase(text ? { kind: "error", text } : { kind: "form" });
    }
  }

  function keep(answer: StylistAnswer) {
    for (const look of answer.looks) {
      if (skip[look.date]) continue;
      for (const slot of LOOK_SLOTS) t.setLook(look.date, slot, look.pieces[slot]);
    }
    close();
  }

  function close() {
    ctl.current?.abort();
    setPhase({ kind: "form" });
    onClose();
  }

  const kept = phase.kind === "done" ? phase.answer.looks.filter((l) => !skip[l.date]).length : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: c.paper }}>
        <ScrollView
          contentContainerStyle={{
            padding: Space.xl,
            paddingTop: insets.top + Space.lg,
            paddingBottom: insets.bottom + 120,
            gap: Space.md,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Eyebrow>The stylist</Eyebrow>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={close}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: c.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="close" color={c.ink} size={16} strokeWidth={1.6} />
            </Pressable>
          </View>
          <Title>Suggest looks</Title>

          {sample === "checking" && <ActivityIndicator color={c.accent} />}

          {sample === null && (
            <Body style={{ color: c.muted }}>
              Suggestions work in the app link on claude.ai, where the app can ask Claude for you. In the
              phone app they’ll arrive with the stylist service.
            </Body>
          )}

          {sample && sample !== "checking" && (phase.kind === "form" || phase.kind === "error") && (
            <>
              <Body style={{ color: c.muted }}>
                Claude plans a day and an evening look from your closet, with each day’s weather and plans,
                where you packed each piece for, and what’s in this season. Nothing changes until you keep a
                suggestion.
              </Body>
              <Segmented<Mode>
                value={mode}
                onChange={setMode}
                options={[
                  { value: "empty", label: "Days without a look" },
                  { value: "all", label: "Whole trip" },
                ]}
              />
              <Muted>
                {mode === "all"
                  ? `All ${stylistDays.length} days. Looks you keep replace the ones there.`
                  : toPlan.length
                    ? `${toPlan.length} day${toPlan.length === 1 ? "" : "s"} without a look.`
                    : "Every day already has a look. Choose Whole trip to start over."}
              </Muted>
              <Eyebrow style={{ marginTop: Space.sm }}>Anything to keep in mind?</Eyebrow>
              <TextInput
                value={wish}
                onChangeText={setWish}
                placeholder="e.g. Dressy dinners in Cape Town, no heels on safari"
                placeholderTextColor={c.faint}
                multiline
                maxLength={500}
                accessibilityLabel="Anything to keep in mind"
                style={{
                  fontFamily: Fonts.body,
                  fontSize: 15,
                  color: c.ink,
                  borderWidth: 1,
                  borderColor: c.line,
                  borderRadius: Radius.sm,
                  padding: 12,
                  minHeight: 72,
                  textAlignVertical: "top",
                }}
              />
              {phase.kind === "error" && (
                <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent }}>{phase.text}</Text>
              )}
              <Button
                label="Suggest looks"
                kind="accent"
                onPress={ask}
                disabled={!toPlan.length || t.closet.length === 0}
              />
              {t.closet.length === 0 && <Muted>Add pieces to your closet first.</Muted>}
              <Muted>
                The first time, claude.ai asks you to allow this page to use Claude. It uses your own Claude
                account.
              </Muted>
              <Trends />
            </>
          )}

          {phase.kind === "asking" && (
            <View style={{ gap: Space.md, paddingVertical: Space.lg }}>
              <ActivityIndicator color={c.accent} />
              <Serif size={20} style={{ textAlign: "center" }}>
                Styling {phase.count} day{phase.count === 1 ? "" : "s"}…
              </Serif>
              <Muted style={{ textAlign: "center" }}>This usually takes under a minute.</Muted>
              <Button label="Stop" kind="secondary" onPress={() => ctl.current?.abort()} />
            </View>
          )}

          {phase.kind === "done" && (
            <>
              {!!phase.answer.note && <Serif size={20}>{phase.answer.note}</Serif>}
              {phase.answer.looks.map((look) => {
                const off = !!skip[look.date];
                return (
                  <View
                    key={look.date}
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: c.ink,
                      paddingTop: Space.md,
                      gap: Space.sm,
                      opacity: off ? 0.45 : 1,
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}>
                      <View style={{ flex: 1 }}>
                        <Eyebrow>{dayLabel(look.date)}</Eyebrow>
                        <Muted numberOfLines={1}>
                          {stylistDays.find((d) => d.date === look.date)?.place}
                        </Muted>
                      </View>
                      <Chip
                        label={off ? "Skip" : "Keep"}
                        on={!off}
                        onPress={() => setSkip({ ...skip, [look.date]: !off })}
                        accessibilityLabel={`${off ? "Keep" : "Skip"} the looks for ${dayLabel(look.date)}`}
                      />
                    </View>
                    {LOOK_SLOTS.map((slot) => {
                      const pieces = piecesOf(look.pieces[slot], t.closet);
                      if (!pieces.length) return null;
                      return (
                        <View key={slot} style={{ gap: 6 }}>
                          <Eyebrow style={{ fontSize: 9.5 }}>{slot === "day" ? "Day" : "Evening"}</Eyebrow>
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
                        </View>
                      );
                    })}
                    {!!look.why && (
                      <Serif size={16} style={{ color: c.muted }}>
                        {look.why}
                      </Serif>
                    )}
                  </View>
                );
              })}

              {phase.answer.missing.length > 0 && (
                <View style={{ marginTop: Space.md }}>
                  <Eyebrow style={{ marginBottom: 4 }}>Worth bringing</Eyebrow>
                  <Rule strong />
                  {phase.answer.missing.map((m) => (
                    <View
                      key={m.name}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: StyleSheet.hairlineWidth * 2,
                        borderBottomColor: c.line,
                      }}
                    >
                      <Text style={{ fontFamily: Fonts.medium, fontSize: 15, color: c.accent }}>
                        {m.name}
                      </Text>
                      <Muted>{[m.for, m.why].filter(Boolean).join(" · ")}</Muted>
                    </View>
                  ))}
                </View>
              )}
              {phase.answer.dropped > 0 && (
                <Muted>
                  {phase.answer.dropped} suggested piece{phase.answer.dropped === 1 ? " wasn’t" : "s weren’t"}{" "}
                  in your closet, so {phase.answer.dropped === 1 ? "it was" : "they were"} left out.
                </Muted>
              )}
              <Button label="Ask again" kind="secondary" onPress={() => setPhase({ kind: "form" })} />
            </>
          )}
        </ScrollView>

        {phase.kind === "done" && (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: Space.xl,
              paddingBottom: insets.bottom + Space.lg,
              backgroundColor: c.paper,
              borderTopWidth: 1,
              borderTopColor: c.line,
            }}
          >
            <Button
              label={kept ? `Keep ${kept} day${kept === 1 ? "" : "s"} of looks` : "Nothing to keep"}
              onPress={() => keep(phase.answer)}
              disabled={!kept}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

/** The trends the stylist was given, with where they came from. */
function Trends() {
  const c = usePalette();
  return (
    <View style={{ marginTop: Space.lg }}>
      <Eyebrow style={{ marginBottom: 4 }}>This season, as of {TRENDS.checkedOn}</Eyebrow>
      <Rule strong />
      {TRENDS.trends.map((tr) => (
        <View
          key={tr.id}
          style={{
            paddingVertical: 10,
            borderBottomWidth: StyleSheet.hairlineWidth * 2,
            borderBottomColor: c.line,
            gap: 2,
          }}
        >
          <Serif size={17}>{tr.name}</Serif>
          <Muted>{tr.wear}</Muted>
          <Text style={{ fontFamily: Fonts.body, fontSize: 11.5, color: c.faint }}>
            {tr.sources.map((s) => s.title).join(" · ")}
          </Text>
        </View>
      ))}
      <Muted style={{ marginTop: Space.sm }}>{TRENDS.caveat}</Muted>
    </View>
  );
}
