import {
  NO_ATTRIBUTES,
  type KeyPiece,
  type Trend,
  type TrendAttributes,
  type TrendBrief,
} from "./trend-model";

/*
 * What's in this season, for the stylist to draw on (OUT-05). Kept as dated data with sources so it can be
 * refreshed, and so a suggestion that leans on a trend can say which one. Trends season the looks; they never
 * outrank the weather, the plans or what the person owns.
 *
 * This brief is made by hand. The weekly job in packages/trends drafts the same shape from tracked sources, and
 * takes over once a person has approved its drafts for a few weeks (docs/engineering/trends.md). Each trend also
 * says what it looks like in the shared vocabulary, so `matchCloset` can find a person's on-trend pieces.
 */

export type { Trend, TrendBrief };

const look = (a: Partial<TrendAttributes>): TrendAttributes => ({
  ...NO_ATTRIBUTES,
  seasons: ["resort 2027", "ss27"],
  regions: ["global"],
  ...a,
});

const NEUTRALS = ["khaki", "olive", "sand", "beige", "camel"];

const key = (
  name: string,
  categories: KeyPiece["categories"],
  words: string[] = [],
  colors: string[] = [],
): KeyPiece => ({ name, categories, words, colors });

const SS27_PARIS = {
  title: "Who What Wear: Paris Fashion Week trends, spring/summer 2027",
  url: "https://www.whowhatwear.com/fashion/runway/paris-fashion-week-trends-spring-summer-2027",
};
const SS27_MONTH = {
  title: "Essence: 7 runway trends from spring/summer 2027 fashion month",
  url: "https://www.essence.com/fashion/7-trends-from-spring-summer-2027-fashion-month/",
};
const RESORT_STOCK = {
  title: "Gifts & Decorative Accessories: cobalt and crochet, what to stock for the 2027 resort season",
  url: "https://www.giftsanddec.com/trending-gifts/product-trends/cobalt-and-crochet-what-retailers-should-stock-for-the-2027-resort-season/",
};
const RESORT_LOOKS = {
  title: "Club Moda: resort wear trends 2027",
  url: "https://clubmodausa.com/blogs/club-moda-blog-resort-beach-cruise-wear-trends/resort-wear-trends-2027",
};
const RESORT_BUYERS = {
  title: "La Moda: resort wear trends 2027, what buyers should stock",
  url: "https://lamodaclothings.com/blogs/news/resort-wear-trends-2027-what-buyers-should-stock-now",
};
const SWIM_WEEK = {
  title: "Resident: the swim 2027 trends that defined Miami Swim Week",
  url: "https://resident.com/fashion-and-style/2026/07/07/backstage-at-paraiso-the-swim-2027-trends-that-defined-miami-swim-week-2026",
};
const VACATION_IDEAS = {
  title: "Sew Mama Sew: vacation outfit ideas 2026",
  url: "https://www.sewmamasew.com/35-vacation-outfit-ideas-2026/",
};
const WWD_CONTEMPORARY = {
  title: "WWD: pastels to plumage, key contemporary trends for resort 2027",
  url: "https://wwd.com/fashion-news/fashion-trends/contemporary-resort-2027-trends-1239007104/",
};

export const TRENDS: TrendBrief = {
  season:
    "Southern-hemisphere high summer 2026-27: the resort 2027 collections and the spring/summer 2027 runways",
  checkedOn: "2026-11-13",
  caveat:
    "Gathered from web-search summaries of fashion press, trade and retailer coverage; the articles weren't read in full, and Pinterest's 2027 predictions aren't out until December.",
  trends: [
    {
      id: "safari-utility",
      name: "Refined safari utility",
      wear: "Khaki, sand and olive anchored by crisp white; a utility jacket, a khaki shirt and cargo or Bermuda shapes, polished with a belt or gold jewellery rather than head-to-toe safari.",
      sources: [
        {
          title: "Marie Claire UK: safari chic, the spring/summer 2026 trend to adopt early",
          url: "https://www.marieclaire.co.uk/fashion/safari-fashion-trend",
        },
        {
          title: "Who What Wear: runway trends to wear now, spring 2026",
          url: "https://www.whowhatwear.com/fashion/trends/runway-trends-to-wear-now-spring-2026",
        },
        {
          title: "Luxury Endless: safari style 2026",
          url: "https://www.luxuryendless.com/fashion/safari-style-2026-the-citys-most-effortless-summer-uniform",
        },
      ],
      attributes: look({
        colors: ["khaki", "olive", "sand"],
        silhouettes: ["utility", "cargo", "bermuda", "safari"],
        categories: ["layer", "top", "bottom", "dress", "set"],
        occasions: ["safari", "city", "travel", "everyday"],
        seasons: ["ss26", "ss27"],
      }),
      keyPieces: [
        key("utility jacket", ["layer"], ["utility", "field", "safari", "shacket"], NEUTRALS),
        key("khaki or olive shirt", ["top"], ["shirt"], NEUTRALS),
        key(
          "cargo trousers or tailored shorts",
          ["bottom"],
          ["cargo", "bermuda", "trousers", "shorts"],
          NEUTRALS,
        ),
      ],
    },
    {
      id: "linen-crochet-gauze",
      name: "Linen, crochet and gauze",
      wear: "Airy natural textures for an easy but put-together summer look: a linen shirt or set by day, crochet or gauze over swim.",
      sources: [RESORT_STOCK, VACATION_IDEAS],
      attributes: look({
        fabrics: ["linen", "crochet", "gauze"],
        occasions: ["beach", "city", "everyday"],
        climates: ["hot", "warm"],
      }),
      keyPieces: [
        key("linen shirt or set", ["top", "set"], ["linen"]),
        key("crochet piece", ["dress", "top", "accessory"], ["crochet"]),
      ],
    },
    {
      id: "kaftans-beach-to-bar",
      name: "Kaftans and beach-to-bar cover-ups",
      wear: "A kaftan, slip or sheer layer over swim that carries on to a drink or dinner, chosen to go with the swimsuit under it.",
      sources: [RESORT_BUYERS, SWIM_WEEK],
      attributes: look({
        silhouettes: ["kaftan", "cover up", "pareo", "sarong", "slip"],
        fabrics: ["sheer", "mesh"],
        categories: ["dress", "accessory"],
        occasions: ["beach", "dinner"],
        climates: ["hot", "warm"],
      }),
      keyPieces: [
        key("swimsuit", ["swim"]),
        key("kaftan or cover-up", ["dress", "accessory"], ["kaftan", "cover up", "pareo", "sarong"]),
      ],
    },
    {
      id: "primary-brights",
      name: "Sunny yellow, cobalt and true red",
      wear: "One clear bright per look, in canary or butter yellow, cobalt or ocean blue, red or orange, against white or a neutral.",
      sources: [SS27_PARIS, SS27_MONTH, RESORT_STOCK],
      attributes: look({
        colors: ["yellow", "blue", "red", "orange"],
        occasions: ["beach", "dinner", "city", "everyday", "party"],
      }),
    },
    {
      id: "olive-and-soft-greens",
      name: "Olive as the neutral, with sage and pistachio",
      wear: "Olive in place of beige or black as the base of a look; sage or pistachio as the soft colour.",
      sources: [
        WWD_CONTEMPORARY,
        RESORT_LOOKS,
        {
          title: "FashionUnited: spring/summer 2027 fashion trends",
          url: "https://fashionunited.com/specials/spring-summer-2027-fashion-trends",
        },
      ],
      attributes: look({ colors: ["olive", "sage", "green"] }),
    },
    {
      id: "white-and-cream",
      name: "Head-to-toe white, ivory and cream",
      wear: "White, ivory and cream worn together, top to toe, with texture doing the work.",
      sources: [
        {
          title: "Net-a-Porter: the spring/summer 2027 trend report",
          url: "https://www.net-a-porter.com/en-fr/porter/article-13683c4632ee6dac/fashion/art-of-style/ss27-fashion-trends",
        },
        {
          title: "Forbes: Paris Fashion Week spring/summer 2027, key trends to know",
          url: "https://www.forbes.com/sites/laiafarrangraves/2026/10/08/paris-fashion-week-springsummer-2027-key-trends-to-know/",
        },
      ],
      attributes: look({
        colors: ["white", "ivory", "cream"],
        occasions: ["city", "dinner", "beach", "party"],
        seasons: ["ss27"],
      }),
    },
    {
      id: "skirts-volume-ruffles",
      name: "Skirts, airy volume and sculptural ruffles",
      wear: "The skirt as the centre of the look; light, billowing dresses and skirts, a sheer layer, or one bold ruffle.",
      sources: [
        SS27_PARIS,
        {
          title: "Who What Wear: Milan Fashion Week trends, spring/summer 2027",
          url: "https://www.whowhatwear.com/fashion/runway/milan-fashion-week-spring-summer-2027-trends",
        },
        {
          title: "Marie Claire: the resort 2027 trends for winter 2026",
          url: "https://www.marieclaire.com/fashion/winter-fashion/resort-2027-winter-fashion-trends/",
        },
      ],
      attributes: look({
        silhouettes: ["skirt", "airy", "ruffle", "maxi", "midi"],
        fabrics: ["sheer"],
        categories: ["bottom", "dress", "top"],
        occasions: ["dinner", "city", "party", "everyday"],
      }),
      keyPieces: [key("skirt", ["bottom"], ["skirt"])],
    },
    {
      id: "dots-stripes-florals-fringe",
      name: "Polka dots, stripes, big florals and fringe",
      wear: "One confident print per look, dots, stripes or a large floral, or movement from fringe on a plain piece.",
      sources: [
        {
          title: "Style Arcade: what retailers are forecasting for resort 27 at Australian Fashion Week",
          url: "https://www.stylearcade.com/blog/australian-fashion-week-what-retailers-are-forecasting-for-resort-27",
        },
        WWD_CONTEMPORARY,
      ],
      attributes: look({
        patterns: ["polka dot", "stripe", "floral"],
        silhouettes: ["fringe"],
        fabrics: ["lace"],
      }),
    },
    {
      id: "matching-sets",
      name: "Matching sets that travel",
      wear: "Two-piece sets worn together or split, so a few pieces make many looks; a set in a luxe fabric for dinner.",
      sources: [RESORT_LOOKS, RESORT_BUYERS, VACATION_IDEAS],
      attributes: look({ silhouettes: ["set"], categories: ["set"] }),
      keyPieces: [key("matching set", ["set"])],
    },
    {
      id: "swim-shine-and-animal",
      name: "Swim with shine, animal print and gold hardware",
      wear: "Swimwear with a metallic finish, a zebra or other animal print, or sculptural gold hardware; midnight blue as the quiet option.",
      sources: [
        SWIM_WEEK,
        {
          title: "Fashion Times: Miami Swim Week swimwear trends",
          url: "https://www.fashiontimes.com/miami-swim-week-swimwear-trends-8-it-girl-looks-everyone-talking-about-14422",
        },
      ],
      attributes: look({
        fabrics: ["metallic"],
        patterns: ["animal"],
        colors: ["gold", "navy"],
        categories: ["swim"],
        occasions: ["beach"],
        climates: ["hot", "warm"],
        seasons: ["swim 2027"],
      }),
    },
    {
      id: "sporty-meets-feminine",
      name: "Sporty pieces with feminine ones",
      wear: "A track jacket, sneakers or sporty shorts mixed with something soft and feminine; good for travel days.",
      sources: [
        {
          title: "WWD: resort 2027 trend, girly and sporty contemporary fashions",
          url: "https://wwd.com/fashion-news/fashion-trends/resort-2027-trend-sporty-feminine-fashion-accessories-1239149750/",
        },
      ],
      attributes: look({
        silhouettes: ["track", "sporty", "sneaker"],
        occasions: ["travel", "active", "everyday"],
        seasons: ["resort 2027"],
      }),
    },
  ],
};
