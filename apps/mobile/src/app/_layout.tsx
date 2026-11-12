import { BodoniModa_400Regular, BodoniModa_400Regular_Italic } from "@expo-google-fonts/bodoni-moda";
import {
  Geist_300Light,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
} from "@expo-google-fonts/geist";
import { GeistMono_400Regular, GeistMono_500Medium } from "@expo-google-fonts/geist-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { DragProvider } from "@/components/drag";
import { usePalette } from "@/constants/theme";
import { useWeatherSync } from "@/lib/weather";
import { TripProvider, useStore } from "@/state/trip-store";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const c = usePalette();
  const { ready } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_400Regular_Italic,
    Geist_300Light,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });
  const loaded = ready && (fontsLoaded || fontError !== null);
  useWeatherSync();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add" options={{ presentation: "modal" }} />
      <Stack.Screen name="trip-settings" options={{ presentation: "modal" }} />
      <Stack.Screen name="piece/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="day/[date]" />
      <Stack.Screen name="flight/[id]" />
      <Stack.Screen name="stay/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TripProvider>
        <DragProvider>
          <StatusBar style={scheme === "dark" ? "light" : "dark"} />
          <Navigator />
        </DragProvider>
      </TripProvider>
    </GestureHandlerRootView>
  );
}
