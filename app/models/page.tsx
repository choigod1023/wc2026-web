import type { Metadata } from "next";
import leaderboard from "@/data/model_leaderboard.json";
import champByModel from "@/data/champion_by_model.json";
import ChampionTrend from "@/components/ChampionTrend";
import { ko } from "@/lib/teams";

export const metadata: Metadata = {
  title: "모델 비교 — WC2026 예측",
  description:
    "여러 확률 모델을 walk-forward Brier로 공정 비교한 리더보드와 모델별 우승 확률.",
};

type LB = {
  name: string;
  short: string;
  brier: number;
  logloss: number;
  accuracy: number;
  best?: boolean;
};
type CBM = {
  model: string;
  short: string;
  champions: { team: string; p: number }[];
};

export default function ModelsPage() {
  const lb = leaderboard as LB[];
  const cbm = champByModel as CBM[];
  const worst = Math.max(...lb.map((m) => m.brier));
  const best = Math.min(...lb.map((m) => m.brier));

  // 모델별 상위 8개국을 한 표로 (행=국가, 열=모델)
  const topTeams: string[] = [];
  for (const m of cbm) {
    for (const c of m.champions.slice(0, 10)) {
      if (!topTeams.includes(c.team)) topTeams.push(c.team);
    }
  }
  const lookup = (short: string, team: string) =>
    cbm
      .find((m) => m.short === short)
      ?.champions.find((c) => c.team === team)?.p ?? 0;
  const ordered = topTeams
    .map((t) => ({ t, avg: cbm.reduce((s, m) => s + lookup(m.short, t), 0) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 12)
    .map((x) => x.t);

  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 className="ph1" style={{ fontSize: 32 }}>모델 비교</h1>
        <p>
          하나의 방식만 믿지 않습니다. 여러 예측 방식을 <strong>과거로 학습하고
          그 이후 경기로 시험</strong>해(2024~2026.6) 누가 더 정확했는지 공정하게
          비교합니다.
        </p>
        <p className="note">
          아래 <b>Brier</b>는 <b>예측 정확도 점수</b>입니다 — 확률을 정직하게
          맞힐수록 낮아지고, 0이면 완벽입니다.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>📈 우승 확률 변화 추세</h2>
          <span className="sub">대회 진행에 따른 상위 6개국 우승 확률</span>
        </div>
        <ChampionTrend />
        <p className="note" style={{ marginTop: 10 }}>
          경기 결과가 쌓일 때마다 Elo·시뮬레이션이 갱신되어 우승 확률이 움직입니다.
          (개막 전~현재, 경기일마다 한 점)
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>📋 Brier 리더보드</h2>
          <span className="sub">낮을수록 정확 · 검증 1,868경기</span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>모델</th>
                <th className="num">Brier</th>
                <th className="num">LogLoss</th>
                <th className="num">적중률</th>
                <th style={{ width: "28%" }}>상대 정확도</th>
              </tr>
            </thead>
            <tbody>
              {lb.map((m, i) => {
                // worst(가장 나쁨)=0%, best(가장 좋음)=100% 로 정규화한 막대
                const span = worst - best || 1;
                const score = ((worst - m.brier) / span) * 100;
                return (
                  <tr key={m.short}>
                    <td className="rank">{i + 1}</td>
                    <td>
                      {m.name}
                      {m.best && (
                        <span className="tag" style={{ marginLeft: 8 }}>
                          최저 Brier
                        </span>
                      )}
                    </td>
                    <td className="num">
                      <strong>{m.brier.toFixed(4)}</strong>
                    </td>
                    <td className="num">{m.logloss.toFixed(4)}</td>
                    <td className="num">{(m.accuracy * 100).toFixed(1)}%</td>
                    <td>
                      <div className="barwrap" style={{ height: 9 }}>
                        <span
                          className="b-home"
                          style={{ width: `${Math.max(score, 1)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          아무 정보 없이 1/3씩 찍으면 0.667, 과거 평균 비율로 찍으면 0.639인데,
          모든 실제 모델이 이를 명확히 이깁니다. 모델 간 차이는 아주 작아(0.5053~0.5065)
          &lsquo;팀 실력 점수 차이&rsquo; 하나에 정보 대부분이 담겨 있음을 보여줍니다 — 단순함이 강점.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>🏆 모델별 우승 확률</h2>
          <span className="sub">각 모델로 10,000회 시뮬레이션</span>
        </div>
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>국가</th>
                {cbm.map((m) => (
                  <th key={m.short} className="num">
                    {m.model.replace(" (기준)", "")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ordered.map((t) => (
                <tr key={t}>
                  <td>{ko(t)}</td>
                  {cbm.map((m) => (
                    <td key={m.short} className="num">
                      {(lookup(m.short, t) * 100).toFixed(1)}%
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note" style={{ marginTop: 10 }}>
          세 모델의 우승 확률이 거의 일치한다 — 무승부 처리 방식(로지스틱 vs
          Davidson)을 바꿔도 토너먼트 우승 확률은 견고하다는 뜻.
        </p>
      </section>
    </>
  );
}
