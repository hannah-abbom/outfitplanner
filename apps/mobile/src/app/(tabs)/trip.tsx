import { dueSoon, requirementsFor } from "@trip/core";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { Bookings } from "@/components/trip/bookings";
import { Itinerary } from "@/components/trip/itinerary";
import { Ready } from "@/components/trip/ready";
import { Body, Button, Eyebrow, Muted, Screen, Segmented, Title } from "@/components/ui";
import { Space, usePalette } from "@/constants/theme";
import { nights, rangeLabel } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

type Section = "days" | "bookings" | "ready";

/** The open trip's practical side: where and when, what's booked, and what each passport needs. */
export default function TripScreen() {
  const c = usePalette();
  const { trip, done } = useTrip();
  const params = useLocalSearchParams<{ view?: string }>();
  // A link from Home can open a section; after that, the tabs here decide.
  const asked: Section = params.view === "ready" || params.view === "bookings" ? params.view : "days";
  const [picked, setPicked] = useState<{ view: string | undefined; section: Section } | null>(null);
  const section = picked && picked.view === params.view ? picked.section : asked;
  const setSection = (s: Section) => setPicked({ view: params.view, section: s });

  if (!trip) {
    return (
      <Screen>
        <Eyebrow>Trip</Eyebrow>
        <Title>No trip yet</Title>
        <Body style={{ color: c.muted }}>
          Import your agent’s itinerary to see every day, booking and entry rule here.
        </Body>
        <Button label="Add a trip" onPress={() => router.push("/trip-settings")} />
      </Screen>
    );
  }

  // One count per task, even when it applies to both travelers.
  const open = new Set(
    dueSoon(requirementsFor(trip))
      .filter((r) => !done[r.id])
      .map((r) => r.id.slice(r.traveler.length + 1)),
  ).size;
  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Eyebrow style={{ flex: 1 }}>{rangeLabel(trip.start, trip.end)}</Eyebrow>
        <Pressable accessibilityRole="button" onPress={() => router.push("/trip-settings")} hitSlop={12}>
          <Eyebrow style={{ color: c.ink, borderBottomWidth: 1, borderBottomColor: c.ink, paddingBottom: 2 }}>
            Settings
          </Eyebrow>
        </Pressable>
      </View>
      <Title numberOfLines={3}>{trip.name}</Title>
      <Muted>
        {trip.travelers.length ? trip.travelers.map((t) => t.name).join(" & ") : "Add who’s traveling"} ·{" "}
        {nights(trip.stays.reduce((n, s) => n + s.nights, 0))}
      </Muted>
      <View style={{ marginTop: Space.sm }}>
        <Segmented<Section>
          value={section}
          onChange={setSection}
          options={[
            { value: "days", label: "Days" },
            { value: "bookings", label: "Bookings" },
            { value: "ready", label: open ? `Ready · ${open}` : "Ready" },
          ]}
        />
      </View>
      {section === "days" && <Itinerary />}
      {section === "bookings" && <Bookings />}
      {section === "ready" && <Ready />}
    </Screen>
  );
}
