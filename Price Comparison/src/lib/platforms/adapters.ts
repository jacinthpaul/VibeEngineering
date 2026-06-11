// One adapter per platform behind a common interface. The demo adapters
// synthesize listings from the shared catalog; a live adapter (affiliate API,
// partner feed) only needs to return the same Listing[] shape.

import type { Listing, LocationInfo, PlatformId } from "@/lib/domain/types";
import { Rng } from "@/lib/util/rng";
import { generateVariants, type ProductVariant } from "./catalog";
import { PLATFORMS, ALL_PLATFORM_IDS, platformSearchUrl } from "./registry";
import { platformServiceability, formatDeliveryEta, type Serviceability } from "./serviceability";

export interface PlatformAdapter {
  id: PlatformId;
  search(product: string, location: LocationInfo): Promise<Listing[]>;
}

// Platform personalities: relative price spread, rating bias and review volume
// so the comparison feels like the real marketplaces.
const PROFILE: Record<PlatformId, { priceMul: [number, number]; ratingBias: number; reviewMul: number }> = {
  amazon:   { priceMul: [0.95, 1.06], ratingBias: 0.1,  reviewMul: 3.0 },
  flipkart: { priceMul: [0.93, 1.05], ratingBias: 0.0,  reviewMul: 2.2 },
  bigbasket:{ priceMul: [0.97, 1.08], ratingBias: 0.05, reviewMul: 0.6 },
  blinkit:  { priceMul: [1.02, 1.15], ratingBias: -0.1, reviewMul: 0.4 },
  jiomart:  { priceMul: [0.90, 1.02], ratingBias: -0.15, reviewMul: 0.5 },
  croma:    { priceMul: [0.96, 1.07], ratingBias: 0.05, reviewMul: 0.8 },
};

function buildListing(
  platform: PlatformId,
  variant: ProductVariant,
  product: string,
  svc: Serviceability,
): Listing | null {
  const rng = new Rng(`listing:${platform}:${variant.key}`);
  const profile = PROFILE[platform];

  // Not every variant is stocked on every platform (~78% coverage).
  if (rng.float() > 0.78) return null;

  const price = Math.round(variant.basePrice * rng.range(...profile.priceMul));
  const discountPct = rng.float() < 0.65 ? rng.int(3, 30) : 0;
  const mrp = discountPct ? Math.round(price / (1 - discountPct / 100)) : price;

  const rating = Math.min(4.9, Math.max(3.1, Math.round((rng.range(3.4, 4.7) + profile.ratingBias) * 10) / 10));
  const reviewCount = Math.round(Math.exp(rng.range(3, 9)) * profile.reviewMul);

  const deliveryHours = rng.range(...svc.deliveryHoursRange);
  const deliveryFee = Math.round(rng.range(...svc.deliveryFeeRange) / 5) * 5;
  const inStock = rng.float() > 0.08;

  const offers = [
    "10% off with HDFC cards",
    "5% cashback on Axis card",
    "Buy 2 get 1 free",
    "Extra ₹100 off on first order",
    "No-cost EMI available",
    "Bank offer: flat ₹250 off",
  ];

  const unitPrice =
    variant.unitAmount && variant.unitLabel
      ? `₹${((price / variant.unitAmount) * 100).toFixed(2)} / 100${variant.unitLabel}`
      : undefined;

  return {
    id: `${platform}-${variant.key}`,
    platform,
    productKey: variant.key,
    title: variant.title,
    brand: variant.brand,
    category: variant.category,
    price,
    mrp,
    discountPct,
    rating,
    reviewCount,
    inStock,
    deliveryEta: formatDeliveryEta(deliveryHours),
    deliveryHours: Math.round(deliveryHours * 10) / 10,
    deliveryFee,
    offer: rng.float() < 0.5 ? rng.pick(offers) : undefined,
    unitPrice,
    url: platformSearchUrl(platform, variant.title),
  };
}

function makeAdapter(id: PlatformId): PlatformAdapter {
  return {
    id,
    async search(product, location) {
      const info = PLATFORMS[id];
      const variants = generateVariants(product);
      const category = variants[0]?.category ?? "general";
      if (!info.categories.includes(category)) return [];

      const svc = platformServiceability(id, location);
      if (!svc.serviceable) return [];

      // Simulate network latency so the UI's loading states are honest.
      await new Promise((r) => setTimeout(r, new Rng(`lat:${id}:${product}`).int(80, 350)));

      return variants
        .map((v) => buildListing(id, v, product, svc))
        .filter((l): l is Listing => l !== null);
    },
  };
}

export const ADAPTERS: PlatformAdapter[] = ALL_PLATFORM_IDS.map(makeAdapter);
