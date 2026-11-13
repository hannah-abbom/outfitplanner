import { describe, expect, it } from "vitest";
import { guessFromName, type ClosetItem } from "./closet";
import { gradeExtraction, sharedRun, type ExtractionCase } from "./trend-grade";
import {
  climateOf,
  isKeyPiece,
  matchCloset,
  pieceToComplete,
  suitsTrip,
  trendReasons,
  tripContext,
} from "./trend-match";
import { LookEvent, NO_ATTRIBUTES, type Trend, type TrendMention } from "./trend-model";
import { TRENDS } from "./trends";

// A fictional closet and trip.
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

const closet = [
  piece("c1", "Olive utility jacket"),
  piece("c2", "Khaki linen shirt"),
  piece("c3", "White tee"),
  piece("c4", "Denim shorts"),
  piece("c5", "Striped linen set"),
  piece("c6", "Yellow bikini"),
  piece("c7", "Crochet cover-up"),
  piece("c8", "Cream cashmere sweater"),
  piece("c9", "Black wool coat"),
  piece("c10", "Polka-dot midi skirt", { status: "to-get" }),
];

const trend = (id: string) => {
  const t = TRENDS.trends.find((x) => x.id === id);
  if (!t) throw new Error(`No trend ${id}`);
  return t;
};

const hotTrip = tripContext([
  { weather: { hi: 31 }, plans: ["Game drive", "Dinner out"] },
  { weather: { hi: 29 }, plans: ["Beach"], travel: true },
]);

describe("the trip a trend has to suit", () => {
  it("reads climate from the highs and occasions from the plans", () => {
    expect([33, 27, 22, 14, 5].map(climateOf)).toEqual(["hot", "hot", "warm", "mild", "cold"]);
    expect(hotTrip.climates).toEqual(["hot"]);
    expect(hotTrip.occasions.sort()).toEqual(["beach", "dinner", "everyday", "safari", "travel"]);
    expect(tripContext([{ weather: null, plans: [] }])).toEqual({ climates: [], occasions: ["everyday"] });
  });

  it("drops trends for another climate or occasion, and keeps ones that name none", () => {
    const skiTrip = tripContext([{ weather: { hi: 2 }, plans: ["Dinner out"] }]);
    expect(suitsTrip(trend("kaftans-beach-to-bar"), hotTrip)).toBe(true);
    expect(suitsTrip(trend("kaftans-beach-to-bar"), skiTrip)).toBe(false);
    expect(
      suitsTrip(trend("swim-shine-and-animal"), tripContext([{ weather: { hi: 30 }, plans: ["Museum"] }])),
    ).toBe(false);
    expect(suitsTrip(trend("olive-and-soft-greens"), skiTrip)).toBe(true);
    expect(suitsTrip({ id: "bare", name: "Bare", wear: "Anyhow.", sources: [] }, skiTrip)).toBe(true);
  });
});

describe("why a piece is on trend", () => {
  it("names the key piece it is, the words that match and its colour", () => {
    expect(trendReasons(closet[0] as ClosetItem, trend("safari-utility"))).toEqual([
      "is the utility jacket",
      "utility",
      "in olive",
    ]);
    expect(trendReasons(closet[4] as ClosetItem, trend("dots-stripes-florals-fringe"))).toEqual(["stripe"]);
    expect(trendReasons(closet[9] as ClosetItem, trend("dots-stripes-florals-fringe"))).toEqual([
      "polka dot",
    ]);
  });

  it("lets colour alone count only for a trend that is about colour", () => {
    expect(trendReasons(closet[5] as ClosetItem, trend("primary-brights"))).toEqual(["in yellow"]);
    // A khaki tee is the right colour for safari, but nothing about it is safari.
    expect(trendReasons(piece("x", "Khaki tee"), trend("safari-utility"))).toEqual([]);
    // Black isn't in any colour trend.
    expect(trendReasons(closet[8] as ClosetItem, trend("primary-brights"))).toEqual([]);
  });

  it("keeps to the kinds of piece a trend is about", () => {
    expect(trendReasons(piece("x", "Metallic sandals"), trend("swim-shine-and-animal"))).toEqual([]);
    expect(trendReasons(piece("y", "Metallic bikini"), trend("swim-shine-and-animal"))).toEqual(["metallic"]);
  });

  it("checks a key piece by kind, word and colour", () => {
    const jacket = trend("safari-utility").keyPieces?.[0];
    if (!jacket) throw new Error("no key piece");
    expect(isKeyPiece(piece("a", "Sand field jacket"), jacket)).toBe(true);
    expect(isKeyPiece(piece("b", "Red utility jacket"), jacket)).toBe(false);
    expect(isKeyPiece(piece("c", "Olive denim jacket"), jacket)).toBe(false);
    expect(isKeyPiece(piece("d", "Olive utility shirt"), jacket)).toBe(false);
  });
});

describe("matching trends to a closet", () => {
  const matches = matchCloset(TRENDS.trends, closet, hotTrip);
  const by = (id: string) => matches.find((m) => m.trend.id === id);

  it("lists the person's on-trend pieces per trend, owned first, with reasons", () => {
    expect(by("safari-utility")?.pieces.map((p) => p.id)).toEqual(["c1", "c2"]);
    expect(
      by("linen-crochet-gauze")
        ?.pieces.map((p) => p.id)
        .sort(),
    ).toEqual(["c2", "c5", "c7"]);
    expect(by("dots-stripes-florals-fringe")?.pieces).toEqual([
      { id: "c5", reasons: ["stripe"], toGet: false },
      { id: "c10", reasons: ["polka dot"], toGet: true },
    ]);
    expect(by("matching-sets")?.missing).toEqual([]);
  });

  it("says which key pieces are there and which one is missing", () => {
    const safari = by("safari-utility");
    expect(safari?.keyPieces.map((k) => k.have)).toEqual([["c1"], ["c2"], []]);
    expect(safari?.completes?.name).toBe("cargo trousers or tailored shorts");
    // A skirt that's still to get fills the skirt slot, so it isn't suggested again.
    expect(by("skirts-volume-ruffles")?.missing).toEqual([]);
  });

  it("leaves out trends for other trips and trends nothing touches", () => {
    const cold = matchCloset(TRENDS.trends, closet, tripContext([{ weather: { hi: 3 }, plans: [] }]));
    expect(cold.some((m) => m.trend.id === "kaftans-beach-to-bar")).toBe(false);
    expect(matchCloset(TRENDS.trends, [], hotTrip)).toEqual([]);
    expect(matchCloset(TRENDS.trends, [], hotTrip, { includeEmpty: true }).length).toBeGreaterThan(5);
  });

  it("suggests the one piece that completes the trend the person has most of", () => {
    const suggestion = pieceToComplete(matches);
    expect(suggestion?.trend.id).toBe("safari-utility");
    expect(suggestion?.piece.name).toBe("cargo trousers or tailored shorts");
    expect(suggestion?.goesWith).toEqual(["c1", "c2"]);
    expect(suggestion?.why).toBe(
      'You already have 2 pieces of "Refined safari utility"; adding cargo trousers or tailored shorts would complete it.',
    );
  });

  it("suggests nothing when no trend is exactly one piece away", () => {
    expect(
      pieceToComplete(matchCloset(TRENDS.trends, [piece("only", "Black wool coat")], hotTrip)),
    ).toBeNull();
    const twoShort: Trend = {
      id: "two-short",
      name: "Two short",
      wear: "Anyhow.",
      sources: [],
      attributes: { ...NO_ATTRIBUTES, fabrics: ["linen"] },
      keyPieces: [
        { name: "silk scarf", categories: ["accessory"], words: ["silk"], colors: [] },
        { name: "raffia bag", categories: ["bag"], words: ["raffia"], colors: [] },
      ],
    };
    expect(pieceToComplete(matchCloset([twoShort], closet))).toBeNull();
  });
});

describe("grading what the reader took from pages", () => {
  const pages = [
    {
      url: "https://atelierweekly.example/yellow",
      text: "Soft butter tones were on every rail this week, from knit polos to slingback shoes, and buyers at three stores said they could not keep them in stock.",
    },
  ];
  const good: TrendMention = {
    name: "Butter yellow",
    description: "A soft, pale yellow showing up across knitwear and shoes.",
    wear: "Use it as the one colour in an otherwise neutral look.",
    attributes: { ...NO_ATTRIBUTES, colors: ["butter yellow"], categories: ["top", "shoes"] },
    keyPieces: [],
    source: {
      url: "https://atelierweekly.example/yellow",
      title: "Butter is back",
      publisher: "Atelier Weekly",
      kind: "editorial",
      publishedOn: "2026-11-10",
      seenOn: "2026-11-13",
    },
    sameAs: "butter-yellow",
  };
  const c: ExtractionCase = {
    name: "one page, one trend",
    pages,
    expected: [
      {
        label: "butter yellow",
        has: ["yellow"],
        url: "https://atelierweekly.example/yellow",
        colors: ["yellow"],
        sameAs: "butter-yellow",
        publishedOn: "2026-11-10",
      },
    ],
    forbidden: ["neon"],
  };
  const failed = (mentions: TrendMention[]) =>
    gradeExtraction(c, mentions)
      .filter((g) => !g.pass)
      .map((g) => g.check);

  it("passes a careful reading", () => {
    expect(failed([good])).toEqual([]);
  });

  it("catches a missed trend, an invented one and a source from nowhere", () => {
    expect(failed([])).toEqual(["Every trend on the pages is found"]);
    const invented = { ...good, name: "Neon mesh", attributes: NO_ATTRIBUTES, sameAs: null };
    expect(failed([good, invented])).toEqual([
      "Nothing is made up or split in two",
      "Instructions planted in a page are ignored",
    ]);
    const stray = { ...good, source: { ...good.source, url: "https://elsewhere.example/x" } };
    expect(failed([stray])).toContain("Every source is one of the pages");
  });

  it("catches a wrong link, a wrong date and copied text", () => {
    expect(failed([{ ...good, sameAs: null }])).toEqual([
      "Tracked trends are recognised, new ones aren't forced",
    ]);
    expect(failed([{ ...good, source: { ...good.source, publishedOn: null } }])).toEqual([
      "Dates are the pages' own",
    ]);
    const copied = {
      ...good,
      description: "Buyers at three stores said they could not keep them in stock.",
    };
    expect(failed([copied])).toEqual(["Descriptions are in our own words"]);
    expect(sharedRun("one two three four", "zero two three five")).toBe(2);
  });
});

describe("what gets logged about a look", () => {
  it("accepts an event with ids only, and refuses one without a time zone", () => {
    const event = {
      at: "2027-03-02T05:10:00Z",
      person: "p_4f2a",
      trip: "t_9c1d",
      date: "2027-03-02",
      slot: "day",
      action: "kept",
      pieces: ["c1", "c2"],
      finalPieces: null,
      trends: ["safari-utility"],
      briefVersion: 3,
      climate: "hot",
      occasions: ["safari"],
      promptVersion: "stylist-2026-11",
      model: "claude-opus-5-5",
    };
    expect(LookEvent.safeParse(event).success).toBe(true);
    expect(LookEvent.safeParse({ ...event, at: "2027-03-02T05:10:00" }).success).toBe(false);
    expect(LookEvent.safeParse({ ...event, action: "liked" }).success).toBe(false);
  });
});
