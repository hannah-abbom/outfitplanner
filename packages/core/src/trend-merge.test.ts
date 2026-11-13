import { describe, expect, it } from "vitest";
import {
  colorFamily,
  draftBrief,
  latestApproved,
  mergeMentions,
  momentum,
  nameTerms,
  normalizeTerm,
  reviewBrief,
  trendSimilarity,
  weekOf,
} from "./trend-merge";
import {
  NO_ATTRIBUTES,
  TrendBrief,
  TrendMention,
  TrendRecord,
  type SourceKind,
  type TrendAttributes,
} from "./trend-model";
import { TRENDS } from "./trends";

// Everything here is made up: the publishers, the pages and the trends' histories.
function mention(
  name: string,
  attributes: Partial<TrendAttributes>,
  publisher: string,
  seenOn: string,
  extra: Partial<TrendMention> = {},
): TrendMention {
  return {
    name,
    description: `${name}, as seen this week.`,
    wear: `Wear ${name.toLowerCase()} with something plain.`,
    attributes: { ...NO_ATTRIBUTES, ...attributes },
    keyPieces: [],
    source: {
      url: `https://${publisher.toLowerCase().replace(/\s+/g, "")}.example/${name.toLowerCase().replace(/\s+/g, "-")}-${seenOn}`,
      title: `${name} is everywhere`,
      publisher,
      kind: "editorial" satisfies SourceKind,
      publishedOn: seenOn,
      seenOn,
    },
    sameAs: null,
    ...extra,
  };
}

describe("the shared vocabulary", () => {
  it("folds shades into the closet's colour families", () => {
    expect(colorFamily("Butter yellow")).toBe("yellow");
    expect(colorFamily("pale yellow")).toBe("yellow");
    expect(colorFamily("cobalt")).toBe("blue");
    expect(colorFamily("off-white")).toBe("ivory");
    expect(colorFamily("pistachio green")).toBe("sage");
    expect(colorFamily("chartreuse")).toBe("chartreuse");
  });

  it("treats different words for the same thing as one term", () => {
    expect(normalizeTerm("Ruffles")).toBe("ruffle");
    expect(normalizeTerm("frills")).toBe("ruffle");
    expect(normalizeTerm("Polka-dots")).toBe("polka dot");
    expect(normalizeTerm("co-ord")).toBe("set");
    expect(normalizeTerm("wide-leg trousers")).toBe("wide leg trouser");
    expect(normalizeTerm("dress")).toBe("dress");
  });

  it("reads the meaning out of a name", () => {
    expect(nameTerms("Butter yellow")).toEqual(["yellow"]);
    expect(nameTerms("The pale yellow trend")).toEqual(["yellow"]);
    expect(nameTerms("Crocheted cover-ups")).toEqual(["crochet", "cover", "up"]);
  });

  it("starts weeks on Monday", () => {
    expect(weekOf("2026-11-13")).toBe("2026-11-09");
    expect(weekOf("2026-11-09")).toBe("2026-11-09");
    expect(weekOf("2026-11-15")).toBe("2026-11-09");
    expect(weekOf("2027-01-01")).toBe("2026-12-28");
  });
});

describe("how alike two trends are", () => {
  const t = (name: string, a: Partial<TrendAttributes> = {}) => ({
    name,
    attributes: { ...NO_ATTRIBUTES, ...a },
  });

  it("sees butter yellow and pale yellow as one", () => {
    expect(
      trendSimilarity(t("Butter yellow", { colors: ["yellow"] }), t("Pale yellow", { colors: ["yellow"] })),
    ).toBe(1);
  });

  it("keeps different colours and different fabrics apart", () => {
    expect(
      trendSimilarity(t("Butter yellow", { colors: ["yellow"] }), t("Cobalt blue", { colors: ["blue"] })),
    ).toBe(0);
    const linen = t("Linen sets", { fabrics: ["linen"], silhouettes: ["set"] });
    const crochet = t("Crochet sets", { fabrics: ["crochet"], silhouettes: ["set"] });
    expect(trendSimilarity(linen, crochet)).toBeLessThan(0.6);
  });

  it("matches on the look when the names differ", () => {
    const a = t("Field jackets", {
      colors: ["khaki", "olive"],
      silhouettes: ["utility"],
      fabrics: ["linen"],
    });
    const b = t("Safari utility", {
      colors: ["khaki", "olive"],
      silhouettes: ["utility"],
      fabrics: ["linen"],
    });
    expect(trendSimilarity(a, b)).toBeGreaterThanOrEqual(0.6);
  });
});

describe("merging a week's mentions", () => {
  it("counts butter yellow and pale yellow as one trend with two publishers", () => {
    const { records, log } = mergeMentions(
      [],
      [
        mention("Butter yellow", { colors: ["butter yellow"] }, "Atelier Weekly", "2026-11-10"),
        mention("Pale yellow", { colors: ["pale yellow"] }, "The Hemline", "2026-11-11"),
        mention("Cobalt blue", { colors: ["cobalt"] }, "The Hemline", "2026-11-11"),
      ],
    );
    expect(records.map((r) => r.id)).toEqual(["butter-yellow", "cobalt-blue"]);
    const yellow = records[0];
    expect(yellow?.aliases).toEqual(["Pale yellow"]);
    expect(yellow?.attributes.colors).toEqual(["yellow"]);
    expect(yellow?.sources).toHaveLength(2);
    expect(yellow?.weeks).toEqual([{ week: "2026-11-09", publishers: ["Atelier Weekly", "The Hemline"] }]);
    expect(log.map((s) => s.action)).toEqual(["new", "merged", "new"]);
    for (const r of records) expect(TrendRecord.safeParse(r).success).toBe(true);
  });

  it("counts a publisher once a week and a page once ever", () => {
    const first = mention("Crochet", { fabrics: ["crochet"] }, "Atelier Weekly", "2026-11-10");
    const again = mention("Crochet dresses", { fabrics: ["crocheted"] }, "Atelier Weekly", "2026-11-12");
    const { records } = mergeMentions([], [first, again, first]);
    expect(records).toHaveLength(1);
    expect(records[0]?.weeks[0]?.publishers).toEqual(["Atelier Weekly"]);
    expect(records[0]?.sources).toHaveLength(2);
  });

  it("believes the reader's hint only when it's plausible", () => {
    const base = mergeMentions(
      [],
      [
        mention(
          "Refined safari",
          { colors: ["khaki"], silhouettes: ["utility", "cargo"] },
          "Atelier Weekly",
          "2026-11-03",
        ),
      ],
    ).records;
    const plausible = mention(
      "Cargo shorts",
      { colors: ["khaki"], silhouettes: ["cargo"] },
      "The Hemline",
      "2026-11-10",
      {
        sameAs: "refined-safari",
      },
    );
    const nonsense = mention("Sequin minis", { fabrics: ["sequin"] }, "The Hemline", "2026-11-10", {
      sameAs: "refined-safari",
    });
    const unknown = mention("Lace trims", { fabrics: ["lace"] }, "The Hemline", "2026-11-10", {
      sameAs: "no-such-trend",
    });
    const { records, log } = mergeMentions(base, [plausible, nonsense, unknown]);
    expect(log.map((s) => [s.action, s.into])).toEqual([
      ["merged", "refined-safari"],
      ["new", "sequin-minis"],
      ["new", "lace-trims"],
    ]);
    expect(records[0]?.weeks).toHaveLength(2);
    expect(records[0]?.firstSeen).toBe("2026-11-03");
    expect(records[0]?.lastSeen).toBe("2026-11-10");
  });

  it("gives two different trends with the same name different ids", () => {
    const a = mention("Stripes", { patterns: ["stripe"] }, "Atelier Weekly", "2026-11-10");
    const b = mention("Stripes", { patterns: ["stripe"] }, "The Hemline", "2026-11-10");
    const { records } = mergeMentions([], [a, b], { mergeAt: 2, hintAt: 2 });
    expect(records.map((r) => r.id)).toEqual(["stripes", "stripes-2"]);
  });

  it("takes another measure of likeness, such as embeddings", () => {
    const { records } = mergeMentions(
      [],
      [
        mention("Boho", { silhouettes: ["fringe"] }, "Atelier Weekly", "2026-11-10"),
        mention("Seventies revival", { fabrics: ["suede"] }, "The Hemline", "2026-11-10"),
      ],
      { similarity: () => 0.9 },
    );
    expect(records).toHaveLength(1);
  });
});

/** A record whose weekly publisher counts are given oldest first, ending the week of 9 November 2026. */
function history(counts: number[]): TrendRecord {
  const last = "2026-11-09";
  const weeks = counts
    .map((n, i) => {
      const back = (counts.length - 1 - i) * 7;
      const d = new Date(Date.UTC(2026, 10, 9 - back)).toISOString().slice(0, 10);
      return { week: d, publishers: Array.from({ length: n }, (_, k) => `Publisher ${k + 1}`) };
    })
    .filter((w) => w.publishers.length > 0);
  const firstSeen = weeks[0]?.week ?? last;
  return {
    id: "made-up",
    name: "Made up",
    description: "A made-up trend.",
    wear: "Wear it.",
    attributes: NO_ATTRIBUTES,
    keyPieces: [],
    aliases: [],
    firstSeen,
    lastSeen: weeks[weeks.length - 1]?.week ?? last,
    sources: ["Publisher 1", "Publisher 2"].map((publisher, i) => ({
      url: `https://publisher${i + 1}.example/made-up`,
      title: "Made up",
      publisher,
      kind: "editorial",
      publishedOn: null,
      seenOn: last,
    })),
    weeks,
  };
}

describe("momentum", () => {
  const state = (counts: number[]) => momentum(history(counts), "2026-11-13").state;

  it("calls a trend new until there are four weeks to compare", () => {
    expect(state([3])).toBe("new");
    expect(state([1, 2, 3])).toBe("new");
  });

  it("sees rising, fading, peaking and steady in the counts", () => {
    expect(state([1, 0, 1, 0, 1, 2, 2, 3])).toBe("rising");
    expect(state([3, 3, 2, 2, 1, 1, 0, 0])).toBe("fading");
    expect(state([1, 1, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3])).toBe("peaking");
    expect(state([4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2])).toBe("steady");
  });

  it("calls a trend nobody has mentioned for a month fading", () => {
    expect(state([2, 2, 1, 1, 0, 0, 0, 0])).toBe("fading");
  });

  it("needs more than one extra mention to call a rise", () => {
    expect(state([0, 0, 0, 1, 0, 0, 1, 1])).not.toBe("rising");
  });

  it("scores recent attention and its direction", () => {
    expect(momentum(history([1, 0, 1, 0, 1, 2, 2, 3]), "2026-11-13")).toMatchObject({
      recent: 8,
      prior: 2,
      score: 11,
    });
    expect(momentum(history([3, 3, 2, 2, 1, 1, 0, 0]), "2026-11-13").score).toBe(0);
  });
});

describe("the brief", () => {
  const named = (id: string, counts: number[]): TrendRecord => ({ ...history(counts), id, name: id });

  it("offers corroborated trends that aren't fading, most momentum first", () => {
    const single = {
      ...named("one-voice", [0, 0, 0, 0, 2, 2, 2, 2]),
      sources: history([1]).sources.slice(0, 1),
    };
    const draft = draftBrief(
      [
        named("steady-one", [4, 4, 4, 4, 2, 2, 2, 2, 2, 2, 2, 2]),
        named("fading-one", [3, 3, 2, 2, 1, 1, 0, 0]),
        named("rising-one", [1, 0, 1, 0, 1, 2, 2, 3]),
        single,
      ],
      { version: 3, today: "2026-11-13", season: "High summer", caveat: "Made up." },
    );
    expect(draft.status).toBe("draft");
    expect(draft.brief.trends.map((t) => [t.id, t.momentum])).toEqual([
      ["rising-one", "rising"],
      ["steady-one", "steady"],
    ]);
    expect(draft.brief.checkedOn).toBe("2026-11-13");
    expect(TrendBrief.safeParse(draft.brief).success).toBe(true);
  });

  it("reaches the stylist only once a person approves it", () => {
    const options = { today: "2026-11-13", season: "High summer", caveat: "Made up." };
    const v1 = reviewBrief(draftBrief([], { ...options, version: 1 }), "approved", "Reviewer", "2026-11-13");
    const v2 = reviewBrief(
      draftBrief([], { ...options, version: 2 }),
      "rejected",
      "Reviewer",
      "2026-11-20",
      "Too thin",
    );
    const v3 = draftBrief([], { ...options, version: 3 });
    expect(latestApproved([v3, v2, v1])?.version).toBe(1);
    expect(latestApproved([v3, v2])).toBeNull();
    expect(() => reviewBrief(v1, "approved", "Reviewer", "2026-11-21")).toThrow(/already approved/);
    expect(() => reviewBrief(v3, "approved", " ", "2026-11-21")).toThrow(/name/);
  });
});

describe("the hand-made brief", () => {
  it("is a valid brief, dated, with a source for every trend", () => {
    expect(TrendBrief.safeParse(TRENDS).success).toBe(true);
    expect(new Set(TRENDS.trends.map((t) => t.id)).size).toBe(TRENDS.trends.length);
    for (const t of TRENDS.trends) {
      expect(t.sources.length).toBeGreaterThan(0);
      for (const s of t.sources) expect(s.url).toMatch(/^https:\/\//);
    }
  });
});
