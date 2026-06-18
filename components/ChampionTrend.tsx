import history from "@/data/champion_history.json";
import { ko } from "@/lib/teams";

type Snap = { t: string; p: Record<string, number> };

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#34d399",
  "#fb923c",
  "#f472b6",
];

function fmtT(t: string): string {
  // "2026-06-15" 또는 "2026-06-15T09:00Z"
  const d = t.slice(0, 10).split("-");
  return `${Number(d[1])}/${Number(d[2])}`;
}

export default function ChampionTrend() {
  const hist = history as unknown as Snap[];
  if (hist.length < 2) {
    return (
      <div className="card note">
        추세 그래프는 데이터가 쌓이면 표시됩니다 (현재 {hist.length}개 시점).
      </div>
    );
  }

  // 최신 시점 기준 상위 6개국
  const latest = hist[hist.length - 1].p;
  const teams = Object.entries(latest)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([t]) => t);

  const n = hist.length;
  const W = 700,
    H = 340,
    PL = 44,
    PR = 12,
    PT = 14,
    PB = 40;
  const plotW = W - PL - PR;
  const plotH = H - PT - PB;
  const maxY =
    Math.ceil(
      Math.max(...teams.flatMap((t) => hist.map((h) => h.p[t] ?? 0))) * 100 / 5,
    ) *
      5 /
    100;
  const x = (i: number) => PL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const y = (v: number) => PT + plotH - (v / maxY) * plotH;

  const yTicks = Array.from({ length: 6 }, (_, i) => (maxY / 5) * i);

  return (
    <div className="card chart-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="trend-svg" role="img">
        {/* y 그리드 + 라벨 */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PL}
              x2={W - PR}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text x={PL - 6} y={y(v) + 4} textAnchor="end" className="trend-axis">
              {Math.round(v * 100)}%
            </text>
          </g>
        ))}
        {/* x 라벨 */}
        {hist.map((h, i) =>
          i % Math.ceil(n / 8) === 0 || i === n - 1 ? (
            <text key={i} x={x(i)} y={H - PB + 18} textAnchor="middle" className="trend-axis">
              {fmtT(h.t)}
            </text>
          ) : null,
        )}
        {/* 팀별 라인 */}
        {teams.map((t, ti) => {
          const pts = hist
            .map((h, i) => `${x(i)},${y(h.p[t] ?? 0)}`)
            .join(" ");
          return (
            <g key={t}>
              <polyline
                points={pts}
                fill="none"
                stroke={COLORS[ti]}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* 마지막 점 강조 */}
              <circle
                cx={x(n - 1)}
                cy={y(hist[n - 1].p[t] ?? 0)}
                r="3.5"
                fill={COLORS[ti]}
              />
            </g>
          );
        })}
      </svg>
      <div className="trend-legend">
        {teams.map((t, ti) => (
          <span key={t} className="trend-leg">
            <span className="dot" style={{ background: COLORS[ti] }} />
            {ko(t)}{" "}
            <b>{((latest[t] ?? 0) * 100).toFixed(1)}%</b>
          </span>
        ))}
      </div>
    </div>
  );
}
