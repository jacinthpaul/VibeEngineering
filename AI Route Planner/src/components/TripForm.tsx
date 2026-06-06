"use client";

import { useState } from "react";
import {
  ALL_CATEGORY_IDS,
  CATEGORY_GROUPS,
} from "@/lib/domain/categories";
import type {
  RoutePreference,
  TripRequest,
  VehicleSelection,
} from "@/lib/domain/types";

const VEHICLES: { id: VehicleSelection; label: string }[] = [
  { id: "motorcycle", label: "🏍 Motorcycle" },
  { id: "car", label: "🚗 Car" },
  { id: "both", label: "Both" },
];

const PREFS: { id: RoutePreference; label: string; hint: string }[] = [
  { id: "fastest", label: "Fastest", hint: "Minimize travel time" },
  { id: "scenic", label: "Scenic", hint: "Beautiful roads & viewpoints" },
  { id: "balanced", label: "Balanced", hint: "Mix of speed & attractions" },
  { id: "explorer", label: "Explorer", hint: "Optimize for experiences" },
];

const DETOURS = [5, 10, 20, 50];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  onSubmit: (req: TripRequest) => void;
  loading: boolean;
}

export default function TripForm({ onSubmit, loading }: Props) {
  const [start, setStart] = useState("Hyderabad");
  const [destination, setDestination] = useState("Goa");
  const [vehicle, setVehicle] = useState<VehicleSelection>("both");
  const [date, setDate] = useState(today());
  const [departureTime, setDepartureTime] = useState("06:00");
  const [routePreference, setRoutePreference] = useState<RoutePreference>("balanced");
  const [maxDetourKm, setMaxDetourKm] = useState(10);

  const [stopMode, setStopMode] = useState<"auto" | "custom">("auto");
  const [stopUnit, setStopUnit] = useState<"time" | "distance">("time");
  const [everyMinutes, setEveryMinutes] = useState(120);
  const [everyKm, setEveryKm] = useState(100);

  const [categories, setCategories] = useState<string[]>(ALL_CATEGORY_IDS);

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const req: TripRequest = {
      start,
      destination,
      vehicle,
      date,
      departureTime,
      routePreference,
      maxDetourKm,
      stopFrequency:
        stopMode === "custom"
          ? { mode: "custom", unit: stopUnit, everyMinutes, everyKm }
          : { mode: "auto" },
      categories,
    };
    onSubmit(req);
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8"
    >
      {/* Locations */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start location">
          <input
            value={start}
            onChange={(e) => setStart(e.target.value)}
            placeholder="e.g. Hyderabad"
            className={inputCls}
          />
        </Field>
        <Field label="Destination">
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="e.g. Goa"
            className={inputCls}
          />
        </Field>
      </div>

      {/* Vehicle */}
      <Field label="Vehicle" className="mt-5">
        <Segmented
          options={VEHICLES}
          value={vehicle}
          onChange={(v) => setVehicle(v as VehicleSelection)}
        />
      </Field>

      {/* Date & time */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Travel date">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Departure time">
          <input
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      {/* Route preference */}
      <Field label="Route preference" className="mt-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PREFS.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setRoutePreference(p.id)}
              className={`rounded-xl border p-3 text-left transition ${
                routePreference === p.id
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="text-sm font-semibold">{p.label}</div>
              <div className="text-xs text-slate-500">{p.hint}</div>
            </button>
          ))}
        </div>
      </Field>

      {/* Stop frequency + detour */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Stop frequency">
          <div className="flex flex-col gap-2">
            <Segmented
              options={[
                { id: "auto", label: "Auto (Recommended)" },
                { id: "custom", label: "Custom" },
              ]}
              value={stopMode}
              onChange={(v) => setStopMode(v as "auto" | "custom")}
            />
            {stopMode === "custom" && (
              <div className="flex gap-2">
                <select
                  value={stopUnit}
                  onChange={(e) => setStopUnit(e.target.value as "time" | "distance")}
                  className={inputCls}
                >
                  <option value="time">Every (time)</option>
                  <option value="distance">Every (distance)</option>
                </select>
                {stopUnit === "time" ? (
                  <select
                    value={everyMinutes}
                    onChange={(e) => setEveryMinutes(Number(e.target.value))}
                    className={inputCls}
                  >
                    <option value={60}>1 hour</option>
                    <option value={120}>2 hours</option>
                  </select>
                ) : (
                  <select
                    value={everyKm}
                    onChange={(e) => setEveryKm(Number(e.target.value))}
                    className={inputCls}
                  >
                    <option value={100}>100 km</option>
                    <option value={150}>150 km</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </Field>

        <Field label="Maximum detour distance">
          <div className="grid grid-cols-4 gap-2">
            {DETOURS.map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setMaxDetourKm(d)}
                className={`rounded-xl border py-2 text-sm font-medium transition ${
                  maxDetourKm === d
                    ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {d} km
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* Categories */}
      <Field
        label="Attraction categories"
        className="mt-5"
        action={
          <div className="flex gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setCategories(ALL_CATEGORY_IDS)}
              className="text-indigo-600 hover:underline"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={() => setCategories([])}
              className="text-slate-500 hover:underline"
            >
              Clear
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {CATEGORY_GROUPS.map((g) => (
            <div key={g.id}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {g.label}
              </div>
              <div className="flex flex-wrap gap-2">
                {g.items.map((c) => {
                  const on = categories.includes(c.id);
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => toggleCategory(c.id)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        on
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="mt-7 w-full rounded-xl bg-indigo-600 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Planning your trip…" : "Plan my trip ✦"}
      </button>
    </form>
  );
}

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

function Field({
  label,
  children,
  className = "",
  action,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        {action}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          type="button"
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition ${
            value === o.id
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
