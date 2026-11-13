import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { BriefVersion, TrendRecord } from "@trip/core";

/*
 * Where the trends live for now: JSON files under data/trends, in the repository. That makes every weekly change
 * a diff a person can read, and git the history. Nothing here is personal data. It moves to the database with the
 * rest of the app's data (docs/engineering/trends.md).
 */

const here = dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = process.env.TRENDS_DATA_DIR ?? join(here, "../../../data/trends");

const RecordsFile = z.object({ updatedOn: z.string(), records: z.array(TrendRecord) });

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (e) {
    if (e instanceof Error && "code" in e && e.code === "ENOENT") return null;
    throw e;
  }
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function loadRecords(): TrendRecord[] {
  const raw = readJson(join(DATA_DIR, "records.json"));
  return raw === null ? [] : RecordsFile.parse(raw).records;
}

export function saveRecords(records: TrendRecord[], today: string): void {
  writeJson(join(DATA_DIR, "records.json"), { updatedOn: today, records });
}

const briefPath = (version: number) => join(DATA_DIR, "briefs", `v${String(version).padStart(4, "0")}.json`);

export function loadBriefs(): BriefVersion[] {
  let files: string[];
  try {
    files = readdirSync(join(DATA_DIR, "briefs"));
  } catch {
    return [];
  }
  return files
    .filter((f) => /^v\d+\.json$/.test(f))
    .map((f) => BriefVersion.parse(readJson(join(DATA_DIR, "briefs", f))))
    .sort((a, b) => a.version - b.version);
}

export function saveBrief(brief: BriefVersion): string {
  const path = briefPath(brief.version);
  writeJson(path, brief);
  return path;
}

/** What one run did, kept so a reviewer can see why a trend merged or a page was dropped. */
export function saveRun(week: string, run: unknown): string {
  const path = join(DATA_DIR, "runs", `${week}.json`);
  writeJson(path, run);
  return path;
}
