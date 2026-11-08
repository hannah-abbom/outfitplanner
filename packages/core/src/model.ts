import { z } from "zod";

/** A calendar date, `YYYY-MM-DD`. */
export const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export type IsoDate = z.infer<typeof IsoDate>;

/** Wall-clock time at a place, `YYYY-MM-DDTHH:MM`, read together with that place's IANA time zone. */
export const LocalDateTime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
export type LocalDateTime = z.infer<typeof LocalDateTime>;

/** ISO 3166-1 alpha-2 country code. */
export const CountryCode = z.string().regex(/^[A-Z]{2}$/);
export type CountryCode = z.infer<typeof CountryCode>;

export const Airport = z.object({
  code: z.string().regex(/^[A-Z]{3}$/),
  name: z.string(),
  city: z.string().nullable(),
  country: CountryCode.nullable(),
  timeZone: z.string().nullable(),
});
export type Airport = z.infer<typeof Airport>;

export const Voucher = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().nullable(),
});
export type Voucher = z.infer<typeof Voucher>;

export const Flight = z.object({
  id: z.string(),
  airline: z.string().nullable(),
  flightNumber: z.string().nullable(),
  from: Airport,
  to: Airport,
  departs: LocalDateTime,
  arrives: LocalDateTime.nullable(),
  terminal: z.string().nullable(),
  voucherIds: z.array(z.string()),
});
export type Flight = z.infer<typeof Flight>;

export const GeoPoint = z.object({ lat: z.number(), lng: z.number() });
export type GeoPoint = z.infer<typeof GeoPoint>;

export const Stay = z.object({
  id: z.string(),
  name: z.string(),
  checkIn: IsoDate,
  checkOut: IsoDate,
  nights: z.number().int().nonnegative(),
  country: CountryCode.nullable(),
  /** The airport the traveler arrived at before checking in, used to name the place. */
  nearAirport: z.string().nullable(),
  location: GeoPoint.nullable(),
  room: z.string().nullable(),
  notes: z.string().nullable(),
  voucherIds: z.array(z.string()),
});
export type Stay = z.infer<typeof Stay>;

export const Gap = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("no-transfer"),
    date: IsoDate,
    airport: z.string(),
    stayId: z.string(),
    stayName: z.string(),
  }),
  z.object({ kind: z.literal("no-stay"), date: IsoDate }),
]);
export type Gap = z.infer<typeof Gap>;

export const Traveler = z.object({
  name: z.string().min(1),
  /** Every passport the person may travel on. */
  nationalities: z.array(CountryCode).min(1),
  /** Passport expiry, never the passport number. */
  passportExpiry: IsoDate.nullable(),
});
export type Traveler = z.infer<typeof Traveler>;

export const TripSource = z.object({
  kind: z.literal("travefy"),
  url: z.string().nullable(),
  importedAt: z.string(),
});
export type TripSource = z.infer<typeof TripSource>;

export const Trip = z.object({
  name: z.string(),
  start: IsoDate,
  end: IsoDate,
  travelers: z.array(Traveler),
  flights: z.array(Flight),
  stays: z.array(Stay),
  vouchers: z.array(Voucher),
  gaps: z.array(Gap),
  source: TripSource,
});
export type Trip = z.infer<typeof Trip>;
