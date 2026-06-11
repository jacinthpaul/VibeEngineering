"use client";

import type { SearchResult } from "@/lib/domain/types";
import { PLATFORMS } from "@/lib/platforms/registry";

const KIND_META: Record<string, { label: string; icon: string }> = {
  "best-pick": { label: "Best Pick", icon: "🏆" },
  "lowest-price": { label: "Lowest Price", icon: "💰" },
  "top-rated": { label: "Top Rated", icon: "⭐" },
  "fastest-delivery": { label: "Fastest Delivery", icon: "⚡" },
  "best-value": { label: "Best Value", icon: "✨" },
};

export default function RecommendationCard({ result }: { result: SearchResult }) {
  if (!result.recommendations.length) return null;
  const byId = new Map(result.listings.map((l) => [l.id, l]));

  return (
    <section className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-5">
      <h2 className="text-sm uppercase tracking-wider text-teal-400 font-semibold mb-2">
        Our recommendation
      </h2>
      <p className="text-sm leading-relaxed text-zinc-200 mb-4">{result.verdict}</p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {result.recommendations.map((r) => {
          const l = byId.get(r.listingId);
          if (!l) return null;
          const meta = KIND_META[r.kind];
          return (
            <div key={r.kind} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="text-xs font-semibold text-teal-300 mb-1">
                {meta.icon} {meta.label}
              </div>
              <div className="text-sm font-medium leading-snug mb-1">{l.title}</div>
              <div className="text-xs text-zinc-400 mb-2">
                {PLATFORMS[l.platform].name} · ₹{l.price.toLocaleString("en-IN")} · {l.rating}★
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{r.reason}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
