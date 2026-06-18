"use client";

import { useEffect, useState } from "react";
import { ko } from "@/lib/teams";

type Odds = { win: number; draw: number; loss: number };
type Pred = { pHome: number; pDraw: number; pAway: number; flipped: boolean };
type Match = {
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
  result: string;
  odds: Odds | null;
  prediction: Pred | null;
  livePrediction: { pHome: number; pDraw: number; pAway: number } | null;
  clock: string | null;
  minute: number | null;
  playText: string | null;
  inplay: {
    pH: number;
    pD: number;
    pA: number;
    over25: number;
    expFinal: string;
    remMin: number;
    redHome: number;
    redAway: number;
  } | null;
};
type StandRow = {
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
type GroupStanding = { label: string; rows: StandRow[] };
type Payload = {
  asOf: string;
  matches: Match[];
  finished: Match[];
  standings: GroupStanding[];
};

function impliedFromOdds(o: Odds) {
  const inv = [1 / o.win, 1 / o.draw, 1 / o.loss];
  const s = inv[0] + inv[1] + inv[2];
  return { h: inv[0] / s, d: inv[1] / s, a: inv[2] / s };
}

const OUT_LABEL = { H: "홈승", D: "무", A: "원정승" } as const;

// 받침 유무로 을/를 선택
function eulReul(word: string): string {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xac00 || c > 0xd7a3) return "을(를)";
  return (c - 0xac00) % 28 !== 0 ? "을" : "를";
}

// 예측에서 가장 높게 본 결과 + 그 확률
function modelTop(p: Pred): { key: "H" | "D" | "A"; prob: number } {
  const arr = [
    { key: "H" as const, prob: p.pHome },
    { key: "D" as const, prob: p.pDraw },
    { key: "A" as const, prob: p.pAway },
  ];
  return arr.reduce((a, b) => (b.prob > a.prob ? b : a));
}
function probOf(p: Pred, key: "H" | "D" | "A"): number {
  return key === "H" ? p.pHome : key === "D" ? p.pDraw : p.pAway;
}
const pct = (x: number) => `${Math.round(x * 100)}`;
// 개막 전 대비 현재 예측이 3%p 이상 달라졌는지
function predShift(m: Match): boolean {
  const a = m.prediction!,
    b = m.livePrediction!;
  return (
    Math.max(
      Math.abs(a.pHome - b.pHome),
      Math.abs(a.pDraw - b.pDraw),
      Math.abs(a.pAway - b.pAway),
    ) >= 0.03
  );
}

function statusLabel(m: Match): { text: string; cls: string } {
  if (m.status === "LIVE")
    return { text: m.clock ? `LIVE · ${m.clock}` : "LIVE", cls: "live" };
  if (m.status === "FINAL") return { text: "경기 종료", cls: "fin" };
  if (m.status === "CANCEL") return { text: "취소", cls: "fin" };
  const t = new Date(m.startDatetime);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const md = `${t.getMonth() + 1}/${t.getDate()}`;
  return { text: `${md} ${hh}:${mm} 예정`, cls: "fin" };
}

// 종료 경기의 실제 결과(H/D/A) — 어떤 배당/예측이 맞았는지 판정용
function finalOutcome(m: Match): "H" | "D" | "A" | null {
  if (m.status !== "FINAL") return null;
  return m.homeScore > m.awayScore ? "H" : m.homeScore < m.awayScore ? "A" : "D";
}

function MatchCard({ m }: { m: Match }) {
  const st = statusLabel(m);
  const showScore = m.status === "LIVE" || m.status === "FINAL";
  const mk = m.odds ? impliedFromOdds(m.odds) : null;
  const out = finalOutcome(m);
  const oddsArr = m.odds
    ? ([
        { key: "H", lbl: "홈승", v: m.odds.win },
        { key: "D", lbl: "무", v: m.odds.draw },
        { key: "A", lbl: "원정승", v: m.odds.loss },
      ] as const)
    : [];
  const favKey =
    oddsArr.length > 0 ? oddsArr.reduce((a, b) => (b.v < a.v ? b : a)).key : null;
  const mTop = m.prediction ? modelTop(m.prediction) : null;
  const modelKey = mTop?.key ?? null;
  const modelHit = out != null && modelKey === out;

  return (
    <div className={`live-match ${m.status === "LIVE" ? "is-live" : ""}`}>
      <div className="lm-top">
        <span className={`lm-status ${st.cls}`}>
          {m.status === "LIVE" && <span className="live-dot mini" />}
          {st.text}
        </span>
        <span>월드컵</span>
      </div>
      <div className="lm-score">
        <span className="lm-team left">{ko(m.homeEn ?? m.homeKo)}</span>
        <span className={`lm-num ${m.status === "LIVE" ? "livescore" : ""}`}>
          {showScore ? `${m.homeScore} : ${m.awayScore}` : "vs"}
        </span>
        <span className="lm-team">{ko(m.awayEn ?? m.awayKo)}</span>
      </div>

      {m.status === "LIVE" && m.playText && (
        <div className="lm-playtext">{m.playText}</div>
      )}

      {/* 인플레이 라이브 추정: 현재 스코어 + 남은 시간 반영 */}
      {m.status === "LIVE" && m.inplay && (
        <div className="lm-inplay">
          <div className="ip-head">
            ⚡ 라이브 추정{" "}
            <span className="note">(남은 {m.inplay.remMin}분 반영)</span>
            {(m.inplay.redHome > 0 || m.inplay.redAway > 0) && (
              <span className="ip-red">
                🟥{" "}
                {m.inplay.redHome > 0 && `${ko(m.homeEn ?? m.homeKo)} ${m.inplay.redHome}`}
                {m.inplay.redHome > 0 && m.inplay.redAway > 0 && " · "}
                {m.inplay.redAway > 0 && `${ko(m.awayEn ?? m.awayKo)} ${m.inplay.redAway}`}
              </span>
            )}
          </div>
          <div className="ip-row">
            <span>승부</span>
            <b>
              {pct(m.inplay.pH)}/{pct(m.inplay.pD)}/{pct(m.inplay.pA)}
            </b>
            <span className="note">홈/무/원정 %</span>
          </div>
          <div className="ip-row">
            <span>오버 2.5</span>
            <b>{pct(m.inplay.over25)}%</b>
            <span className="note">예상 최종 {m.inplay.expFinal}</span>
          </div>
        </div>
      )}

      {m.odds && (
        <div className="lm-odds">
          {oddsArr.map((c) => (
            <div
              key={c.key}
              className={`chip ${out === c.key ? "won" : out ? "lost" : ""}`}
            >
              <span className="lbl">
                {c.lbl}
                {out === c.key && " ✓"}
              </span>
              <b>{c.v.toFixed(2)}</b>
            </div>
          ))}
        </div>
      )}

      {out && (
        <>
          <div className="lm-result">
            결과 <b>{OUT_LABEL[out]}</b>
            {favKey != null &&
              (out === favKey ? (
                <span className="tag-ok">예상대로 (최저배당 적중)</span>
              ) : (
                <span className="tag-up">이변</span>
              ))}
            {modelKey != null && (
              <span className={modelHit ? "tag-ok" : "tag-no"}>
                모델 {modelHit ? "적중 ✓" : "빗나감 ✗"}
              </span>
            )}
          </div>
          {/* 모델이 빗나간 경우: 어떻게 빗나갔는지 */}
          {m.prediction && modelKey != null && !modelHit && (
            <div className="lm-miss">
              모델은 <b>{OUT_LABEL[modelKey]}</b>
              {eulReul(OUT_LABEL[modelKey])}{" "}
              {(mTop!.prob * 100).toFixed(0)}%로 가장 높게 봤지만, 실제는{" "}
              <b>{OUT_LABEL[out]}</b> (모델이 {OUT_LABEL[out]}에 준 확률{" "}
              {(probOf(m.prediction, out) * 100).toFixed(0)}%)
            </div>
          )}
        </>
      )}

      {!out && (m.prediction || mk) && (
        <div className="lm-compare">
          {m.livePrediction ? (
            <span>
              모델{" "}
              <b>
                {(m.livePrediction.pHome * 100).toFixed(0)}/
                {(m.livePrediction.pDraw * 100).toFixed(0)}/
                {(m.livePrediction.pAway * 100).toFixed(0)}
              </b>
            </span>
          ) : (
            m.prediction && (
              <span>
                모델{" "}
                <b>
                  {(m.prediction.pHome * 100).toFixed(0)}/
                  {(m.prediction.pDraw * 100).toFixed(0)}/
                  {(m.prediction.pAway * 100).toFixed(0)}
                </b>
              </span>
            )
          )}
          {mk && (
            <span>
              시장(배당) {(mk.h * 100).toFixed(0)}/{(mk.d * 100).toFixed(0)}/
              {(mk.a * 100).toFixed(0)}
            </span>
          )}
          <span className="note">(홈/무/원정 %)</span>
        </div>
      )}

      {/* 개막 전 → 현재 예측 변화 (충분히 달라졌을 때만) */}
      {!out && m.prediction && m.livePrediction && predShift(m) && (
        <div className="lm-shift">
          📈 개막 전{" "}
          <span className="muted2">
            {pct(m.prediction.pHome)}/{pct(m.prediction.pDraw)}/
            {pct(m.prediction.pAway)}
          </span>{" "}
          → 현재{" "}
          <b>
            {pct(m.livePrediction.pHome)}/{pct(m.livePrediction.pDraw)}/
            {pct(m.livePrediction.pAway)}
          </b>{" "}
          <span className="note">(결과 반영해 갱신)</span>
        </div>
      )}
    </div>
  );
}

function fmtDay(iso: string): string {
  const t = new Date(iso);
  return `${t.getMonth() + 1}월 ${t.getDate()}일`;
}

export default function LivePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);
  const [updated, setUpdated] = useState<string>("");

  useEffect(() => {
    let alive = true;
    let id: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      try {
        const res = await fetch("/api/live", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = (await res.json()) as Payload;
        if (!alive) return;
        setData(j);
        setErr(false);
        setUpdated(new Date().toLocaleTimeString("ko-KR"));
      } catch {
        if (alive) setErr(true);
      }
    };
    const start = () => {
      if (id) return;
      load();
      id = setInterval(load, 5000); // 약 5초마다 폴링 (라이브스코어 체감)
    };
    const stop = () => {
      if (id) clearInterval(id);
      id = null;
    };
    // 탭이 보일 때만 폴링(숨겨지면 중단, 다시 보이면 즉시 새로고침)
    const onVis = () => (document.hidden ? stop() : start());
    start();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      stop();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const hasLive = data?.matches.some((m) => m.status === "LIVE");

  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 className="ph1" style={{ fontSize: 32 }}>라이브</h1>
        <p>
          실시간 스코어 · 경기 시간 · 3-way 배당 · 모델 예측 · 실시간 조별 순위.
          약 5초마다 자동 갱신됩니다.
        </p>
        <div className="live-bar">
          {hasLive && <span className="live-dot" />}
          <span className="note">
            {err
              ? "데이터를 불러오지 못했습니다. 잠시 후 다시 시도합니다."
              : updated
                ? `마지막 갱신 ${updated}`
                : "불러오는 중…"}
          </span>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>⚽ 경기</h2>
          <span className="sub">진행 중 · 종료 · 예정</span>
        </div>
        {!data && !err && <div className="card">불러오는 중…</div>}
        {data && data.matches.length === 0 && (
          <div className="card note">표시할 월드컵 경기가 없습니다.</div>
        )}
        {data && data.matches.length > 0 && (
          <div className="match-grid">
            {data.matches.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </section>

      {/* 지난 경기 결과 (어제·다른 날 포함, 최신순) */}
      <section>
        <div className="section-head">
          <h2>🏁 지난 경기 결과</h2>
          <span className="sub">종료된 전체 경기 · 배당/모델 적중</span>
        </div>
        {data && data.finished.length === 0 && (
          <div className="card note">아직 종료된 경기가 없습니다.</div>
        )}
        {data &&
          (() => {
            const byDay = new Map<string, Match[]>();
            for (const m of data.finished) {
              const d = m.startDatetime.slice(0, 10);
              if (!byDay.has(d)) byDay.set(d, []);
              byDay.get(d)!.push(m);
            }
            return [...byDay.entries()].map(([d, ms]) => (
              <div key={d} className="matchday">
                <h3>{fmtDay(d)}</h3>
                <div className="match-grid">
                  {ms.map((m) => (
                    <MatchCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            ));
          })()}
      </section>

      <section>
        <div className="section-head">
          <h2>📊 실시간 조별 순위</h2>
          <span className="sub">종료된 경기 기준 · 상위 2팀 자동진출</span>
        </div>
        {data && (
          <div className="standings-grid">
            {data.standings.map((g) => (
              <div className="card" key={g.label}>
                <p className="grp-title">{g.label}</p>
                <table className="tbl-stand">
                  <thead>
                    <tr>
                      <th>팀</th>
                      <th className="num">경기</th>
                      <th className="num">승무패</th>
                      <th className="num">득실</th>
                      <th className="num">승점</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r, i) => (
                      <tr
                        key={r.team}
                        className={
                          i < 2 ? "qual" : r.pld >= 3 ? "elim" : undefined
                        }
                      >
                        <td className="team-cell">{ko(r.team)}</td>
                        <td className="num">{r.pld}</td>
                        <td className="num">
                          {r.w}-{r.d}-{r.l}
                        </td>
                        <td className="num">
                          {r.gd > 0 ? `+${r.gd}` : r.gd}
                        </td>
                        <td className="num">
                          <strong>{r.pts}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          순위는 종료된 경기 결과만 반영합니다(승점→골득실→득점). 3위 와일드카드
          진출은 표시하지 않습니다.
        </p>
      </section>
    </>
  );
}
