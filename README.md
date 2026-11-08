# Trip Wardrobe

Working name. A travel companion that keeps a whole trip in one place, built first for our honeymoon:

- Flights, hotels and bookings from forwarded confirmation emails
- Entry requirements for each traveler's passport, for every country on the route
- The weather and plans for each day
- Essentials and documents to bring
- Outfits planned from your own wardrobe, and one packing list

**Status:** the honeymoon build is in progress: an Expo (React Native) app that imports a travel agent's Travefy
link and shows the itinerary, bookings, entry requirements and a packing list, all offline on the phone.

## Docs

- [Product plan](docs/product/plan.md): what we're building, the honeymoon release, phases, open decisions
- [Feature map](docs/product/feature-map.md): every feature with an ID and a phase
- [Architecture](docs/engineering/architecture.md): stack, layout, data model, AI tasks, integrations, privacy
- [Prototype](prototype/README.md): the single-page outfit planner that came first

## Run it

Requires Node 22 and pnpm 10.

```bash
pnpm install
pnpm test                         # core logic: import, route, requirements, essentials
cd apps/mobile && npx expo start  # then scan the QR code with Expo Go on your phone
```

Inside the app, tap **+** and paste a Travefy itinerary link, or choose the sample trip.

## Layout

- `apps/mobile`: the Expo app (Expo Router): Home, Outfits (the planner), Add, Closet, Trip, and day, flight, stay
  and piece screens
- `packages/core`: pure TypeScript with Zod: the Travefy importer, journeys and gaps, entry requirements with
  sources, essentials. Tests run on a fictional itinerary.
