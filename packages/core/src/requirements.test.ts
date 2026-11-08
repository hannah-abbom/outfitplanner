import { describe, expect, it } from "vitest";
import { essentialsFor } from "./essentials";
import type { Flight, Stay, Trip } from "./model";
import { AIRPORTS } from "./places";
import { dueSoon, requirementsFor } from "./requirements";
import { countryVisits, journeys } from "./route";

// A fictional trip: every name, flight and hotel is made up.
function airport(code: string) {
  const a = AIRPORTS[code];
  return {
    code,
    name: code,
    city: a?.city ?? null,
    country: a?.country ?? null,
    timeZone: a?.timeZone ?? null,
  };
}
let n = 0;
function flight(from: string, to: string, departs: string, arrives: string): Flight {
  n += 1;
  return {
    id: `f${n}`,
    airline: null,
    flightNumber: `XX ${n}`,
    from: airport(from),
    to: airport(to),
    departs,
    arrives,
    terminal: null,
    voucherIds: [],
  };
}
function stay(
  name: string,
  checkIn: string,
  checkOut: string,
  country: string,
  nearAirport: string,
  location: Stay["location"] = null,
): Stay {
  return {
    id: name,
    name,
    checkIn,
    checkOut,
    nights: 0,
    country,
    nearAirport,
    location,
    room: null,
    notes: null,
    voucherIds: [],
  };
}

function trip(firstFrom = "MIA"): Trip {
  return {
    name: "Fictional honeymoon",
    start: "2027-02-01",
    end: "2027-02-16",
    travelers: [
      { name: "Ana", nationalities: ["PA"], passportExpiry: "2031-01-01" },
      { name: "Ben", nationalities: ["US"], passportExpiry: "2027-03-01" },
    ],
    flights: [
      flight(firstFrom, "IST", "2027-02-01T22:30", "2027-02-02T18:00"),
      flight("IST", "CPT", "2027-02-03T02:00", "2027-02-03T12:05"),
      flight("CPT", "HDS", "2027-02-07T09:30", "2027-02-07T12:00"),
      flight("HDS", "JNB", "2027-02-10T13:05", "2027-02-10T14:00"),
      flight("JNB", "MRU", "2027-02-11T09:45", "2027-02-11T15:45"),
      flight("MRU", "IST", "2027-02-15T20:30", "2027-02-16T05:15"),
      flight("IST", firstFrom, "2027-02-16T15:40", "2027-02-16T20:35"),
    ],
    stays: [
      stay("Vineyard Cottage", "2027-02-03", "2027-02-07", "ZA", "CPT"),
      stay("Thornveld Lodge", "2027-02-07", "2027-02-10", "ZA", "HDS", { lat: -24.4, lng: 31.1 }),
      stay("Airport Hotel", "2027-02-10", "2027-02-11", "ZA", "JNB"),
      stay("Lagoon Resort", "2027-02-11", "2027-02-15", "MU", "MRU"),
    ],
    vouchers: [{ id: "v1", name: "tickets.pdf", url: null }],
    gaps: [],
    source: { kind: "travefy", url: null, importedAt: "2027-01-01T00:00:00Z" },
  };
}

describe("route", () => {
  it("joins connections into journeys and measures the wait", () => {
    const js = journeys(trip());
    expect(js.map((j) => [j.origin, j.destination, j.departs, j.arrives])).toEqual([
      ["US", "ZA", "2027-02-01", "2027-02-03"],
      ["ZA", "ZA", "2027-02-07", "2027-02-07"],
      ["ZA", "ZA", "2027-02-10", "2027-02-10"],
      ["ZA", "MU", "2027-02-11", "2027-02-11"],
      ["MU", "US", "2027-02-15", "2027-02-16"],
    ]);
    expect(js[0]?.connections).toEqual([{ airport: "IST", country: "TR", hours: 8 }]);
  });

  it("finds the countries entered, from border to border, without counting home", () => {
    expect(countryVisits(trip()).map((v) => [v.country, v.entry, v.exit])).toEqual([
      ["ZA", "2027-02-03", "2027-02-11"],
      ["MU", "2027-02-11", "2027-02-15"],
    ]);
  });
});

describe("requirementsFor", () => {
  const items = requirementsFor(trip());
  const get = (traveler: string, id: string) => items.find((r) => r.id === `${traveler}:${id}`);

  it("clears South Africa's visa for Panama and US passports, with its source", () => {
    expect(get("Ana", "ZA:visa")).toMatchObject({ status: "ok" });
    expect(get("Ben", "ZA:visa")?.sources[0]?.url).toContain("dirco.gov.za");
  });

  it("works out passport validity from the day you leave, and flags a passport that expires too soon", () => {
    expect(get("Ana", "ZA:passport")).toMatchObject({ status: "check" });
    expect(get("Ana", "ZA:passport")?.summary).toContain("Mar 13, 2027");
    expect(get("Ben", "ZA:passport")).toMatchObject({ status: "todo" });
    expect(get("Ben", "MU:passport")).toMatchObject({ status: "todo" });
  });

  it("gives form deadlines: the customs declaration before the first flight, the Mauritius form 72 hours before landing", () => {
    expect(get("Ana", "ZA:declaration")).toMatchObject({ dueFrom: "2027-01-31", dueBy: "2027-02-01" });
    expect(get("Ana", "MU:arrival-form")).toMatchObject({ dueFrom: "2027-02-08", dueBy: "2027-02-11" });
  });

  it("only asks a Panama passport about yellow fever as a check when the flights start elsewhere", () => {
    expect(get("Ana", "ZA:yellow-fever")).toMatchObject({ status: "check" });
    expect(get("Ben", "ZA:yellow-fever")).toBeUndefined();
  });

  it("requires a yellow fever certificate when the trip starts in a yellow fever country", () => {
    const fromPanama = requirementsFor(trip("PTY"));
    expect(fromPanama.find((r) => r.id === "Ben:ZA:yellow-fever")).toMatchObject({
      status: "todo",
      dueBy: "2027-01-24",
    });
  });

  it("sends travelers to a clinic for a lodge in the malaria area", () => {
    expect(get("Ana", "ZA:malaria")).toMatchObject({ status: "todo", dueBy: "2027-02-05" });
    expect(get("Ana", "ZA:malaria")?.summary).toContain("Thornveld Lodge");
  });

  it("asks a Panama passport to confirm the Mauritius visa, and clears a US one", () => {
    expect(get("Ana", "MU:visa")).toMatchObject({ status: "check" });
    expect(get("Ben", "MU:visa")).toMatchObject({ status: "ok" });
  });

  it("dates every item and sorts what's due by deadline", () => {
    expect(items.every((r) => r.checkedOn === "2026-11-07")).toBe(true);
    const due = dueSoon(items.filter((r) => r.traveler === "Ana")).map((r) => r.id);
    expect(due[0]).toBe("Ana:ZA:declaration");
    expect(due).not.toContain("Ana:ZA:visa");
  });
});

describe("essentialsFor", () => {
  it("adds adapters each stay country needs, from the plugs at home", () => {
    const t = trip();
    const labels = essentialsFor(t, requirementsFor(t)).map((i) => i.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        "Passports",
        "Type M plug adapter",
        "Type G plug adapter",
        "Insect repellent (DEET or picaridin)",
        "Mauritius arrival form, QR code",
        "Reef-safe sunscreen",
      ]),
    );
  });
});
