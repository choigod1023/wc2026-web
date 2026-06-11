// named.com 스포츠 API 연동 (서버 전용). 월드컵(league.id=639) 경기만 정규화.
// 키 불필요. CORS 회피를 위해 Next 라우트 핸들러(서버)에서만 호출한다.
import { enFromKo } from "./teams";

const BASE = "https://sports-api.named.com/v1.0";
const WC_LEAGUE_ID = 639;
const TOURNAMENT_START = "2026-06-11";

export type LiveMatch = {
  id: number;
  startDatetime: string;
  status: "READY" | "LIVE" | "FINAL" | "CANCEL";
  displayTime: string | null;
  period: number;
  homeKo: string;
  awayKo: string;
  homeEn: string | null;
  awayEn: string | null;
  homeScore: number;
  awayScore: number;
  result: "WIN" | "DRAW" | "LOSS" | "UNKNOWN";
  odds: { win: number; draw: number; loss: number } | null;
};

type NamedTeam = {
  name: string;
  periodData?: { period: number; score: number }[];
};

function teamScore(t: NamedTeam): number {
  return (t.periodData ?? []).reduce((s, p) => s + (p.score ?? 0), 0);
}

function mapStatus(g: any): LiveMatch["status"] {
  const s = String(g.gameStatus ?? "").toUpperCase();
  if (s === "CANCEL" || g.result === "CANCEL") return "CANCEL";
  if (s === "FINAL" || s === "FINISH" || s === "END") return "FINAL";
  if (["WIN", "LOSE", "DRAW"].includes(g.result)) {
    // 결과 확정 + 아직 FINAL 안 찍힌 경우도 종료로 간주
    if (s === "READY") return "LIVE";
    return "FINAL";
  }
  if (s === "READY" || s === "") {
    return new Date(g.startDatetime).getTime() <= Date.now() ? "LIVE" : "READY";
  }
  return "LIVE";
}

function extractOdds(g: any): LiveMatch["odds"] {
  const odds = g?.representativeOdds?.domestic?.odds ?? g?.odds?.domesticWinLoseOdds;
  if (!Array.isArray(odds)) return null;
  const pick = (type: string) =>
    odds.find((o: any) => o.type === type && o.latestFlag !== false)?.odds;
  const win = pick("WIN");
  const draw = pick("DRAW");
  const loss = pick("LOSS");
  if (win == null || draw == null || loss == null) return null;
  return { win, draw, loss };
}

function normalize(g: any): LiveMatch {
  const h = g.teams.home as NamedTeam;
  const a = g.teams.away as NamedTeam;
  const result = ["WIN", "DRAW", "LOSE"].includes(g.result)
    ? g.result === "LOSE"
      ? "LOSS"
      : g.result
    : "UNKNOWN";
  return {
    id: g.id,
    startDatetime: g.startDatetime,
    status: mapStatus(g),
    displayTime: g.displayTime ?? null,
    period: g.period ?? 0,
    homeKo: h.name,
    awayKo: a.name,
    homeEn: enFromKo(h.name),
    awayEn: enFromKo(a.name),
    homeScore: teamScore(h),
    awayScore: teamScore(a),
    result: result as LiveMatch["result"],
    odds: extractOdds(g),
  };
}

async function fetchDate(date: string, revalidate: number): Promise<LiveMatch[]> {
  try {
    const res = await fetch(`${BASE}/sports/soccer/games?date=${date}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate },
    });
    if (!res.ok) return [];
    const all = await res.json();
    if (!Array.isArray(all)) return [];
    return all
      .filter((g: any) => g?.league?.id === WC_LEAGUE_ID && g?.teams?.home && g?.teams?.away)
      .map(normalize);
  } catch {
    return [];
  }
}

// KST(UTC+9) 기준 날짜 문자열
function kstDate(offsetDays = 0): string {
  const now = new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400 * 1000);
  return now.toISOString().slice(0, 10);
}

// games-by-date 엔드포인트엔 배당이 없어, popular-games 에서 id→배당을 보강한다.
async function fetchOddsMap(date: string): Promise<Map<number, LiveMatch["odds"]>> {
  const map = new Map<number, LiveMatch["odds"]>();
  try {
    const res = await fetch(
      `${BASE}/popular-games?date=${date}&tomorrow-game-flag=true`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 30 } },
    );
    if (!res.ok) return map;
    const j = await res.json();
    for (const g of j?.soccer ?? []) {
      if (g?.league?.id !== WC_LEAGUE_ID) continue;
      const o = extractOdds(g);
      if (o) map.set(g.id, o);
    }
  } catch {
    /* ignore */
  }
  return map;
}

// 라이브/오늘 주변 경기 (어제~모레)
export async function getLiveWindow(): Promise<LiveMatch[]> {
  const dates = [-1, 0, 1, 2].map(kstDate);
  const [lists, oddsMaps] = await Promise.all([
    Promise.all(dates.map((d) => fetchDate(d, 30))),
    // popular-games(+tomorrow flag)로 -1,+1 호출하면 -1,0,1,2 모두 커버
    Promise.all([kstDate(-1), kstDate(1)].map(fetchOddsMap)),
  ]);
  const odds = new Map<number, LiveMatch["odds"]>();
  for (const m of oddsMaps) for (const [k, v] of m) odds.set(k, v);

  const seen = new Set<number>();
  const out: LiveMatch[] = [];
  for (const m of lists.flat()) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    if (!m.odds && odds.has(m.id)) m.odds = odds.get(m.id)!;
    out.push(m);
  }
  out.sort((x, y) => x.startDatetime.localeCompare(y.startDatetime));
  return out;
}

// 개막일~오늘까지 모든 WC 경기 (순위 계산용)
export async function getAllPlayed(): Promise<LiveMatch[]> {
  const today = kstDate(0);
  const dates: string[] = [];
  const d = new Date(TOURNAMENT_START + "T00:00:00Z");
  const end = new Date(today + "T00:00:00Z");
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  const lists = await Promise.all(dates.map((dt) => fetchDate(dt, 120)));
  const seen = new Set<number>();
  const out: LiveMatch[] = [];
  for (const m of lists.flat()) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}
