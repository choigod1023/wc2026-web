import mvm from "@/data/modelVsMarket.json";
import { TEAM_KO } from "@/lib/teams";

type Row = {
  team: string;
  modelPct: number | null;
  fanduel: number | null;
  draftkings: number | null;
  polymarket: number | null;
  kalshi: number | null;
};

// 시장 컨센서스: 사용 가능한 북메이커/예측시장 내재 확률의 평균
function marketConsensus(r: Row): number | null {
  const vals = [r.fanduel, r.draftkings, r.polymarket, r.kalshi].filter(
    (v): v is number => v != null,
  );
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export default function ModelVsMarket() {
  const rows = (mvm as Row[])
    .map((r) => ({
      team: r.team,
      model: r.modelPct,
      market: marketConsensus(r),
    }))
    .filter((r) => r.model != null)
    .sort((a, b) => (b.model ?? 0) - (a.model ?? 0));

  const peak = Math.max(
    ...rows.flatMap((r) => [r.model ?? 0, r.market ?? 0]),
  );
  // 보기 좋은 상한(5% 단위 올림)으로 축 고정
  const axisMax = Math.ceil(peak / 5) * 5;
  const ticks = Array.from({ length: axisMax / 5 + 1 }, (_, i) => i * 5);

  return (
    <div className="card chart-card">
      <div className="legend">
        <span>
          <span className="dot" style={{ background: "var(--bar-model)" }} />
          모델
        </span>
        <span>
          <span className="dot" style={{ background: "var(--bar-market)" }} />
          시장 컨센서스
        </span>
        <span className="legend-note">
          막대 길이 = 우승 확률 · 우측 숫자 = 모델−시장 차이
        </span>
      </div>

      <div className="chart">
        {/* 세로 그리드 */}
        <div className="chart-grid">
          {ticks.map((t) => (
            <div
              key={t}
              className="grid-line"
              style={{ left: `${(t / axisMax) * 100}%` }}
            >
              <span className="grid-label">{t}%</span>
            </div>
          ))}
        </div>

        {rows.map((r) => {
          const delta =
            r.model != null && r.market != null ? r.model - r.market : null;
          return (
            <div className="chart-row" key={r.team}>
              <div className="chart-team">{TEAM_KO[r.team] ?? r.team}</div>
              <div className="chart-bars">
                <GroupBar
                  value={r.model}
                  axisMax={axisMax}
                  color="var(--bar-model)"
                />
                <GroupBar
                  value={r.market}
                  axisMax={axisMax}
                  color="var(--bar-market)"
                />
              </div>
              <div className="chart-delta">
                {delta != null ? (
                  <span className={delta >= 0 ? "delta-up" : "delta-down"}>
                    {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%p
                  </span>
                ) : (
                  <span className="note">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="note" style={{ marginTop: 16 }}>
        모델 우승 확률 vs 시장 내재 확률(북메이커·예측시장 평균). 막대 차이가 곧
        모델과 시장의 견해차다 — 대회 종료 후 어느 쪽이 옳았는지 채점된다.
        (시장 스냅샷 2026-06-10)
      </p>
    </div>
  );
}

function GroupBar({
  value,
  axisMax,
  color,
}: {
  value: number | null;
  axisMax: number;
  color: string;
}) {
  if (value == null) {
    return (
      <div className="gbar gbar-empty" title="시장 데이터 없음">
        <span className="gbar-val note">N/A</span>
      </div>
    );
  }
  const w = Math.max((value / axisMax) * 100, 1.5);
  return (
    <div className="gbar">
      <div className="gbar-fill" style={{ width: `${w}%`, background: color }} />
      <span className="gbar-val">{value.toFixed(1)}%</span>
    </div>
  );
}
