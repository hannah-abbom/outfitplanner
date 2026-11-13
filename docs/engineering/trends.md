# Trends engine

> Status: first working version, November 2026. The core logic is built and tested. The weekly job and its eval are
> written and type-checked against the Anthropic SDK but have not yet run against the live API, because the session
> that built them had no API key. Prices and access rules below were researched on 13 November 2026.

## In short

The stylist (OUT-05) suggests looks from a person's own closet and is told what's in fashion through a short
**trends brief**. Until now that brief was researched by hand. The trends engine replaces the hand work with a
weekly routine:

1. Claude searches a fixed list of fashion sites and writes down what they report.
2. Each report becomes a structured **mention**: a trend's name, what it looks like, where it was seen and when.
3. Code merges mentions that mean the same thing ("butter yellow" and "pale yellow" are one trend), counts how many
   publishers mentioned each trend each week, and reads **momentum** off the counts: new, rising, peaking, steady
   or fading.
4. Code drafts a brief from the trends with momentum. **A person approves it** before the stylist ever sees it, and
   every brief is a numbered version.
5. Separately, code matches the approved trends against a person's closet: which of their pieces are on trend for
   this trip, and the **one missing piece** that would complete a trend they nearly have.

The principle is the one the rest of the app follows: _AI drafts, rules decide._ Claude reads and describes; plain,
tested code merges, counts, ranks and matches; a person signs off.

## What "a machine-learning model behind it" should mean for us

There are three different things people mean by this, and they suit three different stages.

| Stage          | What it is                                                                                       | Do we train anything?                   | When                                           |
| -------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------- | ---------------------------------------------- |
| **Now**        | A large language model (Claude) reads fashion coverage and turns it into structured data         | No. We rent a model that already exists | Built in this version                          |
| **Soon**       | Embeddings: a model turns each trend into a list of numbers so similar trends sit close together | No. Rented, a few cents a month         | When rule-based merging starts making mistakes |
| **Much later** | Our own model, trained on what our users keep, skip and wear, that ranks looks for each person   | Yes                                     | When thousands of people have used the stylist |

So today "ML behind it" honestly means: a very capable general model does the reading, and everything that has to
be right every time is ordinary code. That is the correct design at our size, not a compromise. A custom model
trained on two people's choices would learn nothing; the same model trained on tens of thousands of choices could
learn real taste. What we can do now, at no cost, is **log the right things from day one** so that later model has
data to learn from (see [Personalisation](#personalisation-and-what-to-log-from-day-one)).

What the paid trend firms (Heuritech, WGSN, EDITED) call ML is different again: computer vision over millions of
social-media photos and retail listings, to forecast demand for brands deciding what to manufacture. We don't need
a demand forecast. We need to know what's in fashion this month well enough to season an outfit suggestion.

### What's ML and what isn't

| Step                                       | Who does it                    | ML? |
| ------------------------------------------ | ------------------------------ | --- |
| Finding and reading this week's coverage   | Claude with web search         | Yes |
| Turning notes into structured mentions     | Claude, into a fixed schema    | Yes |
| Checking every link, date and field        | Code (`readMentions`)          | No  |
| Folding shades and synonyms into one word  | Code, from a small word list   | No  |
| Deciding two mentions are the same trend   | Code, with Claude's hint       | No  |
| Counting mentions and working out momentum | Code                           | No  |
| Choosing what goes in the brief            | Code drafts, a person approves | No  |
| Matching trends to a closet                | Code                           | No  |
| Suggesting the looks themselves            | Claude (the existing stylist)  | Yes |

## Sources and their terms

The rule: **official APIs and licensed data first; never scrape.** We don't fetch publishers' pages ourselves. The
job uses Claude's web search tool restricted to a fixed list of sites (`packages/trends/src/sources.ts`). What comes
back is whatever the search index holds, so each publisher's own rules about crawlers decide what can be found. If a
site blocks it, that site simply returns nothing and the job says so. We store a link, a title, a date and a
description **in our own words**: never article text, never images.

| Source                                     | What it gives us                                         | How we'd get it                                | Cost                                                                              | Terms to respect                                                                                                                                                                                                                             | Status              |
| ------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| Fashion magazines and trade press          | What editors and buyers say is in; runway reports        | Claude web search, limited to the listed sites | About $1 to $3 a week in API use (below)                                          | Link and paraphrase only. Several large publishers license or restrict AI use of their content; we don't copy text or republish                                                                                                              | **In use**          |
| Retailers' own editorial and journals      | What shops say is selling                                | Same search, same rules                        | Included above                                                                    | Same. Product listings and "new in" pages are not crawled                                                                                                                                                                                    | **In use**          |
| Pinterest Predicts (yearly report)         | Pinterest's own forecast from its search data            | Public report, read through search             | Free                                                                              | Cite it. The 2027 edition is expected in early December 2026; it was not out when the hand brief was refreshed                                                                                                                               | **In use**, yearly  |
| Pinterest Trends API                       | Top and growing search terms by region and interest      | Official API; needs a Pinterest developer app  | Free                                                                              | Apps start on trial access and need a review (with a video demo) for standard access. **Pinterest's developer guidelines don't allow storing API data** other than your own campaign analytics, and the endpoint only serves today's figures | Wait: see below     |
| Google Trends API (alpha)                  | Search interest over time, comparable across requests    | Official API; apply through Google's form      | No public price or quota                                                          | Invitation-only alpha, opened to a limited number of testers on a rolling basis                                                                                                                                                              | Apply, don't depend |
| Heuritech                                  | Forecasts from image recognition on social media         | Sales contact                                  | Not published; "tailored" pricing                                                 | Licensed data; contract decides what we may show                                                                                                                                                                                             | Not now             |
| WGSN                                       | The industry's standard forecasts, two years ahead       | Sales contact; annual subscription for teams   | Not published. Unverified third-party figures: roughly $14,000 to $25,000+ a year | Licensed; redistribution to consumers would need to be negotiated                                                                                                                                                                            | Not now             |
| EDITED                                     | Retail analytics: what's stocked, priced and selling out | Sales contact                                  | Enterprise. One public listing: $300,000 for 12 months                            | Licensed                                                                                                                                                                                                                                     | Not now             |
| Unofficial scrapers of Google or Pinterest | The same numbers without permission                      | Third-party scraping services                  | Cheap                                                                             | Break the platforms' terms                                                                                                                                                                                                                   | **Never**           |

Notes on the two official trend APIs:

- **Pinterest Trends** is the natural second signal for us, because Pinterest is where people plan outfits. The
  obstacle isn't money, it's the storage rule: momentum needs week-over-week history, and the guidelines say to call
  the API each time rather than keep the data. Two honest ways forward: ask Pinterest for written consent to keep
  weekly snapshots, or use the API only as a live cross-check when a person reviews a draft ("is this term actually
  growing on Pinterest right now?") without storing anything. We already plan a Pinterest developer app for WRD-06
  (boards), so the application can cover both.
- **Google Trends** would give us the cleanest momentum numbers, but access is by invitation and nothing about price
  or limits is public. Worth applying; not worth waiting for.

The paid providers are built and priced for brands and retailers. They'd be worth a conversation only if trends
became a headline feature with revenue behind it, and even then a consumer app showing their data needs a licence
that says so.

**A gap to close:** the session that wrote this could not open `developers.pinterest.com`, `developers.google.com`
or the publishers' terms pages (its network allows only a few hosts), so the access rules above come from search
summaries of those pages rather than a full read. Read the current Pinterest developer guidelines and the Google
alpha form before applying, and check each listed site's terms before the job runs on a schedule.

## The data model

Three shapes, from raw to finished. All are Zod schemas in `packages/core/src/trend-model.ts`.

**Mention**: one source saying one thing this week.

- name, a description and how to wear it, each in our own words
- attributes: colours, silhouettes, fabrics, patterns, kinds of piece, occasions, climates, seasons, regions
- key pieces: up to five pieces that make the trend recognisable (the field jacket in a safari look)
- source: URL, title, publisher, kind (editorial, runway, retailer, search data, provider), the date the page was
  published, the date we read it
- an optional hint from the reader: "this is trend X that you already track"

**Record**: one trend, built from every mention that means the same thing.

- an id, the name, other names it has gone by, description, how to wear it, attributes and key pieces
- first seen and last seen
- every source
- a count per week: which publishers mentioned it (each publisher counts once a week)

**Brief**: the short list the stylist reads.

- season, the date it was checked, a caveat, and up to ten trends, each with its sources, attributes, key pieces
  and momentum
- wrapped in a **version**: a number, a status (draft, approved, rejected), who reviewed it, when, and a note

Colours are stored as families from the closet's own palette ("yellow"), with the shade ("butter yellow") kept in
the name and description. That one decision is what lets trends be compared with each other and with a person's
clothes.

## The weekly pipeline

`pnpm --filter @trip/trends weekly` (add `--dry-run` to see what it would do without writing anything).

1. **Search.** For each group of sites (magazines; runway and trade; retailers and trend data), Claude searches only
   those sites for trend coverage from the last four weeks and writes a few sentences of notes per page, in its own
   words. This call can search and nothing else.
2. **Read.** A second call turns the notes into mentions in a fixed schema. It is given the trends we already track
   so it can say "this is that one". This call has no tools at all.
3. **Check.** Code keeps a mention only if its link is https and on one of our listed sites, its date is real and
   not in the future, and it has a name, a description and how to wear it. Links that weren't among the search
   results are kept but flagged for the reviewer.
4. **Merge.** Code folds each mention into the trend it matches, or starts a new trend.
5. **Score.** Code works out each trend's momentum.
6. **Draft.** Code writes a draft brief: trends with at least two different publishers behind them that aren't
   fading, most momentum first.
7. **Review.** A person reads the draft, opens the links, and runs
   `pnpm --filter @trip/trends review approve <version> --by "<name>"` (or `reject`, with `--note`). Only an approved
   version counts as the current brief.

Everything is written to `data/trends/` as JSON: the records, one file per run (every mention, every merge decision
and its score, everything dropped and why), and one file per brief version. For now that makes each week a diff a
person can read, with git as the history. It moves into the database with the rest of the app's data.

**Web pages are untrusted.** A page might say anything, including "ignore your instructions". Three things keep
that harmless: the call that reads the web can only search; the call that produces data has no tools; and what it
produces is a draft a person reviews. The eval includes a page with a planted instruction to check this holds.

### Merging: why rules first, embeddings later

Two mentions are the same trend when they're alike enough. "Alike" is measured two ways and the stronger wins: how
much their names share once shades and synonyms are folded together ("butter" and "pale yellow" both become
"yellow"; "ruffles", "ruffled" and "frills" become "ruffle"), and how much their look shares (colours, shapes,
fabrics, patterns). Claude's "this is trend X" hint is believed only when the two are at least plausibly alike, so
a wrong hint can't glue unrelated trends together.

We chose this over embeddings for now because:

- At our volume (tens of mentions a week, a few hundred trends in total) it is accurate enough, and every merge can
  be explained: the run log shows the score and the reviewer sees exactly why two things merged.
- It needs no extra vendor. Anthropic doesn't offer an embeddings model; the usual choice is Voyage AI, which means
  another account and key.
- It's testable offline, like the rest of core.

Its weakness is vocabulary it hasn't met: two names for one idea with no words in common ("boho" and "seventies
revival"). When the run logs start showing those as separate trends, switch on embeddings: `mergeMentions` already
accepts a different similarity measure, so it is a one-line change in the job, and the cost is negligible (about
$0.06 per million tokens by third-party listings; our whole history is a few thousand tokens). Until then the
reviewer catches them.

### Momentum

For each trend we count, per week, how many **different publishers** mentioned it. Counting publishers rather than
articles stops one outlet writing five pieces from looking like a movement. Momentum compares the last four weeks
with the four before:

| State   | Meaning                                                                     |
| ------- | --------------------------------------------------------------------------- |
| new     | First seen less than four weeks ago: nothing to compare yet                 |
| rising  | At least half as much again as before, and by at least two mentions         |
| peaking | About level, and at or near the most attention it has ever had              |
| steady  | About level, below its high                                                 |
| fading  | Half as much as before or less (including nobody mentioning it for a month) |

This needs eight weeks of history to say anything beyond "new", so the first two months of weekly runs are mostly
about building that history. Fashion also moves in seasons, not weeks: once there's a year of data, compare with the
same weeks last year so the yearly return of linen in spring doesn't read as a new trend.

## Matching trends to a closet

`matchCloset` and `pieceToComplete` in `packages/core/src/trend-match.ts`. No AI involved.

- **Does the trend suit this trip?** The trip's climates come from each day's forecast high, and its occasions from
  the day's plans (beach, game drive, dinner out). A trend that names climates or occasions is kept only if one of
  them is on the trip; a trend that names none suits any trip.
- **Is this piece on trend?** A piece counts when it is one of the trend's key pieces (right kind, a telling word in
  its name, a listed colour), or its name carries one of the trend's fabrics, patterns or shapes. Colour alone
  counts only for trends that are purely about colour, so a khaki T-shirt isn't "safari" just for being khaki. Every
  match comes with its reasons ("is the utility jacket", "in olive").
- **The one missing piece.** When a person already has part of a trend and exactly one of its key pieces is missing,
  that piece is the suggestion, with the pieces it would go with. If several trends are one piece away, the one the
  person has most of wins. A piece already marked "to get" isn't suggested again.

This uses what the closet knows today: a name, a kind, a main colour, warmth and tags. It gets better for free when
photo reading (WRD-05) records fabric and pattern on each piece. The missing piece is the hand-off to the shopping
feature (OUT-06): it gives that search something specific to look for.

Neither function is wired into the app yet; the app's screens are being redesigned separately.

## Personalisation, and what to log from day one

The eventual goal is suggestions that fit the person, learned from what they do. That needs data we can only
collect going forward, so the schema for it exists now (`LookEvent` in `trend-model.ts`) even though nothing is
trained.

Log one event each time something happens to a suggested look:

| Field                                                                      | Why it matters later                                                                                 |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| action: shown, kept, edited, skipped, worn, not worn                       | "Worn" is the strongest signal there is; "shown" is the baseline everything else is measured against |
| the pieces as suggested, and as finally worn                               | An edit shows exactly what was wrong with the suggestion                                             |
| the trends the suggestion leaned on, and the brief version                 | Which trends a person takes to, and which briefs worked                                              |
| the day's climate and occasions                                            | So a skip on a rainy day isn't read as a dislike                                                     |
| which prompt version and model made it                                     | So we can compare versions fairly                                                                    |
| random ids for the person and the trip, the date and slot, a UTC timestamp | To group events without knowing who anyone is                                                        |

Deliberately **not** logged: names, emails, photos, free text, locations, body measurements, and anything about a
person beyond what they did with a look. Before logging starts, the privacy note has to say so, and people need a
way to turn it off and to delete their history.

What the data unlocks, in order:

1. **From the first weeks, no training:** tell the stylist "you kept these, skipped those" as part of its prompt.
   Per-person, immediate, and it only needs a handful of events.
2. **Hundreds of users:** simple statistics: which trends get kept in which climates, which briefs led to worn
   looks. This improves the brief for everyone.
3. **Many thousands of users, with "worn" data:** a small ranking model of our own that orders candidate looks for
   a person. Only worth it when an offline test on held-back data shows it beats step 1.

## Running costs at our scale

Estimates from published prices, not measurements: the job hasn't run against the live API yet.

- Claude Opus 5.5 is $4 per million tokens in and $20 per million out. Web search is $10 per 1,000 searches, and the
  search results it reads are billed as input tokens.
- A weekly run is three search calls (at most six searches each) and three reading calls: at most 18 searches
  ($0.18) plus tokens, **roughly $1 to $3 a week, so $5 to $15 a month**.
- The eval is eight small calls: well under $1 a run.
- Merging, momentum and closet matching are code: free.

Trends are shared by every user, so this cost **doesn't grow with users**. What grows with users is the stylist
itself, which is tracked separately (PLT-07). After the first few real runs, replace these estimates with the
token counts the API reports. A cheaper model is worth trying only once the eval shows it holds quality.

## How we judge quality

- **Unit tests** (`packages/core`, run on every change): the vocabulary, similarity, merging, momentum, brief
  drafting and approval, closet matching, the checks on Claude's answer, and the eval's own graders.
- **The reading eval** (`pnpm --filter @trip/trends evals`): made-up pages with known answers, graded the way a
  reviewer would. Every trend found and none invented; sources and dates exactly as given; shades in their colour
  family; tracked trends recognised and new ones not forced; nothing copied from the page; a planted instruction
  ignored; and, end to end, the same trend under two names merging into one. Run it whenever the prompt, the schema
  or the model changes.
- **The human review** is itself a measurement. Track how often a draft is approved untouched, and what gets
  removed. If the reviewer keeps deleting the same kind of thing, that becomes a new eval case.
- **Later, from the logs:** do looks that lean on a trend get kept and worn more than looks that don't? That's the
  only measure that says trends are worth having at all.

What the eval doesn't cover yet: the search step (it needs the live web, so it can't have fixed answers) and whether
the trends are _right_ about fashion. For the second, compare the first approved briefs against Pinterest Predicts
when it comes out.

## Deliberately out of scope

- **Forecasting.** We report what's in fashion now, not what will sell next year.
- **Reading images.** No runway photos, no social media posts, no street-style analysis.
- **Social media.** No Instagram or TikTok data: no suitable official access, and personal content we don't want.
- **Scraping** of any kind, and unofficial trend APIs.
- **Menswear, children's wear, beauty.** The sources and vocabulary are womenswear for now.
- **Per-person trends.** Everyone gets the same brief; personal taste comes from feedback, later.
- **Shopping.** The missing piece is named, not searched for. That's OUT-06.
- **Our own trained model**, until the data justifies it.

## Open decisions

1. **Where the weekly job runs.** Suggested: a scheduled GitHub Action that runs the job and opens a pull request
   with the new data files, so reviewing the brief is reviewing a pull request. The alternative is the app's job
   runner (Inngest in the architecture), once the API service exists. Either needs the API key stored as a secret.
2. **Who reviews, and how often.** Weekly takes about ten minutes. If a week is missed, the last approved brief
   simply stays in use; a brief older than about six weeks should be shown as stale.
3. **When the automatic brief replaces the hand-made one.** Suggested: after the first approved version that the
   reviewer is happy with, keeping the hand-made brief in `trends.ts` as the fallback when nothing is approved.
4. **The site list.** The starting list is in `sources.ts`. Check each site's terms, and decide whether to add South
   African and other regional titles.
5. **Pinterest:** ask for consent to store weekly snapshots, or use it only as a live check during review.
6. **Google Trends alpha:** apply or not.
7. **Logging:** when to start, and the wording of the privacy note that goes with it.
8. **Regions and seasons.** One global brief, or one per hemisphere? A trip to a southern summer in November wants
   summer trends while northern magazines write about coats. The job's focus line handles this for now.

## Where things are

| What                                                            | Where                              |
| --------------------------------------------------------------- | ---------------------------------- |
| Schemas: mention, record, brief, version, look event            | `packages/core/src/trend-model.ts` |
| Vocabulary, similarity, merging, momentum, drafting, approval   | `packages/core/src/trend-merge.ts` |
| Closet matching and the missing piece                           | `packages/core/src/trend-match.ts` |
| The two prompts and the checks on Claude's answer               | `packages/core/src/trend-read.ts`  |
| Graders for the reading eval                                    | `packages/core/src/trend-grade.ts` |
| The hand-made brief the stylist reads today                     | `packages/core/src/trends.ts`      |
| The site list                                                   | `packages/trends/src/sources.ts`   |
| The Claude calls (Anthropic SDK, web search, structured output) | `packages/trends/src/claude.ts`    |
| The weekly job, the review command, the eval and its fixtures   | `packages/trends/src/`             |
| Records, run logs and brief versions (created by the first run) | `data/trends/`                     |

Environment: `ANTHROPIC_API_KEY` (the job and eval skip without it). Optional: `TRENDS_MODEL`, `TRENDS_FOCUS`,
`TRENDS_EVAL_RUNS`, `TRENDS_DATA_DIR`.

## Sources for this document

Checked 13 November 2026, through web search.

- Pinterest: [developer guidelines](https://policy.pinterest.com/en/developer-guidelines),
  [Trends API](https://developers.pinterest.com/docs/analytics-and-reports/trends/),
  [access tiers](https://developers.pinterest.com/docs/key-concepts/access-tiers/)
- Google: [Trends API alpha announcement](https://developers.google.com/search/blog/2025/07/trends-api),
  [early access](https://developers.google.com/search/apis/trends)
- [Heuritech pricing](https://heuritech.com/pricing/), [WGSN demo request](https://www.wgsn.com/en/demo),
  [EDITED on AWS Marketplace](https://aws.amazon.com/marketplace/pp/prodview-a26qg3h4ebtkq)
- Anthropic: [API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing)
- The trend sources behind the hand-made brief are listed with each trend in `packages/core/src/trends.ts`.
