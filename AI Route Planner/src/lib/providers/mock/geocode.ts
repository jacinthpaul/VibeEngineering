import type { GeoPlace } from "@/lib/domain/types";
import type { GeocodeProvider } from "@/lib/providers/types";
import { Rng } from "@/lib/util/rng";
import { KNOWN_PLACES } from "./data";

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

export const mockGeocode: GeocodeProvider = {
  async geocode(query: string): Promise<GeoPlace> {
    const key = query.trim().toLowerCase();
    const known = KNOWN_PLACES[key];
    if (known) {
      return { name: known.name, address: known.name, coordinates: known.coords };
    }
    // Deterministically hash unknown queries into a point inside India's bbox.
    const rng = new Rng("geo:" + key);
    const lat = rng.range(11, 25);
    const lng = rng.range(73, 84);
    const name = titleCase(query.trim()) || "Unknown";
    return {
      name,
      address: `${name} (approx.)`,
      coordinates: { lat: Number(lat.toFixed(4)), lng: Number(lng.toFixed(4)) },
    };
  },
};
