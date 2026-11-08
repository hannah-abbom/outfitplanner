import { describe, expect, it } from "vitest";
import { travefyAzores } from "./fixtures/travefy-azores";
import { importTravefy } from "./travefy";
import {
  clothingHints,
  planWeatherRequests,
  readForecast,
  readTypical,
  toFahrenheit,
  weatherKind,
  weatherLabel,
  weatherPlaces,
} from "./weather";

const trip = importTravefy(travefyAzores, { importedAt: "2027-01-01T00:00:00Z" });

describe("weatherPlaces", () => {
  it("uses the stay's location, else the airport you land at or leave from", () => {
    const places = weatherPlaces(trip);
    expect(places.find((p) => p.date === "2027-03-12")?.place.label).toBe("Casa do Rio");
    expect(places.find((p) => p.date === "2027-03-10")?.place.label).toBe("New York");
    expect(places.find((p) => p.date === "2027-03-16")?.place.label).toBe("Quinta Verde");
  });
});

describe("planWeatherRequests", () => {
  it("asks for a forecast for near days and the archive for later ones, once per place", () => {
    const reqs = planWeatherRequests(trip, "2027-03-01");
    const forecast = reqs.filter((r) => r.kind === "forecast");
    const archive = reqs.filter((r) => r.kind === "archive");
    expect(forecast.flatMap((r) => r.dates.map((d) => d.date)).sort()).toEqual([
      "2027-03-10",
      "2027-03-11",
      "2027-03-12",
      "2027-03-13",
      "2027-03-14",
    ]);
    expect(archive.flatMap((r) => r.dates.map((d) => d.date)).sort()).toEqual([
      "2027-03-15",
      "2027-03-16",
      "2027-03-17",
      "2027-03-18",
    ]);
    expect(new Set(reqs.map((r) => `${r.kind}:${r.placeKey}`)).size).toBe(reqs.length);
    const quinta = archive.find((r) => r.dates.some((d) => d.date === "2027-03-17"));
    expect(quinta?.url).toContain("start_date=2022-03-13&end_date=2026-03-19");
  });

  it("skips days already past", () => {
    const reqs = planWeatherRequests(trip, "2027-03-17");
    expect(reqs.flatMap((r) => r.dates.map((d) => d.date)).sort()).toEqual(["2027-03-17", "2027-03-18"]);
  });
});

describe("reading responses", () => {
  const request = {
    kind: "forecast" as const,
    url: "",
    placeKey: "k",
    dates: [{ date: "2027-03-12", label: "Casa do Rio" }],
  };

  it("reads a forecast day", () => {
    const days = readForecast(request, {
      daily: {
        time: ["2027-03-12"],
        temperature_2m_max: [18.6],
        temperature_2m_min: [10.2],
        precipitation_probability_max: [35],
        weather_code: [2],
      },
    });
    expect(days).toEqual([
      {
        date: "2027-03-12",
        place: "Casa do Rio",
        hi: 19,
        lo: 10,
        rainChance: 35,
        code: 2,
        source: "forecast",
      },
    ]);
  });

  it("averages the same dates, two days either side, over past years", () => {
    const time = ["2025-03-11", "2025-03-12", "2025-03-13", "2026-03-12", "2026-03-20"];
    const days = readTypical(
      { ...request, kind: "archive" },
      {
        daily: {
          time,
          temperature_2m_max: [20, 22, 18, 20, 40],
          temperature_2m_min: [10, 12, 8, 10, 30],
          precipitation_sum: [0, 4, 0, 2, 9],
          weather_code: [1, 61, 0, 63, 95],
        },
      },
    );
    expect(days).toEqual([
      {
        date: "2027-03-12",
        place: "Casa do Rio",
        hi: 20,
        lo: 10,
        rainChance: 50,
        code: 0,
        source: "typical",
      },
    ]);
  });
});

describe("weather words", () => {
  it("groups WMO codes and names them", () => {
    expect([0, 2, 3, 45, 61, 81, 95, 73].map(weatherKind)).toEqual([
      "sun",
      "partly",
      "cloud",
      "fog",
      "rain",
      "rain",
      "storm",
      "snow",
    ]);
    expect(weatherLabel(95)).toBe("Thunderstorms");
  });

  it("turns weather into what to wear", () => {
    const hot = clothingHints({
      date: "2027-03-12",
      place: "x",
      hi: 31,
      lo: 18,
      rainChance: 50,
      code: 95,
      source: "typical",
    });
    expect(hot).toEqual(["Hot: breathable fabrics, a hat and sunscreen", "Pack a light rain jacket"]);
    const mild = clothingHints({
      date: "2027-03-12",
      place: "x",
      hi: 26,
      lo: 12,
      rainChance: 5,
      code: 0,
      source: "forecast",
    });
    expect(mild).toEqual([
      "Warm: light clothes, sunglasses and sunscreen",
      "Cool morning and evening, down to 12°: bring a layer",
    ]);
    expect(toFahrenheit(26)).toBe(79);
  });
});
