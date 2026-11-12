import { describe, expect, it } from "vitest";
import { guessFromName, type ClosetItem } from "./closet";
import { daysToPlan, readStylistAnswer, stylistPrompt, type StylistDay } from "./stylist";
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
  piece("p1", "Olive linen shirt", { note: "Packed for the lodge" }),
  piece("p2", "Sand shorts"),
  piece("p3", "Coral bikini", { note: "Packed for the island" }),
  piece("p4", "Striped pareo", { note: "Goes with the coral bikini" }),
  piece("p5", "Black slip dress", { status: "to-get" }),
];

const days: StylistDay[] = [
  {
    date: "2027-03-10",
    label: "Wed 10 Mar",
    place: "Lisbon to Ponta Delgada",
    weather: null,
    plans: ["Travel day"],
    travel: true,
  },
  {
    date: "2027-03-11",
    label: "Thu 11 Mar",
    place: "Casa do Rio",
    weather: {
      date: "2027-03-11",
      place: "Casa do Rio",
      hi: 29,
      lo: 21,
      rainChance: 60,
      code: 61,
      source: "typical",
    },
    plans: ["Beach", "Dinner out"],
    travel: false,
  },
];

describe("the stylist's prompt", () => {
  it("carries the closet with notes, the days, the trends and only the days to plan", () => {
    const prompt = stylistPrompt({
      tripName: "Island honeymoon",
      days,
      closet,
      looks: { "2027-03-10": { day: ["p1", "p2"] } },
      trends: TRENDS,
      mode: "empty",
      wish: "Dressy dinners | please",
    });
    expect(prompt).toContain(
      "p4 | Striped pareo | Accessories | - | mid | casual, beach | owned | Goes with the coral bikini",
    );
    expect(prompt).toContain(
      "p5 | Black slip dress | Dresses | black | mid | casual | TO GET (not owned yet) | -",
    );
    expect(prompt).toContain(
      "2027-03-11 (Thu 11 Mar) | Casa do Rio | 29°C / 21°C, usually rain likely, 60% rain | plans: Beach, Dinner out",
    );
    expect(prompt).toContain("already planned: day=[p1, p2] evening=[]");
    expect(prompt).toContain("DAYS TO PLAN: 2027-03-11\n");
    expect(prompt).toContain('The traveller asked: "Dressy dinners please"');
    expect(prompt).toContain("Refined safari utility");
  });

  it("plans every day when asked for the whole trip", () => {
    expect(
      daysToPlan({ days, looks: { "2027-03-10": { day: ["p1"] } }, mode: "all" }).map((d) => d.date),
    ).toEqual(["2027-03-10", "2027-03-11"]);
  });
});

describe("reading the stylist's answer", () => {
  it("keeps real pieces on the planned days and drops the rest", () => {
    const answer = readStylistAnswer(
      {
        looks: [
          {
            date: "2027-03-11",
            day: ["p3", "p4", "p4", "ghost"],
            evening: ["p5"],
            why: "Beach first, then the slip dress.",
          },
          { date: "2027-03-10", day: ["p1"], evening: [] },
          { date: "2027-03-12", day: ["p1"] },
          { date: "2027-03-11", day: ["p2"] },
        ],
        missing: [
          { name: "Gold sandals", for: "Dinner out", why: "Dresses up the slip dress." },
          { name: "" },
        ],
        note: "Light layers, one dressy night.",
      },
      closet,
      ["2027-03-11"],
    );
    expect(answer).toEqual({
      looks: [
        {
          date: "2027-03-11",
          pieces: { day: ["p3", "p4"], evening: ["p5"] },
          why: "Beach first, then the slip dress.",
        },
      ],
      missing: [{ name: "Gold sandals", for: "Dinner out", why: "Dresses up the slip dress." }],
      note: "Light layers, one dressy night.",
      dropped: 1,
    });
  });

  it("returns null for an answer it can't read", () => {
    expect(readStylistAnswer("sorry", closet, ["2027-03-11"])).toBeNull();
    expect(readStylistAnswer({ looks: "nope" }, closet, ["2027-03-11"])).toBeNull();
  });
});

describe("grading the stylist", () => {
  it("passes a good plan and names what a bad one gets wrong", async () => {
    const { gradeStylist, extractJson } = await import("./stylist-grade");
    const req = {
      tripName: "Island honeymoon",
      days,
      closet,
      looks: {},
      trends: TRENDS,
      mode: "all" as const,
    };
    const good = readStylistAnswer(
      extractJson(
        'Here you go:\n```json\n{"looks":[{"date":"2027-03-10","day":["p1","p2"]},{"date":"2027-03-11","day":["p3","p4"],"evening":["p5"]}]}\n```',
      ),
      closet,
      ["2027-03-10", "2027-03-11"],
    );
    expect(good && gradeStylist(req, good, { p3: "Casa" }).every((g) => g.pass)).toBe(true);

    const bad = readStylistAnswer({ looks: [{ date: "2027-03-11", day: ["p1"], evening: ["p3"] }] }, closet, [
      "2027-03-10",
      "2027-03-11",
    ]);
    const failed = bad
      ? gradeStylist(req, bad, { p3: "Lisbon" })
          .filter((g) => !g.pass)
          .map((g) => g.check)
      : [];
    expect(failed).toEqual([
      "Every planned day has a look",
      "Looks are complete outfits",
      "Pieces stay where they were packed for",
      "Swim on beach and pool days",
    ]);
  });
});
