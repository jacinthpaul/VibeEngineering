import type { Listing, Recommendation } from "@/lib/domain/types";
import { PLATFORMS } from "@/lib/platforms/registry";

// Bayesian-adjusted rating: pulls low-review listings toward the prior so a
// 5.0 with 3 reviews doesn't beat a 4.5 with 12,000.
const PRIOR_RATING = 3.8;
const PRIOR_WEIGHT = 50;

function adjustedRating(l: Listing): number {
  return (l.rating * l.reviewCount + PRIOR_RATING * PRIOR_WEIGHT) / (l.reviewCount + PRIOR_WEIGHT);
}

export function scoreListing(l: Listing, all: Listing[]): number {
  const prices = all.map((x) => x.price + x.deliveryFee);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const total = l.price + l.deliveryFee;
  const priceScore = maxP === minP ? 1 : 1 - (total - minP) / (maxP - minP);

  const ratingScore = (adjustedRating(l) - 3) / 2; // 3→0, 5→1

  const maxReviews = Math.max(...all.map((x) => x.reviewCount), 1);
  const reviewScore = Math.log1p(l.reviewCount) / Math.log1p(maxReviews);

  const maxH = Math.max(...all.map((x) => x.deliveryHours), 1);
  const deliveryScore = 1 - l.deliveryHours / maxH;

  const stockPenalty = l.inStock ? 0 : 0.5;

  const score =
    0.4 * priceScore + 0.3 * ratingScore + 0.15 * reviewScore + 0.15 * deliveryScore - stockPenalty;
  return Math.round(Math.max(0, Math.min(1, score)) * 100);
}

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function recommend(listings: Listing[]): { recommendations: Recommendation[]; verdict: string } {
  const inStock = listings.filter((l) => l.inStock);
  const pool = inStock.length ? inStock : listings;
  if (!pool.length) return { recommendations: [], verdict: "No listings found to compare." };

  const recommendations: Recommendation[] = [];
  const scored = pool
    .map((l) => ({ l, score: scoreListing(l, listings) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  const cheapest = [...pool].sort((a, b) => a.price + a.deliveryFee - (b.price + b.deliveryFee))[0];
  const topRated = [...pool].sort((a, b) => adjustedRating(b) - adjustedRating(a))[0];
  const fastest = [...pool].sort((a, b) => a.deliveryHours - b.deliveryHours)[0];

  recommendations.push({
    listingId: best.l.id,
    kind: "best-pick",
    score: best.score,
    reason: `Best overall balance of price (${fmt.format(best.l.price)}), rating (${best.l.rating}★ from ${best.l.reviewCount.toLocaleString("en-IN")} reviews) and ${best.l.deliveryEta} delivery on ${PLATFORMS[best.l.platform].name}.`,
  });
  if (cheapest.id !== best.l.id) {
    recommendations.push({
      listingId: cheapest.id,
      kind: "lowest-price",
      score: scoreListing(cheapest, listings),
      reason: `Cheapest all-in at ${fmt.format(cheapest.price + cheapest.deliveryFee)} including delivery on ${PLATFORMS[cheapest.platform].name}.`,
    });
  }
  if (topRated.id !== best.l.id && topRated.id !== cheapest.id) {
    recommendations.push({
      listingId: topRated.id,
      kind: "top-rated",
      score: scoreListing(topRated, listings),
      reason: `Highest trust: ${topRated.rating}★ across ${topRated.reviewCount.toLocaleString("en-IN")} reviews on ${PLATFORMS[topRated.platform].name}.`,
    });
  }
  if (fastest.id !== best.l.id && fastest.deliveryHours < best.l.deliveryHours) {
    recommendations.push({
      listingId: fastest.id,
      kind: "fastest-delivery",
      score: scoreListing(fastest, listings),
      reason: `Arrives in ${fastest.deliveryEta} via ${PLATFORMS[fastest.platform].name} — fastest option found.`,
    });
  }

  const savings = Math.max(...pool.map((l) => l.price)) - cheapest.price;
  const verdict =
    `Our pick: ${best.l.title} on ${PLATFORMS[best.l.platform].name} at ${fmt.format(best.l.price)} ` +
    `(score ${best.score}/100). ` +
    (savings > 0
      ? `Comparing across platforms saves up to ${fmt.format(savings)} versus the priciest similar listing. `
      : "") +
    (best.l.id !== cheapest.id
      ? `If price is all that matters, ${PLATFORMS[cheapest.platform].name} has it for ${fmt.format(cheapest.price)}.`
      : `It's also the cheapest option available.`);

  return { recommendations, verdict };
}
