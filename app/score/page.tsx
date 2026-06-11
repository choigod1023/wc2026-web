import type { Metadata } from "next";
import ScoreList from "@/components/ScoreList";
import leaderboard from "@/data/score_leaderboard.json";

export const metadata: Metadata = {
  title: "스코어·언오버·핸디캡 예측 — WC2026",
  description:
    "Elo→득점 포아송/Dixon-Coles 모델로 72경기의 예상 스코어, 언더/오버, 핸디캡과 그 근거를 예측.",
};

type LB = { name: string; short: string; score_loglik: number; ou25_brier: number; best?: boolean };

export default function ScorePage() {
  const lb = leaderboard as LB[];
  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>스코어 · 언오버 · 핸디캡</h1>
        <p>
          승/무/패만으로는 <strong>언더오버(총 득점)</strong>와{" "}
          <strong>핸디캡(득점차)</strong>을 줄 수 없다. 그래서 &lsquo;몇 대 몇&rsquo;의
          확률 분포를 모델링한다. Elo 차이 → 양 팀 기대득점(λ) → 포아송/Dixon-Coles로
          스코어 격자를 만들어 모든 시장을 도출한다.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>🧪 어떤 스코어 방식이 더 맞았나</h2>
          <span className="sub">과거로 학습→이후 경기로 시험 · 점수 높을수록/오차 낮을수록 정확</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>방식</th>
                <th className="num">스코어 적중력 ↑</th>
                <th className="num">언오버 오차 ↓</th>
              </tr>
            </thead>
            <tbody>
              {lb.map((m) => (
                <tr key={m.short}>
                  <td>
                    {m.name}
                    {m.best && (
                      <span className="tag" style={{ marginLeft: 8 }}>
                        대표 모델
                      </span>
                    )}
                  </td>
                  <td className="num">{m.score_loglik.toFixed(4)}</td>
                  <td className="num">{m.ou25_brier.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          Dixon-Coles는 0:0·1:1 같은 낮은 스코어가 실제로 더 자주 나오는 점을 보정해
          가장 잘 맞아, 아래 예측의 대표로 씁니다. 두 방식 모두 &lsquo;그냥 평균 득점&rsquo;보다
          확연히 정확합니다.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>🗓 72경기 스코어 예측</h2>
          <span className="sub">예상 스코어 · 언오버 · 핸디캡 · 근거</span>
        </div>
        <ScoreList />
      </section>
    </>
  );
}
