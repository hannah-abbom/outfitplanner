# Feature map

Every feature has a stable ID. Reference IDs in commit messages and pull requests (`BKG-02: merge booking updates`).
Phases are defined in [plan.md](plan.md): **0** foundations, **1** honeymoon release, **2** on the road, **3** beyond
us. Status is `planned`, `building` or `done`.

The outfit planner is the heart of the app: the closet (WRD), the looks for each day (OUT) and the packing list they
add up to (PCK). Everything else feeds it: the trip gives the days, the weather and the plans; bookings and entry rules
keep the rest of the trip in hand.

## Closet (WRD)

| ID     | Feature                                                                                            | Phase | Status  |
| ------ | -------------------------------------------------------------------------------------------------- | ----- | ------- |
| WRD-01 | Add clothes from photos and screenshots of things you bought                                       | 1     | done    |
| WRD-02 | Add clothes from product links, reading the product page                                           | 1     | done    |
| WRD-03 | Edit pieces: category, colour, warmth, style, have it or to get, a note; first guess from the name | 1     | done    |
| WRD-04 | Closet kept per person across trips                                                                | 1     | done    |
| WRD-05 | AI reads photos and screenshots: several pieces per image, tagged                                  | 1     | planned |
| WRD-06 | Bring in inspiration from Pinterest boards                                                         | 2     | planned |
| WRD-07 | Stickers: each piece cut out of its photo on the device, with a white die-cut edge                 | 1     | web     |

## Outfits (OUT)

| ID     | Feature                                                                        | Phase | Status   |
| ------ | ------------------------------------------------------------------------------ | ----- | -------- |
| OUT-01 | Planner: every day with its weather, plans, and a Day and an Evening look      | 1     | done     |
| OUT-02 | Drag pieces from the closet onto a look, or tap a piece and then a look        | 1     | done     |
| OUT-03 | Plans per day (game drive, beach, dinner out) that shape the looks             | 1     | done     |
| OUT-04 | Notes on what a look is missing for the weather and the plans                  | 1     | done     |
| OUT-05 | AI suggests looks from your closet, the weather, the plans and current trends  | 1     | building |
| OUT-06 | Find pieces to buy from brands you name                                        | 2     | planned  |
| OUT-07 | Looks per traveler                                                             | 2     | planned  |
| OUT-08 | What repeats, what to leave home, and how well the capsule mixes               | 2     | planned  |
| OUT-09 | Trends kept current: a weekly brief from tracked sources, approved by a person | 1     | building |
| OUT-10 | Your on-trend pieces for a trip, and the one piece that would complete a trend | 2     | building |

## Packing (PCK)

| ID     | Feature                                                                | Phase | Status  |
| ------ | ---------------------------------------------------------------------- | ----- | ------- |
| PCK-01 | One checklist: clothes, essentials, documents                          | 1     | done    |
| PCK-02 | Clothes come from the looks, each piece once, with how often it's worn | 1     | done    |
| PCK-03 | Packed state shared between travelers                                  | 2     | planned |
| PCK-04 | Luggage limits (carry-on only) shape the plan                          | 2     | planned |

## Platform (PLT)

| ID     | Feature                                                          | Phase | Status   |
| ------ | ---------------------------------------------------------------- | ----- | -------- |
| PLT-01 | Monorepo, CI, lint, type-check, tests, app builds for our phones | 0     | building |
| PLT-02 | Design tokens and primitives, carried over from the prototype    | 0     | done     |
| PLT-03 | Sign-in (email link, Google, passkeys) and profiles              | 0     | planned  |
| PLT-04 | Fictional demo trip, shown without an account and used by tests  | 0     | planned  |
| PLT-05 | Background jobs with retries and schedules                       | 1     | planned  |
| PLT-06 | Trip, bookings and documents available offline on the phone      | 1     | done     |
| PLT-07 | Per-user AI cost tracking and limits                             | 3     | planned  |
| PLT-08 | Native app decision and wrapper                                  | 3     | planned  |

## Trips and timeline (TRP)

| ID     | Feature                                                                                    | Phase | Status  |
| ------ | ------------------------------------------------------------------------------------------ | ----- | ------- |
| TRP-01 | Multiple trips with name, kind, dates and cover                                            | 0     | done    |
| TRP-02 | Travelers per trip with nationalities, residence and passport expiry (no passport numbers) | 0     | done    |
| TRP-03 | Stops and nights, built from bookings or entered by hand                                   | 1     | done    |
| TRP-04 | Days with plans, dress codes and linked bookings                                           | 1     | done    |
| TRP-05 | Paste a free-text itinerary and get days and plans                                         | 1     | planned |
| TRP-06 | "Today" view: what's next, confirmation numbers, weather, outfit                           | 2     | planned |
| TRP-07 | Calendar export (.ics)                                                                     | 2     | planned |
| TRP-08 | Trip templates by kind (cruise, ski, wedding guest, work)                                  | 3     | planned |
| TRP-09 | Home: every trip, the countdown, and everything left to do across them                     | 1     | done    |

## Bookings inbox (BKG)

| ID     | Feature                                                                                           | Phase | Status  |
| ------ | ------------------------------------------------------------------------------------------------- | ----- | ------- |
| BKG-01 | Paste email text or upload .eml, PDF or screenshot                                                | 1     | planned |
| BKG-02 | Extract bookings (flight, lodging, car, rail, ferry, cruise, activity, dining) with source quotes | 1     | planned |
| BKG-03 | Review inbox: confirm, edit or discard proposed bookings                                          | 1     | planned |
| BKG-04 | Match to the right trip; merge duplicates, changes and cancellations                              | 1     | planned |
| BKG-05 | Private forwarding address per user                                                               | 1     | planned |
| BKG-06 | Open the original email or PDF from a booking                                                     | 1     | planned |
| BKG-07 | Connect a mailbox (Gmail, Outlook) to find confirmations                                          | 3     | planned |
| BKG-08 | Import a travel agent's shared itinerary link (Travefy first), vouchers included                  | 1     | done    |
| BKG-09 | Flag gaps: no transfer between an arrival and the hotel, nights with no stay                      | 1     | done    |

## Flights (FLT)

| ID     | Feature                                                                         | Phase | Status  |
| ------ | ------------------------------------------------------------------------------- | ----- | ------- |
| FLT-01 | Flight segments with airports, local times, terminals, seats and record locator | 1     | done    |
| FLT-02 | Live status on demand                                                           | 1     | planned |
| FLT-03 | Alerts for delays, gate changes and cancellations                               | 2     | planned |
| FLT-04 | Check-in window reminders                                                       | 2     | planned |

## Entry requirements (REQ)

| ID     | Feature                                                                                                                | Phase | Status  |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ----- | ------- |
| REQ-01 | Route countries, transits included, worked out from bookings                                                           | 1     | done    |
| REQ-02 | Requirements per traveler and country: visa or travel authorization, passport validity, health, arrival forms, customs | 1     | done    |
| REQ-03 | Every item carries an official source link and the date it was checked                                                 | 1     | done    |
| REQ-04 | Deadlines turned into checklist items ("apply by …")                                                                   | 1     | done    |
| REQ-05 | Automatic re-check 30 and 7 days before departure, with changes flagged                                                | 2     | planned |

## Essentials and documents (ESS)

| ID     | Feature                                                                              | Phase | Status  |
| ------ | ------------------------------------------------------------------------------------ | ----- | ------- |
| ESS-01 | Rule-based items from country data: plug adapters, voltage, currency, driving side   | 1     | done    |
| ESS-02 | Documents checklist: passports, authorizations, insurance, tickets, vouchers         | 1     | done    |
| ESS-03 | Trip-specific suggestions from activities, weather and trip kind, each with a reason | 1     | planned |
| ESS-04 | Your own standing list (the battery pack you always bring)                           | 1     | planned |

## Weather (WX)

| ID    | Feature                                                  | Phase | Status  |
| ----- | -------------------------------------------------------- | ----- | ------- |
| WX-01 | Climate averages for far-off dates, from historical data | 1     | done    |
| WX-02 | Forecast once the date is within range, refreshed daily  | 1     | done    |
| WX-03 | Weather changes flagged against the outfit plan          | 2     | planned |

## Sharing and notifications (SHR, NTF)

| ID     | Feature                                          | Phase | Status  |
| ------ | ------------------------------------------------ | ----- | ------- |
| SHR-01 | Invite a travel partner to a trip as editor      | 1     | planned |
| SHR-02 | Read-only share link for family                  | 2     | planned |
| NTF-01 | Push notifications on the installed app          | 2     | planned |
| NTF-02 | Email digest before departure: what's left to do | 2     | planned |
