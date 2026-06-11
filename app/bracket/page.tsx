import type { Metadata } from "next";
import stages from "@/data/stage_probs.json";
import { ko } from "@/lib/teams";

export const metadata: Metadata = {
  title: "토너먼트 진출 확률 — WC2026 예측",
  description:
    "32강부터 결승·우승까지 각 팀이 각 단계에 도달할 확률 (몬테카를로 시뮬레이션).",
};

type Stage = {
  team: string;
  R32: number;
  R16: number;
  QF: number;
  SF: number;
  F: number;
  champion: number;
};

const COLS: { key: keyof Stage; label: string }[] = [
  { key: "R32", label: "32강" },
  { key: "R16", label: "16강" },
  { key: "QF", label: "8강" },
  { key: "SF", label: "4강" },
  { key: "F", label: "결승" },
  { key: "champion", label: "우승" },
];

function heat(p: number): string {
  // 확률을 초록 농도로 (0 → 투명, 1 → 진한 초록)
  const a = Math.min(p * 1.15, 1);
  return `rgba(74, 222, 128, ${a.toFixed(3)})`;
}

export default function BracketPage() {
  const rows = (stages as Stage[]).slice(0, 32);

  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>토너먼트 진출 확률</h1>
        <p>
          조별리그 72경기 확률로 대회를 20,000회 시뮬레이션해, 각 팀이 32강부터
          우승까지 <strong>각 단계에 도달할 확률</strong>을 집계했다. 색이 진할수록
          확률이 높다.
        </p>
      </section>

      <section>
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="heat-table">
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>국가</th>
                {COLS.map((c) => (
                  <th key={c.key} className="num">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.team}>
                  <td className="rank">{i + 1}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{ko(r.team)}</td>
                  {COLS.map((c) => {
                    const p = r[c.key] as number;
                    return (
                      <td
                        key={c.key}
                        className="num heat-cell"
                        style={{ background: heat(p) }}
                      >
                        {(p * 100).toFixed(p >= 0.1 ? 0 : 1)}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          근사: (a) 조 동률은 Elo 타이브레이크, (b) 32강 대진은 공식 브래킷 대신
          1위풀 vs 2·3위풀 무작위 추첨. 따라서 중상위권은 ±1%p 노이즈가 있다.
          녹아웃 승부는 Elo 기대승점율을 진출 확률로 사용(연장·승부차기 포함 개념).
        </p>
      </section>
    </>
  );
}
