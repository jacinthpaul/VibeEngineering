import type { LocationInfo, PlatformId } from "@/lib/domain/types";

// City tiers drive which platforms can deliver and how fast. Quick-commerce
// (Blinkit) is metro-only; BigBasket reaches tier-2; marketplaces go anywhere.

const METROS = [
  "mumbai", "delhi", "new delhi", "bengaluru", "bangalore", "hyderabad",
  "chennai", "kolkata", "pune", "ahmedabad", "gurgaon", "gurugram", "noida",
];

const TIER2 = [
  "jaipur", "lucknow", "chandigarh", "kochi", "cochin", "indore", "nagpur",
  "coimbatore", "surat", "visakhapatnam", "vizag", "bhopal", "patna",
  "vadodara", "ludhiana", "agra", "nashik", "mysuru", "mysore", "kanpur",
  "thiruvananthapuram", "trivandrum", "bhubaneswar", "guwahati", "dehradun",
  "madurai", "varanasi", "rajkot", "amritsar", "ranchi", "raipur",
];

// Pincode first digit ➝ a representative region; first two digits of metro
// pincodes used for tier detection (e.g. 110xxx Delhi, 400xxx Mumbai,
// 560xxx Bengaluru, 500xxx Hyderabad, 600xxx Chennai, 700xxx Kolkata,
// 411xxx Pune, 380xxx Ahmedabad).
const METRO_PIN_PREFIXES: Record<string, string> = {
  "110": "Delhi", "400": "Mumbai", "560": "Bengaluru", "500": "Hyderabad",
  "600": "Chennai", "700": "Kolkata", "411": "Pune", "380": "Ahmedabad",
  "122": "Gurugram", "201": "Noida",
};

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase());
}

export function resolveLocation(raw: string): LocationInfo {
  const input = raw.trim();
  const pin = input.match(/^\d{6}$/) ? input : null;

  if (pin) {
    const prefix3 = pin.slice(0, 3);
    if (METRO_PIN_PREFIXES[prefix3]) {
      return { city: `${METRO_PIN_PREFIXES[prefix3]} (${pin})`, tier: 1, recognized: true };
    }
    return { city: `PIN ${pin}`, tier: 3, recognized: false };
  }

  const norm = input.toLowerCase().replace(/\s+/g, " ");
  if (METROS.some((c) => norm.includes(c))) {
    return { city: titleCase(input), tier: 1, recognized: true };
  }
  if (TIER2.some((c) => norm.includes(c))) {
    return { city: titleCase(input), tier: 2, recognized: true };
  }
  return { city: titleCase(input), tier: 3, recognized: false };
}

export interface Serviceability {
  serviceable: boolean;
  note?: string;
  /** Typical delivery window in hours [min, max] when serviceable. */
  deliveryHoursRange: [number, number];
  deliveryFeeRange: [number, number];
}

export function platformServiceability(platform: PlatformId, loc: LocationInfo): Serviceability {
  switch (platform) {
    case "blinkit":
      if (loc.tier === 1)
        return { serviceable: true, deliveryHoursRange: [0.15, 0.5], deliveryFeeRange: [0, 30] };
      return {
        serviceable: false,
        note: "Quick-commerce dark stores operate only in metro cities.",
        deliveryHoursRange: [0, 0],
        deliveryFeeRange: [0, 0],
      };
    case "bigbasket":
      if (loc.tier === 1)
        return { serviceable: true, deliveryHoursRange: [2, 24], deliveryFeeRange: [0, 50] };
      if (loc.tier === 2)
        return { serviceable: true, deliveryHoursRange: [12, 36], deliveryFeeRange: [20, 60] };
      return {
        serviceable: false,
        note: "BigBasket serves metro and tier-2 cities only.",
        deliveryHoursRange: [0, 0],
        deliveryFeeRange: [0, 0],
      };
    case "croma":
      if (loc.tier <= 2)
        return { serviceable: true, deliveryHoursRange: [24, 96], deliveryFeeRange: [0, 99] };
      return {
        serviceable: false,
        note: "Croma ships large electronics only where it has store coverage.",
        deliveryHoursRange: [0, 0],
        deliveryFeeRange: [0, 0],
      };
    case "amazon":
      return loc.tier === 1
        ? { serviceable: true, deliveryHoursRange: [12, 48], deliveryFeeRange: [0, 40] }
        : { serviceable: true, deliveryHoursRange: [48, 120], deliveryFeeRange: [0, 80] };
    case "flipkart":
      return loc.tier === 1
        ? { serviceable: true, deliveryHoursRange: [24, 72], deliveryFeeRange: [0, 40] }
        : { serviceable: true, deliveryHoursRange: [48, 144], deliveryFeeRange: [0, 80] };
    case "jiomart":
      return loc.tier <= 2
        ? { serviceable: true, deliveryHoursRange: [24, 72], deliveryFeeRange: [0, 40] }
        : { serviceable: true, deliveryHoursRange: [72, 168], deliveryFeeRange: [30, 90] };
  }
}

export function formatDeliveryEta(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours <= 4) return `${Math.round(hours)} hr${Math.round(hours) > 1 ? "s" : ""}`;
  if (hours <= 24) return "Today";
  const days = Math.ceil(hours / 24);
  if (days === 1) return "Tomorrow";
  return `${days - 1}–${days} days`;
}
