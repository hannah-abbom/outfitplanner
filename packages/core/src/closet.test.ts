import { describe, expect, it } from "vitest";
import {
  addToLook,
  colorIn,
  forgetPiece,
  guessFromName,
  isDressed,
  lookNotes,
  readProductPage,
  removeFromLook,
  suitcase,
  type ClosetItem,
  type Looks,
} from "./closet";
import { travefyAzores } from "./fixtures/travefy-azores";
import { whatsLeft } from "./left";
import { importTravefy } from "./travefy";
import type { DayWeather } from "./weather";

function piece(id: string, name: string, extra: Partial<ClosetItem> = {}): ClosetItem {
  return {
    id,
    name,
    ...guessFromName(name),
    image: null,
    source: "manual",
    link: null,
    brand: null,
    status: "owned",
    addedAt: "2027-01-01T00:00:00Z",
    ...extra,
  };
}

const hot: DayWeather = {
  date: "2027-03-12",
  place: "x",
  hi: 31,
  lo: 14,
  rainChance: 60,
  code: 61,
  source: "forecast",
};

describe("guessing from a name", () => {
  it("reads the category, warmth, colour and style", () => {
    expect(guessFromName("Ivory linen shirt")).toEqual({
      category: "top",
      warmth: "light",
      color: "ivory",
      tags: ["casual"],
    });
    expect(guessFromName("Black silk slip dress")).toMatchObject({ category: "dress", tags: ["dressy"] });
    expect(guessFromName("Bikini top, coral")).toMatchObject({ category: "swim", color: "coral" });
    expect(guessFromName("Cashmere crewneck sweater")).toMatchObject({ category: "layer", warmth: "warm" });
    expect(guessFromName("Packable rain shell").tags).toContain("rain");
    expect(guessFromName("Leather slides").category).toBe("shoes");
    expect(guessFromName("Rainbow bikini").tags).not.toContain("rain");
  });

  it("prefers the longer colour name and maps aliases", () => {
    expect(colorIn("Light blue oxford")).toBe("light blue");
    expect(colorIn("Off-white trousers")).toBe("ivory");
    expect(colorIn("Plain tee")).toBeNull();
  });
});

describe("reading a product page", () => {
  it("uses schema.org Product data first", () => {
    const html = `<html><head>
      <meta property="og:site_name" content="Maison Exemple">
      <meta property="og:title" content="Wrong title | Maison Exemple">
      <script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"BreadcrumbList"},
        {"@type":"Product","name":"Linen Wrap Skirt","image":["/img/skirt.jpg"],"brand":{"@type":"Brand","name":"Exemple"},"color":"Sand"}]}</script>
    </head></html>`;
    expect(readProductPage(html, "https://shop.example.com/p/123")).toEqual({
      name: "Linen Wrap Skirt",
      image: "https://shop.example.com/img/skirt.jpg",
      brand: "Exemple",
      color: "sand",
    });
  });

  it("falls back to Open Graph tags and trims the shop name", () => {
    const html = `<meta content="Crochet Sun Hat &amp; Band – Example Shop" property="og:title">
      <meta property="og:site_name" content="Example Shop">
      <meta property="og:image" content="https://cdn.example.com/hat.jpg">`;
    expect(readProductPage(html, "https://example.com/hat")).toEqual({
      name: "Crochet Sun Hat & Band",
      image: "https://cdn.example.com/hat.jpg",
      brand: "Example Shop",
      color: null,
    });
  });

  it("returns nothing for a page that names no product", () => {
    expect(readProductPage("<html><title>Just a moment…</title></html>", "https://example.com")).toBeNull();
  });
});

describe("looks", () => {
  it("adds a piece once, removes it, and forgets it everywhere", () => {
    let looks: Looks = {};
    looks = addToLook(looks, "2027-03-12", "day", "a");
    looks = addToLook(looks, "2027-03-12", "day", "a");
    looks = addToLook(looks, "2027-03-12", "evening", "a");
    looks = addToLook(looks, "2027-03-13", "day", "b");
    expect(looks["2027-03-12"]).toEqual({ day: ["a"], evening: ["a"] });
    expect(removeFromLook(looks, "2027-03-13", "day", "b")["2027-03-13"]).toEqual({ day: [] });
    const forgot = forgetPiece(looks, "a");
    expect(isDressed(forgot["2027-03-12"])).toBe(false);
    expect(isDressed(forgot["2027-03-13"])).toBe(true);
  });

  it("says what a look is missing for the weather and plans", () => {
    const knit = piece("k", "Cashmere sweater, cream");
    const tee = piece("t", "White tee");
    expect(lookNotes([knit], "day", hot, [])).toEqual([
      "Cashmere sweater, cream is warm for 31°",
      "60% chance of rain: add a rain layer",
    ]);
    expect(lookNotes([tee], "evening", hot, ["Dinner out"])).toEqual([
      "Down to 14°: add a layer",
      "Dinner out: add something dressy",
    ]);
    expect(lookNotes([tee], "day", undefined, ["Game drive", "Beach"])).toEqual([
      "Beach plans: add swim",
      "Game drives start at dawn in an open vehicle: add a layer",
      "White tee stands out on a game drive; neutrals blend in and hide the dust",
    ]);
    expect(lookNotes([], "day", hot, ["Beach"])).toEqual([]);
  });

  it("packs each piece once with how often it's worn", () => {
    const closet = [
      piece("a", "Ivory linen shirt"),
      piece("b", "Sand shorts"),
      piece("c", "Leather sandals"),
    ];
    const looks: Looks = {
      "2027-03-12": { day: ["a", "b", "c"], evening: ["a"] },
      "2027-03-13": { day: ["b", "c", "gone"] },
      "2026-01-01": { day: ["a"] },
    };
    const lines = suitcase(looks, closet, ["2027-03-12", "2027-03-13"]);
    expect(lines.map((l) => [l.item.id, l.wears, l.dates])).toEqual([
      ["a", 2, ["2027-03-12"]],
      ["b", 2, ["2027-03-12", "2027-03-13"]],
      ["c", 2, ["2027-03-12", "2027-03-13"]],
    ]);
  });
});

describe("what's left", () => {
  const trip = {
    ...importTravefy(travefyAzores, { importedAt: "2027-01-01T00:00:00Z" }),
    travelers: [{ name: "Ana", nationalities: ["PA"], passportExpiry: null }],
  };
  const closet = [piece("a", "Ivory linen shirt"), piece("r", "Rain shell", { status: "to-get" })];

  it("lists bare days, pieces to get and booking holes, most urgent first", () => {
    const looks: Looks = { "2027-03-10": { day: ["a", "r"] } };
    const left = whatsLeft({ trip, done: {}, looks }, closet, "2027-03-08");
    const outfits = left.find((l) => l.kind === "outfits");
    expect(outfits?.kind === "outfits" && outfits.days[0]).toBe("2027-03-11");
    expect(outfits?.kind === "outfits" && outfits.days.length).toBe(8);
    const buy = left.find((l) => l.kind === "buy");
    expect(buy?.kind === "buy" && buy.items.map((i) => i.id)).toEqual(["r"]);
    expect(left.filter((l) => l.kind === "gap")).toHaveLength(trip.gaps.length);
    const firstNotUrgent = left.findIndex((l) => !l.urgent);
    expect(left.slice(firstNotUrgent).every((l) => !l.urgent)).toBe(true);
  });

  it("is empty once the trip is over", () => {
    expect(whatsLeft({ trip, done: {}, looks: {} }, closet, "2027-04-01")).toEqual([]);
  });
});

describe("more kinds of piece", () => {
  it("reads sets, sundresses, trikinis and pareos", () => {
    expect(guessFromName("Rent the Runway shorts and shirt set").category).toBe("set");
    expect(guessFromName("Linen sundress").category).toBe("dress");
    expect(guessFromName("Blue trikini").category).toBe("swim");
    expect(guessFromName("Silk pareo")).toMatchObject({ category: "accessory", tags: ["dressy", "beach"] });
  });
});
