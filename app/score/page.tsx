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
          <h2>🧪 스코어 모델 검증</h2>
          <span className="sub">walk-forward · 스코어 로그우도 / O/U2.5 Brier</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>모델</th>
                <th className="num">스코어 logLik ↑</th>
                <th className="num">O/U 2.5 Brier ↓</th>
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
          Dixon-Coles가 저점수(0:0·1:1) 의존성을 보정해 로그우도가 가장 높아 아래
          예측의 대표 모델로 쓴다. 둘 다 &lsquo;평균득점 고정&rsquo; 기준선을 명확히 이긴다.
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
