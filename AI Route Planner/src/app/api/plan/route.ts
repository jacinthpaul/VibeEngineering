import { NextResponse } from "next/server";
import { parseTripRequest } from "@/lib/domain/validate";
import { planTrip } from "@/lib/agents/pipeline";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseTripRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors.join(" ") }, { status: 422 });
  }

  try {
    const result = await planTrip(parsed.value);
    return NextResponse.json(result);
  } catch (err) {
    console.error("planTrip failed", err);
    return NextResponse.json(
      { error: "Failed to generate plan. Please try again." },
      { status: 500 },
    );
  }
}
