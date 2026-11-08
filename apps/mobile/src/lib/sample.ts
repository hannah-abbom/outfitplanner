import { guessFromName, type ClosetItem } from "@trip/core";

import { newId } from "@/state/trip-store";

/** A made-up closet for a warm trip, to try the planner before photographing your own clothes. */
const SAMPLE: [string, Partial<ClosetItem>?][] = [
  ["Ivory linen shirt"],
  ["White tee"],
  ["Black silk cami"],
  ["Sand linen trousers"],
  ["Denim shorts"],
  ["Khaki utility shorts"],
  ["Black silk slip dress"],
  ["Terracotta midi dress"],
  ["Blush maxi dress", { tags: ["dressy"] }],
  ["Cream cashmere sweater"],
  ["Olive utility jacket"],
  ["Packable rain shell, beige", { status: "to-get" }],
  ["Camel leather sandals"],
  ["White sneakers"],
  ["Black one-piece swimsuit"],
  ["Coral bikini"],
  ["Sand straw tote"],
  ["Straw sun hat, sand"],
];

export function sampleCloset(): ClosetItem[] {
  const now = new Date().toISOString();
  return SAMPLE.map(([name, extra]) => ({
    id: newId("p"),
    name,
    ...guessFromName(name),
    image: null,
    source: "manual" as const,
    link: null,
    brand: null,
    status: "owned" as const,
    addedAt: now,
    ...extra,
  }));
}
