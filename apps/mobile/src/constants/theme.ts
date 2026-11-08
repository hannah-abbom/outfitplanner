import { useColorScheme } from "react-native";

/** Design tokens, carried over from the design canvas: passport burgundy, brass, boarding-pass mono. */
const light = {
  paper: "#f5f3f6",
  surface: "#ffffff",
  sunk: "#ebe7ed",
  ink: "#1d1a22",
  muted: "#6b6371",
  line: "#ddd6df",
  accent: "#7b1e3f",
  accentSoft: "#f4e4ea",
  onAccent: "#ffffff",
  brass: "#7a5612",
  brassSoft: "#f5ecd7",
  good: "#2e7d4f",
  goodSoft: "#e2f1e7",
  bad: "#8f1d17",
  badSoft: "#fbe8e6",
  warn: "#8a4b0b",
  warnSoft: "#fdf3e7",
  shadow: "rgba(29,26,34,0.12)",
  /** The boarding pass keeps passport burgundy in both themes. */
  pass: "#7b1e3f",
  onPass: "#ffffff",
  passRule: "rgba(255,255,255,0.45)",
};

const dark: typeof light = {
  paper: "#141117",
  surface: "#1d1922",
  sunk: "#28232e",
  ink: "#f1edf3",
  muted: "#a79fad",
  line: "#363040",
  accent: "#e98fac",
  accentSoft: "#3a2230",
  onAccent: "#2a0d18",
  brass: "#dcb460",
  brassSoft: "#362d1b",
  good: "#7fd09f",
  goodSoft: "#1d3326",
  bad: "#ff8f85",
  badSoft: "#3d2221",
  warn: "#f2b56b",
  warnSoft: "#3a2a17",
  shadow: "rgba(0,0,0,0.5)",
  pass: "#6a1a37",
  onPass: "#ffffff",
  passRule: "rgba(255,255,255,0.4)",
};

export type Palette = typeof light;

/** Colors for each stay on the route ribbon; mid tones that read on both themes. */
export const STOP_COLORS = [
  "#9b2c52",
  "#3a6ea5",
  "#a07a2c",
  "#8a8290",
  "#1f7f7a",
  "#6b5aa5",
  "#b35f2b",
] as const;

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export const Fonts = {
  display: "Gloock_400Regular",
  body: "HankenGrotesk_400Regular",
  medium: "HankenGrotesk_500Medium",
  semibold: "HankenGrotesk_600SemiBold",
  bold: "HankenGrotesk_700Bold",
  mono: "IBMPlexMono_400Regular",
  monoMedium: "IBMPlexMono_500Medium",
} as const;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;
export const Radius = { sm: 10, md: 14, lg: 18, pill: 999 } as const;
