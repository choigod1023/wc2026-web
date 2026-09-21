// 적중 지도 — 104경기를 시간순 한 칸씩. 라운드별로 묶여 있어서
// "조별리그는 얼룩덜룩하고 녹아웃은 초록이 길게 이어진다"가 한눈에 읽힌다.
import {
  fmtDate,
  outcomeText,
  ReportMatch,
  STAGE_COLS,
  STAGE_ORDER,
  StageKey,
  type StageSummary,
} from "@/lib/report";
import { ko } from "@/lib/teams";

type Props = { matches: ReportMatch[]; byStage: StageSummary[] };

function tip(m: ReportMatch): string {
  const base = `${fmtDate(m.date)} · ${ko(m.home)} ${m.hs}-${m.as} ${ko(m.away)} · 예측 ${outcomeText(m, m.pick)} → ${m.hit ? "적중" : "실패"}`;
  return m.decidedBy === "승부차기"
    ? `${base} (승부차기 ${ko(m.advActual ?? "")} 진출)`
    : base;
}

export default function ReportGrid({ matches, byStage }: Props) {
  const summaryOf = new Map(byStage.map((s) => [s.stageKey, s]));

  return (
    <div className="card rp-map">
      <div className="rp-blocks">
        {STAGE_ORDER.map((key) => {
          const items = matches.filter((m) => m.stageKey === key);
          if (items.length === 0) return null;
          const s = summaryOf.get(key as StageKey);
          return (
            <div className="rp-block" key={key}>
              <div
                className="rp-cells"
                style={{ gridTemplateColumns: `repeat(${STAGE_COLS[key]}, 14px)` }}
              >
                {items.map((m) => (
                  <span
                    key={m.no}
                    className={`rp-cell ${m.hit ? "ok" : "no"}`}
                    title={tip(m)}
                  />
                ))}
              </div>
              <div className="rp-block-foot">
                <span className="rp-block-name">{s?.stage}</span>
                <span className="rp-block-score">
                  {s?.hits}/{s?.n}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rp-legend">
        <span>
          <i className="rp-cell ok" /> 적중
        </span>
        <span>
          <i className="rp-cell no" /> 실패
        </span>
        <span className="rp-legend-note">칸 하나가 경기 하나 · 마우스를 올리면 상세</span>
      </div>
    </div>
  );
}
