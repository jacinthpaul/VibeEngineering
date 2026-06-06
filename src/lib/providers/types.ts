// Provider interfaces — the seam between the agent pipeline and the outside
// world. Mock implementations live in ./mock; real Google Maps / Claude /
// weather implementations can be added later behind these same interfaces.

import type {
  Coordinates,
  GeoPlace,
  RoutePreference,
  RouteResult,
  TravelBrief,
  TravelResearch,
  VehicleType,
  WeatherData,
} from "@/lib/domain/types";

export interface GeocodeProvider {
  geocode(query: string): Promise<GeoPlace>;
}

export interface RoutingProvider {
  route(
    from: GeoPlace,
    to: GeoPlace,
    preference: RoutePreference,
    vehicle: VehicleType,
  ): Promise<RouteResult>;
}

/** A raw place candidate before scoring/enrichment by the Scoring agent. */
export interface RawAttraction {
  id: string;
  name: string;
  category: string;
  coordinates: Coordinates;
  distanceFromStartKm: number;
  detourKm: number;
  googleRating: number;
  reviewCount: number;
  blogMentions: number;
  scenicValue: number; // 0-100
  socialPopularity: number; // 0-100
  summary: string;
}

export interface PlacesProvider {
  discoverAttractions(args: {
    path: Coordinates[];
    distanceKm: number;
    categories: string[];
    maxDetourKm: number;
    seed: string;
  }): Promise<RawAttraction[]>;
}

export interface WeatherProvider {
  getWeather(coords: Coordinates, date: string): Promise<WeatherData>;
}

export interface LlmProvider {
  travelResearch(start: GeoPlace, destination: GeoPlace): Promise<TravelResearch>;
  travelBrief(input: {
    start: GeoPlace;
    destination: GeoPlace;
    distanceKm: number;
    travelTimeText: string;
    bestStops: string[];
    weather: WeatherData;
  }): Promise<TravelBrief>;
}

export interface Providers {
  geocode: GeocodeProvider;
  routing: RoutingProvider;
  places: PlacesProvider;
  weather: WeatherProvider;
  llm: LlmProvider;
  /** True when these are mock providers. */
  isMock: boolean;
}
