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
type Payload = { asOf: string; matches: Match[]; standings: GroupStanding[] };

function impliedFromOdds(o: Odds) {
  const inv = [1 / o.win, 1 / o.draw, 1 / o.loss];
  const s = inv[0] + inv[1] + inv[2];
  return { h: inv[0] / s, d: inv[1] / s, a: inv[2] / s };
}

function statusLabel(m: Match): { text: string; cls: string } {
  if (m.status === "LIVE")
    return {
      text: m.displayTime ? `LIVE · ${m.displayTime}` : "LIVE",
      cls: "live",
    };
  if (m.status === "FINAL") return { text: "경기 종료", cls: "fin" };
  if (m.status === "CANCEL") return { text: "취소", cls: "fin" };
  const t = new Date(m.startDatetime);
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  const md = `${t.getMonth() + 1}/${t.getDate()}`;
  return { text: `${md} ${hh}:${mm} 예정`, cls: "fin" };
}

export default function LivePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);
  const [updated, setUpdated] = useState<string>("");

  useEffect(() => {
    let alive = true;
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
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const hasLive = data?.matches.some((m) => m.status === "LIVE");

  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>라이브</h1>
        <p>
          실시간 스코어 · 경기별 3-way 배당(소수) · 모델 예측 · 실시간 조별 순위.
          30초마다 자동 갱신됩니다.
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
        {data?.matches.map((m) => {
          const st = statusLabel(m);
          const showScore = m.status === "LIVE" || m.status === "FINAL";
          const mk = m.odds ? impliedFromOdds(m.odds) : null;
          return (
            <div
              key={m.id}
              className={`live-match ${m.status === "LIVE" ? "is-live" : ""}`}
            >
              <div className="lm-top">
                <span className={`lm-status ${st.cls}`}>{st.text}</span>
                <span>월드컵</span>
              </div>
              <div className="lm-score">
                <span className="lm-team left">{ko(m.homeEn ?? m.homeKo)}</span>
                <span className="lm-num">
                  {showScore ? `${m.homeScore} : ${m.awayScore}` : "vs"}
                </span>
                <span className="lm-team">{ko(m.awayEn ?? m.awayKo)}</span>
              </div>

              {m.odds && (
                <div className="lm-odds">
                  <div className="chip">
                    <span className="lbl">홈승</span>
                    <b>{m.odds.win.toFixed(2)}</b>
                  </div>
                  <div className="chip">
                    <span className="lbl">무</span>
                    <b>{m.odds.draw.toFixed(2)}</b>
                  </div>
                  <div className="chip">
                    <span className="lbl">원정승</span>
                    <b>{m.odds.loss.toFixed(2)}</b>
                  </div>
                </div>
              )}

              {(m.prediction || mk) && (
                <div className="lm-compare">
                  {m.prediction && (
                    <span>
                      모델{" "}
                      <b>
                        {(m.prediction.pHome * 100).toFixed(0)}/
                        {(m.prediction.pDraw * 100).toFixed(0)}/
                        {(m.prediction.pAway * 100).toFixed(0)}
                      </b>
                    </span>
                  )}
                  {mk && (
                    <span>
                      시장(배당){" "}
                      {(mk.h * 100).toFixed(0)}/{(mk.d * 100).toFixed(0)}/
                      {(mk.a * 100).toFixed(0)}
                    </span>
                  )}
                  <span className="note">(홈/무/원정 %)</span>
                </div>
              )}
            </div>
          );
        })}
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
                <table>
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
                        <td style={{ whiteSpace: "nowrap" }}>{ko(r.team)}</td>
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
