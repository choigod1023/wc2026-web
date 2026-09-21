"use client";

// 104경기 전 목록. 라운드·결과로 걸러 본다.
import { useMemo, useState } from "react";
import {
  fmtDate,
  outcomeText,
  ReportMatch,
  STAGE_ORDER,
  StageKey,
} from "@/lib/report";
import { ko } from "@/lib/teams";

type Props = { matches: ReportMatch[] };
type ResultFilter = "all" | "hit" | "miss";

const RESULT_TABS: { key: ResultFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "hit", label: "적중만" },
  { key: "miss", label: "실패만" },
];

export default function ReportMatches({ matches }: Props) {
  const [stage, setStage] = useState<StageKey | "ALL">("ALL");
  const [result, setResult] = useState<ResultFilter>("all");

  const stages = useMemo(() => {
    const seen = new Map<StageKey, string>();
    for (const m of matches) if (!seen.has(m.stageKey)) seen.set(m.stageKey, m.stage);
    return STAGE_ORDER.filter((k) => seen.has(k)).map((k) => ({
      key: k,
      label: seen.get(k)!,
    }));
  }, [matches]);

  const shown = useMemo(
    () =>
      matches.filter(
        (m) =>
          (stage === "ALL" || m.stageKey === stage) &&
          (result === "all" || (result === "hit" ? m.hit : !m.hit)),
      ),
    [matches, stage, result],
  );

  const hits = shown.filter((m) => m.hit).length;

  return (
    <div>
      <div className="rp-filters">
        <div className="rp-chips">
          <button
            type="button"
            className={`rp-chip ${stage === "ALL" ? "on" : ""}`}
            onClick={() => setStage("ALL")}
          >
            전체 라운드
          </button>
          {stages.map((s) => (
            <button
              type="button"
              key={s.key}
              className={`rp-chip ${stage === s.key ? "on" : ""}`}
              onClick={() => setStage(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="rp-chips">
          {RESULT_TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`rp-chip ${result === t.key ? "on" : ""}`}
              onClick={() => setResult(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="rp-count">
        {shown.length}경기 표시 · 적중 {hits} / 실패 {shown.length - hits}
      </p>

      <div className="card rp-list">
        {shown.map((m) => (
          <Row key={m.no} m={m} />
        ))}
        {shown.length === 0 && <p className="note">조건에 맞는 경기가 없습니다.</p>}
      </div>
    </div>
  );
}

function Row({ m }: { m: ReportMatch }) {
  const pens = m.decidedBy === "승부차기";
  return (
    <div className={`rp-row ${m.hit ? "" : "miss"}`}>
      <div className="rp-head">
        <span className="rp-when">
          {fmtDate(m.date)}
          <em className="rp-stage">{m.stage}</em>
        </span>
        <span className="rp-verdicts">
          <span className={m.hit ? "tag-ok" : "tag-no"}>
            {m.hit ? "적중" : "실패"}
          </span>
          {m.advHit != null && (
            <span className={m.advHit ? "tag-ok" : "tag-no"}>
              진출 {m.advHit ? "적중" : "실패"}
            </span>
          )}
        </span>
      </div>

      <div className="rp-teams">
        <span className={m.actual === "H" ? "won" : ""}>{ko(m.home)}</span>
        <b className="rp-score">
          {m.hs} : {m.as}
        </b>
        <span className={m.actual === "A" ? "won" : ""}>{ko(m.away)}</span>
        {pens && (
          <em className="rp-pens">승부차기 → {ko(m.advActual ?? "")} 진출</em>
        )}
      </div>

      <div className="rp-probs">
        <div className="barwrap" title="홈승 / 무 / 원정승">
          <span className="b-home" style={{ width: `${m.pHome * 100}%` }} />
          <span className="b-draw" style={{ width: `${m.pDraw * 100}%` }} />
          <span className="b-away" style={{ width: `${m.pAway * 100}%` }} />
        </div>
        <div className="probs">
          <span>
            <i>홈</i>
            <b>{(m.pHome * 100).toFixed(0)}%</b>
          </span>
          <span>
            <i>무</i>
            {(m.pDraw * 100).toFixed(0)}%
          </span>
          <span>
            <i>원정</i>
            {(m.pAway * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="rp-calls">
        <span className="rp-call">
          <i>모델</i> {outcomeText(m, m.pick)}
        </span>
        <span className="rp-call">
          <i>실제</i> {outcomeText(m, m.actual)}
        </span>
        {m.market && (
          <span className={`rp-call ${m.market.hit ? "" : "dim"}`}>
            <i>시장</i> {outcomeText(m, m.market.pick)}
            {m.market.hit ? " ✓" : " ✗"}
          </span>
        )}
        {m.advPred && (
          <span className="rp-call">
            <i>진출 예상</i> {ko(m.advPred)}
          </span>
        )}
      </div>
    </div>
  );
}
