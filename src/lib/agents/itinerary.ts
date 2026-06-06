// Itinerary Generator agent: merges attraction + pit stops into one ordered
// timeline, computing ETAs (driving time + accumulated stop durations).

import type {
  PlannedStop,
  RouteResult,
  TimelineEntry,
  VehiclePlan,
  WeatherData,
} from "@/lib/domain/types";
import type { RoutePreference, VehicleType } from "@/lib/domain/types";
import { routeExperienceScore } from "./scoring";

function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatClock(minutesOfDay: number): string {
  const total = ((minutesOfDay % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function buildVehiclePlan(args: {
  route: RouteResult;
  attractions: PlannedStop[];
  pitStops: PlannedStop[];
  departureTime: string;
  weather: WeatherData;
  preference: RoutePreference;
  vehicle: VehicleType;
}): VehiclePlan {
  const { route, attractions, pitStops, departureTime, weather, preference, vehicle } =
    args;

  // Merge and order all stops by distance from start.
  const stops = [...attractions, ...pitStops].sort(
    (a, b) => a.distanceFromStartKm - b.distanceFromStartKm,
  );

  const drivingPerKm = route.distanceKm > 0 ? route.durationMin / route.distanceKm : 1;
  let accumulatedStopMin = 0;
  let prevDist = 0;
  for (const s of stops) {
    s.distanceFromPrevKm = Math.max(0, Math.round(s.distanceFromStartKm - prevDist));
    s.etaMinutesFromStart = Math.round(
      s.distanceFromStartKm * drivingPerKm + accumulatedStopMin,
    );
    accumulatedStopMin += s.suggestedDurationMin;
    prevDist = s.distanceFromStartKm;
  }

  const totalTripMinutes = Math.round(route.durationMin + accumulatedStopMin);
  const depMin = parseTime(departureTime);

  const timeline: TimelineEntry[] = [
    { time: formatClock(depMin), label: "Start", kind: "start" },
    ...stops.map((s) => ({
      time: formatClock(depMin + s.etaMinutesFromStart),
      label: s.name,
      kind: s.kind,
    })),
    {
      time: formatClock(depMin + totalTripMinutes),
      label: "Arrive at destination",
      kind: "destination" as const,
    },
  ];

  const experienceScore = routeExperienceScore({
    attractions,
    foodStops: pitStops.filter((p) => p.kind === "food" || p.kind === "rider_cafe"),
    fuelStops: pitStops.filter((p) => p.kind === "fuel").length,
    vehicle,
    preference,
    weather,
    distanceKm: route.distanceKm,
  });

  return { vehicle, route, stops, timeline, experienceScore, totalTripMinutes };
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
