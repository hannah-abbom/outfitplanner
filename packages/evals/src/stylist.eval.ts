import Anthropic from "@anthropic-ai/sdk";
import {
  daysToPlan,
  extractJson,
  gradeStylist,
  guessFromName,
  readStylistAnswer,
  stylistPrompt,
  TRENDS,
  type ClosetItem,
  type StylistDay,
  type StylistRequest,
} from "@trip/core";

/*
 * Stylist eval (OUT-05). Runs the app's stylist prompt on a made-up trip through the Claude API and grades each
 * answer with the same checks a person would make. The app itself asks Claude through claude.ai; this checks the
 * prompt, so run it whenever the prompt changes: `pnpm --filter @trip/evals evals`. Skips without a key.
 * Everything here is fictional.
 */

const RUNS = Number(process.env.STYLIST_EVAL_RUNS ?? 3);

function piece(id: string, name: string, note?: string, extra: Partial<ClosetItem> = {}): ClosetItem {
  return {
    id,
    name,
    ...guessFromName(name),
    image: null,
    source: "manual",
    link: null,
    brand: null,
    note: note ?? null,
    status: "owned",
    addedAt: "2027-01-01T00:00:00Z",
    ...extra,
  };
}

const closet: ClosetItem[] = [
  piece("c1", "Olive utility jacket", "Packed for the lodge"),
  piece("c2", "Khaki linen trousers", "Packed for the lodge"),
  piece("c3", "Sand linen shirt"),
  piece("c4", "White tee"),
  piece("c5", "Denim shorts"),
  piece("c6", "Cream cashmere sweater"),
  piece("c7", "Black silk slip dress"),
  piece("c8", "Terracotta midi dress"),
  piece("c9", "Striped linen set"),
  piece("c10", "Cobalt one-piece swimsuit", "Packed for the island"),
  piece("c11", "Cobalt pareo", "Packed for the island; goes with the cobalt swimsuit"),
  piece("c12", "Yellow bikini", "Packed for the island"),
  piece("c13", "Crochet cover-up", "Packed for the island"),
  piece("c14", "Leather sandals"),
  piece("c15", "White sneakers"),
  piece("c16", "Rain shell", undefined, { status: "to-get" }),
];
const homes = { c1: "Lodge", c2: "Lodge", c10: "Island", c11: "Island", c12: "Island", c13: "Island" };

const w = (date: string, hi: number, lo: number, rainChance: number, code: number) => ({
  date,
  place: "x",
  hi,
  lo,
  rainChance,
  code,
  source: "forecast" as const,
});

const days: StylistDay[] = [
  {
    date: "2027-03-01",
    label: "Mon 1 Mar",
    place: "Flying home to the savanna",
    weather: w("2027-03-01", 24, 14, 10, 1),
    plans: ["Travel day"],
    travel: true,
  },
  {
    date: "2027-03-02",
    label: "Tue 2 Mar",
    place: "Thorn Tree Lodge",
    weather: w("2027-03-02", 30, 12, 10, 0),
    plans: ["Game drive"],
    travel: false,
  },
  {
    date: "2027-03-03",
    label: "Wed 3 Mar",
    place: "Thorn Tree Lodge",
    weather: w("2027-03-03", 31, 13, 20, 2),
    plans: ["Game drive", "Dinner out"],
    travel: false,
  },
  {
    date: "2027-03-04",
    label: "Thu 4 Mar",
    place: "Coral Island Hotel",
    weather: w("2027-03-04", 29, 23, 50, 61),
    plans: ["Travel day", "Beach"],
    travel: true,
  },
  {
    date: "2027-03-05",
    label: "Fri 5 Mar",
    place: "Coral Island Hotel",
    weather: w("2027-03-05", 29, 23, 60, 61),
    plans: ["Beach", "Dinner out"],
    travel: false,
  },
  {
    date: "2027-03-06",
    label: "Sat 6 Mar",
    place: "Coral Island Hotel",
    weather: w("2027-03-06", 30, 24, 30, 2),
    plans: ["Boat trip"],
    travel: false,
  },
];

const req: StylistRequest = {
  tripName: "Savanna and sea",
  days,
  closet,
  looks: {},
  trends: TRENDS,
  mode: "all",
  wish: "One dressy dinner at the lodge.",
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.log("Stylist eval skipped: set ANTHROPIC_API_KEY to run it.");
    return;
  }
  const client = new Anthropic();
  const prompt = stylistPrompt(req);
  const planned = daysToPlan(req).map((d) => d.date);
  const tally = new Map<string, number>();
  for (let run = 1; run <= RUNS; run++) {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "medium" },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") {
      console.log(`Run ${run}: refused`);
      continue;
    }
    const text = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    const answer = readStylistAnswer(extractJson(text), closet, planned);
    if (!answer) {
      console.log(`Run ${run}: unreadable answer`);
      continue;
    }
    const grades = gradeStylist(req, answer, homes);
    console.log(`Run ${run}: ${grades.filter((g) => g.pass).length}/${grades.length}`);
    for (const g of grades) {
      if (g.pass) tally.set(g.check, (tally.get(g.check) ?? 0) + 1);
      else console.log(`  ✗ ${g.check}: ${g.detail}`);
    }
  }
  console.log("\nPassed per check:");
  for (const [check, n] of tally) console.log(`  ${n}/${RUNS}  ${check}`);
}

main().catch((e: unknown) => {
  if (e instanceof Anthropic.RateLimitError) console.error("Rate limited: try again later.");
  else if (e instanceof Anthropic.AuthenticationError) console.error("The API key was refused.");
  else if (e instanceof Anthropic.APIError) console.error(`API error ${e.status}: ${e.message}`);
  else throw e;
  process.exitCode = 1;
});
