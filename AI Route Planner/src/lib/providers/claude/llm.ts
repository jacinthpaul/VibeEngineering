import Anthropic from "@anthropic-ai/sdk";
import type {
  GeoPlace,
  TravelBrief,
  TravelResearch,
  WeatherData,
} from "@/lib/domain/types";
import type { LlmProvider } from "@/lib/providers/types";

// Real LLM provider backed by the Claude API. Implements the same LlmProvider
// interface as the mock, so the pipeline is unchanged. Used when the user has
// supplied an Anthropic API key via the Setup panel.

const MODEL = "claude-opus-4-8";

const RESEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    mustVisit: { type: "array", items: { type: "string" } },
    hiddenGems: { type: "array", items: { type: "string" } },
    localFood: { type: "array", items: { type: "string" } },
    scenicRoads: { type: "array", items: { type: "string" } },
    touristTraps: { type: "array", items: { type: "string" } },
    seasonalAdvice: { type: "string" },
    blogMentionCount: { type: "integer" },
    summary: { type: "string" },
  },
  required: [
    "mustVisit",
    "hiddenGems",
    "localFood",
    "scenicRoads",
    "touristTraps",
    "seasonalAdvice",
    "blogMentionCount",
    "summary",
  ],
} as const;

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    recommendation: { type: "string" },
  },
  required: ["summary", "recommendation"],
} as const;

function firstJson<T>(message: Anthropic.Message): T {
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content.");
  }
  return JSON.parse(block.text) as T;
}

export function createClaudeLlm(apiKey: string): LlmProvider {
  const client = new Anthropic({ apiKey });

  return {
    async travelResearch(
      start: GeoPlace,
      destination: GeoPlace,
    ): Promise<TravelResearch> {
      const from = start.name.split(",")[0];
      const to = destination.name.split(",")[0];
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: "json_schema", schema: RESEARCH_SCHEMA } },
        messages: [
          {
            role: "user",
            content:
              `You are a road-trip research assistant. A traveller is driving from ${from} ` +
              `to ${to} (${start.name} -> ${destination.name}). Drawing on what travel blogs, ` +
              `guides and road-trip sites typically say about this corridor, produce concise, ` +
              `specific recommendations. Keep each list to 2-4 short entries. "summary" should ` +
              `be one sentence naming the single most worthwhile detour and roughly how many ` +
              `blogs mention it; set blogMentionCount to that number.`,
          },
        ],
      });
      return firstJson<TravelResearch>(message);
    },

    async travelBrief({
      start,
      destination,
      distanceKm,
      travelTimeText,
      bestStops,
      weather,
    }: {
      start: GeoPlace;
      destination: GeoPlace;
      distanceKm: number;
      travelTimeText: string;
      bestStops: string[];
      weather: WeatherData;
    }): Promise<TravelBrief> {
      const from = start.name.split(",")[0];
      const to = destination.name.split(",")[0];
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        output_config: { format: { type: "json_schema", schema: BRIEF_SCHEMA } },
        messages: [
          {
            role: "user",
            content:
              `Write a punchy road-trip brief for a drive from ${from} to ${to}. ` +
              `Facts: ${distanceKm} km, about ${travelTimeText} total. ` +
              `Best stops: ${bestStops.join(", ") || "none yet"}. ` +
              `Weather outlook: ${weather.summary} (rider risk: ${weather.riderRisk}). ` +
              `Return "summary": 1-2 sentences capturing the character of the trip, and ` +
              `"recommendation": one actionable sentence on timing/what to do given the weather.`,
          },
        ],
      });
      const out = firstJson<{ summary: string; recommendation: string }>(message);
      return {
        summary: out.summary,
        distanceKm,
        travelTimeText,
        bestStops,
        weatherNote: weather.summary,
        recommendation: out.recommendation,
      };
    },
  };
}
