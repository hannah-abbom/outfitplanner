import { Platform } from "react-native";

/*
 * Where the stylist's Claude comes from. Inside claude.ai (the app link), the page can ask Claude on the viewer's own
 * account, after they allow it once; no key or server is involved. The phone app has no such host, so there the
 * stylist needs its own small service holding an API key: until that exists, getStylist() answers null.
 */

type SampleOptions = { signal?: AbortSignal; modelTier?: "quick" | "default" | "complex"; cache?: boolean };

export interface Sample {
  json<T = unknown>(input: string, options?: SampleOptions): Promise<T>;
}

type Host = { use?: (name: string) => Promise<unknown> };

export async function getStylist(): Promise<Sample | null> {
  if (Platform.OS !== "web") return null;
  const host = (globalThis as { claude?: Host }).claude;
  if (!host?.use) return null;
  try {
    const s = (await host.use("sample")) as Sample | null;
    return s && typeof s.json === "function" ? s : null;
  } catch {
    return null;
  }
}

/** What to tell the person when a request fails; null when they stopped it themselves. */
export function stylistErrorText(e: unknown): string | null {
  const code = (e as { code?: unknown } | null)?.code;
  switch (code) {
    case "cancelled":
      return null;
    case "not_granted":
    case "sampling_disabled":
    case "not_declared":
    case "capability_disabled":
    case "capability_removed":
      return "This page isn't allowed to use Claude right now. Reopen the app link and allow it when claude.ai asks.";
    case "rate_limited":
      return "Claude is busy, or you've reached a usage limit. Try again in a little while.";
    case "session_expired":
      return "Sign in to claude.ai again, then try once more.";
    case "refused":
      return "Claude couldn't help with that. Try rewording what you typed.";
    case "prompt_too_large":
      return "That's too much to send at once. Try planning only the days without a look.";
    case "invalid_json":
    case "empty_completion":
      return "The suggestions came back in a form the app couldn't read. Try again.";
    default:
      return "Something went wrong reaching Claude. Try again.";
  }
}
