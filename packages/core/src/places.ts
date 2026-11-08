import type { CountryCode } from "./model";

export interface AirportInfo {
  city: string;
  country: CountryCode;
  timeZone: string;
}

/**
 * Airports we know without a lookup. A short list for now; the full table comes from OurAirports (public domain)
 * in Phase 1. Unknown codes still import, with country and time zone left empty.
 */
export const AIRPORTS: Readonly<Record<string, AirportInfo>> = {
  ATL: { city: "Atlanta", country: "US", timeZone: "America/New_York" },
  JFK: { city: "New York", country: "US", timeZone: "America/New_York" },
  EWR: { city: "Newark", country: "US", timeZone: "America/New_York" },
  MIA: { city: "Miami", country: "US", timeZone: "America/New_York" },
  LAX: { city: "Los Angeles", country: "US", timeZone: "America/Los_Angeles" },
  PTY: { city: "Panama City", country: "PA", timeZone: "America/Panama" },
  BOG: { city: "Bogotá", country: "CO", timeZone: "America/Bogota" },
  GRU: { city: "São Paulo", country: "BR", timeZone: "America/Sao_Paulo" },
  LHR: { city: "London", country: "GB", timeZone: "Europe/London" },
  CDG: { city: "Paris", country: "FR", timeZone: "Europe/Paris" },
  AMS: { city: "Amsterdam", country: "NL", timeZone: "Europe/Amsterdam" },
  FRA: { city: "Frankfurt", country: "DE", timeZone: "Europe/Berlin" },
  MAD: { city: "Madrid", country: "ES", timeZone: "Europe/Madrid" },
  LIS: { city: "Lisbon", country: "PT", timeZone: "Europe/Lisbon" },
  PDL: { city: "Ponta Delgada", country: "PT", timeZone: "Atlantic/Azores" },
  IST: { city: "Istanbul", country: "TR", timeZone: "Europe/Istanbul" },
  DXB: { city: "Dubai", country: "AE", timeZone: "Asia/Dubai" },
  DOH: { city: "Doha", country: "QA", timeZone: "Asia/Qatar" },
  ADD: { city: "Addis Ababa", country: "ET", timeZone: "Africa/Addis_Ababa" },
  NBO: { city: "Nairobi", country: "KE", timeZone: "Africa/Nairobi" },
  CPT: { city: "Cape Town", country: "ZA", timeZone: "Africa/Johannesburg" },
  JNB: { city: "Johannesburg", country: "ZA", timeZone: "Africa/Johannesburg" },
  HDS: { city: "Hoedspruit", country: "ZA", timeZone: "Africa/Johannesburg" },
  MQP: { city: "Mbombela", country: "ZA", timeZone: "Africa/Johannesburg" },
  SZK: { city: "Skukuza", country: "ZA", timeZone: "Africa/Johannesburg" },
  DUR: { city: "Durban", country: "ZA", timeZone: "Africa/Johannesburg" },
  MRU: { city: "Mauritius", country: "MU", timeZone: "Indian/Mauritius" },
  SEZ: { city: "Mahé", country: "SC", timeZone: "Indian/Mahe" },
};

export const COUNTRY_NAMES: Readonly<Record<string, string>> = {
  US: "United States",
  PA: "Panama",
  CO: "Colombia",
  BR: "Brazil",
  GB: "United Kingdom",
  FR: "France",
  NL: "Netherlands",
  DE: "Germany",
  ES: "Spain",
  PT: "Portugal",
  TR: "Türkiye",
  AE: "United Arab Emirates",
  QA: "Qatar",
  ET: "Ethiopia",
  KE: "Kenya",
  ZA: "South Africa",
  MU: "Mauritius",
  SC: "Seychelles",
};

export function countryName(code: CountryCode | null): string {
  return (code && COUNTRY_NAMES[code]) ?? code ?? "Unknown country";
}
