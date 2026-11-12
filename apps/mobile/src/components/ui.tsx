import { useEffect, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressScale } from "@/components/motion";
import { Fonts, Radius, Space, usePalette } from "@/constants/theme";

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

/** A screen title: Bodoni italic, large. */
export function Title({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      accessibilityRole="header"
      style={[
        { fontFamily: Fonts.serif, fontSize: 40, lineHeight: 44, letterSpacing: -0.4, color: c.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** Bodoni italic at reading sizes: place names, piece names, look names. */
export function Serif({ children, style, numberOfLines, size = 20 }: TextProps & { size?: number }) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        { fontFamily: Fonts.serif, fontSize: size, lineHeight: Math.round(size * 1.22), color: c.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: Fonts.body, fontSize: 15, lineHeight: 22, color: c.ink }, style]}
    >
      {children}
    </Text>
  );
}

export function Strong({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: Fonts.medium, fontSize: 15, lineHeight: 20, color: c.ink }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: Fonts.body, fontSize: 13, lineHeight: 18, color: c.muted }, style]}
    >
      {children}
    </Text>
  );
}

export function Mono({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: Fonts.mono, fontSize: 12, letterSpacing: 0.4, color: c.muted }, style]}
    >
      {children}
    </Text>
  );
}

/** Small spaced capitals above a section or a title. */
export function Eyebrow({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          fontFamily: Fonts.medium,
          fontSize: 10.5,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: c.muted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

/** A section label with an optional action on the right. */
export function SectionHeader({
  title,
  action,
  onAction,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  return (
    <View
      style={[
        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: Space.lg },
        style,
      ]}
    >
      <Eyebrow>{title}</Eyebrow>
      {action && onAction && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={12}
          style={{ minHeight: 32, justifyContent: "center" }}
        >
          <Eyebrow style={{ color: c.ink }}>{action}</Eyebrow>
        </Pressable>
      )}
    </View>
  );
}

/** A full screen with the safe area, scrolling content and room above the tab bar. */
export function Screen({
  children,
  tabs = true,
  hero,
  gap = Space.md,
}: {
  children: ReactNode;
  tabs?: boolean;
  /** Full-bleed content above the padded column, drawn under the status bar. */
  hero?: ReactNode;
  gap?: number;
}) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{ paddingBottom: (tabs ? 100 : 40) + insets.bottom }}
    >
      {hero}
      <View
        style={{
          paddingTop: hero ? Space.lg : insets.top + Space.lg,
          paddingHorizontal: Space.xl,
          gap,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const base = {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.sm,
    padding: Space.lg,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, style, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

/** A thin line between things. `strong` draws it in ink, to open a section. */
export function Rule({ strong, style }: { strong?: boolean; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return (
    <View
      style={[
        { height: strong ? 1 : StyleSheet.hairlineWidth * 2, backgroundColor: strong ? c.ink : c.line },
        style,
      ]}
    />
  );
}

/** A row in a list: content with a hairline under it, tappable when it goes somewhere. */
export function Row({
  children,
  onPress,
  last,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  last?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const base: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    gap: Space.md,
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth * 2,
    borderBottomColor: c.line,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [base, style, pressed && { opacity: 0.6 }]}
    >
      {children}
    </Pressable>
  );
}

export type Tone = "ok" | "todo" | "check" | "soon" | "accent";

/** A status in small capitals. Burgundy when it needs you. */
export function Tag({ children, tone }: { children: ReactNode; tone: Tone }) {
  const c = usePalette();
  const color: Record<Tone, string> = {
    ok: c.ink,
    todo: c.accent,
    check: c.muted,
    soon: c.accent,
    accent: c.accent,
  };
  return (
    <Text
      style={{
        fontFamily: Fonts.medium,
        fontSize: 9.5,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: color[tone],
      }}
    >
      {children}
    </Text>
  );
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary" | "accent";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = usePalette();
  const bg = kind === "primary" ? c.button : kind === "accent" ? c.accent : "transparent";
  const fg = kind === "primary" ? c.onButton : kind === "accent" ? c.onAccent : c.ink;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      to={0.97}
      style={[
        {
          minHeight: 50,
          borderRadius: Radius.pill,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: Space.xl,
          backgroundColor: bg,
          borderWidth: kind === "secondary" ? 1 : 0,
          borderColor: c.ink,
          opacity: disabled ? 0.4 : 1,
        },
        style,
      ]}
    >
      <Text
        style={{
          fontFamily: Fonts.medium,
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          color: fg,
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

/** Options in a row, the selected one underlined in burgundy. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const c = usePalette();
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: "row",
        gap: Space.xl,
        borderBottomWidth: StyleSheet.hairlineWidth * 2,
        borderBottomColor: c.line,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{
              minHeight: 44,
              justifyContent: "center",
              borderBottomWidth: 1.5,
              borderBottomColor: on ? c.accent : "transparent",
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.medium,
                fontSize: 11,
                letterSpacing: 1.8,
                textTransform: "uppercase",
                color: on ? c.ink : c.faint,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** A small rounded choice, filled when selected. */
export function Chip({
  label,
  on,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  on?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const c = usePalette();
  const content = (
    <Text style={{ fontFamily: Fonts.medium, fontSize: 12, color: on ? c.onButton : c.ink }}>{label}</Text>
  );
  const style: ViewStyle = {
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: on ? c.button : c.line,
    backgroundColor: on ? c.button : "transparent",
    alignItems: "center",
    justifyContent: "center",
  };
  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!on }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={6}
      to={0.92}
      style={style}
    >
      {content}
    </PressScale>
  );
}

/** A thin line that fills to show progress, easing to each new value. */
export function ProgressLine({ value }: { value: number }) {
  const c = usePalette();
  const share = useSharedValue(0);
  useEffect(() => {
    share.set(
      withTiming(Math.max(0, Math.min(1, value)), { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [value, share]);
  const fill = useAnimatedStyle(() => ({ width: `${share.get() * 100}%` }));
  return (
    <View
      style={{ height: 2, backgroundColor: c.line }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
    >
      <Animated.View style={[{ height: 2, backgroundColor: c.accent }, fill]} />
    </View>
  );
}
