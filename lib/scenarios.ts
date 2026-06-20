// 32강 진출 경우의 수 분석. 잔여 조별 경기의 모든 결과 조합을 열거해
// 각 팀의 '직접 진출(조 1·2위)' 확정/탈락/유동 상태와 확률을 계산한다.
// 동률 처리는 2026 룰대로 '승자승(맞대결 승점)'을 우선 적용.
import matchesData from "@/data/matches.json";
import stageData from "@/data/stage_probs.json";
import { recoverGroups } from "./groups";
import type { LiveMatch } from "./named";

type Fixture = {
  home: string;
  away: string;
  pHome: number;
  pDraw: number;
  pAway: number;
};

const FIXTURES = matchesData as (Fixture & { date: string })[];
const R32: Record<string, number> = {};
(stageData as { team: string; R32: number }[]).forEach((s) => {
  R32[s.team] = s.R32;
});

export type Cond = "in" | "maybe" | "out";
export type TeamScenario = {
  team: string;
  status: "qualified" | "eliminated" | "alive";
  qualProb: number; // 직접 진출(1·2위) 확률
  r32Prob: number; // 개막 전 기준 32강 도달(3위 포함) 확률
  pld: number; // 현재 치른 경기 수
  pts: number; // 현재 승점
  gd: number; // 현재 골득실
  gf: number; // 현재 득점
  nextOpp: string | null; // 남은 상대(영문)
  nextHome: boolean | null; // 남은 경기 홈 여부
  cond: { w: Cond; d: Cond; l: Cond } | null; // 남은 경기 승/무/패 시 결과
};
export type RemainingFix = { home: string; away: string };
export type GroupScenario = {
  label: string;
  teams: TeamScenario[];
  remaining: RemainingFix[];
  decided: number; // 종료된 경기 수
};

// 종료된 경기 결과: 무순서 쌍 → 'H'(홈승)/'D'/'A'
function playedResults(played: LiveMatch[]): Map<string, "H" | "D" | "A"> {
  const m = new Map<string, "H" | "D" | "A">();
  for (const g of played) {
    if (g.status !== "FINAL" || !g.homeEn || !g.awayEn) continue;
    const r = g.homeScore > g.awayScore ? "H" : g.homeScore < g.awayScore ? "A" : "D";
    m.set(`${g.homeEn}|${g.awayEn}`, r);
    // 역방향(원정/홈 뒤바뀐 경우) 보정 키도 저장
    m.set(`${g.awayEn}|${g.homeEn}`, r === "H" ? "A" : r === "A" ? "H" : "D");
  }
  return m;
}

// 결과 배열로 그룹 순위 계산 (승점 → 승자승 → 사전순 champRank 근사)
function rank(
  teams: string[],
  results: { home: string; away: string; r: "H" | "D" | "A" }[],
  champRank: Map<string, number>,
): string[] {
  const pts = new Map(teams.map((t) => [t, 0]));
  for (const { home, away, r } of results) {
    if (r === "H") pts.set(home, pts.get(home)! + 3);
    else if (r === "A") pts.set(away, pts.get(away)! + 3);
    else {
      pts.set(home, pts.get(home)! + 1);
      pts.set(away, pts.get(away)! + 1);
    }
  }
  // 1차: 승점. 동률 그룹은 승자승(맞대결 승점)으로 분리.
  const h2hPts = (group: string[]) => {
    const hp = new Map(group.map((t) => [t, 0]));
    for (const { home, away, r } of results) {
      if (!hp.has(home) || !hp.has(away)) continue;
      if (r === "H") hp.set(home, hp.get(home)! + 3);
      else if (r === "A") hp.set(away, hp.get(away)! + 3);
      else {
        hp.set(home, hp.get(home)! + 1);
        hp.set(away, hp.get(away)! + 1);
      }
    }
    return hp;
  };
  return [...teams].sort((a, b) => {
    if (pts.get(b)! !== pts.get(a)!) return pts.get(b)! - pts.get(a)!;
    const tied = teams.filter((t) => pts.get(t) === pts.get(a));
    if (tied.length > 1) {
      const hp = h2hPts(tied);
      if (hp.get(b)! !== hp.get(a)!) return hp.get(b)! - hp.get(a)!;
    }
    return (champRank.get(a) ?? 99) - (champRank.get(b) ?? 99);
  });
}

export function computeScenarios(played: LiveMatch[]): GroupScenario[] {
  const groups = recoverGroups();
  const champRank = new Map<string, number>();
  (stageData as { team: string }[]).forEach((s, i) => champRank.set(s.team, i));

  const done = playedResults(played);
  const LABELS = "ABCDEFGHIJKL".split("");

  return groups.map((teams, gi) => {
    const groupSet = new Set(teams);
    const fixtures = FIXTURES.filter(
      (f) => groupSet.has(f.home) && groupSet.has(f.away),
    );
    const fixedResults: { home: string; away: string; r: "H" | "D" | "A" }[] = [];
    const remaining: (Fixture)[] = [];
    for (const f of fixtures) {
      const r = done.get(`${f.home}|${f.away}`);
      if (r) fixedResults.push({ home: f.home, away: f.away, r });
      else remaining.push(f);
    }

    const top2Count = new Map(teams.map((t) => [t, 0]));
    const top2Prob = new Map(teams.map((t) => [t, 0]));
    const combos = Math.pow(3, remaining.length);
    const OUT: ("H" | "D" | "A")[] = ["H", "D", "A"];

    for (let mask = 0; mask < combos; mask++) {
      let m = mask;
      let prob = 1;
      const assigned: { home: string; away: string; r: "H" | "D" | "A" }[] = [];
      for (const f of remaining) {
        const o = OUT[m % 3];
        m = Math.floor(m / 3);
        prob *= o === "H" ? f.pHome : o === "D" ? f.pDraw : f.pAway;
        assigned.push({ home: f.home, away: f.away, r: o });
      }
      const order = rank(teams, [...fixedResults, ...assigned], champRank);
      const top2 = order.slice(0, 2);
      for (const t of top2) {
        top2Count.set(t, top2Count.get(t)! + 1);
        top2Prob.set(t, top2Prob.get(t)! + prob);
      }
    }

    // 현재 승점·골득실(종료 경기 기준)
    const pts0 = new Map(teams.map((t) => [t, 0]));
    const gf0 = new Map(teams.map((t) => [t, 0]));
    const ga0 = new Map(teams.map((t) => [t, 0]));
    const pld0 = new Map(teams.map((t) => [t, 0]));
    for (const g of played) {
      if (g.status !== "FINAL" || !g.homeEn || !g.awayEn) continue;
      if (!groupSet.has(g.homeEn) || !groupSet.has(g.awayEn)) continue;
      pld0.set(g.homeEn, pld0.get(g.homeEn)! + 1);
      pld0.set(g.awayEn, pld0.get(g.awayEn)! + 1);
      gf0.set(g.homeEn, gf0.get(g.homeEn)! + g.homeScore);
      ga0.set(g.homeEn, ga0.get(g.homeEn)! + g.awayScore);
      gf0.set(g.awayEn, gf0.get(g.awayEn)! + g.awayScore);
      ga0.set(g.awayEn, ga0.get(g.awayEn)! + g.homeScore);
      if (g.homeScore > g.awayScore) pts0.set(g.homeEn, pts0.get(g.homeEn)! + 3);
      else if (g.homeScore < g.awayScore) pts0.set(g.awayEn, pts0.get(g.awayEn)! + 3);
      else {
        pts0.set(g.homeEn, pts0.get(g.homeEn)! + 1);
        pts0.set(g.awayEn, pts0.get(g.awayEn)! + 1);
      }
    }

    // 팀의 남은 경기 결과(승/무/패)별 진출 가능성 분류
    const classify = (t: string): TeamScenario["cond"] => {
      const mine = remaining.filter((f) => f.home === t || f.away === t);
      if (mine.length !== 1) return null; // 마지막 라운드(1경기 남음)만 명확
      const M = mine[0];
      const others = remaining.filter((f) => f !== M);
      const isHome = M.home === t;
      const judge = (mres: "H" | "D" | "A"): Cond => {
        let inAll = true,
          inAny = false;
        const oc = Math.pow(3, others.length);
        for (let k = 0; k < oc; k++) {
          let kk = k;
          const asg = [{ home: M.home, away: M.away, r: mres }];
          for (const f of others) {
            const o = OUT[kk % 3];
            kk = Math.floor(kk / 3);
            asg.push({ home: f.home, away: f.away, r: o });
          }
          const order = rank(teams, [...fixedResults, ...asg], champRank);
          const top2 = order.slice(0, 2).includes(t);
          inAll = inAll && top2;
          inAny = inAny || top2;
        }
        return inAll ? "in" : inAny ? "maybe" : "out";
      };
      return {
        w: judge(isHome ? "H" : "A"),
        d: judge("D"),
        l: judge(isHome ? "A" : "H"),
      };
    };

    const teamScen: TeamScenario[] = teams.map((t) => {
      const cnt = top2Count.get(t)!;
      let status: TeamScenario["status"];
      if (cnt === combos) status = "qualified";
      else if (cnt === 0) status = "eliminated";
      else status = "alive";
      const mine = remaining.find((f) => f.home === t || f.away === t);
      return {
        team: t,
        status,
        qualProb: top2Prob.get(t)!,
        r32Prob: R32[t] ?? 0,
        pld: pld0.get(t)!,
        pts: pts0.get(t)!,
        gd: gf0.get(t)! - ga0.get(t)!,
        gf: gf0.get(t)!,
        nextOpp: mine ? (mine.home === t ? mine.away : mine.home) : null,
        nextHome: mine ? mine.home === t : null,
        cond: classify(t),
      };
    });
    // 현재 순위(승점→골득실→득점→직접진출확률)로 정렬 — 조 순위표처럼
    teamScen.sort(
      (a, b) =>
        b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.qualProb - a.qualProb,
    );

    return {
      label: `그룹 ${LABELS[gi] ?? gi + 1}`,
      teams: teamScen,
      remaining: remaining.map((f) => ({ home: f.home, away: f.away })),
      decided: fixedResults.length,
    };
  });
}
