# PricePulse — Multi-Platform Price Comparison

Search once across **Amazon, Flipkart, BigBasket, Blinkit, JioMart and Croma**.
Enter a product and a location (city or pincode) and get:

- A **sortable comparison table** — price (incl. delivery fee), discount, rating,
  review count, delivery ETA and a composite score.
- **Location-aware availability** — Blinkit only appears in metros, BigBasket in
  metro/tier-2 cities, Croma where it has store coverage; delivery ETAs and fees
  adapt to the city tier.
- **Recommendations** — a weighted Best Pick (price 40%, Bayesian-adjusted
  rating 30%, review volume 15%, delivery speed 15%), plus Lowest Price,
  Top Rated and Fastest Delivery callouts, each with a written reason.
- Extras: platform filter chips, in-stock filter, unit-price normalization for
  groceries (₹/100g), offer badges, CSV export, deep links to each platform's
  search page.

## Run it

```bash
npm install
npm run dev   # http://localhost:3000
```

## Architecture

```
src/
  app/
    page.tsx              # UI shell (client component)
    api/search/route.ts   # POST /api/search → SearchResult
  components/             # SearchForm, PlatformStrip, RecommendationCard, ResultsTable
  lib/
    domain/               # types + request validation
    platforms/
      registry.ts         # platform metadata + deep-link builders
      serviceability.ts   # city/pincode → tier → who delivers, how fast
      adapters.ts         # PlatformAdapter interface + per-platform demo adapters
      catalog.ts          # deterministic product-variant generator
    engine/
      search.ts           # parallel fan-out, aggregation, default sort
      recommend.ts        # scoring + Best Pick / badges / verdict
```

## About the data

Indian marketplaces don't expose public search APIs and actively block
scraping, so the demo adapters **synthesize listings deterministically**
(seeded by the query, so the same search always returns the same results).
Each platform has a realistic "personality" — price spread, rating bias,
review volume, delivery profile.

To go live, implement `PlatformAdapter.search()` for a platform using an
affiliate/partner feed (e.g. Amazon Product Advertising API, Flipkart
Affiliate API) and return the same `Listing[]` shape — the engine, scoring
and UI need no changes.
