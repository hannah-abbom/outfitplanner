import { essentialsFor, requirementsFor, type PackItem } from "@trip/core";
import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import { Icon } from "@/components/icons";
import { Card, Eyebrow, Mono, Muted, Screen, Title } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { useTrip } from "@/state/trip-store";

/** Things to BRING (PCK-01). Clothes join this list when the wardrobe and outfits arrive. */
export default function PackScreen() {
  const { trip, packed, togglePacked } = useTrip();
  const c = usePalette();
  const items = useMemo(() => (trip ? essentialsFor(trip, requirementsFor(trip)) : []), [trip]);

  if (!trip) {
    return (
      <Screen>
        <Title>Pack</Title>
        <Muted>Import your itinerary to get a packing list built from your route.</Muted>
      </Screen>
    );
  }
  const count = items.filter((i) => packed[i.id]).length;
  const pct = items.length ? count / items.length : 0;
  return (
    <Screen>
      <Title>Pack</Title>
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Muted>
            {count} of {items.length} packed
          </Muted>
          <Mono>{Math.round(pct * 100)}%</Mono>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: c.sunk, overflow: "hidden" }}>
          <View style={{ width: `${pct * 100}%`, height: "100%", backgroundColor: c.good }} />
        </View>
      </View>
      <Section
        title="Documents"
        items={items.filter((i) => i.category === "documents")}
        packed={packed}
        onToggle={togglePacked}
      />
      <Section
        title="Essentials"
        items={items.filter((i) => i.category === "essentials")}
        packed={packed}
        onToggle={togglePacked}
      />
      <Muted>Clothes and outfits per day come next, from photos of what you’re bringing.</Muted>
    </Screen>
  );
}

function Section({
  title,
  items,
  packed,
  onToggle,
}: {
  title: string;
  items: PackItem[];
  packed: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const c = usePalette();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: Space.sm, marginTop: Space.xs }}>
      <Eyebrow>{title}</Eyebrow>
      <Card style={{ padding: 0 }}>
        {items.map((item, i) => {
          const on = !!packed[item.id];
          return (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              onPress={() => onToggle(item.id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Space.md,
                padding: Space.md,
                minHeight: 52,
                borderBottomWidth: i === items.length - 1 ? 0 : 1,
                borderBottomColor: c.sunk,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 2,
                  borderColor: on ? c.good : c.line,
                  backgroundColor: on ? c.good : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {on && <Icon name="check" color={c.surface} size={14} strokeWidth={3} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: Fonts.medium,
                    fontSize: 15,
                    color: on ? c.muted : c.ink,
                    textDecorationLine: on ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </Text>
                {item.detail && <Muted>{item.detail}</Muted>}
              </View>
              {item.quantity > 1 && <Mono>×{item.quantity}</Mono>}
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}
