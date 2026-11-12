import { piecesOf, type ClosetItem, type LookSlot } from "./closet";
import { daysToPlan, type StylistAnswer, type StylistRequest } from "./stylist";

/*
 * Graders for the stylist eval (OUT-05). Each check is something a person would notice at once in a bad plan:
 * a day left bare, an invented piece, half an outfit, swimwear on the wrong island, no layer on a cold night.
 */

export interface Grade {
  check: string;
  pass: boolean;
  detail: string;
}

/** Text from a model reply read as one JSON value: the whole reply, a fenced block, or the outermost braces. */
export function extractJson(text: string): unknown {
  const tries = [
    text,
    /```(?:json)?\s*([\s\S]*?)```/.exec(text)?.[1] ?? "",
    text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1),
  ];
  for (const t of tries) {
    try {
      if (t.trim()) return JSON.parse(t);
    } catch {
      continue;
    }
  }
  return null;
}

function complete(pieces: ClosetItem[]): boolean {
  const has = (c: ClosetItem["category"]) => pieces.some((p) => p.category === c);
  return has("dress") || has("set") || has("swim") || (has("top") && has("bottom"));
}

/**
 * Grades one answer. `homes` names, for pieces that belong to one part of the trip, a word the place of every day
 * they're worn on must contain.
 */
export function gradeStylist(
  req: StylistRequest,
  answer: StylistAnswer,
  homes: Record<string, string> = {},
): Grade[] {
  const planned = daysToPlan(req);
  const byDate = new Map(answer.looks.map((l) => [l.date, l]));
  const grades: Grade[] = [];

  const bare = planned.filter((d) => !byDate.has(d.date)).map((d) => d.date);
  grades.push({
    check: "Every planned day has a look",
    pass: bare.length === 0,
    detail: bare.join(", ") || "all covered",
  });
  grades.push({
    check: "Only pieces from the closet",
    pass: answer.dropped === 0,
    detail: `${answer.dropped} invented`,
  });

  const half: string[] = [];
  const wrongPlace: string[] = [];
  const noSwim: string[] = [];
  const cold: string[] = [];
  for (const d of planned) {
    const look = byDate.get(d.date);
    if (!look) continue;
    for (const slot of ["day", "evening"] as LookSlot[]) {
      const pieces = piecesOf(look.pieces[slot], req.closet);
      if (pieces.length && !complete(pieces)) half.push(`${d.date} ${slot}`);
      for (const p of pieces) {
        const home = homes[p.id];
        if (home && !d.place.toLowerCase().includes(home.toLowerCase()))
          wrongPlace.push(`${p.name} on ${d.date}`);
      }
    }
    const day = piecesOf(look.pieces.day, req.closet);
    if (d.plans.some((p) => /beach|pool/i.test(p)) && !day.some((p) => p.category === "swim"))
      noSwim.push(d.date);
    const evening = piecesOf(look.pieces.evening, req.closet);
    if (d.weather && d.weather.lo <= 15 && evening.length && !evening.some((p) => p.category === "layer"))
      cold.push(d.date);
  }
  grades.push({
    check: "Looks are complete outfits",
    pass: half.length === 0,
    detail: half.join(", ") || "all complete",
  });
  grades.push({
    check: "Pieces stay where they were packed for",
    pass: wrongPlace.length === 0,
    detail: wrongPlace.join(", ") || "all in place",
  });
  grades.push({
    check: "Swim on beach and pool days",
    pass: noSwim.length === 0,
    detail: noSwim.join(", ") || "all have swim",
  });
  grades.push({
    check: "A layer on cool evenings",
    pass: cold.length === 0,
    detail: cold.join(", ") || "all layered",
  });
  return grades;
}
