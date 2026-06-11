"use client";

import { useMemo, useState } from "react";
import type { SearchResult } from "@/lib/domain/types";
import { parseSearchQuery } from "@/lib/domain/validate";
import { scoreListing } from "@/lib/engine/recommend";
import { searchAllPlatforms } from "@/lib/engine/search";
import PlatformStrip from "@/components/PlatformStrip";
import RecommendationCard from "@/components/RecommendationCard";
import ResultsTable from "@/components/ResultsTable";
import SearchForm from "@/components/SearchForm";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function Home() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scores = useMemo(() => {
    const m = new Map<string, number>();
    if (result) {
      for (const l of result.listings) m.set(l.id, scoreListing(l, result.listings));
    }
    return m;
  }, [result]);

  // The demo engine is pure TypeScript, so search runs entirely in the
  // browser — this lets the app deploy as a static export (GitHub Pages).
  async function search(product: string, location: string) {
    setLoading(true);
    setError(null);
    try {
      const parsed = parseSearchQuery({ product, location });
      if (!parsed.ok) throw new Error(parsed.errors.join(" "));
      setResult(await searchAllPlatforms(parsed.value));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed. Please try again.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const priceStats = useMemo(() => {
    if (!result?.listings.length) return null;
    const prices = result.listings.filter((l) => l.inStock).map((l) => l.price);
    if (!prices.length) return null;
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [result]);

  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10 flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Price<span className="text-teal-400">Pulse</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          One search across Amazon, Flipkart, BigBasket, Blinkit, JioMart &amp; Croma —
          location-aware availability, side-by-side pricing, and a data-backed best pick.
        </p>
      </header>

      <SearchForm onSearch={search} loading={loading} />

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-sm text-zinc-400">
          <span className="size-4 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
          Querying all platforms in parallel…
        </div>
      )}

      {result && !loading && (
        <>
          <section className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
            <span>
              <span className="text-zinc-200 font-medium">{result.listings.length}</span> listings
              for <span className="text-teal-300">“{result.query.product}”</span> in{" "}
              <span className="text-zinc-200">{result.location.city}</span>
            </span>
            {priceStats && (
              <span>
                Price range:{" "}
                <span className="text-zinc-200">
                  {inr.format(priceStats.min)} – {inr.format(priceStats.max)}
                </span>
              </span>
            )}
            <span className="capitalize">Category: {result.category}</span>
            {!result.location.recognized && (
              <span className="text-amber-400/90">
                Location not recognized — assuming limited delivery coverage.
              </span>
            )}
          </section>

          <PlatformStrip result={result} />

          {result.listings.length > 0 ? (
            <>
              <RecommendationCard result={result} />
              <ResultsTable result={result} scores={scores} />
            </>
          ) : (
            <div className="rounded-lg border border-zinc-800 px-4 py-8 text-center text-sm text-zinc-500">
              No platform had matching listings for this product at your location.
              Try a broader product name or a metro city.
            </div>
          )}
        </>
      )}

      {!result && !loading && !error && (
        <section className="grid gap-4 sm:grid-cols-3 text-sm">
          {[
            {
              icon: "🔎",
              title: "Search once, compare everywhere",
              body: "One query fans out to six platforms in parallel and lines up similar products side by side.",
            },
            {
              icon: "📍",
              title: "Location-aware",
              body: "Quick-commerce and grocery platforms only show up where they actually deliver — with realistic ETAs and fees.",
            },
            {
              icon: "🏆",
              title: "Data-backed best pick",
              body: "A weighted score across price, Bayesian-adjusted ratings, review volume and delivery speed picks the winner — with reasons.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="text-2xl mb-2">{f.icon}</div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </section>
      )}

      <footer className="mt-auto pt-8 text-xs text-zinc-600">
        Demo data: listings are synthesized deterministically per query — marketplaces don&apos;t
        offer public search APIs. The platform-adapter layer is built to swap in live
        affiliate/partner feeds without UI changes.
      </footer>
    </main>
  );
}
