import mvm from "@/data/modelVsMarket.json";

type Row = {
  team: string;
  modelPct: number | null;
  fanduel: number | null;
  draftkings: number | null;
  polymarket: number | null;
  kalshi: number | null;
};

const TEAM_KO: Record<string, string> = {
  Spain: "스페인",
  France: "프랑스",
  England: "잉글랜드",
  Portugal: "포르투갈",
  Brazil: "브라질",
  Argentina: "아르헨티나",
  Germany: "독일",
  Netherlands: "네덜란드",
  Norway: "노르웨이",
  Belgium: "벨기에",
  Colombia: "콜롬비아",
  Croatia: "크로아티아",
  Uruguay: "우루과이",
  Italy: "이탈리아",
  "United States": "미국",
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
    .map((r) => ({ ...r, market: marketConsensus(r) }))
    .filter((r) => r.modelPct != null)
    .sort((a, b) => (b.modelPct ?? 0) - (a.modelPct ?? 0));

  const max = Math.max(
    ...rows.flatMap((r) => [r.modelPct ?? 0, r.market ?? 0]),
  );

  return (
    <div className="card">
      <div className="legend">
        <span>
          <span className="dot" style={{ background: "var(--bar-model)" }} />
          모델
        </span>
        <span>
          <span className="dot" style={{ background: "var(--bar-market)" }} />
          시장 컨센서스 (북메이커·예측시장 평균)
        </span>
      </div>
      {rows.map((r) => (
        <div className="mvm-row" key={r.team}>
          <div className="mvm-team">{TEAM_KO[r.team] ?? r.team}</div>
          <div className="mvm-bars">
            <Bar
              label="모델"
              value={r.modelPct}
              max={max}
              color="var(--bar-model)"
            />
            <Bar
              label="시장"
              value={r.market}
              max={max}
              color="var(--bar-market)"
            />
          </div>
        </div>
      ))}
      <p className="note" style={{ marginTop: 14 }}>
        모델 우승 확률 vs 시장 내재 확률(마진 포함 평균). 막대 차이가 곧 모델과
        시장의 견해차다 — 대회 종료 후 어느 쪽이 옳았는지 채점된다.
      </p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number | null;
  max: number;
  color: string;
}) {
  const w = value != null ? (value / max) * 100 : 0;
  return (
    <div className="mvm-bar">
      <span style={{ width: 34 }}>{label}</span>
      <span className="track">
        <span className="fill" style={{ width: `${w}%`, background: color }} />
      </span>
      <span className="pct">{value != null ? value.toFixed(1) + "%" : "—"}</span>
    </div>
  );
}
