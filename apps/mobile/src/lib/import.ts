import {
  demoItinerary,
  importTravefy,
  parseTravefyLink,
  travefyApiUrl,
  travefyTripIdFromHtml,
  type Trip,
} from "@trip/core";

export class ImportError extends Error {}

/**
 * Fetches a shared Travefy itinerary straight from the phone and turns it into a Trip (BKG-08).
 * Two requests: the shared page, for the trip id it embeds, then the itinerary data the page itself loads.
 */
export async function importFromLink(link: string): Promise<Trip> {
  const pageId = parseTravefyLink(link);
  if (!pageId)
    throw new ImportError(
      "That isn't a Travefy itinerary link. It should start with travefy.com/trip/itinerary/.",
    );

  let html: string;
  try {
    const page = await fetch(link.trim());
    if (!page.ok) throw new ImportError(`Travefy answered ${page.status}. Check the link is still shared.`);
    html = await page.text();
  } catch (e) {
    if (e instanceof ImportError) throw e;
    throw new ImportError("Couldn't reach Travefy. Check your connection and try again.");
  }

  const tripId = travefyTripIdFromHtml(html);
  if (tripId === null)
    throw new ImportError("This page doesn't look like a shared itinerary, or Travefy changed its format.");

  const res = await fetch(travefyApiUrl(pageId), {
    headers: { Accept: "application/json", "X-TRIP-TOKEN": String(tripId), "X-TRIP-AUTH-TOKEN": pageId },
  });
  if (!res.ok) throw new ImportError(`Travefy didn't share the itinerary data (${res.status}).`);
  try {
    return importTravefy(await res.json(), { link: link.trim() });
  } catch {
    throw new ImportError("The itinerary came back in a shape we can't read yet.");
  }
}

/** A fictional trip to look around the app without importing anything. */
export function sampleTrip(): Trip {
  const trip = importTravefy(demoItinerary, { link: null });
  return {
    ...trip,
    travelers: [
      { name: "Ana", nationalities: ["PA"], passportExpiry: null },
      { name: "Ben", nationalities: ["US"], passportExpiry: null },
    ],
  };
}
