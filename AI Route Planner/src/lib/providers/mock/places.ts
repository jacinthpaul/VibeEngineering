import type { Coordinates } from "@/lib/domain/types";
import type { PlacesProvider, RawAttraction } from "@/lib/providers/types";
import { pointAlongPath } from "@/lib/util/geo";
import { Rng } from "@/lib/util/rng";
import { CATEGORY_TEMPLATES, NAME_FRAGMENTS } from "./data";

export const mockPlaces: PlacesProvider = {
  async discoverAttractions({
    path,
    distanceKm,
    categories,
    maxDetourKm,
    seed,
  }: {
    path: Coordinates[];
    distanceKm: number;
    categories: string[];
    maxDetourKm: number;
    seed: string;
  }): Promise<RawAttraction[]> {
    const rng = new Rng("places:" + seed);
    const active = categories.length
      ? categories.filter((c) => CATEGORY_TEMPLATES[c])
      : Object.keys(CATEGORY_TEMPLATES);

    // Scale candidate count with route length (~1 per 35 km), capped.
    const candidateCount = Math.min(28, Math.max(6, Math.round(distanceKm / 35)));
    const out: RawAttraction[] = [];

    for (let i = 0; i < candidateCount; i++) {
      const category = rng.pick(active);
      const tpl = CATEGORY_TEMPLATES[category];
      // Spread along the route between 5% and 95%.
      const t = rng.range(0.05, 0.95);
      const side = rng.float() < 0.5 ? -1 : 1;
      const detourKm = Number(rng.range(1, maxDetourKm).toFixed(1));
      const coordinates = pointAlongPath(path, t, side * detourKm);

      const fragment = rng.pick(NAME_FRAGMENTS);
      const name = `${fragment}${rng.float() < 0.4 ? "konda" : ""} ${tpl.suffix}`.trim();

      // Pseudo-real signal values, biased so a few candidates are clearly great.
      const star = rng.float() < 0.25; // standout
      const googleRating = Number(
        (star ? rng.range(4.5, 4.9) : rng.range(3.6, 4.5)).toFixed(1),
      );
      const reviewCount = Math.round(
        star ? rng.range(2000, 12000) : rng.range(80, 2500),
      );
      const blogMentions = star ? rng.int(5, 14) : rng.int(0, 5);
      const scenicValue = Math.round(star ? rng.range(75, 98) : rng.range(40, 85));
      const socialPopularity = Math.round(
        star ? rng.range(70, 97) : rng.range(30, 80),
      );

      out.push({
        id: `att-${seed}-${i}`,
        name,
        category,
        coordinates,
        distanceFromStartKm: Math.round(t * distanceKm),
        detourKm,
        googleRating,
        reviewCount,
        blogMentions,
        scenicValue,
        socialPopularity,
        summary: tpl.summary,
      });
    }

    // Deduplicate by name, keep within detour budget, sort by route position.
    const seen = new Set<string>();
    return out
      .filter((a) => a.detourKm <= maxDetourKm)
      .filter((a) => (seen.has(a.name) ? false : (seen.add(a.name), true)))
      .sort((a, b) => a.distanceFromStartKm - b.distanceFromStartKm);
  },
};
