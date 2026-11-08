import { router } from "expo-router";
import { Pressable } from "react-native";

import { Icon } from "@/components/icons";
import { usePalette } from "@/constants/theme";

/** The round close button on sheets. */
export function Close() {
  const c = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Close"
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: c.line, alignItems: "center", justifyContent: "center" }}
    >
      <Icon name="close" color={c.ink} size={16} strokeWidth={1.6} />
    </Pressable>
  );
}
