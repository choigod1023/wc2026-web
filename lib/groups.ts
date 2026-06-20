// 조 편성 복원(연결요소) + 공식 조 라벨(A~L) + 2026 룰 순위(승자승 우선).
import matchesData from "@/data/matches.json";
import championship from "@/data/championship.json";
import type { LiveMatch } from "./named";

type Match = { home: string; away: string };

const champRank: Record<string, number> = {};
(championship as { team: string; champion: number }[]).forEach((c, i) => {
  champRank[c.team] = i;
});

// 공식 2026 조 배정의 '대표 팀'(각 조에 하나뿐) → 조 글자 매핑.
// 출처: FIFA 2026 본선 조 추첨 (Group A=Mexico … L=England).
const ANCHOR: Record<string, string> = {
  Mexico: "A",
  Canada: "B",
  Brazil: "C",
  "United States": "D",
  Germany: "E",
  Netherlands: "F",
  Belgium: "G",
  Spain: "H",
  France: "I",
  Argentina: "J",
  Portugal: "K",
  England: "L",
};
const LETTER_ORDER = "ABCDEFGHIJKL";

// 조별리그는 조 안에서만 경기 → 연결요소 = 조. 공식 글자(A~L) 순으로 반환.
export function recoverGroups(): string[][] {
  const adj = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  };
  for (const m of matchesData as Match[]) {
    add(m.home, m.away);
    add(m.away, m.home);
  }
  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const t of adj.keys()) {
    if (seen.has(t)) continue;
    const comp: string[] = [];
    const stack = [t];
    while (stack.length) {
      const u = stack.pop()!;
      if (seen.has(u)) continue;
      seen.add(u);
      comp.push(u);
      for (const v of adj.get(u) ?? []) if (!seen.has(v)) stack.push(v);
    }
    comp.sort((a, b) => (champRank[a] ?? 99) - (champRank[b] ?? 99));
    groups.push(comp);
  }
  // 공식 글자로 정렬 (각 조의 대표 팀으로 글자 판별)
  const letterOf = (g: string[]) => {
    for (const t of g) if (ANCHOR[t]) return ANCHOR[t];
    return "Z";
  };
  groups.sort(
    (a, b) => LETTER_ORDER.indexOf(letterOf(a)) - LETTER_ORDER.indexOf(letterOf(b)),
  );
  return groups;
}

// 그룹 글자(A~L) 라벨
export function groupLetter(groupIndex: number): string {
  return LETTER_ORDER[groupIndex] ?? `${groupIndex + 1}`;
}

// 동률 팀 집합 내 맞대결 성적(승자승)
function h2hStats(
  teams: Set<string>,
  played: LiveMatch[],
): Map<string, { p: number; gd: number; gf: number }> {
  const m = new Map<string, { p: number; gd: number; gf: number }>();
  teams.forEach((t) => m.set(t, { p: 0, gd: 0, gf: 0 }));
  for (const g of played) {
    if (g.status !== "FINAL" || !g.homeEn || !g.awayEn) continue;
    if (!teams.has(g.homeEn) || !teams.has(g.awayEn)) continue;
    const h = m.get(g.homeEn)!,
      a = m.get(g.awayEn)!;
    h.gd += g.homeScore - g.awayScore;
    a.gd += g.awayScore - g.homeScore;
    h.gf += g.homeScore;
    a.gf += g.awayScore;
    if (g.homeScore > g.awayScore) h.p += 3;
    else if (g.homeScore < g.awayScore) a.p += 3;
    else {
      h.p += 1;
      a.p += 1;
    }
  }
  return m;
}

// 2026 순위 규칙: 승점 → (동률 시) 승자승 승점·골득실·다득점 → 전체 골득실·다득점 → FIFA랭킹(Elo)
export function orderByRules<T extends { team: string; pts: number; gd: number; gf: number }>(
  items: T[],
  played: LiveMatch[],
): T[] {
  return [...items].sort((a, b) => {
    if (a.pts !== b.pts) return b.pts - a.pts;
    const tied = new Set(items.filter((x) => x.pts === a.pts).map((x) => x.team));
    if (tied.size > 1) {
      const h = h2hStats(tied, played);
      const ha = h.get(a.team)!,
        hb = h.get(b.team)!;
      if (ha.p !== hb.p) return hb.p - ha.p;
      if (ha.gd !== hb.gd) return hb.gd - ha.gd;
      if (ha.gf !== hb.gf) return hb.gf - ha.gf;
    }
    if (a.gd !== b.gd) return b.gd - a.gd;
    if (a.gf !== b.gf) return b.gf - a.gf;
    return (champRank[a.team] ?? 99) - (champRank[b.team] ?? 99);
  });
}

export type StandRow = {
  team: string;
  pld: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};
export type GroupStanding = { label: string; rows: StandRow[] };

export function computeStandings(played: LiveMatch[]): GroupStanding[] {
  const groups = recoverGroups();
  const teamGroup = new Map<string, number>();
  groups.forEach((g, i) => g.forEach((t) => teamGroup.set(t, i)));

  const blank = (team: string): StandRow => ({
    team, pld: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
  });
  const table = new Map<string, StandRow>();
  groups.forEach((g) => g.forEach((t) => table.set(t, blank(t))));

  for (const m of played) {
    if (m.status !== "FINAL" || !m.homeEn || !m.awayEn) continue;
    const gi = teamGroup.get(m.homeEn);
    if (gi == null || teamGroup.get(m.awayEn) !== gi) continue;
    const h = table.get(m.homeEn)!,
      a = table.get(m.awayEn)!;
    h.pld++; a.pld++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.w++; a.l++; h.pts += 3; }
    else if (m.homeScore < m.awayScore) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  }
  table.forEach((r) => (r.gd = r.gf - r.ga));

  return groups.map((g, i) => {
    const rows = orderByRules(g.map((t) => table.get(t)!), played);
    return { label: `그룹 ${groupLetter(i)}`, rows };
  });
}
