import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import { Icon } from "@/components/icons";
import { Fonts, usePalette } from "@/constants/theme";

export function BackHeader({ label }: { label: string }) {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start" }}
    >
      <Icon name="chevronLeft" color={c.accent} size={20} strokeWidth={2} />
      <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: c.accent }}>{label}</Text>
    </Pressable>
  );
}
