import type { SearchQuery } from "./types";

export type ParseResult =
  | { ok: true; value: SearchQuery }
  | { ok: false; errors: string[] };

export function parseSearchQuery(body: unknown): ParseResult {
  const errors: string[] = [];
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Request body must be a JSON object."] };
  }
  const o = body as Record<string, unknown>;

  const product = typeof o.product === "string" ? o.product.trim() : "";
  const location = typeof o.location === "string" ? o.location.trim() : "";

  if (!product) errors.push("Product name is required.");
  else if (product.length < 2) errors.push("Product name is too short.");
  else if (product.length > 120) errors.push("Product name is too long (max 120 chars).");

  if (!location) errors.push("Location is required.");
  else if (location.length > 80) errors.push("Location is too long (max 80 chars).");

  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { product, location } };
}
