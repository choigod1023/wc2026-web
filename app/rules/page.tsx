import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2026 월드컵 바뀐 룰 — WC2026",
  description:
    "48팀 확대, 32강 신설, 조별리그 동률 시 승자승(상대전적) 최우선 등 2026 월드컵의 달라진 규정 정리.",
};

export default function RulesPage() {
  return (
    <article className="prose">
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 style={{ fontSize: 32 }}>2026 월드컵 바뀐 룰</h1>
        <p>
          2026 대회는 형식과 규정이 크게 바뀌었다. 예측 시뮬레이션의 조 순위·진출
          판정도 이 규칙을 따른다. 아래는 공식 규정 기준 사실이며, 출처를 함께
          표기한다.
        </p>
      </section>

      <h2>1. 48개국·12개 조·104경기</h2>
      <p>
        본선 참가국이 <strong>32 → 48개국</strong>으로 늘었다. 4팀씩{" "}
        <strong>12개 조</strong>로 나뉘고, 총 경기 수는 64 → <strong>104경기</strong>
        로 증가했다. 대회는 미국·캐나다·멕시코 3개국 16개 도시에서 열린다.
      </p>

      <h2>2. 신설된 &lsquo;32강(Round of 32)&rsquo;</h2>
      <p>
        조별리그 통과 팀이 16 → <strong>32팀</strong>으로 늘면서, 기존 16강 앞에{" "}
        <strong>32강 녹아웃 라운드가 새로 생겼다</strong>. 진출 구성은:
      </p>
      <ul>
        <li>각 조 <strong>1위 12팀</strong> 전원 진출</li>
        <li>각 조 <strong>2위 12팀</strong> 전원 진출</li>
        <li>
          <strong>3위 중 성적 상위 8팀</strong> 진출 (12개 조의 3위끼리 경쟁)
        </li>
        <li>합계 <strong>32팀</strong>이 녹아웃 토너먼트로</li>
      </ul>

      <h2>3. 조별리그 동률 시 — 승자승(상대전적) 최우선 ★</h2>
      <p>
        이번 대회의 가장 중요한 변화. 승점이 같은 팀이 둘 이상일 때, 예전처럼{" "}
        <strong>전체 골득실</strong>을 먼저 보지 않고{" "}
        <strong>해당 팀들끼리의 맞대결(승자승)</strong>을 먼저 적용한다.
      </p>
      <div className="callout">
        <strong>적용 순서</strong>
        <ol style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>승점 (조 전체)</li>
          <li>
            <b>맞대결 승점</b> (동률 팀들끼리)
          </li>
          <li>
            <b>맞대결 골득실</b>
          </li>
          <li>
            <b>맞대결 다득점</b>
          </li>
          <li>전체 골득실</li>
          <li>전체 다득점</li>
          <li>페어플레이 점수(경고 −1, 간접 퇴장 −3, 직접 퇴장 −4, 경고+직접퇴장 −5)</li>
          <li>FIFA 랭킹</li>
        </ol>
      </div>
      <p className="note">
        ※ &lsquo;32강 경우의 수&rsquo; 탭은 이 승자승 규칙을 반영해 직접 진출을 판정한다.
        전체 우승 시뮬레이션의 일부 세부 동률(골득실 단계)은 Elo로 근사된다.
      </p>

      <h2>4. 3위 팀 순위 기준</h2>
      <p>12개 조 3위 중 상위 8팀을 가릴 때의 순서:</p>
      <ul>
        <li>승점 → 골득실 → 다득점 → 페어플레이 점수 → FIFA 랭킹</li>
      </ul>

      <h2>5. 최종 동률은 추첨 대신 FIFA 랭킹</h2>
      <p>
        과거에는 모든 기준이 같으면 <strong>추첨(drawing of lots)</strong>으로
        정했지만, 2026 대회는 <strong>FIFA 랭킹</strong>이 최종 결정 기준이 된다.
      </p>

      <div className="callout" style={{ marginTop: 32 }}>
        <strong>출처</strong>
        <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
          <li>
            <a
              href="https://www.espn.com/soccer/story/_/id/48703925/world-cup-group-stage-explained-tiebreakers-third-place-teams"
              target="_blank"
              rel="noreferrer"
            >
              ESPN — World Cup group stage explained: tiebreakers, third-place teams
            </a>
          </li>
          <li>
            <a
              href="https://www.foxsports.com/stories/soccer/fifa-world-cup-group-stage-third-place-tiebreakers"
              target="_blank"
              rel="noreferrer"
            >
              FOX Sports — 2026 FIFA World Cup group stage tiebreakers
            </a>
          </li>
        </ul>
      </div>
    </article>
  );
}
