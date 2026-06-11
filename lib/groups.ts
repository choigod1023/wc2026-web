// 조 편성 복원(연결요소) + 실시간 순위 계산. 모델 데이터(영어 팀명) 기준.
import matchesData from "@/data/matches.json";
import championship from "@/data/championship.json";
import type { LiveMatch } from "./named";

type Match = { home: string; away: string };

const champRank: Record<string, number> = {};
(championship as { team: string; champion: number }[]).forEach((c, i) => {
  champRank[c.team] = i;
});

// 조별리그는 조 안에서만 경기 → 서로 경기하는 팀들의 연결요소 = 조
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
    groups.push(comp);
  }
  // 조 안은 우승확률 순, 조 자체는 최강팀 순으로 정렬해 안정적 라벨
  groups.forEach((g) =>
    g.sort((a, b) => (champRank[a] ?? 99) - (champRank[b] ?? 99)),
  );
  groups.sort(
    (a, b) => (champRank[a[0]] ?? 99) - (champRank[b[0]] ?? 99),
  );
  return groups;
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

export type GroupStanding = {
  label: string;
  rows: StandRow[];
};

export function computeStandings(played: LiveMatch[]): GroupStanding[] {
  const groups = recoverGroups();
  const teamGroup = new Map<string, number>();
  groups.forEach((g, i) => g.forEach((t) => teamGroup.set(t, i)));

  const blank = (team: string): StandRow => ({
    team,
    pld: 0,
    w: 0,
    d: 0,
    l: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    pts: 0,
  });
  const table = new Map<string, StandRow>();
  groups.forEach((g) => g.forEach((t) => table.set(t, blank(t))));

  for (const m of played) {
    if (m.status !== "FINAL") continue;
    if (!m.homeEn || !m.awayEn) continue;
    const gi = teamGroup.get(m.homeEn);
    if (gi == null || teamGroup.get(m.awayEn) !== gi) continue; // 같은 조 경기만
    const h = table.get(m.homeEn)!;
    const a = table.get(m.awayEn)!;
    h.pld++;
    a.pld++;
    h.gf += m.homeScore;
    h.ga += m.awayScore;
    a.gf += m.awayScore;
    a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) {
      h.w++;
      a.l++;
      h.pts += 3;
    } else if (m.homeScore < m.awayScore) {
      a.w++;
      h.l++;
      a.pts += 3;
    } else {
      h.d++;
      a.d++;
      h.pts++;
      a.pts++;
    }
  }
  table.forEach((r) => (r.gd = r.gf - r.ga));

  const LABELS = "ABCDEFGHIJKL".split("");
  return groups.map((g, i) => {
    const rows = g.map((t) => table.get(t)!);
    rows.sort(
      (x, y) =>
        y.pts - x.pts ||
        y.gd - x.gd ||
        y.gf - x.gf ||
        (champRank[x.team] ?? 99) - (champRank[y.team] ?? 99),
    );
    return { label: `그룹 ${LABELS[i] ?? i + 1}`, rows };
  });
}
