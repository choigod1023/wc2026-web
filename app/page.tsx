import Link from "next/link";
import elo from "@/data/elo.json";
import raw from "@/data/retrodiction.json";
import ModelVsMarket from "@/components/ModelVsMarket";
import MatchList from "@/components/MatchList";
import { pct, type Report } from "@/lib/report";
import { ko } from "@/lib/teams";

type Elo = { team: string; elo: number };

const report = raw as unknown as Report;

/** 개막 전 예측 옆에 붙일 '실제로 어디까지 갔나' 배지. */
function reached(
  team: string,
  t: Report["tournament"],
): { label: string; cls: string } | null {
  const inSet = (cards: { team: string }[]) => cards.some((c) => c.team === team);
  if (team === t.actualChampion) return { label: "우승", cls: "tag-ok" };
  if (inSet(t.finalists)) return { label: "준우승", cls: "tag-up" };
  if (inSet(t.semifinalists)) return { label: "4강", cls: "tag-up" };
  if (inSet(t.quarterfinalists)) return { label: "8강", cls: "tag-no" };
  return null;
}

export default function Home() {
  const ratings = (elo as Elo[]).slice(0, 12);
  const { summary, tournament } = report;
  const o = summary.overall;
  const champ = tournament.championCard;
  const market = summary.market;

  return (
    <>
      <section className="hero">
        <div className="rp-eyebrow">대회 종료 · 2026-07-19 · 우승 스페인</div>
        <h1>
          이 예측, <span className="grad">베팅 시장보다</span>
          <br />
          정확했을까?
        </h1>
        <p>
          축구 데이터로 각 팀의 우승·스코어·승부 확률을 계산하고, 그 예측이 실제
          베팅 시장(배당)보다 정확한지 검증하는 프로젝트입니다. 2026 월드컵이
          끝났으니 이제 답이 나왔습니다 — 104경기 전부를 채점했습니다.
        </p>
        <Link href="/report" className="hero-cta">
          104경기 채점 결과 보기 →
        </Link>
      </section>

      <section>
        <div className="grid kpi">
          <div className="kpi-card">
            <div className="label">실제 우승</div>
            <div className="value">
              {champ ? ko(champ.team) : "—"}{" "}
              <small>{champ ? `개막 전 모델 ${champ.modelRank}순위` : ""}</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">채점한 경기</div>
            <div className="value">
              {o.n}
              <small> 조별 + 녹아웃 전부</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">예측 적중률</div>
            <div className="value">
              {pct(o.acc)}
              <small> (승·무·패)</small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">시장과의 대결</div>
            <div className="value">
              {market?.winner === "model" ? "모델 승" : "패"}{" "}
              <small>
                Brier {market?.modelBrier.toFixed(3)} vs{" "}
                {market?.marketBrier.toFixed(3)}
              </small>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>개막 전 우승 확률 vs 실제</h2>
          <span className="sub">
            2026-06-10 스냅샷 · 대회를 2만 번 가상으로 돌린 결과
          </span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>국가</th>
                <th className="num">개막 전 우승 확률</th>
                <th>실제 결과</th>
              </tr>
            </thead>
            <tbody>
              {tournament.preTournamentTop.map((c, i) => {
                const r = reached(c.team, tournament);
                return (
                  <tr key={c.team}>
                    <td className="rank">{i + 1}</td>
                    <td>{ko(c.team)}</td>
                    <td className="num">
                      <strong>{pct(c.p)}</strong>
                    </td>
                    <td>
                      {r ? (
                        <span className={r.cls}>{r.label}</span>
                      ) : (
                        <span className="note">8강 전 탈락</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="note">
          개막 전 상위 4팀이 실제 4강 4팀과 정확히 일치했습니다. 반면 경기 단위
          확률에서는 시장에 졌습니다 —{" "}
          <Link href="/report">성적표에서 자세히</Link>.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>모델 vs 시장</h2>
          <span className="sub">우승 확률 견해차 (2026-06-10 스냅샷)</span>
        </div>
        <ModelVsMarket />
      </section>

      <section>
        <div className="section-head">
          <h2>팀 실력 점수 Top 12</h2>
          <span className="sub">
            체스 랭킹식 점수(Elo) · 높을수록 강함 · 대회 종료 시점
          </span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th className="rank">#</th>
                <th>국가</th>
                <th className="num">실력 점수</th>
              </tr>
            </thead>
            <tbody>
              {ratings.map((r, i) => (
                <tr key={r.team}>
                  <td className="rank">{i + 1}</td>
                  <td>{ko(r.team)}</td>
                  <td className="num">{Math.round(r.elo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>개막 전 고정 예측 (조별리그 72경기)</h2>
          <span className="sub">
            채점 기준으로 개막 전에 저장해 둔 원본 · 사후 수정 없음
          </span>
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
