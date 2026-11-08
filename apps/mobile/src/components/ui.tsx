import type { ReactNode } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts, Radius, Space, usePalette } from "@/constants/theme";

type TextProps = { children: ReactNode; style?: StyleProp<TextStyle>; numberOfLines?: number };

export function Title({ children, style }: TextProps) {
  const c = usePalette();
  return (
    <Text style={[{ fontFamily: Fonts.display, fontSize: 32, lineHeight: 36, color: c.ink }, style]}>
      {children}
    </Text>
  );
}

export function Body({ children, style, numberOfLines }: TextProps) {
  const c = usePalette();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: Fonts.body, fontSize: 15, lineHeight: 21, color: c.ink }, style]}
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
      style={[{ fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 20, color: c.ink }, style]}
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

export function Mono({ children, style }: TextProps) {
  const c = usePalette();
  return <Text style={[{ fontFamily: Fonts.mono, fontSize: 12, color: c.muted }, style]}>{children}</Text>;
}

/** Small uppercase label above a section. */
export function Eyebrow({ children, style }: TextProps) {
  const c = usePalette();
  return (
    <Text
      style={[
        {
          fontFamily: Fonts.monoMedium,
          fontSize: 11,
          letterSpacing: 1.4,
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

/** A full screen with the safe area, scrolling content and room above the tab bar. */
export function Screen({ children, tabs = true }: { children: ReactNode; tabs?: boolean }) {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + Space.lg,
        paddingBottom: (tabs ? 110 : 40) + insets.bottom,
        paddingHorizontal: Space.xl,
        gap: Space.md,
      }}
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  onPress,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const c = usePalette();
  const base = {
    backgroundColor: c.surface,
    borderColor: c.line,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderRadius: Radius.md,
    padding: Space.md,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [base, style, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

export type Tone = "ok" | "todo" | "check" | "soon" | "accent";

export function Tag({ children, tone }: { children: ReactNode; tone: Tone }) {
  const c = usePalette();
  const colors: Record<Tone, [string, string]> = {
    ok: [c.goodSoft, c.good],
    todo: [c.badSoft, c.bad],
    check: [c.sunk, c.muted],
    soon: [c.brassSoft, c.brass],
    accent: [c.accentSoft, c.accent],
  };
  const [bg, fg] = colors[tone];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: Radius.pill,
        paddingHorizontal: 8,
        paddingVertical: 3,
        alignSelf: "flex-start",
      }}
    >
      <Text style={{ fontFamily: Fonts.monoMedium, fontSize: 11, color: fg }}>{children}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = "primary",
  disabled,
}: {
  label: string;
  onPress: () => void;
  kind?: "primary" | "secondary";
  disabled?: boolean;
}) {
  const c = usePalette();
  const primary = kind === "primary";
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        borderRadius: Radius.md,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: Space.lg,
        backgroundColor: primary ? c.accent : c.surface,
        borderWidth: primary ? 0 : 1,
        borderColor: c.line,
        opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ fontFamily: Fonts.semibold, fontSize: 15, color: primary ? c.onAccent : c.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Two or more options side by side, one selected. */
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
      style={{ flexDirection: "row", gap: 4, padding: 4, borderRadius: Radius.md, backgroundColor: c.sunk }}
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
              flex: 1,
              minHeight: 42,
              borderRadius: Radius.sm,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: on ? c.surface : "transparent",
            }}
          >
            <Text style={{ fontFamily: Fonts.semibold, fontSize: 14, color: on ? c.ink : c.muted }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
