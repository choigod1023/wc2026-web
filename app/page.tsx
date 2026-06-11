import Link from "next/link";
import champ from "@/data/championship.json";
import elo from "@/data/elo.json";
import ModelVsMarket from "@/components/ModelVsMarket";
import MatchList from "@/components/MatchList";

type Champ = { team: string; champion: number; final: number };
type Elo = { team: string; elo: number };

export default function Home() {
  const champions = (champ as Champ[]).slice(0, 12);
  const ratings = (elo as Elo[]).slice(0, 12);
  const topPick = champions[0];

  return (
    <>
      <section className="hero">
        <h1>
          이 예측, <span className="grad">베팅 시장보다</span>
          <br />
          정확할까?
        </h1>
        <p>
          축구 데이터로 각 팀의 우승·스코어·승부 확률을 계산하고, 그 예측이 실제
          베팅 시장(배당)보다 정확한지 대회 내내 검증하는 프로젝트입니다. 2026
          월드컵 조별리그 72경기가 그 시험장이에요.
        </p>
        <Link href="/math" className="hero-cta">
          🙂 수학은 몰라도 괜찮아요 — 어떻게 예측하는지 보기 →
        </Link>
      </section>

      <section>
        <div className="grid kpi">
          <div className="kpi-card">
            <div className="label">모델 우승 1순위</div>
            <div className="value">
              {topPick.team}{" "}
              <small>{(topPick.champion * 100).toFixed(1)}%</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">검증 경기 수</div>
            <div className="value">
              72<small> 조별리그</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">예측 정확도 (낮을수록 좋음)</div>
            <div className="value">
              0.506<small> / 그냥 찍기 0.639</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">우승 시뮬레이션</div>
            <div className="value">
              20,000<small>회 몬테카를로</small>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>🏆 우승 확률 (모델)</h2>
          <span className="sub">몬테카를로 20,000회 · 우승 / 결승 진출</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>국가</th>
                <th className="num">우승 확률</th>
                <th className="num">결승 진출</th>
              </tr>
            </thead>
            <tbody>
              {champions.map((c, i) => (
                <tr key={c.team}>
                  <td className="rank">{i + 1}</td>
                  <td>{c.team}</td>
                  <td className="num">
                    <strong>{(c.champion * 100).toFixed(1)}%</strong>
                  </td>
                  <td className="num">{(c.final * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>📊 모델 vs 시장</h2>
          <span className="sub">우승 확률 견해차 (2026-06-10 스냅샷)</span>
        </div>
        <ModelVsMarket />
      </section>

      <section>
        <div className="section-head">
          <h2>📈 Elo 레이팅 Top 12</h2>
          <span className="sub">2026-06-08 기준 · 팀 전력 수치화</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>국가</th>
                <th className="num">Elo</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r, i) => (
                <tr key={r.team}>
                  <td className="rank">{i + 1}</td>
                  <td>{r.team}</td>
                  <td className="num">{Math.round(r.elo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>🗓 조별리그 72경기 예측</h2>
          <span className="sub">홈승 · 무 · 원정승 확률</span>
        </div>
        <MatchList />
      </section>

      <section>
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ margin: "0 0 12px", color: "var(--muted)" }}>
            이 확률이 어떻게 나오는지 궁금하다면 (수학 몰라도 OK)
          </p>
          <Link href="/math" className="hero-cta">
            어떻게 예측하나요? →
          </Link>
        </div>
      </section>
    </>
  );
}
