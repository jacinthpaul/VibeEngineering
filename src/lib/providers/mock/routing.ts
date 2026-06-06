import type {
  Coordinates,
  GeoPlace,
  RoutePreference,
  RouteResult,
  VehicleType,
} from "@/lib/domain/types";
import type { RoutingProvider } from "@/lib/providers/types";
import { haversineKm, lerpCoord } from "@/lib/util/geo";
import { Rng } from "@/lib/util/rng";

// How much longer the road is than the straight line, per preference.
const ROAD_FACTOR: Record<RoutePreference, number> = {
  fastest: 1.18,
  balanced: 1.28,
  scenic: 1.4,
  explorer: 1.52,
};

// Average road speed (km/h) by vehicle + preference.
function avgSpeed(vehicle: VehicleType, pref: RoutePreference): number {
  const base = vehicle === "motorcycle" ? 52 : 60;
  const adj =
    pref === "fastest" ? 8 : pref === "scenic" ? -10 : pref === "explorer" ? -14 : 0;
  return base + adj;
}

const FUEL_EFFICIENCY = { motorcycle: 38, car: 15 }; // km/l
const FUEL_PRICE = 105; // INR/l

function buildPath(
  from: Coordinates,
  to: Coordinates,
  pref: RoutePreference,
  seed: string,
): Coordinates[] {
  const rng = new Rng("path:" + seed);
  const n = 64;
  // Curviness: scenic/explorer routes wiggle more.
  const amp =
    pref === "scenic" ? 0.06 : pref === "explorer" ? 0.08 : pref === "balanced" ? 0.035 : 0.018;
  const phase = rng.range(0, Math.PI);
  const path: Coordinates[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const base = lerpCoord(from, to, t);
    // Lateral sinusoidal jitter so the line reads like a road, zero at ends.
    const envelope = Math.sin(Math.PI * t);
    const wob = Math.sin(t * Math.PI * 3 + phase) * amp * envelope;
    path.push({
      lat: Number((base.lat + wob).toFixed(5)),
      lng: Number((base.lng - wob * 0.6).toFixed(5)),
    });
  }
  return path;
}

export const mockRouting: RoutingProvider = {
  async route(
    from: GeoPlace,
    to: GeoPlace,
    preference: RoutePreference,
    vehicle: VehicleType,
  ): Promise<RouteResult> {
    const seed = `${from.name}->${to.name}:${preference}:${vehicle}`;
    const straight = haversineKm(from.coordinates, to.coordinates);
    const distanceKm = Math.round(straight * ROAD_FACTOR[preference]);
    const speed = avgSpeed(vehicle, preference);
    const durationMin = Math.round((distanceKm / speed) * 60);

    const path = buildPath(from.coordinates, to.coordinates, preference, seed);

    const liters = distanceKm / FUEL_EFFICIENCY[vehicle];
    const fuelCost = Math.round(liters * FUEL_PRICE);
    // Two-wheelers are toll-exempt on Indian highways.
    const tollCost =
      vehicle === "motorcycle"
        ? 0
        : Math.round(distanceKm * (preference === "fastest" ? 1.6 : 1.1));

    return {
      vehicle,
      distanceKm,
      durationMin,
      path,
      fuelEstimate: {
        liters: Number(liters.toFixed(1)),
        cost: fuelCost,
        currency: "INR",
      },
      tollEstimate: { cost: tollCost, currency: "INR" },
    };
  },
};
