"use client";

import { useMemo, useState } from "react";
import type { BadgeKind, Listing, PlatformId, SearchResult } from "@/lib/domain/types";
import { PLATFORMS } from "@/lib/platforms/registry";

type SortKey = "price" | "rating" | "reviews" | "delivery" | "discount" | "score";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const BADGE_LABEL: Record<BadgeKind, string> = {
  "best-pick": "🏆 Best pick",
  "lowest-price": "💰 Lowest price",
  "top-rated": "⭐ Top rated",
  "fastest-delivery": "⚡ Fastest",
  "best-value": "✨ Best value",
};

function PlatformChip({ id }: { id: PlatformId }) {
  const p = PLATFORMS[id];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${p.color}22`, color: p.color }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: p.color }} />
      {p.name}
    </span>
  );
}

function exportCsv(listings: Listing[], product: string) {
  const header = [
    "Platform", "Product", "Brand", "Price (INR)", "MRP (INR)", "Discount %",
    "Rating", "Reviews", "In Stock", "Delivery", "Delivery Fee (INR)", "Offer", "URL",
  ];
  const rows = listings.map((l) => [
    PLATFORMS[l.platform].name, l.title, l.brand, l.price, l.mrp, l.discountPct,
    l.rating, l.reviewCount, l.inStock ? "Yes" : "No", l.deliveryEta, l.deliveryFee,
    l.offer ?? "", l.url,
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `pricepulse-${product.replace(/\s+/g, "-").toLowerCase()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function ResultsTable({
  result,
  scores,
}: {
  result: SearchResult;
  scores: Map<string, number>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("score");
  const [sortAsc, setSortAsc] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<PlatformId | "all">("all");
  const [inStockOnly, setInStockOnly] = useState(false);

  const badges = useMemo(() => {
    const m = new Map<string, BadgeKind[]>();
    for (const r of result.recommendations) {
      m.set(r.listingId, [...(m.get(r.listingId) ?? []), r.kind]);
    }
    return m;
  }, [result.recommendations]);

  const visible = useMemo(() => {
    let rows = result.listings;
    if (platformFilter !== "all") rows = rows.filter((l) => l.platform === platformFilter);
    if (inStockOnly) rows = rows.filter((l) => l.inStock);
    const val = (l: Listing): number => {
      switch (sortKey) {
        case "price": return l.price + l.deliveryFee;
        case "rating": return l.rating;
        case "reviews": return l.reviewCount;
        case "delivery": return l.deliveryHours;
        case "discount": return l.discountPct;
        case "score": return scores.get(l.id) ?? 0;
      }
    };
    const dir = sortAsc ? 1 : -1;
    return [...rows].sort((a, b) => dir * (val(a) - val(b)) || a.price - b.price);
  }, [result.listings, platformFilter, inStockOnly, sortKey, sortAsc, scores]);

  const activePlatforms = useMemo(
    () => result.platforms.filter((p) => p.listingCount > 0).map((p) => p.platform),
    [result.platforms],
  );

  function header(label: string, key: SortKey) {
    const active = sortKey === key;
    return (
      <th
        className={`px-3 py-2.5 text-left text-xs uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-teal-300 ${active ? "text-teal-400" : "text-zinc-400"}`}
        onClick={() => {
          if (active) setSortAsc(!sortAsc);
          else {
            setSortKey(key);
            // Cheapest/fastest first by default; biggest first for the rest.
            setSortAsc(key === "price" || key === "delivery");
          }
        }}
      >
        {label} {active ? (sortAsc ? "↑" : "↓") : ""}
      </th>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          onClick={() => setPlatformFilter("all")}
          className={`rounded-full px-3 py-1 text-xs border transition-colors ${platformFilter === "all" ? "border-teal-500 text-teal-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
        >
          All platforms
        </button>
        {activePlatforms.map((id) => (
          <button
            key={id}
            onClick={() => setPlatformFilter(platformFilter === id ? "all" : id)}
            className={`rounded-full px-3 py-1 text-xs border transition-colors ${platformFilter === id ? "border-teal-500 text-teal-300" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
          >
            {PLATFORMS[id].name}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="accent-teal-500"
          />
          In stock only
        </label>
        <button
          onClick={() => exportCsv(visible, result.query.product)}
          className="rounded-md border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:border-teal-500 hover:text-teal-300 transition-colors"
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/80">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs uppercase tracking-wider text-zinc-400">Product</th>
              <th className="px-3 py-2.5 text-left text-xs uppercase tracking-wider text-zinc-400">Platform</th>
              {header("Price", "price")}
              {header("Discount", "discount")}
              {header("Rating", "rating")}
              {header("Reviews", "reviews")}
              {header("Delivery", "delivery")}
              {header("Score", "score")}
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/80">
            {visible.map((l) => {
              const listingBadges = badges.get(l.id) ?? [];
              const isBest = listingBadges.includes("best-pick");
              return (
                <tr
                  key={l.id}
                  className={`${isBest ? "bg-teal-500/10" : "hover:bg-zinc-900/50"} transition-colors ${!l.inStock ? "opacity-50" : ""}`}
                >
                  <td className="px-3 py-3 max-w-72">
                    <div className="font-medium leading-snug">{l.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-zinc-500">
                      {l.unitPrice && <span>{l.unitPrice}</span>}
                      {l.offer && <span className="text-amber-400/90">🏷 {l.offer}</span>}
                      {!l.inStock && <span className="text-red-400">Out of stock</span>}
                      {listingBadges.map((b) => (
                        <span key={b} className="rounded bg-teal-500/15 text-teal-300 px-1.5 py-0.5">
                          {BADGE_LABEL[b]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3"><PlatformChip id={l.platform} /></td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-semibold">{inr.format(l.price)}</div>
                    {l.discountPct > 0 && (
                      <div className="text-xs text-zinc-500 line-through">{inr.format(l.mrp)}</div>
                    )}
                    {l.deliveryFee > 0 && (
                      <div className="text-xs text-zinc-500">+{inr.format(l.deliveryFee)} delivery</div>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {l.discountPct > 0 ? (
                      <span className="text-emerald-400 text-xs font-medium">{l.discountPct}% off</span>
                    ) : (
                      <span className="text-zinc-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-amber-300">{l.rating}★</span>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-zinc-400">
                    {l.reviewCount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-zinc-300">{l.deliveryEta}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`font-mono text-sm ${(scores.get(l.id) ?? 0) >= 70 ? "text-teal-300" : "text-zinc-400"}`}>
                      {scores.get(l.id) ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 whitespace-nowrap"
                    >
                      View →
                    </a>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-zinc-500">
                  No listings match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
