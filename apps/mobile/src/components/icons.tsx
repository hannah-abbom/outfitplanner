import Svg, { Circle, Path, Rect } from "react-native-svg";

export type IconName =
  | "map"
  | "ticket"
  | "plus"
  | "shield"
  | "suitcase"
  | "plane"
  | "bed"
  | "alert"
  | "chevronRight"
  | "chevronLeft"
  | "check"
  | "file"
  | "close"
  | "link";

/** Stroke icons drawn on a 24-unit grid, colored by `color`. */
export function Icon({
  name,
  size = 22,
  color,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
}) {
  const p = {
    stroke: color,
    strokeWidth,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {name === "map" && (
        <>
          <Path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z" {...p} />
          <Path d="M8 2v16M16 6v16" {...p} />
        </>
      )}
      {name === "ticket" && (
        <>
          <Path
            d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z"
            {...p}
          />
          <Path d="M14 5v2M14 11v2M14 17v2" {...p} />
        </>
      )}
      {name === "plus" && <Path d="M12 5v14M5 12h14" {...p} />}
      {name === "shield" && (
        <>
          <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />
          <Path d="M9 12l2 2 4-4" {...p} />
        </>
      )}
      {name === "suitcase" && (
        <>
          <Rect x={3} y={7} width={18} height={13} rx={2} {...p} />
          <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" {...p} />
        </>
      )}
      {name === "plane" && (
        <Path
          d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
          {...p}
        />
      )}
      {name === "bed" && <Path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" {...p} />}
      {name === "alert" && (
        <>
          <Circle cx={12} cy={12} r={9} {...p} />
          <Path d="M12 7.5v5M12 16h.01" {...p} />
        </>
      )}
      {name === "chevronRight" && <Path d="M9 18l6-6-6-6" {...p} />}
      {name === "chevronLeft" && <Path d="M15 18l-6-6 6-6" {...p} />}
      {name === "check" && <Path d="M20 6L9 17l-5-5" {...p} />}
      {name === "file" && (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...p} />
          <Path d="M14 2v6h6" {...p} />
        </>
      )}
      {name === "close" && <Path d="M18 6L6 18M6 6l12 12" {...p} />}
      {name === "link" && (
        <>
          <Path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" {...p} />
          <Path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" {...p} />
        </>
      )}
    </Svg>
  );
}
