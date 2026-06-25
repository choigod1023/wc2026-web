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
  clock: string | null; // 진행 중 경기 시간 (예: "후반 12'")
  minute: number | null; // 경과 분(숫자) — 인플레이 계산용
  playText: string | null; // 최근 상황 (예: "후반 시작")
};

type NamedTeam = {
  name: string;
  periodData?: { period: number; score: number }[];
};

function teamScore(t: NamedTeam): number {
  return (t.periodData ?? []).reduce((s, p) => s + (p.score ?? 0), 0);
}

// 실제 경과시간(벽시계) 추정 — named가 라이브 시계를 안 주거나 00:00에 멈출 때 폴백.
// startDatetime은 KST(타임존 표기 없음) → +09:00로 해석. 하프타임 15분 보정.
function elapsedMin(g: any): number | null {
  const s: string | null = g.realStartDateTime ?? g.startDatetime ?? null;
  if (!s) return null;
  const iso = /[zZ]|[+\-]\d\d:?\d\d$/.test(s) ? s : s + "+09:00";
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 0) return null;
  if (mins <= 47) return Math.max(1, Math.round(mins)); // 전반
  if (mins <= 62) return 45; // 하프타임 추정(시계 정지)
  if (mins <= 107) return Math.round(mins - 15); // 후반(휴식 15분 보정)
  return 90;
}

// API 시계가 의미있는지(존재 + 00:00 아님).
function apiMinute(g: any): number | null {
  const b = g.broadcast ?? {};
  const period = b.period ?? g.period ?? 0;
  const dt: string | null = b.displayTime ?? g.displayTime ?? null;
  if (!period || !dt || !/^\d+:\d+$/.test(dt) || dt === "00:00") return null;
  const base = period === 1 ? 0 : period === 2 ? 45 : 90;
  return base + Number(dt.split(":")[0]);
}

// 경기 경과 분(숫자). API 시계 우선, 멈춰있으면 실경과시간으로 추정.
function liveMinute(g: any): number | null {
  return apiMinute(g) ?? elapsedMin(g);
}

// 진행 중 경기 시간 라벨(분 기준으로 일관). "(추정)"은 API 시계가 없을 때.
function liveClock(g: any): string | null {
  const m = liveMinute(g);
  if (m == null) return null;
  const est = apiMinute(g) == null ? "~" : ""; // 추정이면 ~ 접두
  if (m <= 45) return `전반 ${est}${m}'`;
  if (m <= 90) return `후반 ${est}${m - 45}'`;
  return `연장 ${est}${m - 90}'`;
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
  const status = mapStatus(g);
  // 진행 중엔 broadcast.score가 가장 현재 스코어. 없으면 periodData 합.
  const bScore = g.broadcast?.score;
  const hasB =
    status === "LIVE" && bScore && typeof bScore.home === "number";
  return {
    id: g.id,
    startDatetime: g.startDatetime,
    status,
    displayTime: g.displayTime ?? null,
    period: g.broadcast?.period ?? g.period ?? 0,
    homeKo: h.name,
    awayKo: a.name,
    homeEn: enFromKo(h.name),
    awayEn: enFromKo(a.name),
    homeScore: hasB ? bScore.home : teamScore(h),
    awayScore: hasB ? bScore.away : teamScore(a),
    result: result as LiveMatch["result"],
    odds: extractOdds(g),
    clock: status === "LIVE" ? liveClock(g) : null,
    minute: status === "LIVE" ? liveMinute(g) : null,
    playText: status === "LIVE" ? (g.broadcast?.playText ?? null) : null,
  };
}

function pickWC(all: any): LiveMatch[] {
  if (!Array.isArray(all)) return [];
  return all
    .filter((g: any) => g?.league?.id === WC_LEAGUE_ID && g?.teams?.home && g?.teams?.away)
    .map(normalize);
}

// revalidate===0 이면 데이터 캐시 우회(no-store). 라이브(오늘) 경기는 항상 0으로
// 호출해 'getLiveWindow 5초 / getAllPlayed 60초'가 같은 URL에서 충돌하던 문제 제거.
function cacheInit(revalidate: number): RequestInit {
  const headers = { "User-Agent": "Mozilla/5.0" };
  return revalidate === 0
    ? { headers, cache: "no-store" }
    : { headers, next: { revalidate } };
}

async function fetchDate(date: string, revalidate: number): Promise<LiveMatch[]> {
  try {
    const res = await fetch(
      `${BASE}/sports/soccer/games?date=${date}`,
      cacheInit(revalidate),
    );
    if (!res.ok) return [];
    return pickWC(await res.json());
  } catch {
    return [];
  }
}

// 진행 중 경기의 퇴장 수(팀별) — broadcasts 이벤트의 RED + locationType 으로 집계.
export async function getRedCards(
  gameId: number,
): Promise<{ home: number; away: number; lastCard: string | null }> {
  try {
    const res = await fetch(`${BASE}/sports/soccer/games/${gameId}/broadcasts`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 10 },
    });
    if (!res.ok) return { home: 0, away: 0, lastCard: null };
    const j = await res.json();
    const ev: any[] = Array.isArray(j) ? j : (j?.broadcasts ?? []);
    let home = 0,
      away = 0,
      lastCard: string | null = null;
    for (const e of ev) {
      const t = String(e?.eventType ?? "");
      if (t.includes("RED")) {
        if (e.locationType === "HOME") home++;
        else if (e.locationType === "AWAY") away++;
      }
      if (t.includes("CARD")) lastCard = e?.playText ?? lastCard;
    }
    return { home, away, lastCard };
  } catch {
    return { home: 0, away: 0, lastCard: null };
  }
}

// named 라이브 정식 피드: 오늘+내일 경기(진행 중 broadcast 포함). 라이브 표시에 더 정확.
async function fetchTodayGames(revalidate: number): Promise<LiveMatch[]> {
  try {
    const res = await fetch(
      `${BASE}/sports/soccer/today-games?tomorrow-game-flag=true`,
      cacheInit(revalidate),
    );
    if (!res.ok) return [];
    return pickWC(await res.json());
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
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 10 } },
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

// 라이브/오늘 주변 경기.
//  · 주 피드: today-games(오늘+내일, 진행 중 broadcast 최신) — 라이브 정확도 우선
//  · 보강: 어제·오늘 날짜 조회 → 이미 끝난 경기(종료 배당 적중 표시용) 포함
//  today-games에 있는 경기는 today-games 값으로 덮어써(가장 최신 라이브 상태) 사용.
export async function getLiveWindow(): Promise<LiveMatch[]> {
  const [today, recent, oddsMaps] = await Promise.all([
    fetchTodayGames(0), // 라이브 — 항상 신선(no-store), 응답단 s-maxage=5로 부하 제어
    Promise.all([kstDate(-1), kstDate(0)].map((d) => fetchDate(d, 0))),
    Promise.all([kstDate(-1), kstDate(1)].map(fetchOddsMap)),
  ]);
  const odds = new Map<number, LiveMatch["odds"]>();
  for (const m of oddsMaps) for (const [k, v] of m) odds.set(k, v);

  const byId = new Map<number, LiveMatch>();
  for (const m of recent.flat()) byId.set(m.id, m); // 날짜 기반(종료 포함)
  for (const m of today) byId.set(m.id, m); // today-games 우선(최신 라이브)

  const out = [...byId.values()].map((m) =>
    !m.odds && odds.has(m.id) ? { ...m, odds: odds.get(m.id)! } : m,
  );
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
  // 오늘 날짜는 라이브와 같은 URL → no-store(0)로 일치시켜 충돌 제거. 지난 날짜는
  // 결과가 안 바뀌므로 길게(1시간) 캐시.
  const todayStr = kstDate(0);
  const lists = await Promise.all(
    dates.map((dt) => fetchDate(dt, dt === todayStr ? 0 : 3600)),
  );
  const seen = new Set<number>();
  const out: LiveMatch[] = [];
  for (const m of lists.flat()) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
}
