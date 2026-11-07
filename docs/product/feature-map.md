# Feature map

Every feature has a stable ID. Reference IDs in commit messages and pull requests (`BKG-02: merge booking updates`).
Phases are defined in [plan.md](plan.md): **0** foundations, **1** honeymoon release, **2** on the road, **3** beyond
us. Status is `planned`, `building` or `done`.

## Platform (PLT)

| ID     | Feature                                                          | Phase | Status  |
| ------ | ---------------------------------------------------------------- | ----- | ------- |
| PLT-01 | Monorepo, CI, lint, type-check, tests, app builds for our phones | 0     | planned |
| PLT-02 | Design tokens and primitives, carried over from the prototype    | 0     | planned |
| PLT-03 | Sign-in (email link, Google, passkeys) and profiles              | 0     | planned |
| PLT-04 | Fictional demo trip, shown without an account and used by tests  | 0     | planned |
| PLT-05 | Background jobs with retries and schedules                       | 1     | planned |
| PLT-06 | Trip, bookings and documents available offline on the phone      | 1     | planned |
| PLT-07 | Per-user AI cost tracking and limits                             | 3     | planned |
| PLT-08 | Native app decision and wrapper                                  | 3     | planned |

## Trips and timeline (TRP)

| ID     | Feature                                                                                    | Phase | Status  |
| ------ | ------------------------------------------------------------------------------------------ | ----- | ------- |
| TRP-01 | Multiple trips with name, kind, dates and cover                                            | 0     | planned |
| TRP-02 | Travelers per trip with nationalities, residence and passport expiry (no passport numbers) | 0     | planned |
| TRP-03 | Stops and nights, built from bookings or entered by hand                                   | 1     | planned |
| TRP-04 | Days with plans, dress codes and linked bookings                                           | 1     | planned |
| TRP-05 | Paste a free-text itinerary and get days and plans                                         | 1     | planned |
| TRP-06 | "Today" view: what's next, confirmation numbers, weather, outfit                           | 2     | planned |
| TRP-07 | Calendar export (.ics)                                                                     | 2     | planned |
| TRP-08 | Trip templates by kind (cruise, ski, wedding guest, work)                                  | 3     | planned |

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

## Flights (FLT)

| ID     | Feature                                                                         | Phase | Status  |
| ------ | ------------------------------------------------------------------------------- | ----- | ------- |
| FLT-01 | Flight segments with airports, local times, terminals, seats and record locator | 1     | planned |
| FLT-02 | Live status on demand                                                           | 1     | planned |
| FLT-03 | Alerts for delays, gate changes and cancellations                               | 2     | planned |
| FLT-04 | Check-in window reminders                                                       | 2     | planned |

## Entry requirements (REQ)

| ID     | Feature                                                                                                                | Phase | Status  |
| ------ | ---------------------------------------------------------------------------------------------------------------------- | ----- | ------- |
| REQ-01 | Route countries, transits included, worked out from bookings                                                           | 1     | planned |
| REQ-02 | Requirements per traveler and country: visa or travel authorization, passport validity, health, arrival forms, customs | 1     | planned |
| REQ-03 | Every item carries an official source link and the date it was checked                                                 | 1     | planned |
| REQ-04 | Deadlines turned into checklist items ("apply by …")                                                                   | 1     | planned |
| REQ-05 | Automatic re-check 30 and 7 days before departure, with changes flagged                                                | 2     | planned |

## Essentials and documents (ESS)

| ID     | Feature                                                                              | Phase | Status  |
| ------ | ------------------------------------------------------------------------------------ | ----- | ------- |
| ESS-01 | Rule-based items from country data: plug adapters, voltage, currency, driving side   | 1     | planned |
| ESS-02 | Documents checklist: passports, authorizations, insurance, tickets, vouchers         | 1     | planned |
| ESS-03 | Trip-specific suggestions from activities, weather and trip kind, each with a reason | 1     | planned |
| ESS-04 | Your own standing list (the battery pack you always bring)                           | 1     | planned |

## Weather (WX)

| ID    | Feature                                                  | Phase | Status  |
| ----- | -------------------------------------------------------- | ----- | ------- |
| WX-01 | Climate averages for far-off dates, from historical data | 1     | planned |
| WX-02 | Forecast once the date is within range, refreshed daily  | 1     | planned |
| WX-03 | Weather changes flagged against the outfit plan          | 2     | planned |

## Wardrobe (WRD)

| ID     | Feature                                                                          | Phase | Status  |
| ------ | -------------------------------------------------------------------------------- | ----- | ------- |
| WRD-01 | Add clothes from photos (one or many pieces per photo)                           | 1     | planned |
| WRD-02 | Add clothes from product links, reading the product page                         | 1     | planned |
| WRD-03 | Edit pieces: category, color, warmth, dressiness, status (have, ordered, to buy) | 1     | planned |
| WRD-04 | Wardrobe kept per person across trips                                            | 1     | planned |

## Outfits (OUT)

| ID     | Feature                                                          | Phase | Status  |
| ------ | ---------------------------------------------------------------- | ----- | ------- |
| OUT-01 | Outfits per day and traveler from weather, plans and dress codes | 1     | planned |
| OUT-02 | Edit outfits by hand                                             | 1     | planned |
| OUT-03 | What's missing, what repeats, what to leave home                 | 1     | planned |

## Packing (PCK)

| ID     | Feature                                                     | Phase | Status  |
| ------ | ----------------------------------------------------------- | ----- | ------- |
| PCK-01 | One checklist: clothes, essentials, documents, per traveler | 1     | planned |
| PCK-02 | Packed state shared between travelers                       | 1     | planned |
| PCK-03 | Luggage limits (carry-on only) shape the plan               | 1     | planned |

## Sharing and notifications (SHR, NTF)

| ID     | Feature                                          | Phase | Status  |
| ------ | ------------------------------------------------ | ----- | ------- |
| SHR-01 | Invite a travel partner to a trip as editor      | 1     | planned |
| SHR-02 | Read-only share link for family                  | 2     | planned |
| NTF-01 | Push notifications on the installed app          | 2     | planned |
| NTF-02 | Email digest before departure: what's left to do | 2     | planned |
