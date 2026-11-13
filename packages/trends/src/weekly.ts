import Anthropic from "@anthropic-ai/sdk";
import {
  draftBrief,
  mergeMentions,
  momentum,
  readMentions,
  trendSearchPrompt,
  weekOf,
  type TrendMention,
} from "@trip/core";
import { explain, hasKey, MODEL, readTrends, searchSites } from "./claude";
import { DEFAULT_FOCUS, GROUPS, SITES } from "./sources";
import { loadBriefs, loadRecords, saveBrief, saveRecords, saveRun } from "./store";

/*
 * The weekly trends job (OUT-05): `pnpm --filter @trip/trends weekly`. It searches the fixed list of sites, turns
 * what it finds into trend mentions, merges them into the tracked trends and writes a draft brief for a person to
 * review. It never approves anything. `--dry-run` prints what it would do and writes nothing. Skips without a key.
 */

const dryRun = process.argv.includes("--dry-run");
const today = process.env.TRENDS_TODAY ?? new Date().toISOString().slice(0, 10);

async function main() {
  if (!hasKey()) {
    console.log("Trends weekly skipped: set ANTHROPIC_API_KEY to run it.");
    return;
  }
  const client = new Anthropic();
  const focus = process.env.TRENDS_FOCUS ?? DEFAULT_FOCUS;
  const records = loadRecords();
  const known = [...records]
    .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
    .slice(0, 60)
    .map((r) => ({ id: r.id, name: r.name, wear: r.wear }));

  const mentions: TrendMention[] = [];
  const dropped: { name: string; reason: string }[] = [];
  const unconfirmed: string[] = [];
  const quiet: string[] = [];
  for (const group of GROUPS) {
    const sites = SITES.filter((s) => group.kinds.includes(s.kind));
    const domains = sites.map((s) => s.domain);
    console.log(`Searching ${group.name} (${sites.length} sites)...`);
    const found = await searchSites(client, trendSearchPrompt({ today, sites, focus }), domains);
    if (found.refused || !found.notes.includes("PAGE")) {
      quiet.push(group.name);
      continue;
    }
    const wire = await readTrends(client, { today, material: found.notes, known });
    const read = wire && readMentions(wire, { seenOn: today, domains });
    if (!read) {
      quiet.push(group.name);
      continue;
    }
    mentions.push(...read.mentions);
    dropped.push(...read.dropped);
    // An address the searches didn't return may be remembered rather than found: kept, but flagged for the reviewer.
    if (found.urls.length)
      for (const m of read.mentions) if (!found.urls.includes(m.source.url)) unconfirmed.push(m.source.url);
  }

  const merged = mergeMentions(records, mentions);
  const version = Math.max(0, ...loadBriefs().map((b) => b.version)) + 1;
  const draft = draftBrief(merged.records, {
    version,
    today,
    season: `Week of ${weekOf(today)}`,
    caveat: `Drafted by the weekly job from ${new Set(mentions.map((m) => m.source.publisher)).size} publishers; a person checked the links before it was approved.`,
  });

  console.log(
    `\n${mentions.length} mentions from ${GROUPS.length - quiet.length} of ${GROUPS.length} groups.`,
  );
  for (const step of merged.log)
    console.log(
      step.action === "new"
        ? `  new     ${step.into}  (${step.mention})`
        : `  merged  ${step.into}  <- ${step.mention}  (${step.score.toFixed(2)})`,
    );
  if (quiet.length) console.log(`Nothing usable from: ${quiet.join(", ")}.`);
  for (const d of dropped) console.log(`  dropped ${d.name}: ${d.reason}`);
  for (const url of unconfirmed) console.log(`  check   ${url} wasn't among the search results`);
  console.log(`\nDraft brief v${version}:`);
  for (const t of draft.brief.trends) console.log(`  ${(t.momentum ?? "").padEnd(8)}${t.name}`);

  if (dryRun) {
    console.log("\nDry run: nothing written.");
    return;
  }
  saveRecords(merged.records, today);
  const runPath = saveRun(weekOf(today), {
    ranOn: today,
    model: MODEL,
    mentions,
    log: merged.log,
    dropped,
    unconfirmed,
    quiet,
    momentum: merged.records.map((r) => ({ id: r.id, ...momentum(r, today) })),
  });
  const path = saveBrief(draft);
  console.log(`\nWrote ${path} and ${runPath}.`);
  console.log(
    `Read the draft, open its links, then: pnpm --filter @trip/trends review approve ${version} --by "<your name>"`,
  );
}

main().catch(explain);
