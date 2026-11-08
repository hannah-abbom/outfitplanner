import { describe, expect, it } from "vitest";
import { buildDays, daysUntil, groupDays } from "./days";
import { travefyAzores } from "./fixtures/travefy-azores";
import { importTravefy } from "./travefy";

const trip = importTravefy(travefyAzores, { importedAt: "2027-01-01T00:00:00Z" });
const days = buildDays(trip);

describe("buildDays", () => {
  it("has every day of the trip, numbered", () => {
    expect(days.map((d) => d.date)).toEqual([
      "2027-03-10",
      "2027-03-11",
      "2027-03-12",
      "2027-03-13",
      "2027-03-14",
      "2027-03-15",
      "2027-03-16",
      "2027-03-17",
      "2027-03-18",
    ]);
    expect(days[8]?.number).toBe(9);
  });

  it("orders a day: check-out, flights by time, the gap after its arrival, then check-in", () => {
    expect(days[4]?.items.map((i) => i.kind)).toEqual(["check-out", "depart", "arrive", "gap", "gap"]);
    expect(days[1]?.items.map((i) => (i.kind === "arrive" ? `arrive ${i.time}` : i.kind))).toEqual([
      "arrive 07:00",
      "check-in",
    ]);
  });

  it("knows where you sleep each night, and when you don't have a bed", () => {
    expect(days[1]?.sleep?.name).toBe("Casa do Rio");
    expect(days[4]?.sleep).toBeNull();
    expect(days[5]?.sleep?.name).toBe("Quinta Verde");
  });
});

describe("groupDays", () => {
  it("groups consecutive days by where you sleep", () => {
    expect(groupDays(days).map((g) => [g.stay?.name ?? null, g.days.length])).toEqual([
      [null, 1],
      ["Casa do Rio", 3],
      [null, 1],
      ["Quinta Verde", 3],
      [null, 1],
    ]);
  });
});

describe("daysUntil", () => {
  it("counts down to the first day", () => {
    expect(daysUntil(trip, "2027-03-01")).toBe(9);
    expect(daysUntil(trip, "2027-03-10")).toBe(0);
  });
});
