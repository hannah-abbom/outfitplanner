# Architecture

> Status: proposed, November 2026. Nothing is built yet. Choices marked **proposed** are confirmed in Phase 0 or in
> the Phase 1 spike for that integration; decisions that are expensive to reverse get an ADR in `docs/decisions/`.
> The stack mirrors the `idea` repository on purpose: same tools, same conventions.

## Principles

1. **AI drafts, rules decide.** Models extract bookings, read photos, plan outfits and suggest essentials. Pure
   functions in `packages/core` decide what must be right: time zones, passport validity windows, which plug
   adapter fits, duplicate and change detection, what's packed.
2. **One domain model.** Zod schemas in `packages/core` define trips, bookings, requirements and wardrobe once.
   Database JSON columns, model outputs, forms and API payloads are validated against them.
3. **Models return typed data.** Every AI task asks for structured output against a schema. Code renders everything
   the traveler reads.
4. **Provenance by construction.** Every extracted field keeps the quote it came from; code checks the quote is in
   the source and flags the field if it isn't. Every requirement keeps its source URL and checked date.
5. **Nothing changes a trip unreviewed.** Extracted bookings arrive as proposals in the inbox.
6. **Untrusted input stays data.** Emails, PDFs, web pages and photos can contain instructions aimed at the model.
   Calls that read them get no tools that change anything, and their output is a typed proposal a person reviews.
7. **Time is stored with its place.** Instants are stored in UTC together with the IANA time zone of the airport or
   place; they are shown in that place's local time, never the device's.
8. **Tenancy in the data layer.** Every repository function is scoped to the signed-in user and the trips they
   belong to. Postgres row-level security follows when there are users beyond us.
9. **Works without a model.** Every AI action has a manual path and a clear "not connected" state.

## Repository layout

```
apps/
  mobile/       Expo (React Native) app with Expo Router: screens, offline store, notifications, Maestro flows
  api/          HTTP API for the app: auth, trips, bookings, uploads, AI tasks, inbound email webhooks, jobs
packages/
  core/         Domain model (Zod), timeline building, booking merge rules, requirement rules, essentials rules,
                packing derivation, time-zone helpers. Pure TypeScript, no I/O.
  db/           Drizzle schema and migrations, user- and trip-scoped repositories, the fictional demo trip
  ai/           Model gateway (Anthropic SDK), one module per task with typed input and output, evals
  ingest/       Email (MIME, HTML to text), PDF text, image prep, safe fetch of product pages
  integrations/ Flight status, weather, inbound email, reference data loaders; each behind an interface with a fake
  ui/           Design tokens and primitives
  trends/       The weekly trends job, its review command and its eval (moves into ai/ with the gateway)
data/           Reference data with its source and licence: airports, countries, plug types; trends/ holds the
                tracked trends and brief versions the weekly job writes
prototype/      The single-page outfit planner that came first
docs/           product/ engineering/ decisions/
```

## Stack

| Concern       | Choice                                                                                         | Status   |
| ------------- | ---------------------------------------------------------------------------------------------- | -------- |
| Language      | TypeScript, strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`                   | decided  |
| Monorepo      | pnpm workspaces + Turborepo                                                                    | decided  |
| Mobile        | React Native with Expo and Expo Router; iPhone and Android first, web later from the same code | decided  |
| Offline       | Trips, bookings and documents cached on the device (SQLite and the file system)                | decided  |
| API           | A TypeScript HTTP service (Hono) sharing Zod contracts with the app through `packages/core`    | proposed |
| UI            | Our own primitives on design tokens in `packages/ui`; styling approach chosen in Phase 0       | decided  |
| Contracts     | Zod 4                                                                                          | decided  |
| Data          | Drizzle ORM; PGlite locally and in tests, managed Postgres in production (Neon)                | proposed |
| Auth          | Better Auth in our own database: email link, Google, passkeys                                  | proposed |
| Files         | S3-compatible object storage (Cloudflare R2 or Vercel Blob), private, encrypted at rest        | proposed |
| Jobs          | Inngest for email processing, scheduled weather and flight refreshes, re-checks                | proposed |
| AI            | Anthropic TypeScript SDK behind a gateway (see below)                                          | decided  |
| Inbound email | Postmark Inbound, posting parsed email to a webhook                                            | spike    |
| Flight status | AeroDataBox on demand in Phase 1; an alerts-capable provider (FlightAware AeroAPI) in Phase 2  | spike    |
| Weather       | Open-Meteo: forecast, historical archive for climate averages, geocoding                       | proposed |
| Push          | Expo Notifications (Apple and Google push through Expo's push service)                         | phase 2  |
| Builds        | EAS Build and EAS Update; TestFlight and Android internal testing for us two                   | proposed |
| Hosting       | The API on a managed Node host (Vercel, Fly or Render), chosen in Phase 0                      | proposed |
| Testing       | Vitest (unit, snapshot), Maestro (end-to-end flows on simulators), evals for AI tasks          | decided  |
| Quality gates | ESLint (typescript-eslint strict), Prettier, type-check, tests, build, smoke tests in CI       | decided  |

## Data model

Core entities. JSON columns are validated against Zod schemas from `packages/core`.

- **user**, **profile**: name, home country and airport, nationalities, residence, passport expiry per nationality,
  forwarding alias.
- **trip**: name, kind, start and end dates. **trip_member**: user, role (owner, editor, viewer).
- **traveler**: per trip; linked to a user or not (a partner without an account); nationalities, residence,
  passport expiry.
- **stop**: place (name, country, coordinates, time zone), arrival and departure dates.
- **day**: date, stop, plans, a weather snapshot with its source and fetch time.
- **booking**: kind (flight, lodging, car, rail, ferry, cruise, activity, dining, other), status (proposed,
  confirmed, cancelled), provider, confirmation code, start and end with time zone, location, travelers, details
  (typed per kind), source document.
- **flight_segment**: airline, flight number, departure and arrival airports, scheduled times, terminal, gate,
  seats, record locator, last status with its source and fetch time.
- **source_document**: how it arrived (forward, upload, paste), sender, subject, storage key, extracted text,
  delete-after date.
- **extraction**: the task, the model output, field quotes, review status.
- **requirement_check**: traveler, country, items (kind, summary, deadline, status), sources (URL, title, quote),
  checked at, next check at.
- **checklist**, **checklist_item**: kind (documents, essentials, packing, before departure), label, quantity,
  traveler, done, origin (rule, AI, wardrobe, manual), reason.
- **wardrobe_item**: owner, name, category, color, warmth, dressiness, tags, status, link, photo.
- **outfit**, **outfit_item**: trip, date, slot, traveler, label, note, needs.
- **push_subscription**, **notification**.

## AI tasks

`packages/ai` exposes a gateway with one method: generate typed output for a named task. Each task module owns its
system prompt, its Zod output schema and its post-processing in code.

- Calls use structured outputs (`messages.parse` with the task's schema) and adaptive thinking with effort set per
  task.
- One default model for every task, set in one constant and overridable by environment variable. Cheaper models
  are only tried when an eval shows they hold quality for that task.
- Server-side fallback is on, so a declined request is retried on a fallback model in the same call. Refusals and
  unparseable output become typed errors shown as plain messages.
- System prompts are cached; long or multi-part requests stream.
- A fake gateway returns canned outputs by task name for tests. `pnpm evals` runs graded cases against the real
  model when an API key is set and skips otherwise. Eval fixtures are fictional.

| Task                   | Reads                                                                                            | Returns                                                    | Effort |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | ------ |
| `extractBookings`      | Email text, PDF attachments (as documents), screenshots                                          | Bookings with a source quote per field                     | medium |
| `parseItinerary`       | Free-text itinerary, trip dates                                                                  | Days with places and plans                                 | medium |
| `catalogueGarments`    | A photo                                                                                          | Clothing pieces with category, color, warmth, dressiness   | low    |
| `garmentsFromPages`    | Product page title, description and image, fetched by us                                         | Clothing pieces                                            | low    |
| `researchRequirements` | Traveler nationality, residence, country, dates; web search limited to official government sites | Requirement items, each with a source URL and quote        | high   |
| `suggestEssentials`    | Trip kind, places, weather, plans, the rule-based list                                           | Extra items, each with a reason                            | medium |
| `planOutfits`          | Days, weather, plans, wardrobe, luggage, the trends brief                                        | Outfits per day and traveler, missing pieces, extras, tips | high   |

The first version of `planOutfits` runs without a server: in the app link on claude.ai the page asks Claude through
the viewer's own account (the artifact `sample` capability), with the prompt and answer checks in
`packages/core/src/stylist.ts` and the trends brief in `trends.ts`, refreshed by hand with its sources. The phone app
needs the API service for it. `packages/evals` grades the prompt on a fictional trip through the Claude API and skips
without a key.

The trends brief is moving from hand research to a weekly job: Claude searches a fixed list of sites, code merges
what it finds into tracked trends with momentum, and a person approves each brief before the stylist reads it. The
same trends are matched against a closet in code. The model, the pipeline, sources and their terms, costs and open
decisions are in [trends.md](trends.md); the job and its eval are in `packages/trends`.

| `trendsBrief` | A fixed list of fashion sites through web search, the trends already tracked | Trend mentions with sources, merged in code into a brief a person approves ([trends.md](trends.md)) | medium |
| `findPieces` | A missing piece and the brands the person names; web search limited to those brands' domains | Products with name, link, image and price as found | medium |
| `readBoard` | Pins from a Pinterest board the person connected (Pinterest API, boards and pins read access) | Style words and the pieces the pins show | low |

## Flows

### Bookings by email

1. Each user gets a private forwarding address (`<random>@in.<our domain>`).
2. The inbound email provider posts the parsed message (text, HTML, attachments) to `/api/inbound/<provider>`. We
   check the webhook secret, size limits and the rate per address.
3. The original is stored privately and a job is queued.
4. The job turns HTML into text, collects PDF attachments and images, and runs `extractBookings`. Code checks every
   quote against the source and flags fields whose quote isn't found.
5. Core rules pick the trip by dates and places, and merge with existing bookings by confirmation code, kind and
   date, so a change or a cancellation updates the booking instead of adding one.
6. Proposals appear in the trip's inbox. Confirming one creates the booking, its flight segments, and updates
   stops and days.

Paste and upload use the same pipeline from step 3.

### Flights

Airports resolve against reference data (OurAirports, with time zones). Phase 1 fetches status when you open a
flight and caches it with its time. Phase 2 polls on a schedule as departure nears (48 h, 24 h, 6 h, then every
15 minutes until landing) or subscribes to provider alerts, and sends a push notification when status, gate or
times change.

### Entry requirements

1. Core works out the route: every destination and transit country from the flight segments and stops.
2. For each traveler and country, `researchRequirements` searches only an allow-list of official domains
   (foreign ministries, embassies, border and health agencies). Code keeps an item only if its source URL is on the
   allow-list and appeared in the search results.
3. Rules in core turn the items into checklist entries with deadlines, for example passport validity against the
   return date.
4. Each check stores its date. Phase 2 re-checks 30 and 7 days before departure and flags changes.
5. The page always says to confirm with the linked official source. An open visa-requirement dataset is used as a
   cross-check; when the two disagree, the item is flagged instead of guessed.

### Weather

Places geocode through Open-Meteo. For dates within the forecast range we store the forecast and refresh it daily.
For dates further out we store climate averages: the same calendar dates averaged over the last ten years from the
historical archive. Each day's snapshot records which of the two it is. Open-Meteo's free tier is for
non-commercial use; we move to a paid plan before the app is public.

### Essentials

Country reference data (plug types, voltage, currency, driving side, emergency numbers, each with its source) drives
the rule-based items in core. `suggestEssentials` adds trip-specific items with reasons. It cannot remove a rule-based
item. Each person can keep a standing list that's added to every trip.

### Wardrobe and outfits

Moved over from the prototype. Photos are resized on the device before upload. Product links are fetched on the
server (with size, time and redirect limits) to read the page's title, description and image, which fixes the
prototype's guessing from the URL. Outfit planning streams its progress to the page. Packing derivation, repeats and
"leave at home" are pure functions in core.

Pieces are shown as stickers (WRD-07), so a closet of mixed photos, screenshots and drawings reads as one set. On the
web the piece is cut out of its photo on the device with MediaPipe's interactive segmenter (the Magic Touch model,
Apache-2.0): the mask under a point, the middle of the photo unless the person taps elsewhere, becomes the alpha, and
a white border is stamped around the outline. MediaPipe is loaded as a plain script from `public/cutout/` rather than
bundled, because Metro can't bundle its dynamic import, and only when a sticker is wanted.
`pnpm --filter @trip/mobile assets:cutout` puts the runtime there before a web export; the model ships as base64 text
because the artifact host serves only web media types. The piece keeps the photo in `original`, so the sticker can be
redone or turned back into the photo. Web images live in IndexedDB, not in saved settings. The phone app shows photos
framed until a development build can use the system's subject lifting (Apple Vision, ML Kit).

## Privacy and security

- No passport numbers, ever. Nationality and expiry date are enough for every rule we run.
- Original emails and PDFs are private to their owner, encrypted at rest, and deleted 30 days after the trip ends
  unless the owner keeps them. Extracted bookings stay.
- Secrets live in environment variables and the host's secret store, never in the repository.
- Inbound webhooks are authenticated, size-limited and rate-limited.
- Real trip data never goes into fixtures, evals or screenshots. Demo content is fictional.

## Testing and quality gates

- Unit tests for everything in `packages/core`: time zones, merge rules, requirement rules, essentials rules,
  packing derivation.
- Integration tests run against PGlite with fake integrations.
- Maestro flows cover the demo trip on iPhone and Android simulators.
- Evals for each AI task with fictional fixtures: booking emails across airlines, hotels and agencies, multi-leg
  itineraries, garment photos.
- CI runs format, lint, type-check, tests, build and smoke tests on every pull request. Evals run on `main` when an
  API key is configured.

## Environments and secrets

| Variable                               | Used by                |
| -------------------------------------- | ---------------------- |
| `DATABASE_URL`                         | db (PGlite when unset) |
| `ANTHROPIC_API_KEY`                    | ai                     |
| `BETTER_AUTH_SECRET`, OAuth client ids | auth                   |
| `STORAGE_*`                            | files                  |
| `INBOUND_WEBHOOK_SECRET`               | inbound email          |
| `FLIGHT_STATUS_API_KEY`                | flights                |
| `EXPO_ACCESS_TOKEN`                    | builds, push (phase 2) |
