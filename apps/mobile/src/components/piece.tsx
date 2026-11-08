import type { ClosetItem } from "@trip/core";
import { Image } from "expo-image";
import { Pressable, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Flat } from "@/components/flat";
import { Fonts, usePalette } from "@/constants/theme";

/** A piece as a tile: its photo, or a drawing in its colour when it has none. */
export function PieceThumb({
  item,
  width,
  height = Math.round(width * 1.25),
  onPress,
  selected,
  showToGet = true,
  style,
}: {
  item: ClosetItem;
  width: number;
  height?: number;
  onPress?: () => void;
  selected?: boolean;
  showToGet?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  const body = (
    <View
      style={[
        {
          width,
          height,
          backgroundColor: c.sunk,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          borderWidth: selected ? 2 : 0,
          borderColor: c.accent,
        },
        style,
      ]}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={150} />
      ) : (
        <Flat category={item.category} color={item.color} size={Math.round(Math.min(width, height) * 0.72)} />
      )}
      {showToGet && item.status === "to-get" && (
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.accent, paddingVertical: 2 }}>
          <Text
            style={{
              fontFamily: Fonts.medium,
              fontSize: 8,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: c.onAccent,
              textAlign: "center",
            }}
          >
            To get
          </Text>
        </View>
      )}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => pressed && { opacity: 0.7 }}
    >
      {body}
    </Pressable>
  );
}
