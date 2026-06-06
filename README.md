# Road Thrill — AI Route Planner

AI-powered road-trip planner for **motorcycles and cars**. Beyond navigation, it
discovers pit stops and hidden gems along a route, scores each with a *Worth
Visiting Score*, layers in weather + travel-blog intelligence, and generates a
full AI travel brief.

This is the **MVP thin end-to-end slice**: a complete pipeline from trip input to
a rich result, currently powered by **mock data providers** so it runs with zero
API keys. Real Google Maps / Claude / weather integrations drop in behind the
existing provider interfaces without touching the rest of the app.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
# or
npm run build && npm start
```

Type-check: `npx tsc --noEmit`  ·  Lint: `npx eslint .`

## Architecture

```
src/
  app/
    page.tsx              Home: trip form <-> results (client)
    api/plan/route.ts     POST /api/plan -> runs the pipeline
  components/
    TripForm.tsx          All PRD inputs (locations, vehicle, prefs, categories)
    PlanResults.tsx       Overview, timeline, scored stops, weather, research,
                          comparison, AI brief, export buttons
  lib/
    domain/               Types, category taxonomy, request validation
    util/                 Seedable RNG + geo math (haversine, path sampling)
    providers/            Provider INTERFACES + mock implementations
      types.ts            GeocodeProvider, RoutingProvider, PlacesProvider,
                          WeatherProvider, LlmProvider
      mock/               Deterministic mock data for each provider
      index.ts            getProviders() -- swap mock -> real here
    agents/               The 7 PRD agents + orchestrator
      pipeline.ts         planTrip(): geocode -> route -> discover -> score ->
                          itinerary -> research -> weather -> brief
      pitStops.ts, attractions.ts, scoring.ts, itinerary.ts implement the rest
      (routing lives in providers)
```

### The provider seam (how to go live)

Every external dependency sits behind an interface in `lib/providers/types.ts`.
`getProviders()` in `lib/providers/index.ts` returns the mock set today. To use
real services, implement the interfaces (e.g. `GoogleRoutingProvider`,
`ClaudeLlmProvider`, `OpenMeteoWeatherProvider`) and branch in `getProviders()`
on the relevant env vars. **No agent or UI code changes.**

Suggested env vars when wiring real APIs:

```
GOOGLE_MAPS_API_KEY=     # Directions, Places, Geocoding
ANTHROPIC_API_KEY=       # Claude -- research summaries, scoring rationale, brief
WEATHER_API_KEY=         # optional; Open-Meteo needs no key
```

### Scoring (from the PRD)

- **Worth Visiting Score /100** -- Google Rating 25%, Review Count 15%, Blog
  Mentions 20%, Scenic Value 15%, Detour 10%, Social Popularity 15%.
- **Route Experience Score /10** -- Scenic 20%, Food 15%, Safety 20%,
  Attractions 20%, Weather 10%, Fuel Availability 15%.

Weights live in `lib/agents/scoring.ts`.

## What's mocked vs real

| Concern            | Now (mock)                                  | Later (real)               |
| ------------------ | ------------------------------------------- | -------------------------- |
| Geocoding          | Gazetteer + deterministic hash              | Google Geocoding           |
| Routing / ETA      | Haversine x road factor, synthetic polyline | Google Directions          |
| Places/attractions | Seeded templates along the route            | Google Places + enrichment |
| Weather            | Seeded 7-day history + forecast             | Open-Meteo / OpenWeather   |
| LLM text           | Templated narrative                         | Claude API                 |

Mock output is **deterministic** (seeded by the request), so demos are stable.

## Not yet built (next steps)

- Interactive map view of the route + stops
- Real provider implementations behind the interfaces
- True PDF export (currently browser print) and shareable links
- Persistence / saved trips, accounts
- V2 items from the PRD: multi-day trips, hotels, live rerouting, mobile app
