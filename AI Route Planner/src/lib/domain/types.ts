// Core domain model for the AI Route Planner.
// These types are provider-agnostic: mock providers and (later) real
// Google Maps / Claude / Weather providers both produce the same shapes.

export type VehicleType = "motorcycle" | "car";
export type VehicleSelection = VehicleType | "both";

export type RoutePreference = "fastest" | "scenic" | "balanced" | "explorer";

export interface StopFrequency {
  mode: "auto" | "custom";
  /** Only used when mode === "custom". */
  unit?: "time" | "distance";
  everyMinutes?: number; // 60 | 120
  everyKm?: number; // 100 | 150
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoPlace {
  name: string;
  address: string;
  coordinates: Coordinates;
}

export interface TripRequest {
  start: string;
  destination: string;
  vehicle: VehicleSelection;
  /** ISO date, e.g. "2026-06-20". */
  date: string;
  /** "HH:mm" local departure time. */
  departureTime: string;
  routePreference: RoutePreference;
  stopFrequency: StopFrequency;
  maxDetourKm: number;
  /** Selected attraction category ids (see categories.ts). */
  categories: string[];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export interface ScoreFactor {
  label: string;
  weightPct: number;
  /** 0-100 normalized contribution input. */
  value: number;
}

export interface WorthVisitingScore {
  total: number; // 0-100
  factors: ScoreFactor[];
  reasons: string[];
}

export interface ExperienceScore {
  total: number; // 0-10
  metrics: ScoreFactor[];
}

// ---------------------------------------------------------------------------
// Stops & attractions
// ---------------------------------------------------------------------------

export type StopKind =
  | "fuel"
  | "tea"
  | "food"
  | "rider_cafe"
  | "rest"
  | "repair"
  | "hospital"
  | "attraction";

export interface PlannedStop {
  id: string;
  name: string;
  kind: StopKind;
  /** Category id for attractions; undefined for service stops. */
  category?: string;
  coordinates: Coordinates;
  distanceFromStartKm: number;
  distanceFromPrevKm: number;
  detourKm: number;
  etaMinutesFromStart: number;
  suggestedDurationMin: number;
  googleRating: number;
  reviewCount: number;
  reviewSummary: string;
  whyRecommended: string;
  vehicleSuitability: string;
  weatherImpact: string;
  worthVisiting?: WorthVisitingScore;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export interface RouteResult {
  vehicle: VehicleType;
  distanceKm: number;
  /** Pure driving time, minutes. */
  durationMin: number;
  path: Coordinates[];
  fuelEstimate: { liters: number; cost: number; currency: string };
  tollEstimate: { cost: number; currency: string };
}

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export interface DailyWeather {
  date: string;
  tempMinC: number;
  tempMaxC: number;
  rainfallMm: number;
  rainChancePct: number;
  windKph: number;
  condition: string;
}

export interface WeatherData {
  historical: DailyWeather[]; // last 7 days
  forecast: DailyWeather[]; // next 7 days
  summary: string;
  riderRisk: "Low" | "Medium" | "High";
  weatherScore: number; // 0-100
}

// ---------------------------------------------------------------------------
// Travel research (blog intelligence)
// ---------------------------------------------------------------------------

export interface TravelResearch {
  mustVisit: string[];
  hiddenGems: string[];
  localFood: string[];
  scenicRoads: string[];
  touristTraps: string[];
  seasonalAdvice: string;
  blogMentionCount: number;
  summary: string;
}

// ---------------------------------------------------------------------------
// Itinerary output
// ---------------------------------------------------------------------------

export interface TimelineEntry {
  time: string; // "HH:mm"
  label: string;
  kind: StopKind | "start" | "destination";
}

export interface VehiclePlan {
  vehicle: VehicleType;
  route: RouteResult;
  stops: PlannedStop[];
  timeline: TimelineEntry[];
  experienceScore: ExperienceScore;
  /** Driving time + stop durations, minutes. */
  totalTripMinutes: number;
}

export interface TravelBrief {
  summary: string;
  distanceKm: number;
  travelTimeText: string;
  bestStops: string[];
  weatherNote: string;
  recommendation: string;
}

export interface ComparisonRow {
  metric: string;
  motorcycle: string;
  car: string;
}

export interface PlanResult {
  request: TripRequest;
  startPlace: GeoPlace;
  destinationPlace: GeoPlace;
  vehiclePlans: VehiclePlan[];
  weather: WeatherData;
  travelResearch: TravelResearch;
  brief: TravelBrief;
  comparison?: ComparisonRow[];
  generatedAt: string;
  /** True when map/route/place data comes from mock providers. */
  usingMockData: boolean;
  /** True when the narrative text was generated by the real Claude API. */
  aiLive: boolean;
  /** Set when a live AI run was requested but failed (fell back to mock text). */
  aiError?: string;
}
