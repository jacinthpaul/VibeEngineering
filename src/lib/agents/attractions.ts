// Attraction Discovery agent: turns raw place candidates into scored,
// itinerary-ready attraction stops, then selects the best, well-spaced set.

import type { Coordinates, PlannedStop, VehicleType } from "@/lib/domain/types";
import type { PlacesProvider, RawAttraction } from "@/lib/providers/types";
import { scoreAttraction } from "./scoring";

const DURATION_BY_CATEGORY: Record<string, number> = {
  waterfalls: 60,
  lakes: 45,
  dams: 30,
  forests: 45,
  viewpoints: 30,
  sunset_points: 30,
  sunrise_points: 30,
  forts: 75,
  palaces: 75,
  monuments: 45,
  temples: 40,
  churches: 30,
  mosques: 30,
  trekking: 120,
  river_rafting: 90,
  camping: 120,
  restaurants: 45,
  local_specialties: 40,
  cafes: 30,
  instagram_spots: 20,
};

function toStop(a: RawAttraction, maxDetourKm: number): PlannedStop {
  const worth = scoreAttraction(a, maxDetourKm);
  return {
    id: a.id,
    name: a.name,
    kind: "attraction",
    category: a.category,
    coordinates: a.coordinates,
    distanceFromStartKm: a.distanceFromStartKm,
    distanceFromPrevKm: 0,
    detourKm: a.detourKm,
    etaMinutesFromStart: 0,
    suggestedDurationMin: DURATION_BY_CATEGORY[a.category] ?? 45,
    googleRating: a.googleRating,
    reviewCount: a.reviewCount,
    reviewSummary: a.summary,
    whyRecommended: worth.reasons.join(" · "),
    vehicleSuitability: a.detourKm <= 10 ? "Easy detour" : "Moderate detour",
    weatherImpact: "Best in clear weather",
    worthVisiting: worth,
  };
}

/** How many attractions to surface, based on preference. */
function targetCount(preference: string, available: number): number {
  const base =
    preference === "explorer" ? 8 : preference === "scenic" ? 6 : preference === "balanced" ? 5 : 3;
  return Math.min(base, available);
}

export async function discoverAttractions(args: {
  places: PlacesProvider;
  path: Coordinates[];
  distanceKm: number;
  categories: string[];
  maxDetourKm: number;
  preference: string;
  vehicle: VehicleType;
  seed: string;
}): Promise<PlannedStop[]> {
  const raw = await args.places.discoverAttractions({
    path: args.path,
    distanceKm: args.distanceKm,
    categories: args.categories,
    maxDetourKm: args.maxDetourKm,
    seed: args.seed,
  });

  const scored = raw.map((a) => toStop(a, args.maxDetourKm));

  // Pick the top-scoring attractions, then keep them spread along the route
  // so the itinerary isn't front-loaded.
  const want = targetCount(args.preference, scored.length);
  const byScore = [...scored].sort(
    (a, b) => (b.worthVisiting?.total ?? 0) - (a.worthVisiting?.total ?? 0),
  );
  const minGapKm = args.distanceKm / (want + 1) / 2;
  const chosen: PlannedStop[] = [];
  for (const cand of byScore) {
    if (chosen.length >= want) break;
    const tooClose = chosen.some(
      (c) => Math.abs(c.distanceFromStartKm - cand.distanceFromStartKm) < minGapKm,
    );
    if (!tooClose) chosen.push(cand);
  }
  // Backfill if spacing was too strict.
  for (const cand of byScore) {
    if (chosen.length >= want) break;
    if (!chosen.includes(cand)) chosen.push(cand);
  }

  return chosen.sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
}
