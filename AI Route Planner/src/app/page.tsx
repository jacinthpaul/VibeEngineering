"use client";

import { useEffect, useState } from "react";
import TripForm from "@/components/TripForm";
import PlanResults from "@/components/PlanResults";
import SetupModal from "@/components/SetupModal";
import { getAnthropicKey, setAnthropicKey } from "@/lib/settings";
import type { PlanResult, TripRequest } from "@/lib/domain/types";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);

  useEffect(() => {
    // Read the saved key after mount to avoid an SSR/client hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setApiKey(getAnthropicKey());
  }, []);

  function saveKey(key: string) {
    setAnthropicKey(key);
    setApiKey(key.trim());
    setSetupOpen(false);
  }

  async function handleSubmit(req: TripRequest) {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) headers["x-anthropic-key"] = apiKey;

      const res = await fetch("/api/plan", {
        method: "POST",
        headers,
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

  const aiEnabled = apiKey.length > 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
      {/* Top bar */}
      <nav className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-lg font-black text-white shadow-lg shadow-red-900/40">
            RT
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            ROAD<span className="text-red-500">THRILL</span>
          </span>
        </div>
        <button
          onClick={() => setSetupOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3.5 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-600 print:hidden"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              aiEnabled ? "bg-emerald-500" : "bg-neutral-600"
            }`}
          />
          {aiEnabled ? "AI: Live" : "Setup AI"}
        </button>
      </nav>

      {result ? (
        <div className="space-y-6">
          <button
            onClick={() => setResult(null)}
            className="text-sm font-medium text-red-500 hover:text-red-400 print:hidden"
          >
            ← Plan another trip
          </button>
          <PlanResults result={result} />
        </div>
      ) : (
        <div className="mx-auto max-w-3xl">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              Plan the <span className="text-red-500">thrill</span>, not just
              the route.
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-neutral-400">
              Where should you stop, what should you see, what should you avoid,
              and which hidden gems are you missing? AI road-trip intelligence
              for motorcycles and cars.
            </p>
          </header>

          <TripForm onSubmit={handleSubmit} loading={loading} />
          {error && (
            <p className="mt-4 rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      )}

      {setupOpen && (
        <SetupModal
          currentKey={apiKey}
          onClose={() => setSetupOpen(false)}
          onSave={saveKey}
        />
      )}
    </main>
  );
}
