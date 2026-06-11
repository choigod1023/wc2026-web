import { NextResponse } from "next/server";
import { getLiveWindow, getAllPlayed } from "@/lib/named";
import { computeStandings } from "@/lib/groups";
import matchesData from "@/data/matches.json";

export const revalidate = 30;

type Pred = { pHome: number; pDraw: number; pAway: number };

// 모델 예측 조회: 일정의 home/away 순서와 named 순서가 다를 수 있어 양방향 확인
const predMap = new Map<string, Pred>();
for (const m of matchesData as any[]) {
  predMap.set(`${m.home}|${m.away}`, {
    pHome: m.pHome,
    pDraw: m.pDraw,
    pAway: m.pAway,
  });
}
function lookupPred(homeEn: string | null, awayEn: string | null) {
  if (!homeEn || !awayEn) return null;
  const direct = predMap.get(`${homeEn}|${awayEn}`);
  if (direct) return { ...direct, flipped: false };
  const rev = predMap.get(`${awayEn}|${homeEn}`);
  if (rev) return { pHome: rev.pAway, pDraw: rev.pDraw, pAway: rev.pHome, flipped: true };
  return null;
}

export async function GET() {
  const [windowMatches, allPlayed] = await Promise.all([
    getLiveWindow(),
    getAllPlayed(),
  ]);

  const matches = windowMatches.map((m) => ({
    ...m,
    prediction: lookupPred(m.homeEn, m.awayEn),
  }));
  const standings = computeStandings(allPlayed);

  return NextResponse.json(
    { asOf: new Date().toISOString(), matches, standings },
    { headers: { "Cache-Control": "s-maxage=30, stale-while-revalidate=60" } },
  );
}
