import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Close } from "@/components/close";
import { Icon, type IconName } from "@/components/icons";
import { Button, Eyebrow, Muted, Row, Rule, Serif, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { CaptureError, pickImage, readLink, setDraft, type Draft } from "@/lib/capture";
import { useTrip } from "@/state/trip-store";

/** The plus button: clothes first, because the closet is what the planner is built from; then trips. */
export default function AddScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { trip } = useTrip();
  const [link, setLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go(get: () => Promise<Draft | null>) {
    setError(null);
    setBusy(true);
    try {
      const draft = await get();
      if (!draft) return;
      setDraft(draft);
      router.replace({ pathname: "/piece/[id]", params: { id: "new" } });
    } catch (e) {
      setError(e instanceof CaptureError ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: c.paper }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          padding: Space.xl,
          paddingTop: Space.xl + (Platform.OS === "android" ? insets.top : 0),
          paddingBottom: insets.bottom + 40,
          gap: Space.md,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Title>Add</Title>
          <Close />
        </View>

        <Eyebrow style={{ marginTop: Space.md }}>To your closet</Eyebrow>
        <Rule strong />
        <Option icon="image" title="Photos & screenshots" detail="Your clothes, or screenshots of things you bought" onPress={() => go(() => pickImage("library"))} />
        <Option icon="camera" title="Take a photo" detail="Lay the piece flat in good light" onPress={() => go(() => pickImage("camera"))} />
        <Option icon="link" title="Paste a link" detail="From the shop’s product page" onPress={() => setShowLink(!showLink)} />
        {showLink && (
          <View style={{ gap: Space.sm, paddingVertical: Space.sm }}>
            <TextInput
              value={link}
              onChangeText={setLink}
              placeholder="https://"
              placeholderTextColor={c.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              accessibilityLabel="Product link"
              style={{
                fontFamily: Fonts.body,
                fontSize: 16,
                color: c.ink,
                borderWidth: 1,
                borderColor: c.line,
                borderRadius: Radius.sm,
                paddingHorizontal: 12,
                minHeight: 46,
              }}
            />
            <Button label="Add from link" onPress={() => go(() => readLink(link))} disabled={!link.trim()} />
          </View>
        )}
        <Option icon="hanger" title="Type it in" detail="Name it and pick a colour" onPress={() => go(async () => ({ source: "manual" }))} last />

        {busy && <ActivityIndicator color={c.accent} />}
        {error && <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent }}>{error}</Text>}

        <Eyebrow style={{ marginTop: Space.xl }}>Trips</Eyebrow>
        <Rule strong />
        <Option icon="map" title="Import an itinerary" detail="Paste your travel agent’s Travefy link" onPress={() => router.replace("/trip-settings")} last={!trip} />
        {trip && (
          <Option icon="shield" title="Who’s traveling" detail={`Passports for ${trip.name}`} onPress={() => router.replace("/trip-settings")} last />
        )}
        <Muted style={{ marginTop: Space.md }}>Everything stays on this phone.</Muted>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Option({
  icon,
  title,
  detail,
  onPress,
  last,
}: {
  icon: IconName;
  title: string;
  detail: string;
  onPress: () => void;
  last?: boolean;
}) {
  const c = usePalette();
  return (
    <Row onPress={onPress} last={last} accessibilityLabel={title}>
      <Icon name={icon} color={c.ink} size={22} strokeWidth={1.3} />
      <View style={{ flex: 1 }}>
        <Serif size={19}>{title}</Serif>
        <Muted>{detail}</Muted>
      </View>
      <Icon name="chevronRight" color={c.faint} size={16} strokeWidth={1.4} />
    </Row>
  );
}
