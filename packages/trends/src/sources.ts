import type { TrendSite } from "@trip/core";

/*
 * The fixed list of sites the weekly job searches. We never fetch these pages ourselves: Claude's web search
 * returns what its search index holds, which leaves each publisher's own crawler rules in charge of what can be
 * found. We keep a link, a title, a date and a description in our own words, nothing more. Adding a site is a
 * product decision: check its terms first and note it in docs/engineering/trends.md.
 */

export const SITES: TrendSite[] = [
  { publisher: "Vogue", domain: "vogue.com", kind: "editorial" },
  { publisher: "Harper's Bazaar", domain: "harpersbazaar.com", kind: "editorial" },
  { publisher: "Elle", domain: "elle.com", kind: "editorial" },
  { publisher: "Who What Wear", domain: "whowhatwear.com", kind: "editorial" },
  { publisher: "Marie Claire", domain: "marieclaire.com", kind: "editorial" },
  { publisher: "Marie Claire UK", domain: "marieclaire.co.uk", kind: "editorial" },
  { publisher: "Glamour South Africa", domain: "glamour.co.za", kind: "editorial" },
  { publisher: "Essence", domain: "essence.com", kind: "editorial" },
  { publisher: "WWD", domain: "wwd.com", kind: "runway" },
  { publisher: "FashionUnited", domain: "fashionunited.com", kind: "runway" },
  { publisher: "Net-a-Porter", domain: "net-a-porter.com", kind: "retailer" },
  { publisher: "Style Arcade", domain: "stylearcade.com", kind: "retailer" },
  { publisher: "Trendalytics", domain: "trendalytics.co", kind: "provider" },
  { publisher: "Heuritech", domain: "heuritech.com", kind: "provider" },
  { publisher: "Pinterest Newsroom", domain: "newsroom.pinterest.com", kind: "search-data" },
];

/** Sites are searched a group at a time, so one busy kind of source can't crowd out the others. */
export const GROUPS: { name: string; kinds: TrendSite["kind"][] }[] = [
  { name: "magazines", kinds: ["editorial"] },
  { name: "runway and trade", kinds: ["runway"] },
  { name: "retailers and trend data", kinds: ["retailer", "provider", "search-data"] },
];

export const DEFAULT_FOCUS =
  "womenswear people will pack for trips in the next three months: warm-weather and resort dressing, swim, travel days and dinners out, plus the season's main colours, shapes, fabrics and prints";
