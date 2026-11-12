import type { ClosetItem } from "@trip/core";
import * as Haptics from "expo-haptics";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Platform, View, type HostInstance, type StyleProp, type ViewStyle } from "react-native";
import { GestureDetector, usePanGesture, type PanGestureActiveEvent } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { SPRING } from "@/components/motion";
import { PieceThumb } from "@/components/piece";
import { usePalette } from "@/constants/theme";

/*
 * Drag a piece from the closet onto a look. Pieces in the tray are draggable; looks register as drop zones. On
 * the phone a drag starts with a short press so the tray still scrolls; with a mouse it starts when you move.
 * Tapping a piece and then a look does the same thing without dragging, for anyone who prefers it.
 */

type Rect = { x: number; y: number; w: number; h: number };
type Zone = { view: HostInstance | null; onDrop: (itemId: string) => void; rect: Rect | null };

interface Drag {
  register: (id: string, zone: Zone) => () => void;
  start: (item: ClosetItem, x: number, y: number) => void;
  move: (x: number, y: number) => void;
  end: (x: number, y: number) => void;
  dragging: ClosetItem | null;
  hover: string | null;
}

const Ctx = createContext<Drag | null>(null);
const GHOST = { w: 64, h: 80 };
const WEB = Platform.OS === "web";

/** With a mouse, a drag would otherwise select the text it passes over. */
function selectable(on: boolean) {
  if (WEB && typeof document !== "undefined") document.body.style.userSelect = on ? "" : "none";
}

function tap() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function DragProvider({ children }: { children: ReactNode }) {
  const zones = useRef(new Map<string, Zone>());
  const [dragging, setDragging] = useState<ClosetItem | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const hoverRef = useRef<string | null>(null);
  const c = usePalette();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const lift = useSharedValue(0);

  const hit = useCallback((px: number, py: number): string | null => {
    for (const [id, z] of zones.current) {
      const r = z.rect;
      if (r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return id;
    }
    return null;
  }, []);

  const setHoverIf = useCallback((id: string | null) => {
    if (hoverRef.current === id) return;
    hoverRef.current = id;
    setHover(id);
    if (id) tap();
  }, []);

  const draggingRef = useRef<ClosetItem | null>(null);

  const register = useCallback((id: string, zone: Zone) => {
    zones.current.set(id, zone);
    return () => {
      if (zones.current.get(id) === zone) zones.current.delete(id);
    };
  }, []);

  const value = useMemo<Drag>(
    () => ({
      register,
      start: (item, px, py) => {
        // Measure every look now: the list may have scrolled since they were laid out.
        for (const z of zones.current.values()) {
          z.rect = null;
          z.view?.measureInWindow((mx, my, w, h) => {
            z.rect = { x: mx, y: my, w, h };
          });
        }
        x.set(px);
        y.set(py);
        lift.set(0);
        lift.set(withSpring(1, SPRING));
        draggingRef.current = item;
        setDragging(item);
        selectable(false);
        tap();
      },
      move: (px, py) => {
        x.set(px);
        y.set(py);
        setHoverIf(hit(px, py));
      },
      end: (px, py) => {
        const item = draggingRef.current;
        const id = hit(px, py);
        draggingRef.current = null;
        setDragging(null);
        setHoverIf(null);
        selectable(true);
        if (item && id) zones.current.get(id)?.onDrop(item.id);
      },
      dragging,
      hover,
    }),
    [register, dragging, hover, hit, setHoverIf, x, y, lift],
  );

  // The piece peels up off the tray: it grows a little and tilts, like a sticker lifted by one corner.
  const ghost = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() - GHOST.w / 2 },
      { translateY: y.get() - GHOST.h * 0.8 },
      { scale: 1 + lift.get() * 0.14 },
      { rotate: `${lift.get() * -8}deg` },
    ],
  }));

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {dragging && (
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                shadowColor: c.ink,
                shadowOpacity: 0.25,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 8 },
                elevation: 8,
              },
              ghost,
            ]}
          >
            <PieceThumb item={dragging} width={GHOST.w} height={GHOST.h} showToGet={false} />
          </Animated.View>
        )}
      </View>
    </Ctx.Provider>
  );
}

export function useDrag(): Drag {
  const d = useContext(Ctx);
  if (!d) throw new Error("useDrag must be used inside DragProvider");
  return d;
}

/** A piece you can pick up from the tray. */
export function DraggablePiece({
  item,
  width,
  selected,
  onPress,
}: {
  item: ClosetItem;
  width: number;
  selected?: boolean;
  onPress: () => void;
}) {
  const drag = useDrag();
  // Handlers are passed by reference and run on the JS thread, so they can reach the drag state directly.
  // A mouse drag ends in a click; ignore it so the piece isn't also selected.
  const dragged = useRef(false);
  const onActivate = (e: PanGestureActiveEvent) => {
    dragged.current = true;
    drag.start(item, e.absoluteX, e.absoluteY);
  };
  const onUpdate = (e: PanGestureActiveEvent) => drag.move(e.absoluteX, e.absoluteY);
  const onDeactivate = (e: PanGestureActiveEvent) => {
    drag.end(e.absoluteX, e.absoluteY);
    setTimeout(() => {
      dragged.current = false;
    }, 300);
  };
  const pan = usePanGesture({
    runOnJS: true,
    minDistance: WEB ? 8 : undefined,
    activateAfterLongPress: WEB ? undefined : 220,
    onActivate,
    onUpdate,
    onDeactivate,
  });
  const lifted = drag.dragging?.id === item.id;
  return (
    <GestureDetector gesture={pan}>
      <View style={{ opacity: lifted ? 0.3 : 1 }}>
        <PieceThumb
          item={item}
          width={width}
          selected={selected}
          onPress={() => !dragged.current && onPress()}
        />
      </View>
    </GestureDetector>
  );
}

/** A look that takes pieces. Highlights while a piece is dragged over it. */
export function DropZone({
  id,
  onDrop,
  style,
  children,
  accessibilityLabel,
}: {
  id: string;
  onDrop: (itemId: string) => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const drag = useDrag();
  const ref = useRef<HostInstance>(null);
  const zone = useRef<Zone>({ view: null, onDrop, rect: null });
  useEffect(() => {
    zone.current.onDrop = onDrop;
  }, [onDrop]);

  const { register } = drag;
  useEffect(() => {
    zone.current.view = ref.current;
    return register(id, zone.current);
  }, [id, register]);

  const over = drag.hover === id;
  // The look swells a little under a piece, to say "drop it here".
  const swell = useSharedValue(1);
  useEffect(() => {
    swell.set(withSpring(over ? 1.025 : 1, SPRING));
  }, [over, swell]);
  const grow = useAnimatedStyle(() => ({ transform: [{ scale: swell.get() }] }));
  return (
    <View ref={ref} accessibilityLabel={accessibilityLabel}>
      <Animated.View
        style={[
          style,
          drag.dragging && { borderColor: c.ink, borderStyle: "dashed" },
          over && { backgroundColor: c.accentSoft, borderColor: c.accent, borderStyle: "solid" },
          grow,
        ]}
      >
        {children}
      </Animated.View>
    </View>
  );
}
