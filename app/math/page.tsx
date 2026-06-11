import type { Metadata } from "next";
import { Tex } from "@/components/Tex";

export const metadata: Metadata = {
  title: "어떻게 예측하나요? — WC2026",
  description:
    "축구를 좋아하지만 수학은 몰라도 괜찮습니다. 이 사이트가 우승·스코어·언오버를 어떻게 계산하는지 쉬운 말로, 그리고 원하는 분께는 수식으로 설명합니다.",
};

export default function MathPage() {
  return (
    <article className="prose">
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>어떻게 예측하나요?</h1>
        <p>
          수학을 몰라도 괜찮습니다. 먼저 <strong>쉬운 말</strong>로 설명하고, 더
          궁금한 분을 위해 아래에 <strong>실제 수식</strong>도 정리해 뒀어요.
        </p>
      </section>

      {/* ── 쉽게 말하면 (수식 없음) ── */}
      <section>
        <h2 style={{ marginTop: 8 }}>🙂 쉽게 말하면</h2>
        <div className="steps">
          <div className="step">
            <span className="step-no">1</span>
            <div>
              <b>팀 실력에 점수를 매깁니다 (Elo).</b> 체스·게임 랭킹처럼, 이기면
              점수가 오르고 지면 내려갑니다. <em>강팀이 약팀을 이기면 조금</em>,{" "}
              <em>약팀이 강팀을 이기면(이변) 많이</em> 움직여요. 중요한 대회(월드컵)
              결과일수록 더 크게 반영합니다.
            </div>
          </div>
          <div className="step">
            <span className="step-no">2</span>
            <div>
              <b>두 팀의 점수 차이로 승·무·패 확률을 뽑습니다.</b> 과거 수만 경기에서
              &ldquo;이만큼 점수 차가 나면 실제로 어떤 결과가 얼마나 나왔나&rdquo;를 학습해
              홈승/무/원정승 확률로 바꿉니다.
            </div>
          </div>
          <div className="step">
            <span className="step-no">3</span>
            <div>
              <b>&lsquo;몇 대 몇&rsquo;까지 예측합니다.</b> 각 팀이 평균 몇 골 넣을지를
              계산해 스코어 분포를 만들고, 거기서 <em>언더/오버</em>(총 득점)와{" "}
              <em>핸디캡</em>(득점 차)까지 뽑아냅니다.
            </div>
          </div>
          <div className="step">
            <span className="step-no">4</span>
            <div>
              <b>대회를 2만 번 가상으로 돌립니다 (몬테카를로).</b> 주사위를 수만 번
              굴리듯 대회 전체를 반복 시뮬레이션해서, 각 팀이 <em>우승·4강·16강에
              오를 확률</em>을 셈합니다.
            </div>
          </div>
        </div>
        <div className="callout">
          그리고 가장 중요한 질문 하나 — <b>&ldquo;우리 예측이 베팅 시장(배당)보다
          정확할까?&rdquo;</b> 대회가 끝나면 같은 경기에 대해 우리 확률과 시장 확률의
          정확도를 채점해서 확인합니다. 이게 이 프로젝트의 진짜 목적이에요.
        </div>
        <p className="note">
          참고: 실제 베팅을 위한 사이트가 아니라, 모델의 정확도를 검증·기록하는
          학습용 프로젝트입니다.
        </p>
      </section>

      {/* ── 여기서부터 수식 ── */}
      <h2 style={{ marginTop: 44 }}>📐 더 궁금하다면: 실제 수식</h2>
      <p className="note">아래는 위 4단계를 그대로 수식으로 적은 것입니다.</p>

      <h3>1. 팀 실력 점수 (Elo)</h3>
      <p>두 팀 점수 차로 기대 성적 E를 구하고(승=1·무=0.5·패=0 혼합):</p>
      <Tex block>
        {String.raw`E_{\text{home}} = \frac{1}{1 + 10^{-\left(R_{\text{home}} + H - R_{\text{away}}\right)/400}}`}
      </Tex>
      <p>실제 결과 S와 기대값의 차이만큼 점수를 올리고 내립니다:</p>
      <Tex block>{String.raw`\Delta R = K \cdot G \cdot (S - E)`}</Tex>
      <p className="note">
        <b>쉽게:</b> <Tex>{String.raw`(S-E)`}</Tex>가 &lsquo;놀라움&rsquo;. 예상대로면 거의
        안 변하고, 이변일수록 크게 변합니다. <Tex>{String.raw`K`}</Tex>=대회 중요도,{" "}
        <Tex>{String.raw`G`}</Tex>=골 차, <Tex>{String.raw`H`}</Tex>=홈 이점(+100).
      </p>

      <h3>2. 승·무·패 확률 (로지스틱 회귀)</h3>
      <p>
        경기 전 점수 차 <Tex>{String.raw`x`}</Tex> 하나로 세 결과의 확률을 만듭니다:
      </p>
      <Tex block>
        {String.raw`P(c \mid x) = \frac{e^{\beta_c x + \alpha_c}}{\displaystyle\sum_{c' \in \{H,D,A\}} e^{\beta_{c'} x + \alpha_{c'}}}`}
      </Tex>
      <p className="note">
        <b>쉽게:</b> &ldquo;점수 차가 이 정도면 홈승 ○○%, 무 ○○%, 원정승 ○○%&rdquo;를
        과거 데이터로 학습한 표라고 보면 됩니다.
      </p>

      <h3>3. 스코어 → 언더/오버 · 핸디캡 (포아송)</h3>
      <p>각 팀의 기대 득점 λ를 점수 차로 추정하고,</p>
      <Tex block>
        {String.raw`\log \lambda_{\text{home}} = a_0 + a_1\, x, \qquad \log \lambda_{\text{away}} = b_0 + b_1\, x`}
      </Tex>
      <p>스코어가 x:y로 날 확률을 구해(저점수 보정 Dixon-Coles 포함),</p>
      <Tex block>
        {String.raw`P(X=x,\, Y=y) = \frac{\lambda_h^{x} e^{-\lambda_h}}{x!}\cdot \frac{\lambda_a^{y} e^{-\lambda_a}}{y!}`}
      </Tex>
      <p>
        여기서 <b>오버 2.5</b>는 <Tex>{String.raw`\sum_{x+y>2.5} P(x,y)`}</Tex>,{" "}
        <b>핸디캡</b>은 득점 차 분포로 바로 계산됩니다.
      </p>

      <h3>4. 정확도 점수 (Brier)</h3>
      <p>예측 확률과 실제 결과가 얼마나 가까운지 잰 값(낮을수록 정확):</p>
      <Tex block>
        {String.raw`\text{Brier} = \frac{1}{N}\sum_{i=1}^{N}\sum_{c}\left(p_{i,c} - y_{i,c}\right)^2`}
      </Tex>
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
              <td>그냥 ⅓씩 찍기</td>
              <td className="num">0.6667</td>
            </tr>
            <tr>
              <td>과거 평균 비율로 찍기</td>
              <td className="num">0.6385</td>
            </tr>
            <tr>
              <td>
                <strong>우리 모델</strong>
              </td>
              <td className="num">
                <strong>0.5056</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>5. 시장(배당) 확률과 비교</h3>
      <p>소수 배당을 확률로 바꿀 때는 역수를 합으로 나눠 수수료(마진)를 제거합니다:</p>
      <Tex block>
        {String.raw`p_c = \frac{1/o_c}{\,1/o_H + 1/o_D + 1/o_A\,}`}
      </Tex>
      <p className="note">
        <b>쉽게:</b> 같은 경기에서 <b>우리 확률 vs 시장 확률</b>의 Brier를 비교해, 누가
        더 정확했는지 대회 후 채점합니다.
      </p>

      <div className="callout" style={{ marginTop: 32 }}>
        전체 수식·코드는{" "}
        <a href="https://github.com/choigod1023/wc2026-predictor/blob/main/docs/MATH.md">
          docs/MATH.md
        </a>{" "}
        에 더 자세히 있습니다.
      </div>
    </article>
  );
}
