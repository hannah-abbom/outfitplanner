import { COLORS, type Category } from "@trip/core";
import Svg, { Path } from "react-native-svg";

import { usePalette } from "@/constants/theme";

/** A fashion flat for each kind of piece, drawn on a 64-unit grid. */
const SHAPES: Record<Category, { body: string; lines?: string }> = {
  top: { body: "M23 9l9 5 9-5 13 8-4 11-6-3v31H20V25l-6 3-4-11z", lines: "M32 14v42M27 10l5 9 5-9" },
  bottom: { body: "M20 8h24l3 48H36l-4-30-4 30H17z", lines: "M20 13h24" },
  dress: { body: "M27 6h10l2 10-3 6 12 34H16l12-34-3-6z", lines: "M25 22h14" },
  set: {
    body: "M24 7l8 3 8-3 10 6-3 7-5-2v10H22V18l-5 2-3-7zM21 33h22l2 24h-9l-4-15-4 15h-9z",
    lines: "M21 37h22",
  },
  layer: {
    body: "M24 12c2-6 14-6 16 0l10 4 6 30-8 2-2-18v28H18V30l-2 18-8-2 6-30z",
    lines: "M32 18v40M26 12c2 4 10 4 12 0",
  },
  shoes: { body: "M7 41c7 0 11-7 17-9l6 6c6 2 19 2 27 5v7H7z", lines: "M7 45h50" },
  swim: {
    body: "M24 8h2c1 8 3 12 6 12s5-4 6-12h2c0 9 2 15 5 20-3 7-3 14-2 22-4 1-8 4-11 8-3-4-7-7-11-8 1-8 1-15-2-22 3-5 5-11 5-20z",
  },
  bag: { body: "M15 26h34l-3 28H18z", lines: "M24 26c0-11 16-11 16 0" },
  accessory: {
    body: "M8 40c0-4 11-6 24-6s24 2 24 6-11 6-24 6S8 44 8 40z",
    lines: "M21 36c0-10 5-14 11-14s11 4 11 14",
  },
};

export function Flat({
  category,
  color,
  size = 56,
}: {
  category: Category;
  color: string | null;
  size?: number;
}) {
  const c = usePalette();
  const shape = SHAPES[category];
  const fill = (color && COLORS[color]) || c.sunk;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Path d={shape.body} fill={fill} stroke={c.ink} strokeWidth={1} strokeLinejoin="round" />
      {shape.lines && (
        <Path d={shape.lines} fill="none" stroke={c.ink} strokeWidth={1} strokeLinejoin="round" />
      )}
    </Svg>
  );
}
