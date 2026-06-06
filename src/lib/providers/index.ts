import type { Providers } from "./types";
import { mockGeocode } from "./mock/geocode";
import { mockRouting } from "./mock/routing";
import { mockPlaces } from "./mock/places";
import { mockWeather } from "./mock/weather";
import { mockLlm } from "./mock/llm";

/**
 * Returns the active provider set. Today this is always the mock set.
 *
 * When real API keys are added, branch here on env vars and return real
 * implementations (e.g. GoogleRoutingProvider, ClaudeLlmProvider). The agent
 * pipeline depends only on the Providers interface, so nothing else changes.
 */
export function getProviders(): Providers {
  return {
    geocode: mockGeocode,
    routing: mockRouting,
    places: mockPlaces,
    weather: mockWeather,
    llm: mockLlm,
    isMock: true,
  };
}
