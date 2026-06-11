import type { PlatformStatus, SearchQuery, SearchResult } from "@/lib/domain/types";
import { ADAPTERS } from "@/lib/platforms/adapters";
import { inferCategory } from "@/lib/platforms/catalog";
import { PLATFORMS } from "@/lib/platforms/registry";
import { platformServiceability, resolveLocation } from "@/lib/platforms/serviceability";
import { recommend } from "./recommend";

export async function searchAllPlatforms(query: SearchQuery): Promise<SearchResult> {
  const location = resolveLocation(query.location);
  const category = inferCategory(query.product);

  // Fan out to every adapter in parallel; one slow/failed platform must not
  // sink the whole comparison.
  const settled = await Promise.allSettled(
    ADAPTERS.map((a) => a.search(query.product, location)),
  );

  const listings = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  const platforms: PlatformStatus[] = ADAPTERS.map((a, i) => {
    const svc = platformServiceability(a.id, location);
    const sellsCategory = PLATFORMS[a.id].categories.includes(category);
    const count = settled[i].status === "fulfilled" ? (settled[i] as PromiseFulfilledResult<unknown[]>).value.length : 0;
    return {
      platform: a.id,
      serviceable: svc.serviceable && sellsCategory,
      note: !sellsCategory
        ? `${PLATFORMS[a.id].name} doesn't carry ${category} products.`
        : svc.note,
      listingCount: count,
    };
  });

  // Default order: total cost ascending (price + delivery fee).
  listings.sort((a, b) => a.price + a.deliveryFee - (b.price + b.deliveryFee));

  const { recommendations, verdict } = recommend(listings);

  return {
    query,
    location,
    category,
    listings,
    platforms,
    recommendations,
    verdict,
    generatedAt: new Date().toISOString(),
  };
}
