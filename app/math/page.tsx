import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "수식 해설 — WC2026 예측",
  description:
    "Elo 레이팅, 확률 변환(로지스틱), Brier Score, 시장 내재 확률, 몬테카를로까지 시스템에 들어간 모든 수식.",
};

function F({ children }: { children: React.ReactNode }) {
  return <div className="formula">{children}</div>;
}

export default function MathPage() {
  return (
    <article className="prose">
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 34 }}>수식 해설</h1>
        <p>
          이 시스템은 단 두 줄의 Elo 수식에서 출발해, 확률 분해 → 검증 →
          시뮬레이션으로 이어진다. 아래는 각 단계의 정확한 계산식이다.
        </p>
      </section>

      <h2>1. Elo 레이팅 — 팀 전력의 수치화</h2>
      <h3>1.1 기대 승점율</h3>
      <p>
        두 팀의 경기 전 레이팅 차이로 홈팀의 기대 승점율 E를 계산한다. E는 승=1,
        무=0.5, 패=0을 섞은 값이라 <em>승리 확률이 아니라</em> 기대 점수다.
      </p>
      <F>
        E_home = 1 / (1 + 10^(−(R_home + H − R_away) / 400))
      </F>
      <ul>
        <li>
          <code>R_home, R_away</code> — 경기 전 Elo 레이팅 (초기값 1500)
        </li>
        <li>
          <code>H</code> — 홈 어드밴티지. 중립 경기면 0, 아니면 +100
        </li>
        <li>
          분모 <code>400</code> — "400점 차 = 승률 약 10배"가 되도록 정한 스케일
          상수 (튜닝 대상 아님, 체계의 정의)
        </li>
      </ul>

      <h3>1.2 레이팅 갱신</h3>
      <p>
        실제 결과 S(승 1 / 무 0.5 / 패 0)와 기대값 E의 차이만큼 레이팅을
        이동시킨다. 제로섬 — 홈이 얻은 만큼 원정이 잃는다.
      </p>
      <F>
        ΔR = K · G · (S − E_home)
        <br />
        R_home += ΔR<span className="cmt"> ; </span>R_away −= ΔR
      </F>
      <div className="callout">
        핵심은 <code>(S − E)</code> — <strong>놀라움(surprise) 항</strong>이다.
        예상대로면 0에 가까워 거의 안 움직이고, 약팀이 이변을 내면 크게 움직인다.
        베이지안 갱신의 가장 단순한 형태.
      </div>

      <h3>1.3 경기 중요도 가중치 K</h3>
      <p>정보 가치가 높은 경기일수록 K를 키워 더 크게 갱신한다.</p>
      <F>
        월드컵 본선 60 · 대륙선수권 50 · 예선 40 · 네이션스리그 30 · 친선전 20
      </F>

      <h3>1.4 골 차 배수 G</h3>
      <p>득점차 d = |home − away| 가 클수록 "더 강한 전력 신호"로 본다.</p>
      <F>
        d ≤ 1 → 1.0 <span className="cmt"> | </span> d = 2 → 1.5
        <span className="cmt"> | </span> d ≥ 3 → (11 + d) / 8
      </F>

      <h2>2. 확률 변환 — Elo 차이 → 승/무/패</h2>
      <p>
        Elo의 E는 무승부를 0.5로 뭉갠 값이라, 시장과 비교하려면 P(홈승)·P(무)·
        P(원정승) 세 확률로 분해해야 한다. <strong>다항 로지스틱 회귀</strong>를
        쓴다. 입력 피처는 단 하나 — 경기 전 Elo 차이.
      </p>
      <F>x = Δpre = (R_home + H) − R_away</F>
      <F>
        P(c | x) = softmax_c( β_c · x + α_c ), &nbsp; c ∈ {"{홈, 무, 원정}"}
      </F>
      <p className="note">
        피처를 1개만 쓰는 이유: 단순할수록 과적합 위험이 낮고, Elo 차이 하나에 팀
        전력 정보 대부분이 이미 압축돼 있다. 피처 추가는 walk-forward Brier
        개선을 확인한 뒤에만. 또한 학습 피처는 반드시 <em>경기 전</em> 값이라야
        데이터 누수가 없다.
      </p>

      <h2>3. 평가 지표 — 멀티클래스 Brier Score</h2>
      <p>
        예측 확률 벡터와 실제 결과(원-핫)의 평균 제곱 거리. "맞췄나"가 아니라
        "확률을 정직하게 말했나"를 측정한다. 베팅 맥락의 핵심 지표.
      </p>
      <F>Brier = mean_i Σ_c ( p_(i,c) − y_(i,c) )²</F>
      <p>
        완벽한 예측 = 0, 항상 (⅓,⅓,⅓) 찍기 = 0.667. walk-forward 검증(학습
        1990–2023 / 검증 2024–2026.6) 결과:
      </p>
      <div className="card" style={{ margin: "14px 0" }}>
        <table>
          <thead>
            <tr>
              <th>예측 방식</th>
              <th className="num">Brier</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>uniform (항상 ⅓)</td>
              <td className="num">0.6667</td>
            </tr>
            <tr>
              <td>base-rate (학습기간 H/D/A 비율)</td>
              <td className="num">0.6385</td>
            </tr>
            <tr>
              <td>
                <strong>Elo + 로지스틱 (본 모델)</strong>
              </td>
              <td className="num">
                <strong>0.5056</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="callout">
        주의: 이 0.5056을 클럽 축구 북메이커 Brier와 직접 비교하면 안 된다.
        국가대표 경기엔 격차 큰 예선(쉬운 문제)이 많아 평균 난이도가 다르기
        때문. 정당한 비교는 <strong>같은 72경기</strong>에 대한 모델 vs 마감 배당
        Brier 대결 — 그것이 이 프로젝트의 목적이다.
      </div>

      <h2>4. 시장 내재 확률 (마진 제거)</h2>
      <p>
        마감 소수 배당의 역수를 합으로 정규화해 북메이커 마진을 제거한 뒤, 모델과
        같은 경기에 대해 Brier로 대결한다.
      </p>
      <F>p_c = (1 / o_c) / ( 1/o_H + 1/o_D + 1/o_A )</F>
      <p>우승 마켓의 미국식 +배당은 다음으로 환산한다:</p>
      <F>
        p = 100 / (odds + 100)
        <span className="cmt"> &nbsp; # +470 → 17.5%</span>
      </F>

      <h2>5. 토너먼트 진출 확률 — 몬테카를로</h2>
      <p>
        104경기가 얽힌 우승 확률은 해석적으로 풀기 어렵다. 대회 전체를 20,000회
        가상 진행해 우승 빈도로 근사한다 (rng seed = 42, 재현성).
      </p>
      <h3>5.1 한 경기 추첨</h3>
      <F>
        u ~ U(0,1)
        <br />u {"<"} p_H → 홈승 <span className="cmt"> | </span> p_H ≤ u {"<"}{" "}
        p_H+p_D → 무 <span className="cmt"> | </span> 그 외 → 원정승
      </F>
      <h3>5.2 녹아웃 진출 확률 (Elo 근사)</h3>
      <p>스코어 모델이 없어 Elo 기대승점율을 진출 확률로 쓴다.</p>
      <F>P(a beats b) = 1 / (1 + 10^(−(R_a − R_b)/400))</F>
      <h3>5.3 우승 확률과 표준오차</h3>
      <F>
        P̂(우승=t) = (t가 우승한 시행 수) / N
        <br />
        SE = √( p̂(1−p̂) / N ) <span className="cmt"> # p̂=0.16, N=20k → ±0.26%p</span>
      </F>
      <p className="note">
        명시적 근사 2가지: (a) 조 동률은 골득실 대신 Elo로 타이브레이크, (b) 32강
        대진은 공식 브래킷 대신 "1위 풀 vs 2·3위 풀" 무작위 추첨 → 중상위권에
        ±1%p 노이즈.
      </p>

      <div
        className="callout"
        style={{ marginTop: 36, textAlign: "center" }}
      >
        전체 수식 명세와 코드는{" "}
        <a href="https://github.com/choigod1023/wc2026-predictor/blob/main/docs/MATH.md">
          docs/MATH.md
        </a>{" "}
        에서 볼 수 있습니다.
      </div>
    </article>
  );
}
