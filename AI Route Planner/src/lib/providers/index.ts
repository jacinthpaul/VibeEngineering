import type { Providers } from "./types";
import { mockGeocode } from "./mock/geocode";
import { mockRouting } from "./mock/routing";
import { mockPlaces } from "./mock/places";
import { mockWeather } from "./mock/weather";
import { mockLlm } from "./mock/llm";
import { createClaudeLlm } from "./claude/llm";

export interface ProviderOptions {
  /** User-supplied Anthropic API key; enables the real Claude LLM provider. */
  anthropicKey?: string;
}

/**
 * Returns the active provider set.
 *
 * Map/route/place/weather are mock today. The LLM provider becomes the real
 * Claude API when an Anthropic key is supplied (from the Setup panel or the
 * ANTHROPIC_API_KEY env var). When real Google Maps / weather keys are added,
 * branch here the same way — the agent pipeline only depends on the interfaces.
 */
export function getProviders(opts: ProviderOptions = {}): Providers {
  const anthropicKey = opts.anthropicKey || process.env.ANTHROPIC_API_KEY;
  const aiLive = Boolean(anthropicKey);

  return {
    geocode: mockGeocode,
    routing: mockRouting,
    places: mockPlaces,
    weather: mockWeather,
    llm: aiLive ? createClaudeLlm(anthropicKey!) : mockLlm,
    isMock: true,
    aiLive,
  };
}
