"use client";

import { useState } from "react";

const SUGGESTED = [
  { product: "iPhone 15", location: "Mumbai" },
  { product: "Amul Butter", location: "Bengaluru" },
  { product: "Basmati Rice", location: "Jaipur" },
  { product: "Wireless Earbuds", location: "560001" },
];

export default function SearchForm({
  onSearch,
  loading,
}: {
  onSearch: (product: string, location: string) => void;
  loading: boolean;
}) {
  const [product, setProduct] = useState("");
  const [location, setLocation] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!product.trim() || !location.trim() || loading) return;
    onSearch(product.trim(), location.trim());
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex-[2] flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-zinc-400">Product</span>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g. iPhone 15, Amul butter 500g, running shoes…"
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-teal-500"
            maxLength={120}
          />
        </label>
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-zinc-400">Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City or pincode"
            className="rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 text-sm placeholder:text-zinc-600 focus:outline-none focus:border-teal-500"
            maxLength={80}
          />
        </label>
        <button
          type="submit"
          disabled={loading || !product.trim() || !location.trim()}
          className="self-end rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold transition-colors"
        >
          {loading ? "Searching…" : "Compare"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span>Try:</span>
        {SUGGESTED.map((s) => (
          <button
            key={s.product}
            type="button"
            onClick={() => {
              setProduct(s.product);
              setLocation(s.location);
              onSearch(s.product, s.location);
            }}
            className="rounded-full border border-zinc-700 px-3 py-1 hover:border-teal-500 hover:text-teal-300 transition-colors"
          >
            {s.product} · {s.location}
          </button>
        ))}
      </div>
    </form>
  );
}
