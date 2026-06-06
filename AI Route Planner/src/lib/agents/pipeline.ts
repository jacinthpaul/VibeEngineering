// Orchestrator: runs the full agent pipeline for a trip request and assembles
// the final PlanResult. This is where the 7 PRD agents are wired together:
//   Route Planner · Pit Stop Discovery · Attraction Discovery ·
//   Travel Research · Weather · Scoring · Itinerary Generator

import type {
  ComparisonRow,
  PlanResult,
  TripRequest,
  VehiclePlan,
  VehicleType,
} from "@/lib/domain/types";
import { getProviders, type ProviderOptions } from "@/lib/providers";
import { mockLlm } from "@/lib/providers/mock/llm";
import { discoverAttractions } from "./attractions";
import { discoverPitStops } from "./pitStops";
import { buildVehiclePlan, formatDuration } from "./itinerary";

function vehiclesFor(sel: TripRequest["vehicle"]): VehicleType[] {
  return sel === "both" ? ["motorcycle", "car"] : [sel];
}

export async function planTrip(
  req: TripRequest,
  opts: ProviderOptions = {},
): Promise<PlanResult> {
  const p = getProviders(opts);
  // If a live AI call fails, fall back to mock narrative and surface the reason.
  let aiError: string | undefined;
  const onAiFailure = (err: unknown) => {
    if (!p.aiLive) throw err;
    aiError = err instanceof Error ? err.message : "Claude request failed.";
  };

  // 1. Geocode both endpoints (in parallel).
  const [startPlace, destinationPlace] = await Promise.all([
    p.geocode.geocode(req.start),
    p.geocode.geocode(req.destination),
  ]);

  // 2. Weather + travel research are vehicle-independent — fetch once.
  const weather = await p.weather.getWeather(destinationPlace.coordinates, req.date);
  const travelResearch = await p.llm
    .travelResearch(startPlace, destinationPlace)
    .catch((err) => {
      onAiFailure(err);
      return mockLlm.travelResearch(startPlace, destinationPlace);
    });

  // 3. Per vehicle: route → attractions + pit stops → itinerary.
  const vehiclePlans: VehiclePlan[] = [];
  for (const vehicle of vehiclesFor(req.vehicle)) {
    const route = await p.routing.route(
      startPlace,
      destinationPlace,
      req.routePreference,
      vehicle,
    );
    const seed = `${startPlace.name}->${destinationPlace.name}:${vehicle}:${req.routePreference}`;

    const [attractions, pitStops] = await Promise.all([
      discoverAttractions({
        places: p.places,
        path: route.path,
        distanceKm: route.distanceKm,
        categories: req.categories,
        maxDetourKm: req.maxDetourKm,
        preference: req.routePreference,
        vehicle,
        seed,
      }),
      Promise.resolve(discoverPitStops(route, vehicle, req.stopFrequency, seed)),
    ]);

    vehiclePlans.push(
      buildVehiclePlan({
        route,
        attractions,
        pitStops,
        departureTime: req.departureTime,
        weather,
        preference: req.routePreference,
        vehicle,
      }),
    );
  }

  // 4. Travel brief from the primary plan.
  const primary = vehiclePlans[0];
  const bestStops = primary.stops
    .filter((s) => s.kind === "attraction")
    .slice()
    .sort((a, b) => (b.worthVisiting?.total ?? 0) - (a.worthVisiting?.total ?? 0))
    .slice(0, 3)
    .map((s) => s.name);

  const briefInput = {
    start: startPlace,
    destination: destinationPlace,
    distanceKm: primary.route.distanceKm,
    travelTimeText: formatDuration(primary.totalTripMinutes),
    bestStops,
    weather,
  };
  const brief = await p.llm.travelBrief(briefInput).catch((err) => {
    onAiFailure(err);
    return mockLlm.travelBrief(briefInput);
  });

  // 5. Comparison view when both vehicles were requested.
  const comparison =
    vehiclePlans.length === 2 ? buildComparison(vehiclePlans) : undefined;

  return {
    request: req,
    startPlace,
    destinationPlace,
    vehiclePlans,
    weather,
    travelResearch,
    brief,
    comparison,
    generatedAt: new Date().toISOString(),
    usingMockData: p.isMock,
    aiLive: p.aiLive && !aiError,
    aiError,
  };
}

function buildComparison(plans: VehiclePlan[]): ComparisonRow[] {
  const moto = plans.find((p) => p.vehicle === "motorcycle")!;
  const car = plans.find((p) => p.vehicle === "car")!;
  const safety = (pl: VehiclePlan) =>
    String(pl.experienceScore.metrics.find((m) => m.label === "Safety")?.value ?? "-");
  const scenic = (pl: VehiclePlan) =>
    String(pl.experienceScore.metrics.find((m) => m.label === "Scenic Value")?.value ?? "-");
  return [
    { metric: "Distance", motorcycle: `${moto.route.distanceKm} km`, car: `${car.route.distanceKm} km` },
    {
      metric: "Total Time",
      motorcycle: formatDuration(moto.totalTripMinutes),
      car: formatDuration(car.totalTripMinutes),
    },
    {
      metric: "Stops",
      motorcycle: String(moto.stops.length),
      car: String(car.stops.length),
    },
    {
      metric: "Attractions",
      motorcycle: String(moto.stops.filter((s) => s.kind === "attraction").length),
      car: String(car.stops.filter((s) => s.kind === "attraction").length),
    },
    { metric: "Scenic Score", motorcycle: scenic(moto), car: scenic(car) },
    { metric: "Safety Score", motorcycle: safety(moto), car: safety(car) },
    {
      metric: "Experience Score",
      motorcycle: `${moto.experienceScore.total}/10`,
      car: `${car.experienceScore.total}/10`,
    },
    {
      metric: "Fuel Cost",
      motorcycle: `₹${moto.route.fuelEstimate.cost}`,
      car: `₹${car.route.fuelEstimate.cost}`,
    },
    {
      metric: "Toll",
      motorcycle: `₹${moto.route.tollEstimate.cost}`,
      car: `₹${car.route.tollEstimate.cost}`,
    },
  ];
}
