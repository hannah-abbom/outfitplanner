import { useColorScheme } from "react-native";

/*
 * Editorial: white paper, black ink, photography doing the decorating, and one accent. The accent is burgundy and
 * marks what needs you: the next thing to do, a missing transfer, a piece you still have to buy, the selected tab.
 */
const light = {
  paper: "#ffffff",
  surface: "#ffffff",
  sunk: "#f3f2ef",
  ink: "#111111",
  muted: "#6b6b6b",
  faint: "#9a9a9a",
  line: "#e8e8e8",
  accent: "#7a1f3d",
  accentSoft: "#f6ebef",
  onAccent: "#ffffff",
  /** Primary buttons are ink, so burgundy stays rare. */
  button: "#111111",
  onButton: "#ffffff",
  scrim: "rgba(0,0,0,0.55)",
  /** Stickers keep a white die-cut edge in both themes, like the real thing. */
  sticker: "#ffffff",
  stickerShadow: "rgba(17,17,17,0.18)",
  /** The flight screen is dark in both themes. */
  pass: "#0b0b0b",
  onPass: "#f4f3f0",
  passMuted: "#8c8c8c",
  passLine: "#262626",
};

const dark: typeof light = {
  paper: "#0b0b0b",
  surface: "#141414",
  sunk: "#1c1c1c",
  ink: "#f4f3f0",
  muted: "#a3a3a3",
  faint: "#6e6e6e",
  line: "#2a2a2a",
  accent: "#e39ab0",
  accentSoft: "#2e1820",
  onAccent: "#1a0710",
  button: "#f4f3f0",
  onButton: "#0b0b0b",
  scrim: "rgba(0,0,0,0.6)",
  sticker: "#ffffff",
  stickerShadow: "rgba(0,0,0,0.55)",
  pass: "#000000",
  onPass: "#f4f3f0",
  passMuted: "#8c8c8c",
  passLine: "#262626",
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === "dark" ? dark : light;
}

export const Fonts = {
  /** Bodoni Moda italic: titles, place names, the names of looks. */
  serif: "BodoniModa_400Regular_Italic",
  serifUpright: "BodoniModa_400Regular",
  light: "Geist_300Light",
  body: "Geist_400Regular",
  medium: "Geist_500Medium",
  semibold: "Geist_600SemiBold",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
} as const;

export const Space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const Radius = { sm: 4, md: 8, lg: 14, pill: 999 } as const;
