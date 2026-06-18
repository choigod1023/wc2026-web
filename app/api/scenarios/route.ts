import { NextResponse } from "next/server";
import { getAllPlayed } from "@/lib/named";
import { computeScenarios } from "@/lib/scenarios";
import { computeStandings } from "@/lib/groups";

export const dynamic = "force-dynamic"; // 첫 진입에도 현재 데이터 생성
export const revalidate = 0;

export async function GET() {
  const played = await getAllPlayed();
  const groups = computeScenarios(played);

  // 현재 조 순위(경기·승점·골득실)를 각 팀에 붙이고, 순위 순으로 정렬
  const rec = new Map<string, { pld: number; pts: number; gd: number }>();
  for (const g of computeStandings(played))
    for (const r of g.rows) rec.set(r.team, { pld: r.pld, pts: r.pts, gd: r.gd });
  for (const g of groups) {
    for (const t of g.teams) {
      const r = rec.get(t.team);
      if (r) {
        t.pld = r.pld;
        t.pts = r.pts;
        t.gd = r.gd;
      }
    }
    // 경기를 치렀으면 현재 순위(승점→골득실→직접진출확률) 순으로
    if (g.decided > 0) {
      g.teams.sort(
        (a, b) =>
          (b.pts ?? 0) - (a.pts ?? 0) ||
          (b.gd ?? 0) - (a.gd ?? 0) ||
          b.qualProb - a.qualProb,
      );
    }
  }

  return NextResponse.json(
    { asOf: new Date().toISOString(), groups },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" } },
  );
}
