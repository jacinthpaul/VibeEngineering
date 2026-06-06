import type { Coordinates } from "@/lib/domain/types";

// A small gazetteer so the well-known PRD examples resolve to real-ish
// coordinates. Anything not listed is hashed into a point inside India.
export const KNOWN_PLACES: Record<string, { name: string; coords: Coordinates }> =
  {
    hyderabad: { name: "Hyderabad, Telangana", coords: { lat: 17.385, lng: 78.4867 } },
    "hyderabad airport": {
      name: "Rajiv Gandhi Intl Airport, Hyderabad",
      coords: { lat: 17.2403, lng: 78.4294 },
    },
    "my current location": {
      name: "Hyderabad, Telangana",
      coords: { lat: 17.385, lng: 78.4867 },
    },
    goa: { name: "Goa", coords: { lat: 15.2993, lng: 74.124 } },
    "araku valley": {
      name: "Araku Valley, Andhra Pradesh",
      coords: { lat: 18.3273, lng: 82.8754 },
    },
    ooty: { name: "Ooty, Tamil Nadu", coords: { lat: 11.4102, lng: 76.695 } },
    bangalore: { name: "Bengaluru, Karnataka", coords: { lat: 12.9716, lng: 77.5946 } },
    bengaluru: { name: "Bengaluru, Karnataka", coords: { lat: 12.9716, lng: 77.5946 } },
    chennai: { name: "Chennai, Tamil Nadu", coords: { lat: 13.0827, lng: 80.2707 } },
    mumbai: { name: "Mumbai, Maharashtra", coords: { lat: 19.076, lng: 72.8777 } },
    pune: { name: "Pune, Maharashtra", coords: { lat: 18.5204, lng: 73.8567 } },
    gandikota: {
      name: "Gandikota, Andhra Pradesh",
      coords: { lat: 14.8164, lng: 78.2865 },
    },
    vizag: { name: "Visakhapatnam, Andhra Pradesh", coords: { lat: 17.6868, lng: 83.2185 } },
    visakhapatnam: {
      name: "Visakhapatnam, Andhra Pradesh",
      coords: { lat: 17.6868, lng: 83.2185 },
    },
    coorg: { name: "Coorg, Karnataka", coords: { lat: 12.3375, lng: 75.8069 } },
    munnar: { name: "Munnar, Kerala", coords: { lat: 10.0889, lng: 77.0595 } },
  };

// Evocative place-name fragments used to synthesize attraction names.
export const NAME_FRAGMENTS = [
  "Gandi",
  "Nagar",
  "Belum",
  "Talakona",
  "Horsley",
  "Ethipothala",
  "Kuntala",
  "Pochera",
  "Nelapattu",
  "Ananthagiri",
  "Borra",
  "Lambasingi",
  "Maredumilli",
  "Papikondalu",
  "Tirumala",
  "Srisailam",
  "Mahabub",
  "Bhongir",
  "Warangal",
  "Medak",
];

// Per-category templates: how to build a name + a stock review summary.
export const CATEGORY_TEMPLATES: Record<
  string,
  { suffix: string; summary: string }
> = {
  waterfalls: { suffix: "Waterfalls", summary: "Powerful monsoon-fed cascade, slippery rocks." },
  lakes: { suffix: "Lake", summary: "Calm lake, great for sunrise photos and boating." },
  dams: { suffix: "Dam", summary: "Massive reservoir with sweeping backwater views." },
  forests: { suffix: "Reserve Forest", summary: "Dense canopy drive, occasional wildlife." },
  viewpoints: { suffix: "Viewpoint", summary: "Panoramic valley vista, windy and cool." },
  sunset_points: { suffix: "Sunset Point", summary: "Famous golden-hour spot, gets crowded." },
  sunrise_points: { suffix: "Sunrise Point", summary: "Early climb rewarded with a sea of clouds." },
  forts: { suffix: "Fort", summary: "Hilltop ruins with layered history and ramparts." },
  palaces: { suffix: "Palace", summary: "Ornate royal architecture, guided tours available." },
  monuments: { suffix: "Monument", summary: "Heritage structure, well-preserved carvings." },
  temples: { suffix: "Temple", summary: "Ancient temple, vibrant during festivals." },
  churches: { suffix: "Church", summary: "Colonial-era church with quiet courtyards." },
  mosques: { suffix: "Masjid", summary: "Historic mosque with intricate stonework." },
  trekking: { suffix: "Trek Base", summary: "Moderate trail, carry water and start early." },
  river_rafting: { suffix: "Rafting Point", summary: "Grade II-III rapids, seasonal operations." },
  camping: { suffix: "Campsite", summary: "Riverside camping, bonfire and stargazing." },
  restaurants: { suffix: "Dhaba", summary: "Legendary highway dhaba, generous thalis." },
  local_specialties: { suffix: "Food Street", summary: "Regional specialties you won't find elsewhere." },
  cafes: { suffix: "Cafe", summary: "Cozy rider cafe with strong coffee and parking." },
  instagram_spots: { suffix: "Photo Point", summary: "Iconic frame, best light in early morning." },
};

// Service-stop name pools for the Pit Stop Discovery agent.
export const FUEL_BRANDS = ["IndianOil", "HP", "Bharat Petroleum", "Shell", "Reliance"];
export const TEA_NAMES = ["Highway Chai Point", "Roadside Tea Stall", "Irani Chai Corner"];
export const RIDER_CAFE_NAMES = ["Rider's Rest Cafe", "Throttle Cafe", "Milestone Cafe"];
export const FAMILY_RESTAURANTS = [
  "Sagar Family Restaurant",
  "Highway Kings Multicuisine",
  "Annapurna Food Court",
];
