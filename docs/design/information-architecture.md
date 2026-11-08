# Information architecture

> Status: second version, November 2026. The outfit planner is the main feature; everything else feeds it.

## What the app is for

You give it a trip and your clothes, and it helps you decide what to wear each day and what to pack. The trip
supplies the days, the weather and the plans; the closet supplies the pieces; the planner is where they meet. The
packing list is whatever the looks use, plus the essentials and documents the route needs.

Three questions, each with one home:

| Question           | Home        | Holds                                                                   |
| ------------------ | ----------- | ----------------------------------------------------------------------- |
| What do I wear?    | **Outfits** | Every day with its weather and plans, a Day and an Evening look, and the suitcase they add up to |
| What do I have?    | **Closet**  | Every piece, from photos, screenshots of things you bought, and links   |
| Where, when, what? | **Trip**    | Days, bookings, and entry rules to _do_ before you go                   |

**Home** sits above them: every trip, the countdown to the next one, and one list of everything left across them.

## Navigation

```
Bottom tabs: Home · Outfits · [ + ] · Closet · Trip
├── Home              next trip as a photo cover with the countdown; how many days have a look, with a way into
│                     the planner; "Left to do" across trips (forms, missing transfers, days without a look,
│                     pieces to get); every trip
├── Outfits           the open trip, By day | Suitcase
│   ├── By day        chapters (one per stay); each day: date, weather, plans, Day (or Travel) and Evening looks,
│   │                 notes on what a look is missing; the closet tray along the bottom to drag from
│   └── Suitcase      the looks' pieces once each with how often worn, then documents and essentials, with ticks
├── [ + ] Add         to the closet: photos & screenshots, camera, link, type it in; trips: import an itinerary,
│   │                 who's traveling
│   └── Piece         photo or drawing, name (first guess fills the rest), what it is, colour, warmth, good
│                     for, have it or to get, brand and link
├── Closet            every piece in a grid, filtered by kind or "to get"; tap to edit
└── Trip              the open trip, Days | Bookings | Ready, and its settings
    ├── Days          chapters, then each day in local time with weather → Day
    ├── Bookings      flights and stays by date, with missing transfers
    ├── Ready         per traveler: what to do and by when, rules by country with official sources
    └── Settings      import or re-import, rename the trip, travelers and passports, units, remove
Day                   weather and what to wear, the day's looks, the timeline of bookings
Flight                dark, readable at a glance: times, duration, time change, terminal, documents
Stay                  dates, room, notes from the agent, missing transfer, vouchers
```

### Why these choices

- **Outfits sits next to Home.** It's the reason to open the app, so it's one tap from anywhere and the first thing
  Home points to after the countdown.
- **The plus adds clothes first.** The closet is what the planner is built from; adding a trip comes second.
- **The closet belongs to the person, not the trip.** Pieces carry over to the next trip; looks belong to a trip.
- **Drag, or tap then tap.** Dragging from the tray onto a look is the quick way; tapping a piece and then a look
  does the same for anyone who prefers not to drag.
- **Plans shape looks.** A game drive asks for a layer and neutral colours, the beach for swim, dinner for something
  dressy. The planner says what a look is missing, in plain words, in burgundy.
- **Do, bring, wear never mix.** Ready is things to do (forms, clinics, passport checks). The suitcase is things to
  bring. Outfits is what to wear.
- **One accent.** Burgundy marks what needs you: the next thing to do, a missing transfer, a piece to get, the tab
  you're on. Everything else is black and white, with photography doing the decorating.
