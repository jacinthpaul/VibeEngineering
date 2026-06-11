import type { PlatformId, PlatformInfo } from "@/lib/domain/types";

export const PLATFORMS: Record<PlatformId, PlatformInfo> = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    color: "#ff9900",
    categories: ["grocery", "electronics", "fashion", "general"],
    tagline: "Everything store, pan-India delivery",
  },
  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    color: "#2874f0",
    categories: ["grocery", "electronics", "fashion", "general"],
    tagline: "India's homegrown marketplace",
  },
  bigbasket: {
    id: "bigbasket",
    name: "BigBasket",
    color: "#84c225",
    categories: ["grocery"],
    tagline: "Groceries, slotted & express delivery",
  },
  blinkit: {
    id: "blinkit",
    name: "Blinkit",
    color: "#f8cb46",
    categories: ["grocery", "general"],
    tagline: "10-minute quick commerce",
  },
  jiomart: {
    id: "jiomart",
    name: "JioMart",
    color: "#0c5273",
    categories: ["grocery", "electronics", "fashion", "general"],
    tagline: "Value pricing across categories",
  },
  croma: {
    id: "croma",
    name: "Croma",
    color: "#12daa8",
    categories: ["electronics"],
    tagline: "Electronics specialist with store backup",
  },
};

export const ALL_PLATFORM_IDS = Object.keys(PLATFORMS) as PlatformId[];

/** Search-results deep link for a product on each platform. */
export function platformSearchUrl(id: PlatformId, product: string): string {
  const q = encodeURIComponent(product);
  switch (id) {
    case "amazon":
      return `https://www.amazon.in/s?k=${q}`;
    case "flipkart":
      return `https://www.flipkart.com/search?q=${q}`;
    case "bigbasket":
      return `https://www.bigbasket.com/ps/?q=${q}`;
    case "blinkit":
      return `https://blinkit.com/s/?q=${q}`;
    case "jiomart":
      return `https://www.jiomart.com/search/${q}`;
    case "croma":
      return `https://www.croma.com/searchB?q=${q}`;
  }
}
