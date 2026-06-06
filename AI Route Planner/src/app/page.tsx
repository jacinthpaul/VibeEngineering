"use client";

import { useState } from "react";
import TripForm from "@/components/TripForm";
import PlanResults from "@/components/PlanResults";
import type { PlanResult, TripRequest } from "@/lib/domain/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  async function handleSubmit(req: TripRequest) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResult(data as PlanResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Road Thrill
          <span className="text-indigo-600"> · AI Route Planner</span>
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-slate-600">
          Where should you stop, what should you see, what should you avoid, and
          which hidden gems are you missing? Plan smarter road trips for
          motorcycles and cars.
        </p>
      </header>

      {result ? (
        <div className="space-y-6">
          <button
            onClick={() => setResult(null)}
            className="text-sm font-medium text-indigo-600 hover:underline print:hidden"
          >
            ← Plan another trip
          </button>
          <PlanResults result={result} />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <TripForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
