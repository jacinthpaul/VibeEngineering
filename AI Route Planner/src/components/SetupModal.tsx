"use client";

import { useState } from "react";
import { maskKey } from "@/lib/settings";

interface Props {
  currentKey: string;
  onClose: () => void;
  onSave: (key: string) => void;
}

// Mounted only while open (see page.tsx), so its field state resets naturally
// each time it appears — no open/close effect needed.
export default function SetupModal({ currentKey, onClose, onSave }: Props) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const hasKey = currentKey.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl shadow-red-950/30"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-neutral-50">Setup · AI Engine</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Add your Anthropic API key to generate trip briefs and blog
              intelligence with live Claude instead of demo text.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-neutral-500 hover:bg-neutral-800 hover:text-neutral-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {hasKey && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-xs">
            <span className="text-emerald-400">
              ✓ Live AI enabled · key {maskKey(currentKey)}
            </span>
            <button
              onClick={() => onSave("")}
              className="font-medium text-neutral-400 hover:text-red-400"
            >
              Remove key
            </button>
          </div>
        )}

        <label className="mt-5 block text-sm font-medium text-neutral-300">
          {hasKey ? "Replace API key" : "Anthropic API key"}
        </label>
        <div className="mt-1.5 flex gap-2">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="sk-ant-…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="shrink-0 rounded-xl border border-neutral-700 px-3 text-xs font-medium text-neutral-400 hover:border-neutral-500"
          >
            {show ? "Hide" : "Show"}
          </button>
        </div>

        <ul className="mt-4 space-y-1.5 text-xs text-neutral-500">
          <li>
            • Stored only in this browser (localStorage); sent solely to this
            app&apos;s backend to call Claude on your behalf.
          </li>
          <li>
            • Get a key at{" "}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:underline"
            >
              console.anthropic.com
            </a>
            . Usage is billed to your Anthropic account.
          </li>
          <li>• Maps, routes and weather remain demo data for now.</li>
        </ul>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-300 hover:border-neutral-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(value)}
            disabled={!value.trim()}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}
