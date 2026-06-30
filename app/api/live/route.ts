import { NextResponse } from "next/server";
import { getLiveWindow, getAllPlayed, getRedCards } from "@/lib/named";
import { computeStandings } from "@/lib/groups";
import matchesData from "@/data/matches.json";
import livePreds from "@/data/live_predictions.json";
import liveScore from "@/data/live_score.json";
import closingOdds from "@/data/closing_odds.json";
import oddsHistory from "@/data/odds_history.json";
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
// 조별리그 72경기의 팀쌍 집합 → 이 안에 없는 WC 경기 = 녹아웃.
const groupPairs = new Set<string>();
for (const m of matchesData as any[]) {
  groupPairs.add([m.home, m.away].sort().join("|"));
}
function isKnockout(m: any): boolean {
  return (
    !!m.homeEn &&
    !!m.awayEn &&
    !groupPairs.has([m.homeEn, m.awayEn].sort().join("|"))
  );
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

// 배당 추이: 가장 오래된 스냅샷(개장 배당)을 경기 home/away에 맞춰 반환
const histRaw = oddsHistory as Record<string, { w: number; d: number; l: number }[]>;
function openOdds(homeEn: string | null, awayEn: string | null) {
  if (!homeEn || !awayEn) return null;
  const fwd = histRaw[`${homeEn}|${awayEn}`];
  if (fwd && fwd.length) return { win: fwd[0].w, draw: fwd[0].d, loss: fwd[0].l };
  const rev = histRaw[`${awayEn}|${homeEn}`];
  if (rev && rev.length)
    return { win: rev[0].l, draw: rev[0].d, loss: rev[0].w }; // 뒤집기
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

  // 녹아웃 진출팀 추론: 결정승부면 승자, 무승부(연장·승부차기)면 '다음 녹아웃
  // 라운드에 등장하는 팀'으로 추론(named가 승부차기 결과를 안 주므로). 추론 불가
  // (최신 라운드 등 다음 경기 미존재) 시 null → "승부차기 진행/미정"으로 표기.
  const koGames = [...allPlayed, ...windowMatches].filter(isKnockout);
  const advancerOf = (m: any): string | null => {
    if (!isKnockout(m) || m.status !== "FINAL") return null;
    if (m.homeScore > m.awayScore) return m.homeEn;
    if (m.awayScore > m.homeScore) return m.awayEn;
    const laterHas = (team: string | null) =>
      !!team &&
      koGames.some(
        (g) =>
          g.id !== m.id &&
          g.startDatetime > m.startDatetime &&
          (g.homeEn === team || g.awayEn === team),
      );
    const h = laterHas(m.homeEn),
      a = laterHas(m.awayEn);
    return h && !a ? m.homeEn : a && !h ? m.awayEn : null;
  };

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
            m.minuteExact ?? m.minute, // 소수 분 → 매 폴링마다 연속 변화
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
      oddsOpen: openOdds(m.homeEn, m.awayEn), // 개장 배당(변동 표시용)
      isKO: isKnockout(m), // 녹아웃 경기 여부
      advanced: advancerOf(m), // 녹아웃 진출팀(추론). 미정이면 null
      koLevel:
        isKnockout(m) && m.status === "FINAL" && m.homeScore === m.awayScore, // 연장·승부차기行
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
