import { reviewBrief } from "@trip/core";
import { loadBriefs, saveBrief } from "./store";

/*
 * A person's decision on a draft brief: `pnpm --filter @trip/trends review approve 3 --by "Name" [--note "..."]`,
 * or `reject`. With no arguments it lists the versions. Approval is the only way a brief reaches the stylist.
 */

function flag(name: string): string | null {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 ? (process.argv[at + 1] ?? null) : null;
}

function main() {
  const [decision, versionArg] = process.argv.slice(2);
  const briefs = loadBriefs();
  if (!decision) {
    if (!briefs.length) console.log("No briefs yet. Run the weekly job first.");
    for (const b of briefs)
      console.log(
        `v${b.version}  ${b.status.padEnd(8)}  ${b.createdOn}  ${b.brief.trends.length} trends${b.reviewedBy ? `  (${b.reviewedBy})` : ""}`,
      );
    return;
  }
  if (decision !== "approve" && decision !== "reject") throw new Error('Say "approve" or "reject".');
  const draft = briefs.find((b) => b.version === Number(versionArg));
  if (!draft) throw new Error(`No brief v${versionArg ?? "?"}.`);
  const by = flag("by");
  if (!by) throw new Error('Say who is reviewing: --by "Name".');
  const today = new Date().toISOString().slice(0, 10);
  const reviewed = reviewBrief(
    draft,
    decision === "approve" ? "approved" : "rejected",
    by,
    today,
    flag("note"),
  );
  console.log(`Brief v${reviewed.version} ${reviewed.status} by ${by}: ${saveBrief(reviewed)}`);
}

try {
  main();
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
}
