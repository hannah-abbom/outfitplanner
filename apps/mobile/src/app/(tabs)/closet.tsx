import { CATEGORIES, CATEGORY_LABEL, type Category } from "@trip/core";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";

import { PieceThumb } from "@/components/piece";
import { Body, Button, Chip, Eyebrow, Muted, Screen, Serif, Title } from "@/components/ui";
import { Space, usePalette } from "@/constants/theme";
import { sampleCloset } from "@/lib/sample";
import { useStore } from "@/state/trip-store";

type Filter = Category | "all" | "to-get";

/** Everything you own or plan to get (WRD-01 to WRD-04). It belongs to you, not to a trip. */
export default function ClosetScreen() {
  const c = usePalette();
  const { width } = useWindowDimensions();
  const { closet, savePiece } = useStore();
  const [filter, setFilter] = useState<Filter>("all");

  if (closet.length === 0) {
    return (
      <Screen>
        <Eyebrow>Closet</Eyebrow>
        <Title>Start with what you own</Title>
        <Body style={{ color: c.muted }}>
          Add photos of your clothes, screenshots of things you’ve bought, or links to product pages. You’ll
          drag them onto each day of the trip, and the closet carries over to the next one.
        </Body>
        <View style={{ gap: Space.sm, marginTop: Space.md }}>
          <Button label="Add clothes" onPress={() => router.push("/add")} />
          <Button
            label="Try sample pieces"
            kind="secondary"
            onPress={() => sampleCloset().forEach(savePiece)}
          />
        </View>
      </Screen>
    );
  }

  const cols = 3;
  const gap = 10;
  const tile = Math.floor((Math.min(width, 520) - Space.xl * 2 - gap * (cols - 1)) / cols);
  const present = CATEGORIES.filter((k) => closet.some((i) => i.category === k));
  const toGet = closet.filter((i) => i.status === "to-get").length;
  const shown = closet.filter((i) =>
    filter === "all" ? true : filter === "to-get" ? i.status === "to-get" : i.category === filter,
  );

  return (
    <Screen>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" }}>
        <View>
          <Eyebrow>
            {closet.length} pieces{toGet ? ` · ${toGet} to get` : ""}
          </Eyebrow>
          <Title>Closet</Title>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/add")}
          hitSlop={12}
          style={{ minHeight: 44, justifyContent: "center" }}
        >
          <Eyebrow style={{ color: c.ink, borderBottomWidth: 1, borderBottomColor: c.ink, paddingBottom: 2 }}>
            Add
          </Eyebrow>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -Space.xl }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: Space.xl }}
      >
        <Chip label="All" on={filter === "all"} onPress={() => setFilter("all")} />
        {toGet > 0 && (
          <Chip label={`To get · ${toGet}`} on={filter === "to-get"} onPress={() => setFilter("to-get")} />
        )}
        {present.map((k) => (
          <Chip key={k} label={CATEGORY_LABEL[k]} on={filter === k} onPress={() => setFilter(k)} />
        ))}
      </ScrollView>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap, marginTop: Space.sm }}>
        {shown.map((i) => (
          <Pressable
            key={i.id}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${i.name}`}
            onPress={() => router.push({ pathname: "/piece/[id]", params: { id: i.id } })}
            style={({ pressed }) => ({ width: tile, gap: 6, opacity: pressed ? 0.7 : 1 })}
          >
            <PieceThumb item={i} width={tile} />
            <View>
              <Serif size={15} numberOfLines={1}>
                {i.name}
              </Serif>
              <Muted numberOfLines={1} style={{ fontSize: 11.5 }}>
                {i.brand ?? CATEGORY_LABEL[i.category]}
              </Muted>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
