// Core domain types for PricePulse — multi-platform price comparison.

export type PlatformId =
  | "amazon"
  | "flipkart"
  | "bigbasket"
  | "blinkit"
  | "jiomart"
  | "croma";

export type ProductCategory = "grocery" | "electronics" | "fashion" | "general";

export interface PlatformInfo {
  id: PlatformId;
  name: string;
  /** Tailwind-friendly accent color for badges/chips. */
  color: string;
  /** Categories the platform actually sells. */
  categories: ProductCategory[];
  tagline: string;
}

export interface SearchQuery {
  /** Free-text product, e.g. "iPhone 15" or "Amul butter 500g". */
  product: string;
  /** City name or 6-digit pincode. */
  location: string;
}

export interface LocationInfo {
  /** Normalized display name, e.g. "Bengaluru". */
  city: string;
  /** 1 = metro, 2 = tier-2 city, 3 = everywhere else. */
  tier: 1 | 2 | 3;
  /** Whether we matched a known city (vs falling back to tier 3). */
  recognized: boolean;
}

export interface Listing {
  id: string;
  platform: PlatformId;
  /** Stable key shared by the same product variant across platforms. */
  productKey: string;
  title: string;
  brand: string;
  category: ProductCategory;
  /** Final price in INR after discount. */
  price: number;
  /** Original list price (MRP) in INR. */
  mrp: number;
  /** Percent off MRP, 0 when no discount. */
  discountPct: number;
  /** Average rating 1–5, one decimal. */
  rating: number;
  reviewCount: number;
  inStock: boolean;
  /** Human-readable delivery estimate, e.g. "12 min" or "2–3 days". */
  deliveryEta: string;
  /** Delivery time in hours, used for sorting/scoring. */
  deliveryHours: number;
  deliveryFee: number;
  /** Platform offer text, if any. */
  offer?: string;
  /** Unit-normalized price for groceries, e.g. "₹62.50 / 100g". */
  unitPrice?: string;
  /** Deep-link style URL to the product search on the platform. */
  url: string;
}

export interface PlatformStatus {
  platform: PlatformId;
  /** Whether the platform delivers to the queried location at all. */
  serviceable: boolean;
  /** Why not, when unserviceable (e.g. "Not available outside metro cities"). */
  note?: string;
  listingCount: number;
}

export type BadgeKind = "best-pick" | "lowest-price" | "top-rated" | "fastest-delivery" | "best-value";

export interface Recommendation {
  listingId: string;
  kind: BadgeKind;
  /** Composite score 0–100 (only meaningful for best-pick / best-value). */
  score: number;
  reason: string;
}

export interface SearchResult {
  query: SearchQuery;
  location: LocationInfo;
  category: ProductCategory;
  listings: Listing[];
  platforms: PlatformStatus[];
  recommendations: Recommendation[];
  /** Overall best-pick summary paragraph. */
  verdict: string;
  generatedAt: string;
}
