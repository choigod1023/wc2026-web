import { NextResponse } from "next/server";
import { getAllPlayed } from "@/lib/named";
import { computeScenarios } from "@/lib/scenarios";

export const revalidate = 60;

export async function GET() {
  const played = await getAllPlayed();
  const groups = computeScenarios(played);
  return NextResponse.json(
    { asOf: new Date().toISOString(), groups },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
  );
}
