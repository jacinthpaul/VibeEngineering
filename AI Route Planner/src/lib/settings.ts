// Client-side storage for the user's Anthropic API key.
//
// The key lives only in this browser's localStorage and is sent to our own
// /api/plan route per request (header), never persisted on the server.

const KEY = "rt_anthropic_key";

export function getAnthropicKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAnthropicKey(value: string): void {
  if (typeof window === "undefined") return;
  try {
    const v = value.trim();
    if (v) window.localStorage.setItem(KEY, v);
    else window.localStorage.removeItem(KEY);
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

/** Masks a key for display, e.g. "sk-ant-…a1b2". */
export function maskKey(value: string): string {
  if (!value) return "";
  if (value.length <= 12) return "•".repeat(value.length);
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}
