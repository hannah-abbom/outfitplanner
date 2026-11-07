# Information architecture

> Status: first exploration, November 2026. Where every feature lives in the mobile app, and why.

## The rule that organizes everything

A trip asks three questions, and each has one home:

| Question            | Home          | Holds                                                                                 |
| ------------------- | ------------- | ------------------------------------------------------------------------------------- |
| Where and when?     | **Itinerary** | Stops, nights, days, and everything that happens on a day, in local time              |
| What did we book?   | **Bookings**  | Every reservation with its confirmation number, documents and contacts, offline       |
| What must we do?    | **Ready**     | Entry requirements, forms and deadlines per traveler: things to _do_ before or during |
| What must we bring? | **Pack**      | Outfits per day, clothes, essentials and documents: things to _bring_                 |

"Do" and "bring" never mix. Applying for a travel authorization is in Ready; carrying the printed authorization is
in Pack. The passport-validity check is in Ready; the passport itself is in Pack.

A booking appears in two places by design: in Bookings as the record, and in Itinerary on the day it happens. It is
the same object, so a change shows up in both.

## Navigation

```
Trips (home)
├── Trip ───────────────── bottom tabs: Itinerary · Bookings · [ + ] · Ready · Pack
│   ├── Itinerary          route ribbon (stops and nights), days grouped by stop, Today when traveling
│   │   └── Day            weather, timeline of the day's bookings and plans, what to wear
│   │       └── Booking    (same detail screen as from Bookings)
│   ├── Bookings           inbox of proposals to review, then all bookings by kind
│   │   ├── Inbox item     what was found in an email or document, with the quotes it came from
│   │   └── Booking        flight as a boarding pass; stays, transfers, activities, dining as cards
│   ├── [ + ] Add          forward address, scan, upload, paste, enter by hand
│   ├── Ready              readiness, traveler switcher, due-soon list, requirements by country
│   │   └── Requirement    what it is, who it applies to, the deadline, the official source, last checked
│   ├── Pack               Outfits | List
│   │   ├── Outfits        per day and traveler, built from the wardrobe
│   │   └── List           clothes, essentials, documents per traveler, with packed state shared
│   └── Trip settings      (tap the trip name) travelers and sharing, dates, luggage, local info
└── Profile                passports (nationality and expiry), home airport, wardrobe, my standing
                           essentials, forwarding address, notifications
```

### Why these choices

- **Trip first, not feature first.** Everything except Profile lives inside a trip, because people think "our
  honeymoon", not "my bookings across trips". When a trip is under way or starts within a week, the app opens
  straight into it.
- **Add is always one tap away.** Getting bookings in is the job that makes everything else work, so it sits in
  the middle of the tab bar on every trip screen.
- **Itinerary becomes Today.** During the trip the same tab opens on today: what's next, the confirmation number
  you'll be asked for, the weather and the outfit. No separate mode to switch into.
- **Ready is per traveler.** Requirements depend on the passport. A couple with different passports sees each
  person's list, plus what applies to both.
- **Wardrobe belongs to the person.** Clothes carry over between trips, so the wardrobe lives in Profile and Pack
  draws from it.

## Screens in the first release

| Screen     | Main job                               | Key content                                                           |
| ---------- | -------------------------------------- | --------------------------------------------------------------------- |
| Trips      | Get into the right trip                | Next trip with countdown and readiness, past trips, new trip          |
| Itinerary  | See the shape of the trip              | Route ribbon, days grouped by stop, weather and key times per day     |
| Day        | Know everything about one day          | Weather, timeline in local time, dress codes, outfit                  |
| Bookings   | Find any reservation fast, offline     | Inbox count, filter by kind, confirmation numbers to copy             |
| Booking    | Use it at the counter                  | Flight as a boarding pass; documents; contacts; source email          |
| Add        | Get a booking in from anywhere         | Forward address with copy, scan, upload, paste, manual                |
| Inbox item | Trust what was extracted               | Fields with the quote they came from, flags, confirm, edit or discard |
| Ready      | Not miss anything that blocks the trip | Readiness, due-soon list sorted by deadline, requirements by country  |
| Pack       | Leave with the right things            | Outfits per day; one list with progress per traveler                  |
| Profile    | Set up once, reuse every trip          | Passports, wardrobe, standing essentials, forwarding address          |
