"use client";

import { useState } from "react";
import type {
  PlanResult,
  PlannedStop,
  VehiclePlan,
  WorthVisitingScore,
} from "@/lib/domain/types";
import { categoryLabel } from "@/lib/domain/categories";
import { formatDuration } from "@/lib/agents/itinerary";

const KIND_ICON: Record<string, string> = {
  fuel: "⛽",
  tea: "☕",
  food: "🍽",
  rider_cafe: "🏍",
  rest: "🚻",
  attraction: "📍",
  start: "🚦",
  destination: "🏁",
};

export default function PlanResults({ result }: { result: PlanResult }) {
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const plan = result.vehiclePlans[vehicleIdx];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-50">
              {result.startPlace.name.split(",")[0]}{" "}
              <span className="text-red-500">→</span>{" "}
              {result.destinationPlace.name.split(",")[0]}
            </h2>
            <p className="text-sm text-neutral-500">
              {result.request.date} · departs {result.request.departureTime} ·{" "}
              {result.request.routePreference} route
            </p>
          </div>
          <div className="flex gap-2">
            <ExportButtons result={result} plan={plan} />
          </div>
        </div>
        <StatusBanner result={result} />
      </div>

      {/* Vehicle tabs */}
      {result.vehiclePlans.length > 1 && (
        <div className="inline-flex rounded-xl border border-neutral-800 bg-neutral-900/60 p-1">
          {result.vehiclePlans.map((p, i) => (
            <button
              key={p.vehicle}
              onClick={() => setVehicleIdx(i)}
              className={`rounded-lg px-5 py-2 text-sm font-medium capitalize transition ${
                vehicleIdx === i
                  ? "bg-red-600 text-white"
                  : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {p.vehicle === "motorcycle" ? "🏍" : "🚗"} {p.vehicle}
            </button>
          ))}
        </div>
      )}

      {/* Route overview */}
      <RouteOverview plan={plan} weatherScore={result.weather.weatherScore} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Timeline plan={plan} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ExperiencePanel plan={plan} />
          <WeatherPanel weather={result.weather} />
          <ResearchPanel research={result.travelResearch} />
        </div>
      </div>

      {/* Full-width so the cards distribute across the page instead of stacking */}
      <Stops plan={plan} />

      {result.comparison && <ComparisonTable result={result} />}

      <TravelBrief result={result} />
    </div>
  );
}

// --- Status banner ---------------------------------------------------------

function StatusBanner({ result }: { result: PlanResult }) {
  if (result.aiError) {
    return (
      <p className="mt-3 rounded-lg border border-amber-900 bg-amber-950/40 px-3 py-2 text-xs text-amber-300">
        Live AI request failed ({result.aiError}). Showing demo narrative —
        check your key in Setup.
      </p>
    );
  }
  if (result.aiLive) {
    return (
      <p className="mt-3 rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-300">
        ✦ Narratives generated live by Claude. Maps, routes & weather are still
        demo data.
      </p>
    );
  }
  return (
    <p className="mt-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-400">
      Demo mode — results use mock providers. Add your Anthropic key in{" "}
      <span className="font-semibold text-neutral-200">Setup</span> for live AI
      briefs.
    </p>
  );
}

// --- Route overview --------------------------------------------------------

function RouteOverview({
  plan,
  weatherScore,
}: {
  plan: VehiclePlan;
  weatherScore: number;
}) {
  const stats = [
    { label: "Distance", value: `${plan.route.distanceKm} km` },
    { label: "Total time", value: formatDuration(plan.totalTripMinutes) },
    { label: "Fuel est.", value: `₹${plan.route.fuelEstimate.cost}` },
    { label: "Toll est.", value: `₹${plan.route.tollEstimate.cost}` },
    { label: "Weather", value: `${weatherScore}/100` },
    { label: "Experience", value: `${plan.experienceScore.total}/10` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 text-center"
        >
          <div className="text-lg font-bold text-red-500">{s.value}</div>
          <div className="text-xs text-neutral-500">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// --- Timeline --------------------------------------------------------------

function Timeline({ plan }: { plan: VehiclePlan }) {
  return (
    <Card title="Route timeline">
      <ol className="relative ml-3 border-l border-neutral-800">
        {plan.timeline.map((t, i) => (
          <li key={i} className="mb-4 ml-5 last:mb-0">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-neutral-800 text-xs ring-2 ring-neutral-950">
              {KIND_ICON[t.kind] ?? "•"}
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-neutral-200">{t.label}</span>
              <span className="shrink-0 text-xs font-semibold text-neutral-500">
                {t.time}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

// --- Stops -----------------------------------------------------------------

function Stops({ plan }: { plan: VehiclePlan }) {
  return (
    <Card title="Stops & discoveries">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {plan.stops.map((s) => (
          <StopCard key={s.id} stop={s} />
        ))}
      </div>
    </Card>
  );
}

function StopCard({ stop }: { stop: PlannedStop }) {
  const isAttraction = stop.kind === "attraction";
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span>{KIND_ICON[stop.kind] ?? "📍"}</span>
            <span className="font-semibold text-neutral-100">{stop.name}</span>
          </div>
          <div className="mt-0.5 text-xs text-neutral-500">
            {isAttraction && stop.category
              ? categoryLabel(stop.category)
              : stop.kind.replace("_", " ")}{" "}
            · {stop.distanceFromStartKm} km in ·{" "}
            {formatDuration(stop.suggestedDurationMin)} stop
            {stop.detourKm > 0 && ` · ${stop.detourKm} km detour`}
          </div>
        </div>
        {stop.worthVisiting && <ScoreBadge score={stop.worthVisiting} />}
      </div>

      <p className="mt-2 text-sm text-neutral-400">{stop.reviewSummary}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
        <span>⭐ {stop.googleRating} ({stop.reviewCount.toLocaleString()})</span>
        <span>· {stop.vehicleSuitability}</span>
      </div>
      {stop.whyRecommended && (
        <p className="mt-2 text-xs text-red-400">{stop.whyRecommended}</p>
      )}
    </div>
  );
}

function ScoreBadge({ score }: { score: WorthVisitingScore }) {
  const color =
    score.total >= 85
      ? "bg-emerald-500/15 text-emerald-400"
      : score.total >= 70
        ? "bg-red-500/15 text-red-400"
        : "bg-neutral-800 text-neutral-400";
  return (
    <div className={`shrink-0 rounded-lg px-2.5 py-1 text-center ${color}`}>
      <div className="text-base font-bold leading-none">{score.total}</div>
      <div className="text-[10px] uppercase tracking-wide">/ 100</div>
    </div>
  );
}

// --- Experience score ------------------------------------------------------

function ExperiencePanel({ plan }: { plan: VehiclePlan }) {
  return (
    <Card title={`Route experience · ${plan.experienceScore.total}/10`}>
      <div className="space-y-2">
        {plan.experienceScore.metrics.map((m) => (
          <Bar key={m.label} label={m.label} value={m.value} hint={`${m.weightPct}%`} />
        ))}
      </div>
    </Card>
  );
}

function Bar({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-neutral-400">
        <span>
          {label} {hint && <span className="text-neutral-600">({hint})</span>}
        </span>
        <span className="font-medium text-neutral-200">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-800">
        <div
          className="h-1.5 rounded-full bg-red-600"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

// --- Weather ---------------------------------------------------------------

function WeatherPanel({ weather }: { weather: PlanResult["weather"] }) {
  const riskColor =
    weather.riderRisk === "High"
      ? "text-red-400"
      : weather.riderRisk === "Medium"
        ? "text-amber-400"
        : "text-emerald-400";
  return (
    <Card title="Weather intelligence">
      <p className="text-sm text-neutral-400">{weather.summary}</p>
      <p className="mt-2 text-sm text-neutral-300">
        Rider risk: <span className={`font-semibold ${riskColor}`}>{weather.riderRisk}</span>
      </p>
      <div className="mt-3 grid grid-cols-7 gap-1">
        {weather.forecast.map((d) => (
          <div key={d.date} className="rounded-lg bg-neutral-800/50 p-1.5 text-center">
            <div className="text-[10px] text-neutral-500">{d.date.slice(8)}</div>
            <div className="text-xs font-semibold text-neutral-200">{d.tempMaxC}°</div>
            <div className="text-[10px] text-sky-400">{d.rainChancePct}%</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-neutral-600">
        7-day forecast · max temp / rain chance
      </p>
    </Card>
  );
}

// --- Travel research -------------------------------------------------------

function ResearchPanel({ research }: { research: PlanResult["travelResearch"] }) {
  return (
    <Card title="Travel blog intelligence">
      <p className="rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-sm text-red-200">
        {research.summary}
      </p>
      <ResearchList title="Must visit" items={research.mustVisit} />
      <ResearchList title="Hidden gems" items={research.hiddenGems} />
      <ResearchList title="Local food" items={research.localFood} />
      <ResearchList title="Tourist traps to skip" items={research.touristTraps} />
      <p className="mt-3 text-xs text-neutral-500">{research.seasonalAdvice}</p>
    </Card>
  );
}

function ResearchList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </div>
      <ul className="mt-1 list-inside list-disc text-sm text-neutral-400">
        {items.map((it) => (
          <li key={it}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

// --- Comparison ------------------------------------------------------------

function ComparisonTable({ result }: { result: PlanResult }) {
  const rows = result.comparison!;
  return (
    <Card title="Motorcycle vs Car">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-neutral-500">
              <th className="py-2 font-medium">Metric</th>
              <th className="py-2 font-medium">🏍 Motorcycle</th>
              <th className="py-2 font-medium">🚗 Car</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.metric} className="border-t border-neutral-800">
                <td className="py-2 text-neutral-500">{r.metric}</td>
                <td className="py-2 font-medium text-neutral-200">{r.motorcycle}</td>
                <td className="py-2 font-medium text-neutral-200">{r.car}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// --- AI travel brief -------------------------------------------------------

function TravelBrief({ result }: { result: PlanResult }) {
  const b = result.brief;
  return (
    <div className="overflow-hidden rounded-2xl border border-red-900/50 bg-gradient-to-br from-red-700 via-red-800 to-neutral-950 p-6 text-white sm:p-8">
      <div className="flex items-center gap-2">
        <h3 className="text-lg font-bold">AI Travel Brief</h3>
        <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          {result.aiLive ? "Claude · live" : "demo"}
        </span>
      </div>
      <p className="mt-2 text-red-50/90">{b.summary}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-red-200/80">Distance</div>
          <div className="text-lg font-semibold">{b.distanceKm} km</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-red-200/80">Travel time</div>
          <div className="text-lg font-semibold">{b.travelTimeText}</div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-red-200/80">Best stops</div>
          <div className="text-sm font-medium">{b.bestStops.join(" · ") || "—"}</div>
        </div>
      </div>
      <div className="mt-4 rounded-xl bg-black/25 p-4">
        <p className="text-sm">
          <span className="font-semibold">Weather:</span> {b.weatherNote}
        </p>
        <p className="mt-2 text-sm">
          <span className="font-semibold">Recommendation:</span> {b.recommendation}
        </p>
      </div>
    </div>
  );
}

// --- Export ----------------------------------------------------------------

function ExportButtons({ result, plan }: { result: PlanResult; plan: VehiclePlan }) {
  function mapsLink() {
    const o = result.startPlace.coordinates;
    const d = result.destinationPlace.coordinates;
    const waypoints = plan.stops
      .filter((s) => s.kind === "attraction")
      .slice(0, 5)
      .map((s) => `${s.coordinates.lat},${s.coordinates.lng}`)
      .join("|");
    const url = new URL("https://www.google.com/maps/dir/");
    url.searchParams.set("api", "1");
    url.searchParams.set("origin", `${o.lat},${o.lng}`);
    url.searchParams.set("destination", `${d.lat},${d.lng}`);
    if (waypoints) url.searchParams.set("waypoints", waypoints);
    return url.toString();
  }

  const btn =
    "rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-neutral-500";

  return (
    <>
      <a href={mapsLink()} target="_blank" rel="noopener noreferrer" className={btn}>
        Open in Google Maps
      </a>
      <button onClick={() => window.print()} className={btn}>
        Print / Save PDF
      </button>
    </>
  );
}

// --- Shared card -----------------------------------------------------------

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      {children}
    </section>
  );
}
