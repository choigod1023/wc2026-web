import type { Metadata } from "next";
import stages from "@/data/stage_probs.json";
import { ko } from "@/lib/teams";
import BracketTree from "@/components/BracketTree";

export const metadata: Metadata = {
  title: "토너먼트 진출 확률 — WC2026 예측",
  description:
    "32강부터 결승·우승까지 각 팀이 각 단계에 오를 확률 (대회 2만 번 반복 시뮬레이션).",
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
        <h1 className="ph1" style={{ fontSize: 32 }}>토너먼트 진출 확률</h1>
        <p>
          대회 전체를 컴퓨터로 2만 번 가상으로 치러, 각 팀이 32강부터 우승까지{" "}
          <strong>각 단계에 오를 확률</strong>을 집계했습니다. 색이 진할수록 확률이
          높습니다.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>토너먼트 대진표</h2>
          <span className="sub">공식 2026 브래킷 · 조 확정 시 팀명 자동 채움</span>
        </div>
        <BracketTree />
        <p className="note" style={{ marginTop: 10 }}>
          공식 대진 구조(32강~결승)입니다. 조별리그가 끝나는 조부터 1·2위 팀명이
          채워지고, 3위 슬롯은 어느 조 3위가 올지 막판 조합으로 정해져 후보 조로
          표시됩니다.
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
          참고: 32강 대진표가 아직 공식 확정 방식이 아니라 무작위로 짝지어 돌리기
          때문에, 중상위권 팀은 ±1%p 정도 오차가 있을 수 있습니다. 토너먼트 승부는
          실제 스코어를 추첨하고, 비기면 연장·승부차기까지 반영합니다.
        </p>
      </section>
    </>
  );
}
