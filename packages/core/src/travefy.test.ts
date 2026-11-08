import { describe, expect, it } from "vitest";
import { travefyAzores } from "./fixtures/travefy-azores";
import { importTravefy, parseTravefyLink, travefyApiUrl, travefyTripIdFromHtml } from "./travefy";

const trip = importTravefy(travefyAzores, {
  link: "https://travefy.com/trip/itinerary/x",
  importedAt: "2027-01-01T00:00:00Z",
});

describe("importTravefy", () => {
  it("reads the trip name and its first and last day", () => {
    expect(trip.name).toBe("Lisbon & the Azores");
    expect(trip.start).toBe("2027-03-10");
    expect(trip.end).toBe("2027-03-18");
  });

  it("joins each departure with its arrival into one flight, across days", () => {
    expect(trip.flights.map((f) => [f.flightNumber, f.from.code, f.to.code, f.departs, f.arrives])).toEqual([
      ["FA 210", "JFK", "LIS", "2027-03-10T19:00", "2027-03-11T07:00"],
      ["IH129", "LIS", "PDL", "2027-03-14T10:00", "2027-03-14T11:15"],
      ["IH 121", "PDL", "LIS", "2027-03-18T09:00", "2027-03-18T12:30"],
      ["FA 209", "LIS", "JFK", "2027-03-18T15:00", "2027-03-18T17:30"],
    ]);
  });

  it("keeps airline, terminal and each airport's time zone and country", () => {
    const [first, second] = trip.flights;
    expect(first?.airline).toBe("Fictional Air");
    expect(first?.from).toMatchObject({ code: "JFK", country: "US", timeZone: "America/New_York" });
    expect(second?.to).toMatchObject({ code: "PDL", country: "PT", timeZone: "Atlantic/Azores" });
    expect(second?.terminal).toBe("2");
  });

  it("ends a stay at the next departure when that comes before the next check-in", () => {
    expect(trip.stays.map((s) => [s.name, s.checkIn, s.checkOut, s.nights])).toEqual([
      ["Casa do Rio", "2027-03-11", "2027-03-14", 3],
      ["Quinta Verde", "2027-03-15", "2027-03-18", 3],
    ]);
  });

  it("keeps room, notes, location, country and vouchers for a stay, and leaves prices out", () => {
    const [casa] = trip.stays;
    expect(casa).toMatchObject({
      room: "Deluxe River View",
      notes: "Includes breakfast",
      country: "PT",
      nearAirport: "LIS",
      location: { lat: 38.711, lng: -9.13 },
      voucherIds: ["v903"],
    });
    expect(JSON.stringify(trip)).not.toContain("$999");
  });

  it("ignores inactive events and duplicated event ids", () => {
    expect(trip.stays.map((s) => s.name)).not.toContain("Cancelled Inn");
    expect(trip.stays.filter((s) => s.name === "Casa do Rio")).toHaveLength(1);
  });

  it("lists attached files as vouchers and links them to their flights", () => {
    expect(trip.vouchers.map((v) => v.name)).toEqual([
      "Fictional Air tickets.pdf",
      "Casa do Rio voucher.pdf",
    ]);
    expect(trip.flights[0]?.voucherIds).toEqual(["v901"]);
  });

  it("flags an arrival with no transfer and a night with no stay, but not a connection or a listed transfer", () => {
    expect(trip.gaps).toEqual([
      { kind: "no-transfer", date: "2027-03-14", airport: "PDL", stayId: "s107", stayName: "Quinta Verde" },
      { kind: "no-stay", date: "2027-03-14" },
    ]);
  });

  it("records where the trip came from", () => {
    expect(trip.source).toEqual({
      kind: "travefy",
      url: "https://travefy.com/trip/itinerary/x",
      importedAt: "2027-01-01T00:00:00Z",
    });
  });

  it("rejects data that isn't an itinerary", () => {
    expect(() => importTravefy({ hello: "world" })).toThrow();
  });
});

describe("Travefy links", () => {
  it("reads the page id from a shared itinerary link", () => {
    expect(parseTravefyLink("https://travefy.com/trip/itinerary/AbC123_xyz-987654")).toBe(
      "AbC123_xyz-987654",
    );
    expect(parseTravefyLink("  https://www.travefy.com/trip/itinerary/AbC123_xyz-987654?ref=mail ")).toBe(
      "AbC123_xyz-987654",
    );
    expect(parseTravefyLink("https://example.com/trip/itinerary/AbC123_xyz-987654")).toBeNull();
  });

  it("builds the itinerary API address", () => {
    expect(travefyApiUrl("AbC123")).toBe("https://travefy.com/itinerary-rest-api/itineraryPages/AbC123");
  });

  it("finds the trip id in the page's embedded configuration", () => {
    const html =
      '<meta name="x" content="{&quot;loadingModel&quot;:{&quot;itineraryPage&quot;:{&quot;trip&quot;:{&quot;id&quot;:4242,&quot;name&quot;:&quot;A &amp; B&quot;}}}}">';
    expect(travefyTripIdFromHtml(html)).toBe(4242);
    expect(travefyTripIdFromHtml("<html></html>")).toBeNull();
  });
});
