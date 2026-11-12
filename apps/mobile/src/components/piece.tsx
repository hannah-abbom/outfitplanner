import type { ClosetItem } from "@trip/core";
import { Image } from "expo-image";
import { Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Flat } from "@/components/flat";
import { PressScale } from "@/components/motion";
import { Fonts, usePalette } from "@/constants/theme";
import { useImageUri } from "@/lib/images";

/** Each piece leans a little, the same way every time, like stickers pressed on by hand. */
export function tiltOf(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(h) % 9) - 4) * 0.8;
}

/**
 * A piece as a sticker: its cut-out, its photo in a white die-cut frame, or its drawing with a white edge. Every
 * kind sits the same way on the tile, so a closet of mixed photos still looks like one set.
 */
export function PieceThumb({
  item,
  width,
  height = Math.round(width * 1.25),
  onPress,
  selected,
  showToGet = true,
  tilt = true,
  style,
}: {
  item: ClosetItem;
  width: number;
  height?: number;
  onPress?: () => void;
  selected?: boolean;
  showToGet?: boolean;
  tilt?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  const uri = useImageUri(item.image);
  const isSticker = !!item.image && !!item.original;
  const shadow = { filter: `drop-shadow(0px 2px 3px ${c.stickerShadow})` } as const;
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
      <View
        style={[
          {
            width: "84%",
            height: "84%",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ rotate: `${tilt ? tiltOf(item.id) : 0}deg` }],
          },
          shadow,
        ]}
      >
        {uri && isSticker && (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
            transition={150}
          />
        )}
        {uri && !isSticker && (
          <View
            style={{ width: "88%", height: "88%", padding: 3, backgroundColor: c.sticker, borderRadius: 6 }}
          >
            <Image
              source={{ uri }}
              style={{ flex: 1, borderRadius: 4 }}
              contentFit="cover"
              transition={150}
            />
          </View>
        )}
        {!uri && (
          <Flat
            category={item.category}
            color={item.color}
            size={Math.round(Math.min(width, height) * 0.8)}
          />
        )}
      </View>
      {showToGet && item.status === "to-get" && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.accent,
            paddingVertical: 2,
          }}
        >
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
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={item.name}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      to={0.92}
    >
      {body}
    </PressScale>
  );
}
