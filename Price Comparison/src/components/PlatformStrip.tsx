"use client";

import type { SearchResult } from "@/lib/domain/types";
import { PLATFORMS } from "@/lib/platforms/registry";

export default function PlatformStrip({ result }: { result: SearchResult }) {
  return (
    <div className="flex flex-wrap gap-2">
      {result.platforms.map((p) => {
        const info = PLATFORMS[p.platform];
        return (
          <div
            key={p.platform}
            title={p.note ?? info.tagline}
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
              p.serviceable && p.listingCount > 0
                ? "border-zinc-700 text-zinc-200"
                : "border-zinc-800 text-zinc-600"
            }`}
          >
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: p.serviceable && p.listingCount > 0 ? info.color : "#3f3f46",
              }}
            />
            <span className="font-medium">{info.name}</span>
            {p.serviceable && p.listingCount > 0 ? (
              <span className="text-zinc-500">{p.listingCount} found</span>
            ) : (
              <span className="text-zinc-600">{p.note ? "unavailable" : "no matches"}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
