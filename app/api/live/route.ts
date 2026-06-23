import { NextResponse } from "next/server";
import { getLiveWindow, getAllPlayed, getRedCards } from "@/lib/named";
import { computeStandings } from "@/lib/groups";
import matchesData from "@/data/matches.json";
import livePreds from "@/data/live_predictions.json";
import liveScore from "@/data/live_score.json";
import closingOdds from "@/data/closing_odds.json";
import { inPlay } from "@/lib/inplay";

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

// 현재(업데이트된 Elo) 예측 — 개막 전 대비 변화 표시용
const liveMap = new Map<string, Pred>();
for (const m of livePreds as any[]) {
  liveMap.set(`${m.home}|${m.away}`, {
    pHome: m.pHome,
    pDraw: m.pDraw,
    pAway: m.pAway,
  });
}
function lookupLive(homeEn: string | null, awayEn: string | null) {
  if (!homeEn || !awayEn) return null;
  const d = liveMap.get(`${homeEn}|${awayEn}`);
  if (d) return d;
  const r = liveMap.get(`${awayEn}|${homeEn}`);
  if (r) return { pHome: r.pAway, pDraw: r.pDraw, pAway: r.pHome };
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

// 경기 전 기대득점(λ) — 인플레이 모델 입력
const lamMap = new Map<string, { lh: number; la: number }>();
for (const m of liveScore as any[])
  lamMap.set(`${m.home}|${m.away}`, { lh: m.lambdaHome, la: m.lambdaAway });
function lamFor(homeEn: string | null, awayEn: string | null) {
  if (!homeEn || !awayEn) return null;
  const d = lamMap.get(`${homeEn}|${awayEn}`);
  if (d) return d;
  const r = lamMap.get(`${awayEn}|${homeEn}`);
  if (r) return { lh: r.la, la: r.lh };
  return null;
}

export async function GET() {
  const [windowMatches, allPlayed] = await Promise.all([
    getLiveWindow(),
    getAllPlayed(),
  ]);

  // 진행 중 경기의 퇴장 수를 병렬 조회 (broadcasts 이벤트)
  const liveOnes = windowMatches.filter((m) => m.status === "LIVE");
  const reds = new Map<number, { home: number; away: number; lastCard: string | null }>();
  await Promise.all(
    liveOnes.map(async (m) => reds.set(m.id, await getRedCards(m.id))),
  );

  // 팀별 '이번 대회 폼' (종료 경기 시간순 결과 + 누적 득실)
  type Form = { results: ("W" | "D" | "L")[]; gf: number; ga: number };
  const formMap = new Map<string, Form>();
  const addForm = (t: string | null, gf: number, ga: number) => {
    if (!t) return;
    const e = formMap.get(t) ?? { results: [], gf: 0, ga: 0 };
    e.results.push(gf > ga ? "W" : gf < ga ? "L" : "D");
    e.gf += gf;
    e.ga += ga;
    formMap.set(t, e);
  };
  for (const m of [...allPlayed]
    .filter((m) => m.status === "FINAL")
    .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime))) {
    addForm(m.homeEn, m.homeScore, m.awayScore);
    addForm(m.awayEn, m.awayScore, m.homeScore);
  }
  const formOf = (t: string | null) =>
    t && formMap.has(t)
      ? {
          results: formMap.get(t)!.results.slice(-5),
          gd: formMap.get(t)!.gf - formMap.get(t)!.ga,
        }
      : null;

  const enrich = (m: any) => {
    let inplay = null;
    const rc = reds.get(m.id) ?? { home: 0, away: 0, lastCard: null };
    if (m.status === "LIVE" && m.minute != null) {
      const lam = lamFor(m.homeEn, m.awayEn);
      if (lam)
        inplay = {
          ...inPlay(
            lam.lh,
            lam.la,
            m.minute,
            m.homeScore,
            m.awayScore,
            rc.home,
            rc.away,
          ),
          redHome: rc.home,
          redAway: rc.away,
        };
    }
    return {
      ...m,
      prediction: lookupPred(m.homeEn, m.awayEn), // 개막 전 고정
      livePrediction: lookupLive(m.homeEn, m.awayEn), // 현재(업데이트)
      odds: m.odds ?? closingFor(m.homeEn, m.awayEn), // 라이브 배당 없으면 마감배당
      inplay, // 진행 중: 현재 스코어+시간+퇴장 기반 라이브 추정
      homeForm: formOf(m.homeEn), // 이번 대회 폼
      awayForm: formOf(m.awayEn),
    };
  };

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
