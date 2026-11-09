import { router, type Href } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/icons";
import { Fonts, usePalette } from "@/constants/theme";

/**
 * Home · Outfits · [+] · Closet · Trip. Outfits sits next to Home because planning what to wear is the point of
 * the app; the plus adds clothes first, since the closet is what everything else is built from.
 */
export default function TabsLayout() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingTop: 6,
          paddingHorizontal: 12,
          paddingBottom: Math.max(insets.bottom, 12),
          backgroundColor: c.paper,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: c.line,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Home" />
        </TabTrigger>
        <TabTrigger name="outfits" href="/outfits" asChild>
          <TabButton label="Outfits" />
        </TabTrigger>
        <AddButton />
        <TabTrigger name="closet" href="/closet" asChild>
          <TabButton label="Closet" />
        </TabTrigger>
        <TabTrigger name="trip" href="/trip" asChild>
          <TabButton label="Trip" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ label, isFocused, ...props }: Omit<TabTriggerSlotProps, "ref"> & { label: string }) {
  const c = usePalette();
  // The tab navigates itself and isn't a link: a page embedded in another (like an artifact) can have its link
  // clicks intercepted, and the trigger's own handler skips clicks the host has already marked as handled.
  const { href, onPress: _onPress, ...rest } = props;
  return (
    <Pressable
      {...rest}
      onPress={() => href && router.navigate(href as Href)}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48 }}
    >
      <View style={{ borderBottomWidth: 1.5, borderBottomColor: isFocused ? c.accent : "transparent", paddingBottom: 4 }}>
        <Text
          style={{
            fontFamily: Fonts.medium,
            fontSize: 10.5,
            letterSpacing: 1.8,
            textTransform: "uppercase",
            color: isFocused ? c.ink : c.faint,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function AddButton() {
  const c = usePalette();
  return (
    <View style={{ flex: 0.9, alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add clothes or a trip"
        onPress={() => router.push("/add")}
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: c.accent,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.8 : 1,
        })}
      >
        <Icon name="plus" color={c.onAccent} size={20} strokeWidth={1.6} />
      </Pressable>
    </View>
  );
}
