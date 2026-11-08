import { router } from "expo-router";
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from "expo-router/ui";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon, type IconName } from "@/components/icons";
import { Fonts, usePalette } from "@/constants/theme";

/** The five places from the information architecture: Itinerary, Bookings, Add, Ready, Pack. */
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
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: c.surface,
          borderTopWidth: 1,
          borderTopColor: c.line,
          flexDirection: "row",
          alignItems: "flex-start",
        }}
      >
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="map" label="Itinerary" />
        </TabTrigger>
        <TabTrigger name="bookings" href="/bookings" asChild>
          <TabButton icon="ticket" label="Bookings" />
        </TabTrigger>
        <AddButton />
        <TabTrigger name="ready" href="/ready" asChild>
          <TabButton icon="shield" label="Ready" />
        </TabTrigger>
        <TabTrigger name="pack" href="/pack" asChild>
          <TabButton icon="suitcase" label="Pack" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  icon,
  label,
  isFocused,
  ...props
}: Omit<TabTriggerSlotProps, "ref"> & { icon: IconName; label: string }) {
  const c = usePalette();
  const color = isFocused ? c.accent : c.muted;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={{ flex: 1, alignItems: "center", gap: 4, minHeight: 48 }}
    >
      <Icon name={icon} color={color} size={24} />
      <Text style={{ fontFamily: Fonts.semibold, fontSize: 11, color }}>{label}</Text>
    </Pressable>
  );
}

function AddButton() {
  const c = usePalette();
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a booking or import a trip"
        onPress={() => router.push("/add")}
        style={({ pressed }) => ({
          width: 56,
          height: 56,
          marginTop: -26,
          borderRadius: 28,
          backgroundColor: c.accent,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: c.accent,
          shadowOpacity: 0.35,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Icon name="plus" color={c.onAccent} size={26} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}
