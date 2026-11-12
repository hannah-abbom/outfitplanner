import type { ClosetItem } from "@trip/core";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { PieceThumb } from "@/components/piece";
import { Chip, Muted } from "@/components/ui";
import { Fonts, Space, usePalette } from "@/constants/theme";
import { canCutOut, cutOut, type Point } from "@/lib/cutout";
import { useImageUri } from "@/lib/images";

type Images = Pick<ClosetItem, "image" | "original">;

/**
 * Turns a piece's photo into a sticker (WRD-05): cut out on the device, with a white die-cut edge. Opens on the
 * sticker for a new photo; the photo stays one tap away, and tapping the piece in the photo cuts again from there.
 */
export function StickerMaker({
  item,
  auto,
  onChange,
}: {
  item: ClosetItem;
  /** Cut out as soon as the screen opens, for a photo just added. */
  auto: boolean;
  onChange: (images: Images) => void;
}) {
  const c = usePalette();
  const photo = item.original ?? item.image;
  const photoUri = useImageUri(photo);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [tapped, setTapped] = useState<Point | null>(null);
  const [box, setBox] = useState({ w: 1, h: 1 });
  // The tap target takes the photo's own shape, so a tap lands on the same spot in the photo.
  const [ratio, setRatio] = useState(1.25);
  const tapHeight = Math.round(Math.min(220, Math.max(90, 132 * ratio)));
  const [lastSticker, setLastSticker] = useState<string | null>(item.original ? item.image : null);
  const started = useRef(false);
  const isSticker = !!item.original;

  // A new sticker peels onto the page: in small and tilted, a little overshoot, then it settles.
  const reduce = useReducedMotion();
  const peel = useSharedValue(1);
  const shown = useRef(item.image);
  useEffect(() => {
    if (shown.current === item.image) return; // not when the editor opens on a sticker already made
    shown.current = item.image;
    if (!isSticker || reduce) return;
    peel.set(0);
    peel.set(withSpring(1, { damping: 9, stiffness: 170, mass: 0.7 }));
  }, [item.image, isSticker, reduce, peel]);
  const peeled = useAnimatedStyle(() => ({
    opacity: Math.min(1, peel.get() * 2.5),
    transform: [{ scale: 0.7 + 0.3 * peel.get() }, { rotate: `${(1 - peel.get()) * -14}deg` }],
  }));
  const canMake = canCutOut && !!photo && item.source !== "link";

  async function make(at?: Point) {
    if (!photoUri || !photo || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const sticker = await cutOut(photoUri, at);
      if (sticker) {
        setLastSticker(sticker);
        onChange({ image: sticker, original: photo });
      } else {
        setNote("Couldn’t find a piece to lift out there. Tap the piece in the photo.");
      }
    } catch {
      setNote("Stickers couldn’t be made in this browser. The photo is kept as it is.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!auto || started.current || !canMake || isSticker || !photoUri) return;
    started.current = true;
    const t = setTimeout(() => void make(), 0);
    return () => clearTimeout(t);
  });

  const onLayout = (e: LayoutChangeEvent) =>
    setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  return (
    <View style={{ alignItems: "center", gap: Space.sm }}>
      <View>
        <Animated.View style={peeled}>
          <PieceThumb item={item} width={190} showToGet={false} />
        </Animated.View>
        {busy && (
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: c.scrim,
            }}
          >
            <ActivityIndicator color={c.sticker} />
            <Text
              style={{
                fontFamily: Fonts.medium,
                fontSize: 11,
                letterSpacing: 1.6,
                textTransform: "uppercase",
                color: c.sticker,
              }}
            >
              Cutting out
            </Text>
          </View>
        )}
      </View>

      {canMake && (isSticker || lastSticker) && (
        <View style={{ flexDirection: "row", gap: 6 }}>
          <Chip
            label="Sticker"
            on={isSticker}
            onPress={() => !isSticker && lastSticker && onChange({ image: lastSticker, original: photo })}
          />
          <Chip
            label="Photo"
            on={!isSticker}
            onPress={() => isSticker && onChange({ image: photo, original: null })}
          />
        </View>
      )}

      {canMake && !isSticker && !busy && !lastSticker && (
        <Chip label="Make it a sticker" onPress={() => void make()} />
      )}

      {canMake && photoUri && (
        <View style={{ alignItems: "center", gap: 6, marginTop: Space.xs }}>
          <Muted style={{ textAlign: "center" }}>
            {isSticker
              ? "Not the right piece? Tap it in the photo."
              : "Tap the piece in the photo to cut it out."}
          </Muted>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tap the piece in the photo to cut it out from there"
            disabled={busy}
            onLayout={onLayout}
            onPress={(e) => {
              const at = {
                x: Math.min(1, Math.max(0, e.nativeEvent.locationX / box.w)),
                y: Math.min(1, Math.max(0, e.nativeEvent.locationY / box.h)),
              };
              setTapped(at);
              void make(at);
            }}
            style={{
              width: 132,
              height: tapHeight,
              borderRadius: 6,
              overflow: "hidden",
              backgroundColor: c.sunk,
            }}
          >
            <Image
              source={{ uri: photoUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              onLoad={(e) => e.source.width > 0 && setRatio(e.source.height / e.source.width)}
            />
            {tapped && (
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: tapped.x * box.w - 7,
                  top: tapped.y * box.h - 7,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  borderWidth: 2,
                  borderColor: c.sticker,
                  backgroundColor: c.accent,
                }}
              />
            )}
          </Pressable>
        </View>
      )}

      {note && (
        <Text style={{ fontFamily: Fonts.body, fontSize: 13, color: c.accent, textAlign: "center" }}>
          {note}
        </Text>
      )}
    </View>
  );
}
