import {
  CATEGORIES,
  CATEGORY_LABEL,
  COLORS,
  guessFromName,
  STYLE_TAGS,
  type Category,
  type ClosetItem,
  type StyleTag,
  type Warmth,
} from "@trip/core";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Close } from "@/components/close";
import { PieceThumb } from "@/components/piece";
import { Button, Chip, Eyebrow, Muted, Segmented, Title } from "@/components/ui";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";
import { takeDraft } from "@/lib/capture";
import { newId, useStore } from "@/state/trip-store";

const TAG_LABEL: Record<StyleTag, string> = {
  casual: "Casual",
  dressy: "Dressy",
  active: "Active",
  beach: "Beach",
  rain: "Rain-ready",
};

/** Adding or editing one piece. A first guess fills in from the name, so it's mostly a confirmation. */
export default function PieceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { closet, savePiece, removePiece } = useStore();
  const existing = closet.find((i) => i.id === id);

  const [item, setItem] = useState<ClosetItem>(() => {
    if (existing) return existing;
    const d = takeDraft() ?? {};
    const name = d.name ?? "";
    const guess = guessFromName(name);
    return {
      id: newId("p"),
      name,
      category: d.category ?? guess.category,
      color: d.color ?? guess.color,
      warmth: d.warmth ?? guess.warmth,
      tags: d.tags ?? guess.tags,
      image: d.image ?? null,
      source: d.source ?? "manual",
      link: d.link ?? null,
      brand: d.brand ?? null,
      status: "owned",
      addedAt: new Date().toISOString(),
    };
  });
  // Fields the person picked by hand stop following the name.
  const [touched, setTouched] = useState<Set<string>>(() => new Set(existing ? ["category", "color", "warmth", "tags"] : []));
  const set = <K extends keyof ClosetItem>(key: K, value: ClosetItem[K]) => {
    setTouched((t) => new Set(t).add(key));
    setItem((i) => ({ ...i, [key]: value }));
  };
  const rename = (name: string) => {
    const g = guessFromName(name);
    setItem((i) => ({
      ...i,
      name,
      category: touched.has("category") ? i.category : g.category,
      color: touched.has("color") || (!g.color && i.color) ? i.color : g.color,
      warmth: touched.has("warmth") ? i.warmth : g.warmth,
      tags: touched.has("tags") ? i.tags : g.tags,
    }));
  };

  const input = {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: c.ink,
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    minHeight: 44,
  } as const;
  const valid = item.name.trim().length > 0;

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
          <Title>{existing ? "Edit piece" : "New piece"}</Title>
          <Close />
        </View>

        <View style={{ alignItems: "center", gap: 6 }}>
          <PieceThumb item={item} width={168} showToGet={false} />
          <Muted>
            {item.source === "screenshot"
              ? "From a screenshot"
              : item.source === "link"
                ? "From a link"
                : item.source === "photo"
                  ? "From a photo"
                  : "No photo: drawn in its colour"}
          </Muted>
        </View>

        <Eyebrow style={{ marginTop: Space.sm }}>Name</Eyebrow>
        <TextInput
          value={item.name}
          onChangeText={rename}
          placeholder="e.g. Ivory linen shirt"
          placeholderTextColor={c.faint}
          accessibilityLabel="Name"
          style={[input, { fontFamily: Fonts.serif, fontSize: 22, minHeight: 52 }]}
        />

        <Eyebrow style={{ marginTop: Space.sm }}>What it is</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {CATEGORIES.map((k: Category) => (
            <Chip key={k} label={CATEGORY_LABEL[k]} on={item.category === k} onPress={() => set("category", k)} />
          ))}
        </View>

        <Eyebrow style={{ marginTop: Space.sm }}>Colour{item.color ? ` · ${item.color}` : ""}</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {Object.entries(COLORS).map(([name, hex]) => {
            const on = item.color === name;
            return (
              <Pressable
                key={name}
                accessibilityRole="button"
                accessibilityLabel={name}
                accessibilityState={{ selected: on }}
                onPress={() => set("color", on ? null : name)}
                hitSlop={4}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: hex,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? c.accent : c.line,
                }}
              />
            );
          })}
        </View>

        <Eyebrow style={{ marginTop: Space.sm }}>Warmth</Eyebrow>
        <Segmented<Warmth>
          value={item.warmth}
          onChange={(v) => set("warmth", v)}
          options={[
            { value: "light", label: "Light" },
            { value: "mid", label: "Mid" },
            { value: "warm", label: "Warm" },
          ]}
        />

        <Eyebrow style={{ marginTop: Space.sm }}>Good for</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {STYLE_TAGS.map((tag) => {
            const on = item.tags.includes(tag);
            return (
              <Chip
                key={tag}
                label={TAG_LABEL[tag]}
                on={on}
                onPress={() => set("tags", on ? item.tags.filter((x) => x !== tag) : [...item.tags, tag])}
              />
            );
          })}
        </View>

        <Eyebrow style={{ marginTop: Space.sm }}>Do you have it?</Eyebrow>
        <Segmented<ClosetItem["status"]>
          value={item.status}
          onChange={(v) => set("status", v)}
          options={[
            { value: "owned", label: "I have it" },
            { value: "to-get", label: "To get" },
          ]}
        />

        <Eyebrow style={{ marginTop: Space.sm }}>Brand and link</Eyebrow>
        <TextInput
          value={item.brand ?? ""}
          onChangeText={(v) => set("brand", v.trim() ? v : null)}
          placeholder="Brand (optional)"
          placeholderTextColor={c.faint}
          accessibilityLabel="Brand"
          style={input}
        />
        <TextInput
          value={item.link ?? ""}
          onChangeText={(v) => set("link", v.trim() ? v.trim() : null)}
          placeholder="Product link (optional)"
          placeholderTextColor={c.faint}
          autoCapitalize="none"
          keyboardType="url"
          accessibilityLabel="Product link"
          style={input}
        />

        <Button
          label={existing ? "Save" : "Add to closet"}
          disabled={!valid}
          onPress={() => {
            savePiece({ ...item, name: item.name.trim() });
            router.back();
          }}
          style={{ marginTop: Space.md }}
        />
        {existing && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              removePiece(item.id);
              router.back();
            }}
            style={{ alignSelf: "center", padding: Space.md, minHeight: 44 }}
          >
            <Text style={{ fontFamily: Fonts.medium, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: c.accent }}>
              Remove from closet
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
