import { NextResponse } from "next/server";
import { parseSearchQuery } from "@/lib/domain/validate";
import { searchAllPlatforms } from "@/lib/engine/search";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseSearchQuery(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors.join(" ") }, { status: 422 });
  }

  try {
    const result = await searchAllPlatforms(parsed.value);
    return NextResponse.json(result);
  } catch (err) {
    console.error("searchAllPlatforms failed", err);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 },
    );
  }
}
