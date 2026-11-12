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
  | "link"
  | "sun"
  | "partly"
  | "cloud"
  | "fog"
  | "rain"
  | "storm"
  | "snow"
  | "camera"
  | "image"
  | "trash"
  | "hanger";

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
      {name === "sun" && (
        <>
          <Circle cx={12} cy={12} r={4.2} {...p} />
          <Path
            d="M12 2v2.2M12 19.8V22M4.9 4.9l1.5 1.5M17.6 17.6l1.5 1.5M2 12h2.2M19.8 12H22M4.9 19.1l1.5-1.5M17.6 6.4l1.5-1.5"
            {...p}
          />
        </>
      )}
      {name === "partly" && (
        <>
          <Path
            d="M8 2.5v1.6M2.5 8h1.6M4.1 4.1l1.1 1.1M11.9 4.1l-1.1 1.1M5.3 10.6A3.4 3.4 0 0 1 11 6.4"
            {...p}
          />
          <Path d="M17.5 12h-1A6 6 0 1 0 10 20h7.5a4 4 0 0 0 0-8z" {...p} />
        </>
      )}
      {name === "cloud" && <Path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" {...p} />}
      {name === "fog" && <Path d="M4 9h16M2 13h20M5 17h14" {...p} />}
      {name === "rain" && (
        <>
          <Path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" {...p} />
          <Path d="M8 13v6M12 15v6M16 13v6" {...p} />
        </>
      )}
      {name === "storm" && (
        <>
          <Path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9" {...p} />
          <Path d="M13 11l-4 6h6l-4 6" {...p} />
        </>
      )}
      {name === "camera" && (
        <>
          <Path
            d="M3 8a2 2 0 0 1 2-2h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
            {...p}
          />
          <Circle cx={12} cy={13} r={3.6} {...p} />
        </>
      )}
      {name === "image" && (
        <>
          <Rect x={3} y={4} width={18} height={16} rx={2} {...p} />
          <Circle cx={9} cy={9.5} r={1.6} {...p} />
          <Path d="M21 16l-5-5-9 9" {...p} />
        </>
      )}
      {name === "trash" && <Path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" {...p} />}
      {name === "hanger" && (
        <Path
          d="M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3v1L2.8 15.6c-.9.6-.5 1.9.6 1.9h17.2c1.1 0 1.5-1.3.6-1.9L12 9.5"
          {...p}
        />
      )}
      {name === "snow" && (
        <>
          <Path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25" {...p} />
          <Path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01" {...p} />
        </>
      )}
    </Svg>
  );
}
