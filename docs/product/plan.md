# Product plan

> Status: draft, November 2026. Working name: Trip Wardrobe. Designed around our honeymoon; first used for real on
> the trip after it.

## What we're building

One place for everything about a trip. Forward a confirmation email and the flight, hotel or booking lands in the
trip. Each traveler sees what their passport needs for every country on the route. Each day shows where you are,
what you're doing, the weather, and what you'll wear, planned from the clothes you actually own. Before you leave, it
tells you what's missing, what to buy, and what to pack, down to the plug adapter.

We design it around our honeymoon. Then we widen it: cruises, ski trips, work travel, family trips, other people.

The honeymoon starts less than two weeks after this plan was written. That is too soon to build, test and trust a
new app, so the honeymoon runs on the prototype plus hand-done research, and its real confirmations, requirements
and packing become the first test case for this app. The first trip that runs on the app itself is the next one.

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

Two tracks run at once:

- **The honeymoon (now).** The prototype handles the wardrobe, outfits and packing; entry requirements and
  essentials are researched by hand. What we learn, what was painful and what we wished the app did, goes into
  this plan.
- **The app.** Phases 0 and 1 are built with the honeymoon as the test case. Real confirmations and documents are
  used locally to test extraction and never committed; fixtures and evals stay fictional.

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
5. **Offline and installable.** Shared trip with both of us.

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
| Web app or native app first    | Installable web app (PWA) first                   | One codebase, fastest to ship, works on both phones. Native later if we need the App Store.         |
| Keep original emails and PDFs? | Keep until 30 days after the trip, then delete    | Useful at check-in and for re-reading. Extracted bookings stay.                                     |
| Paid services                  | Price each in its Phase 1 spike before committing | Flight data, inbound email, hosting and the Claude API all cost money; we choose with real numbers. |
| Product name and domain        | Decide before the forwarding address ships        | The forwarding address shows the domain.                                                            |
