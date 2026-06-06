// Pit Stop Discovery agent: generates service stops (fuel, tea, food, rest)
// along the route, applying the vehicle-specific cadence from the PRD.

import type {
  PlannedStop,
  RouteResult,
  StopFrequency,
  StopKind,
  VehicleType,
} from "@/lib/domain/types";
import { pointAlongPath } from "@/lib/util/geo";
import { Rng } from "@/lib/util/rng";
import {
  FAMILY_RESTAURANTS,
  FUEL_BRANDS,
  RIDER_CAFE_NAMES,
  TEA_NAMES,
} from "@/lib/providers/mock/data";

const KIND_DURATION: Record<StopKind, number> = {
  fuel: 10,
  tea: 15,
  food: 40,
  rider_cafe: 30,
  rest: 20,
  repair: 0,
  hospital: 0,
  attraction: 45,
};

// Rotation of service-stop kinds by vehicle.
const MOTO_ROTATION: StopKind[] = ["tea", "fuel", "rider_cafe", "food"];
const CAR_ROTATION: StopKind[] = ["food", "rest", "food"];

function intervalKm(
  freq: StopFrequency,
  vehicle: VehicleType,
  route: RouteResult,
): number {
  const speed = route.durationMin > 0 ? (route.distanceKm / route.durationMin) * 60 : 55;
  if (freq.mode === "custom") {
    if (freq.unit === "distance" && freq.everyKm) return freq.everyKm;
    if (freq.unit === "time" && freq.everyMinutes) return (freq.everyMinutes / 60) * speed;
  }
  // Auto: motorcycle ~ every 60 min, car ~ every 150 min.
  const minutes = vehicle === "motorcycle" ? 60 : 150;
  return (minutes / 60) * speed;
}

function nameFor(kind: StopKind, rng: Rng): { name: string; summary: string; why: string } {
  switch (kind) {
    case "fuel":
      return {
        name: `${rng.pick(FUEL_BRANDS)} Fuel Station`,
        summary: "Clean restroom, air pump available.",
        why: "Top up before the next long stretch.",
      };
    case "tea":
      return {
        name: rng.pick(TEA_NAMES),
        summary: "Hot chai and quick snacks.",
        why: "Short caffeine + stretch break.",
      };
    case "rider_cafe":
      return {
        name: rng.pick(RIDER_CAFE_NAMES),
        summary: "Biker-friendly with secure parking.",
        why: "Popular regrouping point for riders.",
      };
    case "rest":
      return {
        name: "Highway Rest Area",
        summary: "Clean washrooms and shaded parking.",
        why: "Comfort break for the family.",
      };
    default:
      return {
        name: rng.pick(FAMILY_RESTAURANTS),
        summary: "Multicuisine menu, ample parking.",
        why: "Sit-down meal break.",
      };
  }
}

export function discoverPitStops(
  route: RouteResult,
  vehicle: VehicleType,
  freq: StopFrequency,
  seed: string,
): PlannedStop[] {
  const rng = new Rng("pit:" + seed);
  const step = intervalKm(freq, vehicle, route);
  const rotation = vehicle === "motorcycle" ? MOTO_ROTATION : CAR_ROTATION;

  const stops: PlannedStop[] = [];
  let i = 0;
  for (let dist = step; dist < route.distanceKm - step * 0.4; dist += step) {
    const kind = rotation[i % rotation.length];
    const t = dist / route.distanceKm;
    const meta = nameFor(kind, rng);
    stops.push({
      id: `pit-${seed}-${i}`,
      name: meta.name,
      kind,
      coordinates: pointAlongPath(route.path, t, 0),
      distanceFromStartKm: Math.round(dist),
      distanceFromPrevKm: 0, // filled in by the itinerary agent
      detourKm: 0,
      etaMinutesFromStart: 0, // filled in by the itinerary agent
      suggestedDurationMin: KIND_DURATION[kind],
      googleRating: Number(rng.range(3.8, 4.6).toFixed(1)),
      reviewCount: rng.int(40, 1500),
      reviewSummary: meta.summary,
      whyRecommended: meta.why,
      vehicleSuitability:
        vehicle === "motorcycle" ? "Bike-friendly parking" : "Easy car parking",
      weatherImpact: "Covered seating available",
    });
    i++;
  }
  return stops;
}
