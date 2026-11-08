import { Gloock_400Regular } from "@expo-google-fonts/gloock";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { IBMPlexMono_400Regular, IBMPlexMono_500Medium } from "@expo-google-fonts/ibm-plex-mono";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { usePalette } from "@/constants/theme";
import { useWeatherSync } from "@/lib/weather";
import { TripProvider, useTrip } from "@/state/trip-store";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navigator() {
  const c = usePalette();
  const { ready } = useTrip();
  const [fontsLoaded, fontError] = useFonts({
    Gloock_400Regular,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
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
      <Stack.Screen name="day/[date]" />
      <Stack.Screen name="flight/[id]" />
      <Stack.Screen name="stay/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <TripProvider>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Navigator />
    </TripProvider>
  );
}
