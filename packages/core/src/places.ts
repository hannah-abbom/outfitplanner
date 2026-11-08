import type { CountryCode } from "./model";

export interface AirportInfo {
  city: string;
  country: CountryCode;
  timeZone: string;
  lat: number;
  lng: number;
}

/**
 * Airports we know without a lookup. A short list for now; the full table comes from OurAirports (public domain)
 * in Phase 1. Unknown codes still import, with country and time zone left empty.
 */
export const AIRPORTS: Readonly<Record<string, AirportInfo>> = {
  ATL: { city: "Atlanta", country: "US", timeZone: "America/New_York", lat: 33.64, lng: -84.43 },
  JFK: { city: "New York", country: "US", timeZone: "America/New_York", lat: 40.64, lng: -73.78 },
  EWR: { city: "Newark", country: "US", timeZone: "America/New_York", lat: 40.69, lng: -74.17 },
  MIA: { city: "Miami", country: "US", timeZone: "America/New_York", lat: 25.79, lng: -80.29 },
  LAX: { city: "Los Angeles", country: "US", timeZone: "America/Los_Angeles", lat: 33.94, lng: -118.41 },
  PTY: { city: "Panama City", country: "PA", timeZone: "America/Panama", lat: 9.07, lng: -79.38 },
  BOG: { city: "Bogotá", country: "CO", timeZone: "America/Bogota", lat: 4.7, lng: -74.15 },
  GRU: { city: "São Paulo", country: "BR", timeZone: "America/Sao_Paulo", lat: -23.43, lng: -46.47 },
  LHR: { city: "London", country: "GB", timeZone: "Europe/London", lat: 51.47, lng: -0.45 },
  CDG: { city: "Paris", country: "FR", timeZone: "Europe/Paris", lat: 49.01, lng: 2.55 },
  AMS: { city: "Amsterdam", country: "NL", timeZone: "Europe/Amsterdam", lat: 52.31, lng: 4.76 },
  FRA: { city: "Frankfurt", country: "DE", timeZone: "Europe/Berlin", lat: 50.03, lng: 8.57 },
  MAD: { city: "Madrid", country: "ES", timeZone: "Europe/Madrid", lat: 40.47, lng: -3.56 },
  LIS: { city: "Lisbon", country: "PT", timeZone: "Europe/Lisbon", lat: 38.77, lng: -9.13 },
  PDL: { city: "Ponta Delgada", country: "PT", timeZone: "Atlantic/Azores", lat: 37.74, lng: -25.7 },
  IST: { city: "Istanbul", country: "TR", timeZone: "Europe/Istanbul", lat: 41.26, lng: 28.74 },
  DXB: { city: "Dubai", country: "AE", timeZone: "Asia/Dubai", lat: 25.25, lng: 55.36 },
  DOH: { city: "Doha", country: "QA", timeZone: "Asia/Qatar", lat: 25.27, lng: 51.61 },
  ADD: { city: "Addis Ababa", country: "ET", timeZone: "Africa/Addis_Ababa", lat: 8.98, lng: 38.8 },
  NBO: { city: "Nairobi", country: "KE", timeZone: "Africa/Nairobi", lat: -1.32, lng: 36.93 },
  CPT: { city: "Cape Town", country: "ZA", timeZone: "Africa/Johannesburg", lat: -33.97, lng: 18.6 },
  JNB: { city: "Johannesburg", country: "ZA", timeZone: "Africa/Johannesburg", lat: -26.14, lng: 28.24 },
  HDS: { city: "Hoedspruit", country: "ZA", timeZone: "Africa/Johannesburg", lat: -24.37, lng: 31.05 },
  MQP: { city: "Mbombela", country: "ZA", timeZone: "Africa/Johannesburg", lat: -25.38, lng: 31.11 },
  SZK: { city: "Skukuza", country: "ZA", timeZone: "Africa/Johannesburg", lat: -24.96, lng: 31.59 },
  DUR: { city: "Durban", country: "ZA", timeZone: "Africa/Johannesburg", lat: -29.61, lng: 31.12 },
  MRU: { city: "Mauritius", country: "MU", timeZone: "Indian/Mauritius", lat: -20.43, lng: 57.68 },
  SEZ: { city: "Mahé", country: "SC", timeZone: "Indian/Mahe", lat: -4.67, lng: 55.52 },
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
