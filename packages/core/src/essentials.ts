import type { CountryCode, Trip } from "./model";
import { countryName } from "./places";
import type { Requirement } from "./requirements";

/*
 * Things to bring that follow from the trip itself (ESS-01, ESS-02): documents, plug adapters, and items the
 * places call for. Clothes come from the wardrobe and outfit plan later; this list never depends on AI.
 */

export interface PackItem {
  id: string;
  label: string;
  detail: string | null;
  category: "documents" | "essentials";
  quantity: number;
}

/** Socket types per country, main type first (IEC World Plugs). */
export const PLUGS: Readonly<Record<string, readonly string[]>> = {
  US: ["A", "B"],
  CA: ["A", "B"],
  PA: ["A", "B"],
  CO: ["A", "B"],
  GB: ["G"],
  MU: ["G", "C"],
  ZA: ["M", "N", "C"],
  TR: ["F", "C"],
  PT: ["F", "C"],
  ES: ["F", "C"],
  FR: ["E", "C"],
  DE: ["F", "C"],
  AE: ["G", "C", "D"],
};

const PLUG_NOTE: Readonly<Record<string, string>> = {
  M: "large three round pins",
  G: "UK-style, three rectangular pins",
  F: "two round pins, European",
  C: "two round pins, European",
};

export function essentialsFor(trip: Trip, requirements: Requirement[] = []): PackItem[] {
  const items: PackItem[] = [];
  const people = Math.max(1, trip.travelers.length);

  items.push({
    id: "passports",
    label: people > 1 ? "Passports" : "Passport",
    detail: null,
    category: "documents",
    quantity: people,
  });
  if (requirements.some((r) => r.id.endsWith(":yellow-fever"))) {
    items.push({
      id: "yellow-card",
      label: "Yellow fever card",
      detail: "If you're coming from a yellow fever country",
      category: "documents",
      quantity: 1,
    });
  }
  if (requirements.some((r) => r.id.endsWith(":arrival-form") && r.country === "MU")) {
    items.push({
      id: "mu-form",
      label: "Mauritius arrival form, QR code",
      detail: "Printed or saved on your phone",
      category: "documents",
      quantity: 1,
    });
  }
  if (trip.vouchers.length > 0) {
    items.push({
      id: "vouchers",
      label: "Tickets and vouchers",
      detail: `${trip.vouchers.length} files from your itinerary`,
      category: "documents",
      quantity: 1,
    });
  }

  const home: CountryCode | null = trip.flights[0]?.from.country ?? null;
  const homePlugs = new Set(home ? (PLUGS[home] ?? []) : []);
  const stayCountries = [
    ...new Set(trip.stays.map((s) => s.country).filter((c): c is CountryCode => c !== null)),
  ];
  for (const country of stayCountries) {
    const plugs = PLUGS[country];
    if (!plugs || plugs.some((p) => homePlugs.has(p))) continue;
    const main = plugs[0] as string;
    items.push({
      id: `adapter-${main}`,
      label: `Type ${main} plug adapter`,
      detail: `${countryName(country)}${PLUG_NOTE[main] ? `: ${PLUG_NOTE[main]}` : ""}`,
      category: "essentials",
      quantity: people > 1 ? 2 : 1,
    });
  }

  if (requirements.some((r) => r.id.endsWith(":malaria"))) {
    items.push({
      id: "repellent",
      label: "Insect repellent (DEET or picaridin)",
      detail: "Malaria area on safari",
      category: "essentials",
      quantity: 1,
    });
    items.push({
      id: "antimalarials",
      label: "Antimalarial tablets, if prescribed",
      detail: "Start before you arrive",
      category: "essentials",
      quantity: 1,
    });
  }
  if (trip.stays.some((s) => s.country === "MU")) {
    items.push({
      id: "sunscreen",
      label: "Reef-safe sunscreen",
      detail: "Mauritius beaches and reefs",
      category: "essentials",
      quantity: 1,
    });
  }
  items.push({
    id: "battery",
    label: "Battery pack",
    detail: "Long flights and game drives",
    category: "essentials",
    quantity: 1,
  });
  return items;
}
