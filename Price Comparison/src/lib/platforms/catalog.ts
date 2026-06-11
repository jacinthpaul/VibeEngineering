// Deterministic demo catalog. Real marketplaces block automated scraping and
// offer no public search APIs, so listings are synthesized — seeded by the
// query so results are stable — behind the same shape a live adapter
// (affiliate API / partner feed) would return. See README for wiring real data.

import type { ProductCategory } from "@/lib/domain/types";
import { Rng, hashString } from "@/lib/util/rng";

const GROCERY_WORDS = [
  "milk", "butter", "ghee", "paneer", "curd", "yogurt", "bread", "egg",
  "rice", "atta", "flour", "dal", "oil", "sugar", "salt", "tea", "coffee",
  "biscuit", "chips", "chocolate", "juice", "fruit", "vegetable", "onion",
  "tomato", "potato", "masala", "spice", "snack", "noodle", "pasta", "honey",
  "jam", "cereal", "oats", "shampoo", "soap", "detergent", "toothpaste",
];

const ELECTRONICS_WORDS = [
  "iphone", "phone", "smartphone", "mobile", "laptop", "macbook", "tablet",
  "ipad", "tv", "television", "headphone", "earbud", "earphone", "airpods",
  "speaker", "camera", "watch", "smartwatch", "monitor", "keyboard", "mouse",
  "router", "charger", "powerbank", "console", "playstation", "xbox",
  "refrigerator", "fridge", "washing machine", "microwave", "ac ", "air conditioner",
];

const FASHION_WORDS = [
  "shirt", "tshirt", "t-shirt", "jeans", "trouser", "dress", "kurta", "saree",
  "shoe", "sneaker", "sandal", "jacket", "hoodie", "cap", "sock", "belt", "bag",
];

export function inferCategory(product: string): ProductCategory {
  const p = ` ${product.toLowerCase()} `;
  if (ELECTRONICS_WORDS.some((w) => p.includes(w))) return "electronics";
  if (GROCERY_WORDS.some((w) => p.includes(w))) return "grocery";
  if (FASHION_WORDS.some((w) => p.includes(w))) return "fashion";
  return "general";
}

const BRANDS: Record<ProductCategory, string[]> = {
  grocery: ["Amul", "Mother Dairy", "Nestlé", "Tata", "Fortune", "Aashirvaad", "Britannia", "Patanjali"],
  electronics: ["Samsung", "Apple", "OnePlus", "Sony", "boAt", "LG", "Xiaomi", "HP"],
  fashion: ["Levi's", "H&M", "Allen Solly", "Puma", "Roadster", "U.S. Polo", "Nike", "Zara"],
  general: ["Milton", "Cello", "Philips", "Prestige", "Wipro", "Bajaj", "Pigeon", "Solimo"],
};

const GROCERY_SOLID_SIZES = ["100g", "200g", "500g", "1kg", "2kg"];
const GROCERY_LIQUID_SIZES = ["200ml", "500ml", "1L", "2L"];
const LIQUID_WORDS = ["milk", "oil", "juice", "shampoo", "honey", "ghee"];
const ELECTRONICS_VARIANTS = ["64GB", "128GB", "256GB", "Black", "Blue", "Silver", "2026 model"];
const FASHION_VARIANTS = ["S", "M", "L", "XL", "Slim Fit", "Regular Fit"];
const GENERAL_VARIANTS = ["Standard", "Pro", "Plus", "Classic", "Compact"];

/** Whether the query already names a known brand (then we don't prefix one). */
function detectBrand(product: string, category: ProductCategory): string | null {
  const p = product.toLowerCase();
  for (const brands of Object.values(BRANDS)) {
    for (const b of brands) {
      if (p.includes(b.toLowerCase())) return b;
    }
  }
  // Common brands outside our pools that shoppers type a lot.
  const extra = ["apple", "iphone", "macbook", "amul", "maggi", "dettol", "colgate", "adidas"];
  const hit = extra.find((b) => p.includes(b));
  if (hit === "iphone" || hit === "macbook") return "Apple";
  if (hit) return hit[0].toUpperCase() + hit.slice(1);
  void category;
  return null;
}

export interface ProductVariant {
  /** Stable key shared across platforms for the same variant. */
  key: string;
  title: string;
  brand: string;
  category: ProductCategory;
  /** Base market price in INR; platforms apply their own spread on top. */
  basePrice: number;
  /** Grams or ml for groceries, used for unit-price math. */
  unitAmount?: number;
  unitLabel?: string;
}

// Big-ticket vs accessory electronics get realistic price bands.
const PREMIUM_ELECTRONICS = [
  "iphone", "macbook", "laptop", "tv", "television", "refrigerator", "fridge",
  "washing machine", "air conditioner", "ac ", "playstation", "xbox", "camera", "ipad",
];
const BUDGET_ELECTRONICS = [
  "charger", "cable", "mouse", "keyboard", "earphone", "earbud", "powerbank", "router",
];

function basePriceFor(category: ProductCategory, rng: Rng, product: string): number {
  switch (category) {
    case "grocery":
      return Math.round(rng.range(40, 800));
    case "electronics": {
      const p = ` ${product.toLowerCase()} `;
      const [lo, hi] = PREMIUM_ELECTRONICS.some((w) => p.includes(w))
        ? [25000, 150000]
        : BUDGET_ELECTRONICS.some((w) => p.includes(w))
          ? [300, 4000]
          : [1500, 50000];
      return Math.round(rng.range(lo, hi) / 100) * 100 - 1; // ₹x,x99 style
    }
    case "fashion":
      return Math.round(rng.range(400, 4000) / 10) * 10 - 1;
    case "general":
      return Math.round(rng.range(200, 5000) / 10) * 10 - 1;
  }
}

function parseSize(size: string): { amount: number; label: string } | null {
  const m = size.match(/^(\d+)(g|kg|ml|L)$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2] === "kg") return { amount: n * 1000, label: "g" };
  if (m[2] === "L") return { amount: n * 1000, label: "ml" };
  return { amount: n, label: m[2] };
}

/** Generate 3–5 similar product variants for a query, deterministic per query. */
export function generateVariants(product: string): ProductVariant[] {
  const category = inferCategory(product);
  const rng = new Rng(`variants:${product.toLowerCase().trim()}`);
  const namedBrand = detectBrand(product, category);
  const count = rng.int(3, 5);

  const grocerySizes = LIQUID_WORDS.some((w) => product.toLowerCase().includes(w))
    ? GROCERY_LIQUID_SIZES
    : GROCERY_SOLID_SIZES;
  const pool =
    category === "grocery" ? grocerySizes
    : category === "electronics" ? ELECTRONICS_VARIANTS
    : category === "fashion" ? FASHION_VARIANTS
    : GENERAL_VARIANTS;
  const suffixes = rng.shuffle(pool).slice(0, count);
  const brands = rng.shuffle(BRANDS[category]);

  // Clean display name: title-case the query once.
  const display = product.trim().replace(/\s+/g, " ").replace(/\w\S*/g, (w) =>
    w.length > 2 && w === w.toLowerCase() ? w[0].toUpperCase() + w.slice(1) : w,
  );

  return suffixes.map((suffix, i) => {
    const brand = namedBrand ?? brands[i % brands.length];
    const title = namedBrand
      ? `${display} (${suffix})`
      : `${brand} ${display} (${suffix})`;
    const variantRng = new Rng(`variant:${product.toLowerCase()}:${suffix}`);
    const size = category === "grocery" ? parseSize(suffix) : null;
    let basePrice = basePriceFor(category, variantRng, product);
    // Larger grocery packs cost proportionally more.
    if (size) basePrice = Math.max(20, Math.round((basePrice / 500) * size.amount));
    return {
      key: `${hashString(title.toLowerCase())}`,
      title,
      brand,
      category,
      basePrice,
      unitAmount: size?.amount,
      unitLabel: size?.label,
    };
  });
}
