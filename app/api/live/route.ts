import { NextResponse } from "next/server";
import { getLiveWindow, getAllPlayed } from "@/lib/named";
import { computeStandings } from "@/lib/groups";
import matchesData from "@/data/matches.json";
import closingOdds from "@/data/closing_odds.json";

// 항상 동적 실행 → 첫 진입에도 현재 데이터를 생성(빌드시점 캐시로 굳지 않게).
// named 호출 자체는 5초 캐시라 매 요청이 외부를 두드리지 않는다.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

// 기록된 마감배당 조회 (named가 종료 후 배당을 내려도 적중 표시 가능)
const oddsMap = new Map<string, { win: number; draw: number; loss: number }>();
for (const c of closingOdds as any[]) {
  oddsMap.set(`${c.home}|${c.away}`, { win: c.oH, draw: c.oD, loss: c.oA });
}
function closingFor(homeEn: string | null, awayEn: string | null) {
  if (!homeEn || !awayEn) return null;
  const d = oddsMap.get(`${homeEn}|${awayEn}`);
  if (d) return d;
  const r = oddsMap.get(`${awayEn}|${homeEn}`);
  if (r) return { win: r.loss, draw: r.draw, loss: r.win }; // 뒤집기
  return null;
}

export async function GET() {
  const [windowMatches, allPlayed] = await Promise.all([
    getLiveWindow(),
    getAllPlayed(),
  ]);

  const enrich = (m: any) => ({
    ...m,
    prediction: lookupPred(m.homeEn, m.awayEn),
    odds: m.odds ?? closingFor(m.homeEn, m.awayEn), // 라이브 배당 없으면 마감배당
  });

  // 진행 중·예정: 라이브 윈도우에서 미종료만
  const matches = windowMatches.filter((m) => m.status !== "FINAL").map(enrich);
  // 지난 결과: 종료된 전체 경기(개막일~), 최신순
  const finished = allPlayed
    .filter((m) => m.status === "FINAL")
    .map(enrich)
    .sort((a, b) => b.startDatetime.localeCompare(a.startDatetime));
  const standings = computeStandings(allPlayed);

  return NextResponse.json(
    { asOf: new Date().toISOString(), matches, finished, standings },
    { headers: { "Cache-Control": "s-maxage=5, stale-while-revalidate=15" } },
  );
}
