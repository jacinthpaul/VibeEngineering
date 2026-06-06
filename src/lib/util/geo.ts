import type { Coordinates } from "@/lib/domain/types";

const R = 6371; // Earth radius, km

function toRad(d: number): number {
  return (d * Math.PI) / 180;
}

/** Great-circle distance in km. */
export function haversineKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Linear interpolation between two coordinates (t in [0,1]). */
export function lerpCoord(a: Coordinates, b: Coordinates, t: number): Coordinates {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/**
 * Sample a point at fraction `t` along a polyline by arc length, optionally
 * offset perpendicular to the local direction by `offsetKm` (signed).
 */
export function pointAlongPath(
  path: Coordinates[],
  t: number,
  offsetKm = 0,
): Coordinates {
  if (path.length === 0) return { lat: 0, lng: 0 };
  if (path.length === 1) return path[0];

  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = haversineKm(path[i], path[i + 1]);
    segLens.push(d);
    total += d;
  }
  const target = Math.max(0, Math.min(1, t)) * total;

  let acc = 0;
  let idx = 0;
  let localT = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target || i === segLens.length - 1) {
      idx = i;
      localT = segLens[i] === 0 ? 0 : (target - acc) / segLens[i];
      break;
    }
    acc += segLens[i];
  }

  const p = lerpCoord(path[idx], path[idx + 1], localT);
  if (offsetKm === 0) return p;

  // Perpendicular offset: rotate the segment direction by 90°.
  const dLat = path[idx + 1].lat - path[idx].lat;
  const dLng = path[idx + 1].lng - path[idx].lng;
  const len = Math.hypot(dLat, dLng) || 1;
  const perpLat = -dLng / len;
  const perpLng = dLat / len;
  const degPerKm = 1 / 111; // rough
  return {
    lat: p.lat + perpLat * offsetKm * degPerKm,
    lng: p.lng + perpLng * offsetKm * degPerKm,
  };
}
