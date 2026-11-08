# Product plan

> Status: draft, November 2026. Working name: Trip Wardrobe. Designed around our honeymoon; first used for real on
> the trip after it.

## What we're building

An outfit planner for trips. You add the clothes you own, from photos, screenshots of things you bought, or links,
and the app lays out every day of the trip with its weather and plans. You drag pieces onto each day's looks, it says
what a look is missing (a layer for a cold evening, swim for the beach, neutrals for a game drive), and the packing
list is whatever the looks use. AI suggests looks from your closet and current trends, and can find what's missing
from brands you like.

Around the planner sits everything else a trip needs, because the trip is what the looks are built on: the itinerary
imported from the agent's link, bookings, what each passport needs for every country on the route, and one Home
screen with every trip, the countdown and everything left to do.

We design it around our honeymoon. Then we widen it: cruises, ski trips, work travel, family trips, other people.

The honeymoon starts less than two weeks after this plan was written. The full app can't be ready by then, so we
ship a lean **honeymoon build** first: the real app, on both our phones, with the trip imported from the agent's
itinerary link. Everything else in Phase 1 follows after the trip, with the honeymoon as its first test case.

## Product principles

1. **One inbox per trip.** Forward or paste a confirmation, upload a PDF or a screenshot. It arrives as a proposed
   booking you confirm with one tap. Nothing changes the trip without the traveler confirming it.
2. **Every fact shows where it came from.** A booking links to its email. A flight status names its feed and time.
   An entry requirement links to the government page and the date we checked it.
3. **AI drafts, rules decide.** Claude reads emails, photos and itineraries and suggests outfits and essentials.
   Code decides the things that must be right: passport validity windows, time zones, which adapter fits which
   socket, what counts as packed.
4. **Built for two.** A trip is shared. Wardrobes and outfit plans stay per person.
5. **Works at the gate.** Trip details, confirmation numbers and boarding info open offline on a phone.
6. **Useful without AI.** Everything can be entered by hand. AI saves time; it is never the only way in.

## What the first release has to do

What a trip like our honeymoon needs, in the order we'd need it.

**While planning**

- Create the trip with both of us as travelers, with nationalities and passport expiry dates (never passport numbers).
- Forward every confirmation (flights, hotels, transfers, tours, restaurants) and review what was found.
- See the trip as a timeline: places, nights, flights, check-ins, plans per day.
- See entry requirements for each of us, for each country including transits: visa or travel authorization,
  passport validity, vaccinations, arrival forms. Each item has a source and a deadline, like "apply for the
  authorization by May 20".
- Get the essentials list: adapters for each country's sockets, documents, health, money, tech, and
  trip-specific items (reef-safe sunscreen for snorkeling, a jacket for a cold boat ride).

**While packing**

- Add clothes from photos and product links.
- Get outfits planned per day from the weather, the plans and the dress codes, plus what's missing, what repeats,
  and what to leave home. This is the prototype, moved into the real app.
- Tick off one packing list that combines clothes, essentials and documents.

**While traveling**

- A "today" view: where we are, what's next, confirmation numbers, the weather, what to wear.
- Flight status for each flight, available offline once loaded.

## Feature areas

| Area                       | What it does                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Trips & timeline           | Multiple trips, each with stops, nights, days and plans. Built from bookings or entered by hand.             |
| Bookings inbox             | Forward, paste or upload confirmations. Claude extracts bookings, you confirm, duplicates and changes merge. |
| Flights                    | Every flight segment with local times, terminals and seats. Live status, then alerts for changes.            |
| Entry requirements         | Per traveler and country: visa or eTA, passport validity, health, customs. Sourced and dated.                |
| Essentials & documents     | Rule-based items (adapters, documents) plus trip-specific suggestions, as checklists.                        |
| Weather                    | Forecast when the date is close, climate averages when it's far. Refreshed as the trip nears.                |
| Wardrobe, outfits, packing | Your clothes from photos and links, outfits per day and traveler, one packing checklist.                     |
| Sharing                    | Invite your partner to the trip. Later, read-only links for family.                                          |

The full list with IDs is in [feature-map.md](feature-map.md).

## Phases

### Honeymoon build (before departure)

The smallest version we'd trust on the trip, built in this order:

1. Expo app with the tabs from the [information architecture](../design/information-architecture.md): Home,
   Outfits, Add, Closet, Trip.
2. Import a Travefy itinerary link on the phone (BKG-08): flights joined into one trip leg each, stays per night,
   vouchers listed, gaps flagged (BKG-09).
3. Itinerary, Day, Bookings and the flight pass, all offline (PLT-06).
4. Ready: entry requirements per traveler from rules in `packages/core`, with sources and deadlines (REQ-02 to REQ-04).
5. The closet: pieces from photos, screenshots and links, a first guess from each name (WRD-01 to WRD-04).
6. The planner: every day with its weather and plans, Day and Evening looks filled by dragging or tapping, and notes
   on what each look is missing (OUT-01 to OUT-04).
7. The suitcase: the looks' pieces once each, plus documents and essentials, ticked on the phone (PCK-01, PCK-02).
8. On both phones through Expo (a development build or Expo Go with EAS Update).

No server, sign-in, AI or email forwarding yet. AI comes next, below. The trip data lives only on the phones, imported from the link, so
no real trip data enters the repository.

After the trip, Phases 0 and 1 continue below, with the honeymoon as the first test case. Real confirmations and
documents are used locally to test extraction and never committed; fixtures and evals stay fictional.

### The outfit planner's AI, next

Each of these needs a small server, because the AI key can't live in the app. All are possible:

- **Read photos and screenshots** (WRD-05): Claude looks at a photo or an order screenshot and returns each piece
  with its kind, colour, warmth and style. A screenshot with four items becomes four pieces.
- **Suggest looks with current trends** (OUT-05): Claude plans looks from the closet, each day's weather and plans,
  and a short trends brief it builds with web search, then explains each pick. Suggestions land as drafts you keep
  or drag away.
- **Pinterest boards** (WRD-06): through Pinterest's official API, after you connect your account; it needs our app
  approved by Pinterest. Until then, a pin's link or a screenshot of it works as inspiration.
- **Find pieces from brands you name** (OUT-06, stretch): Claude searches the web limited to those brands' sites and
  returns products with links and images. Prices and stock change, so results always open on the brand's own page.

### Phase 0: Foundations

Monorepo, CI, design tokens carried over from the prototype, sign-in, trips and travelers, a fictional demo trip,
deployed to a private URL.

Done when we can both sign in on our phones, create a trip and add each other.

### Phase 1: First release

Built in this order, each step usable on its own:

1. **Timeline and bookings inbox.** Paste or upload a confirmation, review, confirm. Flights view with local times.
2. **Forwarding address.** The same pipeline, fed by email.
3. **Requirements, essentials and documents.**
4. **Weather, wardrobe, outfits and packing.** The prototype, moved over, with real weather data.
5. **Offline on the phone.** Shared trip with both of us.

Done when the honeymoon can be rebuilt in the app from its real confirmations alone, with requirements, essentials,
outfits and packing matching what we actually needed, and we'd trust it for the next trip.

### Phase 2: On the road

Push notifications for flight changes (delay, gate, cancellation) and check-in windows. The "today" view. Calendar
export. Read-only share links for family. We use it on our next trip and fix what hurts.

### Phase 3: Beyond us

Onboarding for new people, trip templates by kind (cruise formal nights, ski layers, wedding guest), cost controls
per user, hardening for many users, and a decision on native apps (wrap the web app, or build with Expo). Optional
mailbox connections (Gmail, Outlook) once forwarding has proven what people need.

## Where it fits

Some apps already cover parts of this:

- **Bookings by email:** TripIt, Wanderlog and Tripsy build itineraries from forwarded confirmations.
- **Flights:** Flighty tracks flights in detail.
- **Packing:** PackPoint builds lists from the weather and activities.
- **Wardrobe:** Stylebook, Whering and GetWardrobe plan outfits from your own clothes.

We haven't found one that joins them: bookings, entry requirements, weather and your own wardrobe in one plan per
day, per traveler. That combination is the product.

### What a travel agent's itinerary gets wrong

Many trips, ours included, arrive as an agent's shared itinerary (Travefy is common). Reading one closely showed
what we have to do better:

- **A flight is split into pieces.** Departure and arrival are separate entries, often on different days, so a
  connection is hard to see. We show one flight, with the layover between flights.
- **Empty days disappear.** Days with nothing booked are left out, so you can't tell where you sleep each night.
  We show every night and its stay.
- **Gaps go unnoticed.** Nothing says there is no transfer from the airport to the first hotel. We flag it.
- **Times have no time zone.** We show each time in the local time of its place, and say so.
- **Vouchers are loose attachments.** We attach each PDF to its booking, available offline.
- **Prices sit next to plans.** Useful when booking, noise on the trip. We keep them out of the trip view.
- **Nothing about getting ready.** No entry requirements, weather, essentials or packing.

So importing an agent's link is a first-release feature (BKG-08), and gap detection comes with it (BKG-09).

## What we take from the honeymoon

- The confirmation emails for flights, hotels, transfers, tours and restaurants, kept in one email folder. They are
  the first real inputs for testing extraction, used locally and never committed.
- The requirements and essentials we researched by hand, as the expected answers for the requirements and essentials
  features.
- What we actually wore and what we didn't, to judge the outfit planner.
- Notes from the trip: what we looked up at the airport, what we couldn't find, what we wished the app did.
- Phones (iPhone or Android) and a domain name for the forwarding address, for Phase 0 and Phase 1.

## Open decisions

| Decision                       | Recommendation                                    | Why                                                                                                 |
| ------------------------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Web app or native app first    | Decided: React Native with Expo, mobile first     | A real app on both phones, offline and with notifications; web can follow from the same code.       |
| Keep original emails and PDFs? | Keep until 30 days after the trip, then delete    | Useful at check-in and for re-reading. Extracted bookings stay.                                     |
| Paid services                  | Price each in its Phase 1 spike before committing | Flight data, inbound email, hosting and the Claude API all cost money; we choose with real numbers. |
| Product name and domain        | Decide before the forwarding address ships        | The forwarding address shows the domain.                                                            |
