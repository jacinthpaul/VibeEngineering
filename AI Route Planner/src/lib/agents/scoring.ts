// Scoring agent: produces the Worth Visiting Score (per attraction) and the
// Route Experience Score (per route), using the exact weights from the PRD.

import type {
  ExperienceScore,
  PlannedStop,
  RoutePreference,
  ScoreFactor,
  VehicleType,
  WeatherData,
  WorthVisitingScore,
} from "@/lib/domain/types";
import type { RawAttraction } from "@/lib/providers/types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function weightedTotal(factors: ScoreFactor[]): number {
  return Math.round(
    factors.reduce((sum, f) => sum + (f.weightPct / 100) * f.value, 0),
  );
}

// --- Worth Visiting Score -------------------------------------------------

export function scoreAttraction(
  a: RawAttraction,
  maxDetourKm: number,
): WorthVisitingScore {
  const ratingVal = (a.googleRating / 5) * 100;
  // Review count on a log scale; ~12k reviews ≈ 100.
  const reviewVal = clamp((Math.log10(a.reviewCount + 1) / Math.log10(12000)) * 100);
  const blogVal = clamp((a.blogMentions / 12) * 100);
  const detourVal = clamp(100 - (a.detourKm / Math.max(1, maxDetourKm)) * 100);

  const factors: ScoreFactor[] = [
    { label: "Google Rating", weightPct: 25, value: Math.round(ratingVal) },
    { label: "Review Count", weightPct: 15, value: Math.round(reviewVal) },
    { label: "Travel Blog Mentions", weightPct: 20, value: Math.round(blogVal) },
    { label: "Scenic Value", weightPct: 15, value: a.scenicValue },
    { label: "Detour Required", weightPct: 10, value: Math.round(detourVal) },
    { label: "Social Popularity", weightPct: 15, value: a.socialPopularity },
  ];

  const reasons: string[] = [];
  if (a.blogMentions >= 5) reasons.push(`Mentioned by ${a.blogMentions} travel blogs`);
  if (a.googleRating >= 4.4) reasons.push(`${a.googleRating} Google rating`);
  if (a.detourKm <= 8) reasons.push(`Only ${a.detourKm} km detour`);
  if (a.scenicValue >= 80) reasons.push("Highly scenic spot");
  if (a.reviewCount >= 2000) reasons.push(`${a.reviewCount.toLocaleString()} reviews`);
  if (reasons.length === 0) reasons.push("Pleasant stop to break the journey");

  return { total: weightedTotal(factors), factors, reasons };
}

// --- Route Experience Score (out of 10) -----------------------------------

export function routeExperienceScore(args: {
  attractions: PlannedStop[];
  foodStops: PlannedStop[];
  fuelStops: number;
  vehicle: VehicleType;
  preference: RoutePreference;
  weather: WeatherData;
  distanceKm: number;
}): ExperienceScore {
  const { attractions, foodStops, fuelStops, vehicle, preference, weather, distanceKm } =
    args;

  const avg = (xs: number[], fallback = 50) =>
    xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : fallback;

  const scenicBonus =
    preference === "scenic" ? 12 : preference === "explorer" ? 8 : 0;
  const scenicValue = clamp(
    avg(attractions.map((a) => a.worthVisiting?.factors[3].value ?? 60)) + scenicBonus,
  );

  const foodQuality = clamp(
    foodStops.length ? avg(foodStops.map((f) => (f.googleRating / 5) * 100)) : 55,
  );

  // Safety: cars baseline higher; weather and aggressive pace reduce it.
  const safety = clamp(
    (vehicle === "car" ? 82 : 70) -
      (weather.riderRisk === "High" ? 22 : weather.riderRisk === "Medium" ? 10 : 0) -
      (preference === "fastest" ? 6 : 0),
  );

  const attractionsScore = clamp(
    avg(attractions.map((a) => a.worthVisiting?.total ?? 0), 40) +
      Math.min(15, attractions.length * 2),
  );

  const weatherScore = weather.weatherScore;

  // Fuel availability: how well fuel stops cover the distance (~1 per 120 km ideal).
  const idealFuel = Math.max(1, distanceKm / 120);
  const fuelAvailability = clamp((fuelStops / idealFuel) * 100);

  const metrics: ScoreFactor[] = [
    { label: "Scenic Value", weightPct: 20, value: Math.round(scenicValue) },
    { label: "Food Quality", weightPct: 15, value: Math.round(foodQuality) },
    { label: "Safety", weightPct: 20, value: Math.round(safety) },
    { label: "Attractions", weightPct: 20, value: Math.round(attractionsScore) },
    { label: "Weather", weightPct: 10, value: Math.round(weatherScore) },
    { label: "Fuel Availability", weightPct: 15, value: Math.round(fuelAvailability) },
  ];

  return { total: Number((weightedTotal(metrics) / 10).toFixed(1)), metrics };
}
