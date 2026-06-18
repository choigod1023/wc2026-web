"use client";

import { useEffect, useState } from "react";
import scores from "@/data/score_predictions.json";
import liveScore from "@/data/live_score.json";
import { ko } from "@/lib/teams";

// 현재(업데이트된 Elo) 스코어 예측: home|away → overUnder/expScore
const liveMap = new Map<string, any>();
for (const m of liveScore as any[]) liveMap.set(`${m.home}|${m.away}`, m);

type Score = {
  date: string;
  home: string;
  away: string;
  eloDiff: number;
  lambdaHome: number;
  lambdaAway: number;
  expScore: string;
  topScores: { h: number; a: number; p: number }[];
  overUnder: Record<string, number>;
  handicap: Record<string, number>;
  fairHandicap: number;
  rationale: string;
};
type Result = { hs: number; as: number };

function fmtDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(m)}월 ${Number(day)}일`;
}

export default function ScoreList() {
  const all = scores as Score[];
  const [results, setResults] = useState<Map<string, Result>>(new Map());

  useEffect(() => {
    let alive = true;
    fetch("/api/live", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const map = new Map<string, Result>();
        for (const m of j.finished ?? []) {
          if (m.homeEn && m.awayEn)
            map.set(`${m.homeEn}|${m.awayEn}`, {
              hs: m.homeScore,
              as: m.awayScore,
            });
        }
        setResults(map);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 예측에 실제 결과 매칭(양방향)
  const resultFor = (s: Score): Result | null => {
    const d = results.get(`${s.home}|${s.away}`);
    if (d) return d;
    const r = results.get(`${s.away}|${s.home}`);
    if (r) return { hs: r.as, as: r.hs };
    return null;
  };

  // 채점 요약
  let nOU = 0,
    hitOU = 0,
    nRes = 0,
    hitRes = 0,
    nExact = 0,
    totErr = 0,
    nGraded = 0;
  const graded = all.map((s) => {
    const res = resultFor(s);
    if (!res) return { s, res: null };
    const total = res.hs + res.as;
    const overPred = s.overUnder["2.5"] >= 0.5;
    const ouHit = overPred === total > 2.5;
    const actRes =
      res.hs > res.as ? "H" : res.hs < res.as ? "A" : "D";
    const [eh, ea] = s.expScore.split("-").map(Number);
    const predRes = eh > ea ? "H" : eh < ea ? "A" : "D";
    const resHit = predRes === actRes;
    const exact = eh === res.hs && ea === res.as;
    nOU++;
    if (ouHit) hitOU++;
    nRes++;
    if (resHit) hitRes++;
    nGraded++;
    if (exact) nExact++;
    totErr += Math.abs(s.lambdaHome + s.lambdaAway - total);
    return { s, res, total, ouHit, actRes, resHit, exact };
  });

  const byDate = new Map<string, typeof graded>();
  for (const g of graded) {
    if (!byDate.has(g.s.date)) byDate.set(g.s.date, []);
    byDate.get(g.s.date)!.push(g);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div>
      {nGraded > 0 && (
        <div className="card grade-summary">
          <div className="gs-item">
            <div className="gs-label">언더/오버 2.5 적중</div>
            <div className="gs-val">
              {hitOU}/{nOU}{" "}
              <small>({nOU ? Math.round((hitOU / nOU) * 100) : 0}%)</small>
            </div>
          </div>
          <div className="gs-item">
            <div className="gs-label">승무패 적중</div>
            <div className="gs-val">
              {hitRes}/{nRes}{" "}
              <small>({nRes ? Math.round((hitRes / nRes) * 100) : 0}%)</small>
            </div>
          </div>
          <div className="gs-item">
            <div className="gs-label">정확 스코어</div>
            <div className="gs-val">{nExact}건</div>
          </div>
          <div className="gs-item">
            <div className="gs-label">평균 총득점 오차</div>
            <div className="gs-val">{(totErr / nGraded).toFixed(2)}골</div>
          </div>
        </div>
      )}

      {dates.map((d) => (
        <div className="matchday" key={d}>
          <h3>{fmtDate(d)}</h3>
          {byDate.get(d)!.map(({ s, res, total, ouHit, resHit, exact }, i) => {
            const o25 = s.overUnder["2.5"] * 100;
            const fh = s.fairHandicap;
            const fhSide = fh > 0 ? ko(s.home) : ko(s.away);
            return (
              <div className="score-card" key={i}>
                <div className="sc-head">
                  <div className="sc-teams">
                    {ko(s.home)} <span className="muted2">vs</span> {ko(s.away)}
                  </div>
                  {res ? (
                    <div className="sc-actual" title="예상 → 실제">
                      <span className="muted2">{s.expScore}</span> →{" "}
                      <b>
                        {res.hs}-{res.as}
                      </b>
                      {exact && <span className="tag-ok">정확 ✓</span>}
                    </div>
                  ) : (
                    <div className="sc-exp" title="가장 가능성 큰 스코어">
                      {s.expScore}
                    </div>
                  )}
                </div>

                <div className="sc-meta">
                  <span>
                    기대득점{" "}
                    <b>
                      {s.lambdaHome.toFixed(2)} : {s.lambdaAway.toFixed(2)}
                    </b>
                  </span>
                  <span className="muted2">
                    실력차 {s.eloDiff >= 0 ? "+" : ""}
                    {s.eloDiff}
                  </span>
                </div>

                {/* 예정 경기: 개막 전 → 현재(업데이트) 예측 변화 */}
                {!res &&
                  (() => {
                    const lv = liveMap.get(`${s.home}|${s.away}`);
                    if (!lv) return null;
                    const liveO = lv.overUnder["2.5"] * 100;
                    const diff = liveO - o25;
                    if (Math.abs(diff) < 3) return null;
                    return (
                      <div className="sc-shift">
                        📈 오버 2.5: 개막 전{" "}
                        <span className="muted2">{o25.toFixed(0)}%</span> → 현재{" "}
                        <b>{liveO.toFixed(0)}%</b>
                        <span className="muted2">
                          {" "}
                          · 예상 {s.expScore}→{lv.expScore}
                        </span>
                      </div>
                    );
                  })()}

                {/* 종료 경기: 적중 배지 */}
                {res && (
                  <div className="sc-grades">
                    <span className={ouHit ? "tag-ok" : "tag-no"}>
                      O/U 2.5 {ouHit ? "적중 ✓" : "실패 ✗"}
                      <span className="g-sub">
                        {" "}
                        (예측 {o25 >= 50 ? "오버" : "언더"} / 실제 {total}골)
                      </span>
                    </span>
                    <span className={resHit ? "tag-ok" : "tag-no"}>
                      승무패 {resHit ? "적중 ✓" : "실패 ✗"}
                    </span>
                  </div>
                )}

                <div className="sc-grid">
                  <div className="sc-block">
                    <div className="sc-label">언더/오버 2.5</div>
                    <div className="ou-bar">
                      <span className="ou-over" style={{ width: `${o25}%` }}>
                        오버 {o25.toFixed(0)}%
                      </span>
                      <span
                        className="ou-under"
                        style={{ width: `${100 - o25}%` }}
                      >
                        언더 {(100 - o25).toFixed(0)}%
                      </span>
                    </div>
                    <div className="sc-lines">
                      {Object.entries(s.overUnder).map(([line, p]) => (
                        <span key={line} className="sc-line">
                          O{line} <b>{(p * 100).toFixed(0)}%</b>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sc-block">
                    <div className="sc-label">
                      적정 핸디캡{" "}
                      {fh === 0
                        ? "없음(박빙)"
                        : `${fhSide} -${Math.abs(fh).toFixed(1)}`}
                    </div>
                    <div className="sc-lines">
                      {s.topScores.slice(0, 4).map((t, j) => (
                        <span key={j} className="sc-line">
                          {t.h}-{t.a} <b>{(t.p * 100).toFixed(0)}%</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="sc-why">
                  {s.rationale
                    .split(s.away)
                    .join(ko(s.away))
                    .split(s.home)
                    .join(ko(s.home))}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
