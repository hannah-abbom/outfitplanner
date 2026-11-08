import { router } from "expo-router";
import { Pressable, Text } from "react-native";

import { Icon } from "@/components/icons";
import { Fonts, usePalette } from "@/constants/theme";

export function BackHeader({ label, color }: { label: string; color?: string }) {
  const c = usePalette();
  const fg = color ?? c.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, minHeight: 44, alignSelf: "flex-start" }}
    >
      <Icon name="chevronLeft" color={fg} size={14} strokeWidth={1.6} />
      <Text style={{ fontFamily: Fonts.medium, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: fg }}>{label}</Text>
    </Pressable>
  );
}
