import { countryName, type Gap } from "@trip/core";
import { useLocalSearchParams } from "expo-router";
import { Linking, View } from "react-native";

import { BackHeader } from "@/components/back-header";
import { Icon } from "@/components/icons";
import { Body, Card, Eyebrow, Muted, Screen, Strong, Title } from "@/components/ui";
import { Space, usePalette } from "@/constants/theme";
import { dayLabel, nights } from "@/lib/format";
import { useTrip } from "@/state/trip-store";

export default function StayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { trip } = useTrip();
  const c = usePalette();
  const stay = trip?.stays.find((s) => s.id === id);

  if (!trip || !stay) {
    return (
      <Screen tabs={false}>
        <BackHeader label="Back" />
        <Muted>This stay isn’t in your trip.</Muted>
      </Screen>
    );
  }
  const vouchers = trip.vouchers.filter((v) => stay.voucherIds.includes(v.id));
  const gap = trip.gaps.find(
    (g): g is Extract<Gap, { kind: "no-transfer" }> => g.kind === "no-transfer" && g.stayId === stay.id,
  );

  return (
    <Screen tabs={false}>
      <BackHeader label="Back" />
      <View style={{ gap: 4 }}>
        <Eyebrow style={{ color: c.brass }}>
          {countryName(stay.country)} · {nights(stay.nights)}
        </Eyebrow>
        <Title>{stay.name}</Title>
      </View>
      <Card style={{ flexDirection: "row", gap: Space.xl }}>
        <View style={{ flex: 1 }}>
          <Eyebrow>Check in</Eyebrow>
          <Strong>{dayLabel(stay.checkIn)}</Strong>
        </View>
        <View style={{ flex: 1 }}>
          <Eyebrow>Check out</Eyebrow>
          <Strong>{dayLabel(stay.checkOut)}</Strong>
        </View>
      </Card>
      {stay.room && (
        <Card>
          <Eyebrow>Room</Eyebrow>
          <Body>{stay.room}</Body>
        </Card>
      )}
      {stay.notes && (
        <Card>
          <Eyebrow>From your agent</Eyebrow>
          <Body>{stay.notes}</Body>
        </Card>
      )}
      {gap && (
        <Card style={{ backgroundColor: c.warnSoft, borderColor: c.warn, borderStyle: "dashed" }}>
          <Strong style={{ color: c.warn }}>No transfer booked</Strong>
          <Body style={{ color: c.warn, fontSize: 13 }}>
            Nothing gets you from {gap.airport} airport to here yet. Ask the hotel or your agent.
          </Body>
        </Card>
      )}
      {vouchers.length > 0 && (
        <View style={{ gap: Space.sm }}>
          <Eyebrow>Vouchers</Eyebrow>
          {vouchers.map((v) => (
            <Card
              key={v.id}
              onPress={v.url ? () => Linking.openURL(v.url as string) : undefined}
              style={{ flexDirection: "row", alignItems: "center", gap: Space.md }}
            >
              <Icon name="file" color={c.accent} size={20} />
              <Strong style={{ flex: 1 }} numberOfLines={2}>
                {v.name}
              </Strong>
              {v.url && <Icon name="chevronRight" color={c.muted} size={18} />}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}
