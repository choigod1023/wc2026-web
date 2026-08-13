import Link from "next/link";
import raw from "@/data/retrodiction.json";
import ReportGrid from "@/components/ReportGrid";
import ReportMatches from "@/components/ReportMatches";
import { pct, type Report, type TeamCard } from "@/lib/report";
import { ko } from "@/lib/teams";

export const metadata = {
  title: "성적표 — 104경기 예측 채점",
  description:
    "2026 월드컵 104경기를 경기 전 정보만으로 예측하고 실제 결과와 대조한 채점표.",
};

const report = raw as unknown as Report;

function rankText(c: TeamCard, which: "model" | "market"): string {
  const p = which === "model" ? c.modelP : c.marketP;
  const r = which === "model" ? c.modelRank : c.marketRank;
  if (p == null) return "—";
  return `${pct(p)}${r ? ` (${r}순위)` : ""}`;
}

export default function ReportPage() {
  const { summary, tournament, baseline, method, matches } = report;
  const o = summary.overall;
  const champ = tournament.championCard;
  const market = summary.market;

  return (
    <>
      <section className="hero">
        <div className="rp-eyebrow">대회 종료 · 2026-07-19 · 우승 스페인</div>
        <h1>
          104경기, <span className="grad">69번 맞고 35번 틀렸다</span>
        </h1>
        <p>
          개막 전에 확정한 예측은 조별리그 72경기뿐이었습니다. 녹아웃 대진은
          개막 전에 알 수 없으니까요. 그래서 남은 32경기는 오랫동안 &ldquo;맞았는지
          틀렸는지&rdquo; 자체가 없었습니다. 이 페이지는 각 경기를{" "}
          <b>그 경기 직전 시점의 정보만으로</b> 다시 예측해, 104경기 전부에 적중
          여부를 붙인 결과입니다.
        </p>
        <Link href="/math" className="hero-cta">
          예측을 어떻게 만드는지 →
        </Link>
      </section>

      <section>
        <div className="grid kpi">
          <div className="kpi-card">
            <div className="label">전체 적중률</div>
            <div className="value">
              {pct(o.acc)}{" "}
              <small>
                {o.hits}/{o.n}경기
              </small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">녹아웃 진출팀 적중</div>
            <div className="value">
              {pct(summary.advance.acc)}{" "}
              <small>
                {summary.advance.hits}/{summary.advance.n}
              </small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">우승 예측</div>
            <div className="value">
              적중{" "}
              <small>
                {champ ? `${ko(champ.team)} · 개막 전 ${champ.modelRank}순위` : "—"}
              </small>
            </div>
          </div>
          <div className="kpi-card">
            <div className="label">시장과의 대결</div>
            <div className="value">
              {market?.winner === "model" ? "모델 승" : "패"}{" "}
              <small>
                Brier {market?.modelBrier.toFixed(3)} vs {market?.marketBrier.toFixed(3)}
              </small>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>적중 지도</h2>
          <span className="sub">칸 하나가 경기 하나 · 시간순 · 초록이 적중</span>
        </div>
        <ReportGrid matches={matches} byStage={summary.byStage} />
      </section>

      <section>
        <div className="section-head">
          <h2>라운드별 성적</h2>
          <span className="sub">
            Brier는 확률이 얼마나 정확했는지 · 0에 가까울수록 좋음
          </span>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>라운드</th>
                <th className="num">적중</th>
                <th className="num">적중률</th>
                <th className="num">Brier</th>
              </tr>
            </thead>
            <tbody>
              {summary.byStage.map((s) => (
                <tr key={s.stageKey}>
                  <td>{s.stage}</td>
                  <td className="num">
                    {s.hits}/{s.n}
                  </td>
                  <td className="num">
                    <strong>{pct(s.acc, 0)}</strong>
                  </td>
                  <td className="num">{s.brier.toFixed(4)}</td>
                </tr>
              ))}
              <tr className="rp-total">
                <td>전체</td>
                <td className="num">
                  {o.hits}/{o.n}
                </td>
                <td className="num">
                  <strong>{pct(o.acc, 0)}</strong>
                </td>
                <td className="num">{o.brier.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="note">
          기준선과 비교: 늘 1/3씩 찍으면 {baseline.uniform.toFixed(4)}, 과거 승·무·패
          비율대로 찍으면 {baseline.baseRate.toFixed(4)}. 모델은{" "}
          {o.brier.toFixed(4)} 로 둘 다 앞섭니다.
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>모델 vs 시장</h2>
          <span className="sub">마감 배당이 기록된 조별리그 {market?.n}경기</span>
        </div>
        <div className="card rp-versus">
          <div className="rp-vs-side">
            <div className="label">모델</div>
            <div className="value">{market?.modelBrier.toFixed(4)}</div>
            <div className="sub">적중 {market ? pct(market.modelAcc, 1) : "—"}</div>
          </div>
          <div className="rp-vs-mid">vs</div>
          <div className="rp-vs-side win">
            <div className="label">시장(배당)</div>
            <div className="value">{market?.marketBrier.toFixed(4)}</div>
            <div className="sub">적중 {market ? pct(market.marketAcc, 1) : "—"}</div>
          </div>
        </div>
        <div className="callout">
          <p>
            <b>졌습니다.</b> 경기 단위 확률의 질에서는 베팅 시장이 더 정확했습니다.
            이 프로젝트가 원래 던진 질문 &ldquo;내 모델이 시장보다 정확한가&rdquo;에
            대한 답은, 적어도 이번 대회 조별리그에서는 <b>아니오</b>입니다.
          </p>
          <p className="note">{market?.note}</p>
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>대회 단위로 보면</h2>
          <span className="sub">개막 전(2026-06-10) 우승 확률 vs 실제 결과</span>
        </div>
        <div className="card rp-champ">
          <div className="rp-champ-team">
            <span className="rp-champ-label">실제 우승</span>
            <strong>{champ ? ko(champ.team) : "—"}</strong>
          </div>
          <div className="rp-champ-nums">
            <span>
              <i>모델</i> {champ ? rankText(champ, "model") : "—"}
            </span>
            <span>
              <i>시장</i> {champ ? rankText(champ, "market") : "—"}
            </span>
          </div>
        </div>
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>실제 도달</th>
                <th className="num">개막 전 상위 N 중 적중</th>
                <th>모델이 꼽았던 팀</th>
              </tr>
            </thead>
            <tbody>
              {tournament.topNvsActual.map((r) => (
                <tr key={r.stage}>
                  <td>{r.stage}</td>
                  <td className="num">
                    <strong>
                      {r.hits}/{r.k}
                    </strong>
                  </td>
                  <td className="rp-teamlist">{r.top.map(ko).join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          경기 단위 확률은 시장에 졌지만, 대회 상위권을 꼽는 데는 모델이 잘
          맞혔습니다. 서로 다른 것을 재는 지표라 하나로 뭉뚱그릴 수 없습니다.{" "}
          {tournament.note}
        </p>
      </section>

      <section>
        <div className="section-head">
          <h2>전 경기 채점</h2>
          <span className="sub">104경기 · 라운드와 결과로 걸러 보기</span>
        </div>
        <ReportMatches matches={matches} />
      </section>

      <section>
        <div className="section-head">
          <h2>어떻게 채점했나</h2>
          <span className="sub">그리고 이 숫자로 말할 수 없는 것</span>
        </div>
        <div className="card prose">
          <h3>미래를 보지 않았다는 보장</h3>
          <p>
            예측에 쓴 전력치는 <b>{method.feature}</b>입니다. 정의상 그 경기가
            열리기 전 값이라, 대회가 진행되며 갱신돼도 각 경기 시점에서는 전부
            과거 정보입니다.
          </p>
          <p>
            확률로 바꾸는 모델의 계수는 <b>{method.model}</b>으로 고정했습니다.{" "}
            {method.leakage} 조별리그 72경기를 이 방식으로 다시 채점하면 Brier
            0.5359 로, 개막 전에 저장해 둔 고정본의 0.5336 과 사실상 같습니다 —
            채점 경로가 기존 결과를 재현한다는 확인입니다.
          </p>
          <h3>이 숫자의 한계</h3>
          <ul>
            <li>
              <b>녹아웃 배당이 없습니다.</b> 마감 배당을 조별리그 72경기만
              기록해 둬서, 녹아웃 32경기는 시장과 직접 비교할 수 없습니다.
            </li>
            <li>{method.koNote}</li>
            <li>
              승부차기로 갈린 4경기를 모델은 <b>4개 다</b> 반대로 예측했습니다.
              다만 표본이 4개라 모델이 나빠서인지 운이 나빠서인지 구분할 수
              없습니다.
            </li>
            {summary.ou25 && (
              <li>
                언/오버 2.5는 {summary.ou25.hits}/{summary.ou25.n} ={" "}
                {pct(summary.ou25.acc, 1)} 로 동전던지기와 다르지 않았습니다.{" "}
                {summary.ou25.note}
              </li>
            )}
          </ul>
          <p className="note">
            채점 생성 시각 {report.generated} · 원본 데이터와 코드는{" "}
            <a
              href="https://github.com/choigod1023/wc2026-predictor"
              target="_blank"
              rel="noreferrer"
            >
              wc2026-predictor
            </a>{" "}
            (src/retrodict.py) 에 있습니다.
          </p>
        </div>
      </section>
    </>
  );
}
