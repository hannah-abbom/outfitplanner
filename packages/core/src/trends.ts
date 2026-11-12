/*
 * What's in this season, for the stylist to draw on (OUT-05). Kept as dated data with sources so it can be
 * refreshed, and so a suggestion that leans on a trend can say which one. Trends season the looks; they never
 * outrank the weather, the plans or what the person owns.
 */

export interface Trend {
  id: string;
  name: string;
  /** What it looks like, in a sentence the stylist can act on. */
  wear: string;
  sources: { title: string; url: string }[];
}

export interface TrendBrief {
  season: string;
  checkedOn: string;
  caveat: string;
  trends: Trend[];
}

export const TRENDS: TrendBrief = {
  season: "Southern-hemisphere summer, late 2026, with the spring/summer 2027 runways",
  checkedOn: "2026-11-12",
  caveat: "Gathered from fashion-press search results; runway coverage was still coming in.",
  trends: [
    {
      id: "safari-utility",
      name: "Refined safari utility",
      wear: "Khaki, sand and olive; field jackets, belted safari shirts and cargo or Bermuda shapes in linen, polished rather than rugged.",
      sources: [
        {
          title: "Marie Claire UK: the safari trend for spring/summer 2026",
          url: "https://www.marieclaire.co.uk/fashion/safari-fashion-trend",
        },
        {
          title: "Elite Traveler: what to wear on safari",
          url: "https://elitetraveler.com/style/what-to-wear-on-safari",
        },
      ],
    },
    {
      id: "linen-crochet-kaftans",
      name: "Linen, crochet and sheer kaftans",
      wear: "Linen button-downs that go from pool to café, crochet dresses and sheer kaftans over swim.",
      sources: [
        {
          title: "Who What Wear: vacation fashion trends 2026",
          url: "https://www.whowhatwear.com/fashion/vacation/vacation-fashion-trends-2026",
        },
        {
          title: "Who What Wear: 8 destinations, 16 trends for the 2026 vacation wardrobe",
          url: "https://www.whowhatwear.com/living/travel/summer-2026-fashion-travel-trends",
        },
      ],
    },
    {
      id: "slip-as-cover-up",
      name: "Nightgown dresses as cover-ups, beaded sandals",
      wear: "Slip- and nightgown-style dresses worn over swimwear, with beaded sandals or blue ballet flats.",
      sources: [
        {
          title: "Who What Wear: vacation fashion trends 2026",
          url: "https://www.whowhatwear.com/fashion/vacation/vacation-fashion-trends-2026",
        },
      ],
    },
    {
      id: "romance-at-the-waist",
      name: "Ruffles, peplum and a defined waist",
      wear: "Romantic ruffles and peplum shapes, with a belt or sash at the waist.",
      sources: [
        {
          title: "Coveteur: New York Fashion Week spring/summer 2027 trends",
          url: "https://coveteur.com/nyfw-trends-ss27",
        },
        {
          title: "Who What Wear: New York Fashion Week trends for 2027",
          url: "https://www.whowhatwear.com/fashion/runway/new-york-fashion-week-trends-spring-summer-2027",
        },
      ],
    },
    {
      id: "ss27-colour",
      name: "Butter yellow, cobalt, red and offbeat greens",
      wear: "Butter yellow, cobalt blue and a vivid red as accents; unexpected greens; head-to-toe white.",
      sources: [
        {
          title: "Coveteur: New York Fashion Week spring/summer 2027 trends",
          url: "https://coveteur.com/nyfw-trends-ss27",
        },
        {
          title: "Marie Claire: Copenhagen Fashion Week trends for spring 2027",
          url: "https://www.marieclaire.com/fashion/copenhagen-fashion-week-trends-spring-2027/",
        },
      ],
    },
    {
      id: "fringe-sheer",
      name: "Fringe, tassels and gauzy layers",
      wear: "Movement from fringe and tassels, and sheer, gauzy layers over something simple.",
      sources: [
        {
          title: "Marie Claire: Copenhagen Fashion Week trends for spring 2027",
          url: "https://www.marieclaire.com/fashion/copenhagen-fashion-week-trends-spring-2027/",
        },
        {
          title: "Vogue Scandinavia: Copenhagen runway trends, spring/summer 2027",
          url: "https://www.voguescandinavia.com/articles/copenhagen-fashion-week-runway-trends-spring-summer-2027",
        },
      ],
    },
    {
      id: "bold-print",
      name: "Bold dots, checks and stripes",
      wear: "Confident prints, dots and checks, worn as the one statement in a look.",
      sources: [
        {
          title: "Heuritech: Copenhagen Fashion Week spring/summer 2027",
          url: "https://heuritech.com/?p=31388",
        },
      ],
    },
    {
      id: "matching-sets",
      name: "Matching sets that travel",
      wear: "Two-piece sets and a tight colour palette, so a few pieces make many looks; a set or slip dress in a luxe fabric for dinner.",
      sources: [
        {
          title: "Marie Claire UK: what to pack for your honeymoon",
          url: "https://www.marieclaire.co.uk/fashion/honeymoon-packing-list-by-destination",
        },
        {
          title: "Who What Wear: honeymoon outfits for every destination",
          url: "https://whowhatwear.com/outfits-to-pack-for-your-honeymoon",
        },
      ],
    },
  ],
};
