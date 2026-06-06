import type { GeoPlace, TravelBrief, TravelResearch, WeatherData } from "@/lib/domain/types";
import type { LlmProvider } from "@/lib/providers/types";
import { Rng } from "@/lib/util/rng";
import { NAME_FRAGMENTS } from "./data";

// Mock "LLM" — produces templated narrative text. The real implementation
// would call the Claude API behind this same interface.

function gem(rng: Rng, suffix: string): string {
  return `${rng.pick(NAME_FRAGMENTS)} ${suffix}`;
}

export const mockLlm: LlmProvider = {
  async travelResearch(start: GeoPlace, destination: GeoPlace): Promise<TravelResearch> {
    const rng = new Rng(`research:${start.name}->${destination.name}`);
    const blogMentionCount = rng.int(8, 16);
    const headliner = gem(rng, "Fort");
    return {
      mustVisit: [headliner, gem(rng, "Waterfalls"), gem(rng, "Viewpoint")],
      hiddenGems: [gem(rng, "Lake"), gem(rng, "Cave Temple")],
      localFood: ["Regional thali at a highway dhaba", "Filter coffee + bonda combo", "Spicy mutton curry"],
      scenicRoads: ["Ghat section with hairpin bends", "Tree-canopy stretch mid-route"],
      touristTraps: ["Overpriced viewpoint parking near the summit"],
      seasonalAdvice:
        "Waterfalls are at their best post-monsoon; some ghat roads get foggy in the early morning.",
      blogMentionCount,
      summary: `${blogMentionCount} travel blogs flag ${headliner} as the most worthwhile detour between ${start.name.split(",")[0]} and ${destination.name.split(",")[0]}.`,
    };
  },

  async travelBrief({
    start,
    destination,
    distanceKm,
    travelTimeText,
    bestStops,
    weather,
  }: {
    start: GeoPlace;
    destination: GeoPlace;
    distanceKm: number;
    travelTimeText: string;
    bestStops: string[];
    weather: WeatherData;
  }): Promise<TravelBrief> {
    const from = start.name.split(",")[0];
    const to = destination.name.split(",")[0];
    const rainy = weather.riderRisk !== "Low";
    return {
      summary: `A ${distanceKm} km run from ${from} to ${to}, best enjoyed at an unhurried pace with a few high-value stops rather than a flat-out dash.`,
      distanceKm,
      travelTimeText,
      bestStops,
      weatherNote: weather.summary,
      recommendation: rainy
        ? "Start before sunrise to stay ahead of afternoon weather, and keep rain gear within easy reach."
        : "Leave a little after sunrise for the best light at the early viewpoints; no major weather concerns.",
    };
  },
};
