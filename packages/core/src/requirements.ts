import type { CountryCode, IsoDate, Stay, Traveler, Trip } from "./model";
import { countryName } from "./places";
import { addDays, addMonths, countryVisits, type CountryVisit } from "./route";

/*
 * Entry requirements (REQ-02 to REQ-04). Rules decide; every item names its official source and the date the
 * rule was checked. Where sources disagree we say so and ask the traveler to confirm, rather than pick one.
 * Only South Africa and Mauritius have rules so far; other countries get a "check the official site" item.
 */

export const RULES_CHECKED_ON: IsoDate = "2026-11-07";

export interface Source {
  title: string;
  url: string;
}

export type RequirementStatus = "ok" | "todo" | "check";

export interface Requirement {
  id: string;
  traveler: string;
  country: CountryCode;
  kind: "visa" | "passport" | "health" | "form";
  title: string;
  summary: string;
  status: RequirementStatus;
  /** First day it can be done, for forms with a window. */
  dueFrom: IsoDate | null;
  /** Last day it can be done. */
  dueBy: IsoDate | null;
  sources: Source[];
  checkedOn: IsoDate;
}

const SRC = {
  zaExempt: {
    title: "South Africa: countries exempt from visas (DIRCO)",
    url: "https://dirco.gov.za/paris/wp-content/uploads/sites/6/2024/12/COUNTRIES-EXEMPT-FROM-VISAS.pdf",
  },
  zaEta: { title: "South Africa Electronic Travel Authorisation", url: "https://eta.dha.gov.za" },
  zaYellowFever: {
    title: "South Africa: yellow fever requirements (DIRCO)",
    url: "https://dirco.gov.za/canberra/yellow-fever/",
  },
  zaDeclaration: {
    title: "SARS online traveller declaration",
    url: "https://www.sars.gov.za/travellerdeclaration/",
  },
  zaMalaria: {
    title: "SANParks: malaria in Kruger",
    url: "https://www.sanparks.org/parks/kruger/useful-information/malaria",
  },
  muForm: { title: "Mauritius All-in-One Travel Form", url: "https://safemauritius.govmu.org" },
  muTourism: {
    title: "Mauritius Tourism: travel requirements",
    url: "https://www.mymauritius.travel/nl/node/2531",
  },
} satisfies Record<string, Source>;

/** Passports exempt from a South African visa for a tourist stay of up to 90 days (the subset we have verified). */
const ZA_VISA_EXEMPT = new Set<CountryCode>(["US", "PA", "GB", "CA", "DE", "FR"]);

/** Countries with a risk of yellow fever transmission (WHO list, as used by South Africa). */
const YELLOW_FEVER_COUNTRIES = new Set<CountryCode>([
  "AR",
  "BO",
  "BR",
  "CO",
  "EC",
  "GF",
  "GY",
  "PA",
  "PY",
  "PE",
  "SR",
  "TT",
  "VE",
  "AO",
  "BJ",
  "BF",
  "BI",
  "CM",
  "CF",
  "TD",
  "CG",
  "CD",
  "CI",
  "GQ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LR",
  "ML",
  "MR",
  "NE",
  "NG",
  "RW",
  "SN",
  "SL",
  "SS",
  "SD",
  "TG",
  "UG",
]);

/** Passports that don't need a visa for a short tourist stay in Mauritius (verified subset). */
const MU_VISA_FREE = new Set<CountryCode>(["US", "GB"]);

const MALARIA_AIRPORTS = new Set(["HDS", "MQP", "SZK"]);

/** Kruger and the Lowveld, where South Africa's seasonal malaria risk is. */
function inLowveld(stay: Stay): boolean {
  if (stay.location) {
    const { lat, lng } = stay.location;
    if (lat > -26 && lat < -22 && lng > 30.5 && lng < 32.2) return true;
  }
  return stay.nearAirport !== null && MALARIA_AIRPORTS.has(stay.nearAirport);
}

function fmt(date: IsoDate): string {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function item(
  traveler: Traveler,
  visit: CountryVisit,
  r: Omit<Requirement, "traveler" | "country" | "checkedOn" | "id"> & { key: string },
): Requirement {
  const { key, ...rest } = r;
  return {
    id: `${traveler.name}:${visit.country}:${key}`,
    traveler: traveler.name,
    country: visit.country,
    checkedOn: RULES_CHECKED_ON,
    ...rest,
  };
}

function southAfrica(t: Traveler, v: CountryVisit, trip: Trip): Requirement[] {
  const out: Requirement[] = [];
  const exempt = t.nationalities.some((n) => ZA_VISA_EXEMPT.has(n));
  out.push(
    item(t, v, {
      key: "visa",
      kind: "visa",
      title: "Visa",
      summary: exempt
        ? "Not needed for a stay of up to 90 days."
        : "You may need a visa or an Electronic Travel Authorisation. Check before you book.",
      status: exempt ? "ok" : "check",
      dueFrom: null,
      dueBy: null,
      sources: exempt ? [SRC.zaExempt] : [SRC.zaEta, SRC.zaExempt],
    }),
  );

  const validUntil = addDays(v.exit, 30);
  const tooSoon = t.passportExpiry !== null && t.passportExpiry < validUntil;
  out.push(
    item(t, v, {
      key: "passport",
      kind: "passport",
      title: "Passport",
      summary: tooSoon
        ? `Your passport expires ${fmt(t.passportExpiry as IsoDate)}. It must be valid until at least ${fmt(validUntil)}. Renew it before you go.`
        : `Needs 2 completely blank visa pages and to be valid until at least ${fmt(validUntil)}.`,
      status: tooSoon ? "todo" : "check",
      dueFrom: null,
      dueBy: tooSoon ? v.arrivedBy.departs : null,
      sources: [SRC.zaExempt],
    }),
  );

  const firstDeparture = v.arrivedBy.departs;
  out.push(
    item(t, v, {
      key: "declaration",
      kind: "form",
      title: "Customs traveller declaration",
      summary: "Fill it in online in the 24 hours before your flight to South Africa.",
      status: "todo",
      dueFrom: addDays(firstDeparture, -1),
      dueBy: firstDeparture,
      sources: [SRC.zaDeclaration],
    }),
  );

  const passedThrough = [
    v.arrivedBy.origin,
    ...v.arrivedBy.connections.filter((c) => c.hours === null || c.hours >= 12).map((c) => c.country),
  ];
  const fromRiskCountry = passedThrough.find(
    (c): c is CountryCode => c !== null && YELLOW_FEVER_COUNTRIES.has(c),
  );
  const riskPassport = t.nationalities.find((n) => YELLOW_FEVER_COUNTRIES.has(n));
  if (fromRiskCountry) {
    out.push(
      item(t, v, {
        key: "yellow-fever",
        kind: "health",
        title: "Yellow fever certificate",
        summary: `You travel from ${countryName(fromRiskCountry)}, so bring a yellow fever certificate. The vaccine must be at least 10 days old.`,
        status: "todo",
        dueFrom: null,
        dueBy: addDays(v.entry, -10),
        sources: [SRC.zaYellowFever],
      }),
    );
  } else if (riskPassport) {
    out.push(
      item(t, v, {
        key: "yellow-fever",
        kind: "health",
        title: "Yellow fever card",
        summary: `Your flights don't start in a yellow fever country, so it's likely not needed. If you're in ${countryName(riskPassport)} in the days before you fly, bring your yellow card.`,
        status: "check",
        dueFrom: null,
        dueBy: null,
        sources: [SRC.zaYellowFever],
      }),
    );
  }

  const malariaStay = trip.stays.find(
    (s) => s.country === "ZA" && s.checkIn >= v.entry && s.checkIn < v.exit && inLowveld(s),
  );
  if (malariaStay) {
    out.push(
      item(t, v, {
        key: "malaria",
        kind: "health",
        title: "Malaria: see a travel clinic",
        summary: `${malariaStay.name} is in a malaria area, and the risk is highest from November to April. Ask a clinic about tablets, which start before you arrive.`,
        status: "todo",
        dueFrom: null,
        dueBy: addDays(malariaStay.checkIn, -2),
        sources: [SRC.zaMalaria],
      }),
    );
  }
  return out;
}

function mauritius(t: Traveler, v: CountryVisit): Requirement[] {
  const free = t.nationalities.some((n) => MU_VISA_FREE.has(n));
  return [
    item(t, v, {
      key: "visa",
      kind: "visa",
      title: "Visa",
      summary: free
        ? "Not needed for a tourist stay. Carry your return ticket and hotel booking."
        : "Sources disagree on whether you get in visa-free or with a visa on arrival. Confirm with the embassy or your travel agent.",
      status: free ? "ok" : "check",
      dueFrom: null,
      dueBy: null,
      sources: [SRC.muTourism],
    }),
    item(t, v, {
      key: "passport",
      kind: "passport",
      title: "Passport",
      summary: `To be safe, have it valid until at least ${fmt(addMonths(v.entry, 6))}, six months after you arrive.`,
      status: t.passportExpiry !== null && t.passportExpiry < addMonths(v.entry, 6) ? "todo" : "check",
      dueFrom: null,
      dueBy: null,
      sources: [SRC.muTourism],
    }),
    item(t, v, {
      key: "arrival-form",
      kind: "form",
      title: "Mauritius arrival form",
      summary:
        "Free. Fill it in within 72 hours before you land, on the official site only, and keep the QR code.",
      status: "todo",
      dueFrom: addDays(v.entry, -3),
      dueBy: v.entry,
      sources: [SRC.muForm],
    }),
  ];
}

function unknownCountry(t: Traveler, v: CountryVisit): Requirement[] {
  return [
    item(t, v, {
      key: "check",
      kind: "visa",
      title: `Entry rules for ${countryName(v.country)}`,
      summary:
        "We don't have rules for this country yet. Check its official immigration site for your passport.",
      status: "check",
      dueFrom: null,
      dueBy: null,
      sources: [],
    }),
  ];
}

export function requirementsFor(trip: Trip): Requirement[] {
  const visits = countryVisits(trip);
  return trip.travelers.flatMap((t) =>
    visits.flatMap((v) => {
      if (v.country === "ZA") return southAfrica(t, v, trip);
      if (v.country === "MU") return mauritius(t, v);
      return unknownCountry(t, v);
    }),
  );
}

/** Things to do, soonest deadline first, then the ones without a deadline. */
export function dueSoon(items: Requirement[]): Requirement[] {
  return items
    .filter((r) => r.status !== "ok")
    .sort((a, b) => (a.dueBy ?? "9999").localeCompare(b.dueBy ?? "9999") || (a.status === "todo" ? -1 : 1));
}
