import { CountryCode, IsoDate, type Traveler } from "@trip/core";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Close } from "@/components/close";
import { Body, Button, Card, Eyebrow, Muted, Rule, Segmented, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { ImportError, importFromLink, sampleTrip } from "@/lib/import";
import { sampleCloset } from "@/lib/sample";
import { useStore, useTrip } from "@/state/trip-store";

type Draft = { name: string; nationalities: string; passportExpiry: string };

/** Getting a trip in (BKG-08), naming it, and saying who's traveling (TRP-02). Never asks for passport numbers. */
export default function TripSettingsScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { trip, id, setTrip, setTravelers, unit, setUnit } = useTrip();
  const { updateTrip, closet, savePiece } = useStore();
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(trip?.name ?? "");
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
      setTrip(await importFromLink(link));
      router.replace("/");
    } catch (e) {
      setError(e instanceof ImportError ? e.message : "Something went wrong importing that link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const out: Traveler[] = [];
    for (const d of drafts) {
      if (!d.name.trim() && !d.nationalities.trim()) continue;
      const codes = d.nationalities
        .split(/[,\s/]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
      if (!d.name.trim()) return setTravelerError("Give each traveler a name.");
      if (codes.length === 0 || !codes.every((x) => CountryCode.safeParse(x).success)) {
        return setTravelerError(`Use two-letter country codes for ${d.name.trim()}'s passports, like PA or US.`);
      }
      const expiry = d.passportExpiry.trim();
      if (expiry && !IsoDate.safeParse(expiry).success)
        return setTravelerError(`Write ${d.name.trim()}'s passport expiry as YYYY-MM-DD, or leave it empty.`);
      out.push({ name: d.name.trim(), nationalities: codes, passportExpiry: expiry || null });
    }
    if (out.length === 0) return setTravelerError("Add at least one traveler.");
    setTravelerError(null);
    setTravelers(out);
    if (id && name.trim() && name.trim() !== trip?.name) updateTrip(id, (t) => ({ ...t, trip: { ...t.trip, name: name.trim() } }));
    router.back();
  }

  const input = {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: c.ink,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    minHeight: 46,
  } as const;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.paper }}>
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
          <Title>{trip ? "This trip" : "Add a trip"}</Title>
          <Close />
        </View>

        <Eyebrow style={{ marginTop: Space.sm }}>{trip ? "Import again or add another" : "Your agent’s itinerary"}</Eyebrow>
        <Rule strong />
        <TextInput
          value={link}
          onChangeText={setLink}
          placeholder="https://travefy.com/trip/itinerary/…"
          placeholderTextColor={c.faint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          accessibilityLabel="Itinerary link"
          style={input}
        />
        {error && <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent }}>{error}</Text>}
        {busy ? <ActivityIndicator color={c.accent} /> : <Button label="Import" onPress={runImport} disabled={!link.trim()} />}
        <Muted>
          Flights are joined, every night gets its stay, and missing transfers are flagged. The same link again updates
          the trip and keeps your outfits.
        </Muted>

        {!trip && (
          <Button
            label="Look around with a sample trip"
            kind="secondary"
            onPress={() => {
              setTrip(sampleTrip());
              if (closet.length === 0) sampleCloset().forEach(savePiece);
              router.replace("/");
            }}
          />
        )}

        {trip && (
          <>
            <Eyebrow style={{ marginTop: Space.lg }}>Trip name</Eyebrow>
            <Rule strong />
            <TextInput value={name} onChangeText={setName} accessibilityLabel="Trip name" style={[input, { fontFamily: Fonts.serif, fontSize: 20 }]} />

            <Eyebrow style={{ marginTop: Space.lg }}>Who’s traveling</Eyebrow>
            <Rule strong />
            <Body style={{ color: c.muted, fontSize: 14 }}>Entry rules depend on each passport. We never ask for passport numbers.</Body>
            {drafts.map((d, i) => (
              <Card key={i} style={{ gap: Space.sm }}>
                <TextInput
                  value={d.name}
                  onChangeText={(v) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, name: v } : x)))}
                  placeholder="Name"
                  placeholderTextColor={c.faint}
                  accessibilityLabel={`Traveler ${i + 1} name`}
                  style={input}
                />
                <TextInput
                  value={d.nationalities}
                  onChangeText={(v) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, nationalities: v } : x)))}
                  placeholder="Passport country codes, e.g. PA or US"
                  placeholderTextColor={c.faint}
                  autoCapitalize="characters"
                  accessibilityLabel={`Traveler ${i + 1} passports`}
                  style={input}
                />
                <TextInput
                  value={d.passportExpiry}
                  onChangeText={(v) => setDrafts(drafts.map((x, j) => (j === i ? { ...x, passportExpiry: v } : x)))}
                  placeholder="Passport expiry YYYY-MM-DD (optional)"
                  placeholderTextColor={c.faint}
                  accessibilityLabel={`Traveler ${i + 1} passport expiry`}
                  style={input}
                />
              </Card>
            ))}
            <Pressable
              accessibilityRole="button"
              onPress={() => setDrafts([...drafts, { name: "", nationalities: "", passportExpiry: "" }])}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Eyebrow style={{ color: c.ink }}>+ Add another traveler</Eyebrow>
            </Pressable>
            {travelerError && <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent }}>{travelerError}</Text>}
            <Button label="Save" onPress={save} />

            <Eyebrow style={{ marginTop: Space.lg }}>Temperatures</Eyebrow>
            <Segmented
              value={unit}
              onChange={setUnit}
              options={[
                { value: "C", label: "Celsius" },
                { value: "F", label: "Fahrenheit" },
              ]}
            />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setTrip(null);
                router.replace("/");
              }}
              style={{ alignSelf: "center", padding: Space.md, marginTop: Space.lg, minHeight: 44 }}
            >
              <Eyebrow style={{ color: c.accent }}>Remove this trip from the phone</Eyebrow>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
