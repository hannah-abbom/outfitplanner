import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { MentionsWire, trendReadPrompt, type TrendReadRequest } from "@trip/core";

/*
 * The two Claude calls behind the trends engine. The search call can search the web and do nothing else; the
 * reading call has no tools and returns data in a fixed shape. Neither can change anything.
 */

/** One model for both calls. Try a cheaper one only when the eval shows it holds up. */
export const MODEL = process.env.TRENDS_MODEL ?? "claude-opus-5-5";
const BETAS = ["server-side-fallback-2026-07-01"];

export function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN);
}

export interface SearchNotes {
  /** Claude's notes on the pages it found, in the PAGE layout. Empty when it declined or found nothing. */
  notes: string;
  /** Every address the searches returned, to tell a found page from a remembered one. */
  urls: string[];
  refused: boolean;
}

/** Searches the given sites and returns notes. A long search can pause; it's sent back to carry on. */
export async function searchSites(
  client: Anthropic,
  prompt: string,
  domains: string[],
): Promise<SearchNotes> {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: prompt }];
  const urls = new Set<string>();
  for (let turn = 0; turn < 5; turn++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: BETAS,
      fallbacks: "default",
      output_config: { effort: "medium" },
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6, allowed_domains: domains }],
      messages,
    });
    for (const block of response.content) {
      if (block.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
      for (const result of block.content) urls.add(result.url);
    }
    if (response.stop_reason === "refusal") return { notes: "", urls: [...urls], refused: true };
    if (response.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: response.content });
      continue;
    }
    const notes = response.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
    return { notes, urls: [...urls], refused: false };
  }
  return { notes: "", urls: [...urls], refused: false };
}

/** Turns notes into trend mentions as data. Returns null when Claude declined or the answer didn't parse. */
export async function readTrends(client: Anthropic, req: TrendReadRequest): Promise<MentionsWire | null> {
  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    betas: BETAS,
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(MentionsWire) },
    messages: [{ role: "user", content: trendReadPrompt(req) }],
  });
  if (response.stop_reason === "refusal") return null;
  return response.parsed_output;
}

/** Plain words for an API failure, and a failing exit code. Anything else is rethrown. */
export function explain(e: unknown): void {
  if (e instanceof Anthropic.RateLimitError) console.error("Rate limited: try again later.");
  else if (e instanceof Anthropic.AuthenticationError) console.error("The API key was refused.");
  else if (e instanceof Anthropic.APIError) console.error(`API error ${e.status}: ${e.message}`);
  else throw e;
  process.exitCode = 1;
}
