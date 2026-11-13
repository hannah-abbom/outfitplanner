import Anthropic from "@anthropic-ai/sdk";
import { gradeExtraction, mergeMentions, readMentions, renderPages, type Grade } from "@trip/core";
import { explain, hasKey, readTrends } from "./claude";
import { CASES } from "./fixtures";

/*
 * Trend-reading eval (OUT-05): `pnpm --filter @trip/trends evals`. Gives the reading prompt made-up pages and
 * grades what comes back the way a reviewer would: every trend found and none invented, sources and dates as
 * given, shades in their colour family, tracked trends recognised, nothing copied, planted instructions ignored.
 * Run it whenever the reading prompt, the schema or the model changes. Skips without a key.
 */

const RUNS = Number(process.env.TRENDS_EVAL_RUNS ?? 2);
const TODAY = "2026-11-13";

async function main() {
  if (!hasKey()) {
    console.log("Trends eval skipped: set ANTHROPIC_API_KEY to run it.");
    return;
  }
  const client = new Anthropic();
  const tally = new Map<string, number>();
  let total = 0;
  for (const c of CASES) {
    for (let run = 1; run <= RUNS; run++) {
      total += 1;
      const wire = await readTrends(client, { today: TODAY, material: renderPages(c.pages), known: c.known });
      const read = wire && readMentions(wire, { seenOn: TODAY });
      if (!read) {
        console.log(`${c.name}, run ${run}: refused or unreadable`);
        continue;
      }
      const grades: Grade[] = gradeExtraction(c, read.mentions);
      if (c.name.startsWith("Two outlets")) {
        // End to end: the two yellows must come out of merging as one trend with two publishers behind it.
        const yellow = mergeMentions([], read.mentions).records.filter((r) =>
          r.attributes.colors.includes("yellow"),
        );
        const publishers = yellow[0]?.weeks[0]?.publishers.length ?? 0;
        grades.push({
          check: "The same trend under two names merges into one",
          pass: yellow.length === 1 && publishers === 2,
          detail: `${yellow.length} yellow trends, ${publishers} publishers`,
        });
      }
      console.log(`${c.name}, run ${run}: ${grades.filter((g) => g.pass).length}/${grades.length}`);
      for (const g of grades) {
        if (g.pass) tally.set(g.check, (tally.get(g.check) ?? 0) + 1);
        else console.log(`  ✗ ${g.check}: ${g.detail}`);
      }
      for (const d of read.dropped) console.log(`  dropped ${d.name}: ${d.reason}`);
    }
  }
  console.log(`\nPassed per check, of ${total} runs (the merge check runs on one case):`);
  for (const [check, n] of tally) console.log(`  ${n}  ${check}`);
}

main().catch(explain);
