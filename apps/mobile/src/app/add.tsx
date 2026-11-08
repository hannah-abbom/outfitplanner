import { CountryCode, IsoDate, type Traveler } from "@trip/core";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { Body, Button, Card, Eyebrow, Muted, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { ImportError, importFromLink, sampleTrip } from "@/lib/import";
import { useTrip } from "@/state/trip-store";

type Draft = { name: string; nationalities: string; passportExpiry: string };

/** Getting a trip in (BKG-08) and saying who's traveling (TRP-02). Never asks for passport numbers. */
export default function AddScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { trip, setTrip, setTravelers } = useTrip();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    trip?.travelers.length
      ? trip.travelers.map((t) => ({
          name: t.name,
          nationalities: t.nationalities.join(", "),
          passportExpiry: t.passportExpiry ?? "",
        }))
      : [
          { name: "", nationalities: "", passportExpiry: "" },
          { name: "", nationalities: "", passportExpiry: "" },
        ],
  );
  const [travelerError, setTravelerError] = useState<string | null>(null);

  async function runImport() {
    setBusy(true);
    setError(null);
    try {
      const imported = await importFromLink(link);
      setTrip({ ...imported, travelers: trip?.travelers ?? [] });
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "Something went wrong importing that link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveTravelers() {
    const out: Traveler[] = [];
    for (const d of drafts) {
      if (!d.name.trim() && !d.nationalities.trim()) continue;
      const codes = d.nationalities
        .split(/[,\s/]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (!d.name.trim()) return setTravelerError("Give each traveler a name.");
      if (codes.length === 0 || !codes.every((x) => CountryCode.safeParse(x).success)) {
        return setTravelerError(
          `Use two-letter country codes for ${d.name.trim()}'s passports, like PA or US.`,
        );
      }
      const expiry = d.passportExpiry.trim();
      if (expiry && !IsoDate.safeParse(expiry).success)
        return setTravelerError(`Write ${d.name.trim()}'s passport expiry as YYYY-MM-DD, or leave it empty.`);
      out.push({ name: d.name.trim(), nationalities: codes, passportExpiry: expiry || null });
    }
    if (out.length === 0) return setTravelerError("Add at least one traveler.");
    setTravelerError(null);
    setTravelers(out);
    router.back();
  }

  const input = {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: c.ink,
    backgroundColor: c.paper,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    minHeight: 46,
  } as const;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: c.surface }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: Space.xl,
          paddingTop: Space.xl + (Platform.OS === "android" ? insets.top : 0),
          paddingBottom: insets.bottom + 40,
          gap: Space.md,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Title style={{ fontSize: 28 }}>{trip ? "Your trip" : "Add your trip"}</Title>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={() => router.back()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c.paper,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" color={c.ink} size={18} strokeWidth={2.2} />
          </Pressable>
        </View>

        <Card style={{ gap: Space.sm, backgroundColor: c.accentSoft, borderColor: c.accentSoft }}>
          <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: c.accent }}>
            Import your agent’s itinerary link
          </Text>
          <TextInput
            value={link}
            onChangeText={setLink}
            placeholder="https://travefy.com/trip/itinerary/…"
            placeholderTextColor={c.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            accessibilityLabel="Itinerary link"
            style={[input, { backgroundColor: c.surface }]}
          />
          {error && <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.bad }}>{error}</Text>}
          {busy ? (
            <ActivityIndicator color={c.accent} />
          ) : (
            <Button label={trip ? "Import again" : "Import"} onPress={runImport} disabled={!link.trim()} />
          )}
          <Muted>
            Flights are joined, every night gets its stay, and missing transfers are flagged. The trip stays
            on this phone.
          </Muted>
        </Card>

        {!trip && (
          <Button
            label="Use a sample trip instead"
            kind="secondary"
            onPress={() => {
              setTrip(sampleTrip());
              router.back();
            }}
          />
        )}

        {trip && (
          <>
            <Eyebrow style={{ marginTop: Space.sm }}>Who’s traveling</Eyebrow>
            <Body style={{ color: c.muted, fontSize: 14 }}>
              Entry rules depend on each passport. We never ask for passport numbers.
            </Body>
            {drafts.map((d, i) => (
              <Card key={i} style={{ gap: Space.sm }}>
                <TextInput
                  value={d.name}
                  onChangeText={(v) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                  placeholder="Name"
                  placeholderTextColor={c.muted}
                  accessibilityLabel={`Traveler ${i + 1} name`}
                  style={input}
                />
                <TextInput
                  value={d.nationalities}
                  onChangeText={(v) =>
                    setDrafts(drafts.map((x, j) => (j === i ? { ...x, nationalities: v } : x)))
                  }
                  placeholder="Passport country codes, e.g. PA or US"
                  placeholderTextColor={c.muted}
                  autoCapitalize="characters"
                  accessibilityLabel={`Traveler ${i + 1} passports`}
                  style={input}
                />
                <TextInput
                  value={d.passportExpiry}
                  onChangeText={(v) =>
                    setDrafts(drafts.map((x, j) => (j === i ? { ...x, passportExpiry: v } : x)))
                  }
                  placeholder="Passport expiry YYYY-MM-DD (optional)"
                  placeholderTextColor={c.muted}
                  accessibilityLabel={`Traveler ${i + 1} passport expiry`}
                  style={input}
                />
              </Card>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setDrafts([...drafts, { name: "", nationalities: "", passportExpiry: "" }])}
            >
              <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: c.accent }}>
                + Add another traveler
              </Text>
            </Pressable>
            {travelerError && (
              <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.bad }}>{travelerError}</Text>
            )}
            <Button label="Save travelers" onPress={saveTravelers} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTrip(null);
                router.back();
              }}
              style={{ alignSelf: "center", padding: Space.md }}
            >
              <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: c.bad }}>
                Remove this trip from the phone
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
