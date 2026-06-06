// Lightweight runtime validation/normalization of an incoming TripRequest.
// (No external schema lib to keep the dependency footprint minimal.)

import type { RoutePreference, TripRequest, VehicleSelection } from "./types";
import { ALL_CATEGORY_IDS } from "./categories";

const VEHICLES: VehicleSelection[] = ["motorcycle", "car", "both"];
const PREFS: RoutePreference[] = ["fastest", "scenic", "balanced", "explorer"];
const DETOURS = [5, 10, 20, 50];

export type ValidationResult =
  | { ok: true; value: TripRequest }
  | { ok: false; errors: string[] };

export function parseTripRequest(input: unknown): ValidationResult {
  const errors: string[] = [];
  const b = (input ?? {}) as Record<string, unknown>;

  const start = typeof b.start === "string" ? b.start.trim() : "";
  const destination = typeof b.destination === "string" ? b.destination.trim() : "";
  if (!start) errors.push("Start location is required.");
  if (!destination) errors.push("Destination is required.");

  const vehicle = VEHICLES.includes(b.vehicle as VehicleSelection)
    ? (b.vehicle as VehicleSelection)
    : "both";

  const routePreference = PREFS.includes(b.routePreference as RoutePreference)
    ? (b.routePreference as RoutePreference)
    : "balanced";

  const date =
    typeof b.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.date)
      ? b.date
      : new Date().toISOString().slice(0, 10);

  const departureTime =
    typeof b.departureTime === "string" && /^\d{2}:\d{2}$/.test(b.departureTime)
      ? b.departureTime
      : "06:00";

  const maxDetourKm = DETOURS.includes(Number(b.maxDetourKm))
    ? Number(b.maxDetourKm)
    : 10;

  const sf = (b.stopFrequency ?? {}) as Record<string, unknown>;
  const stopFrequency: TripRequest["stopFrequency"] =
    sf.mode === "custom"
      ? {
          mode: "custom",
          unit: sf.unit === "distance" ? "distance" : "time",
          everyMinutes: typeof sf.everyMinutes === "number" ? sf.everyMinutes : 120,
          everyKm: typeof sf.everyKm === "number" ? sf.everyKm : 100,
        }
      : { mode: "auto" };

  const categories = Array.isArray(b.categories)
    ? (b.categories as unknown[]).filter(
        (c): c is string => typeof c === "string" && ALL_CATEGORY_IDS.includes(c),
      )
    : ALL_CATEGORY_IDS;

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      start,
      destination,
      vehicle,
      date,
      departureTime,
      routePreference,
      stopFrequency,
      maxDetourKm,
      categories: categories.length ? categories : ALL_CATEGORY_IDS,
    },
  };
}
