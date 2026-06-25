// 인플레이(in-play) 라이브 모델 — 진행 중 경기의 승부·언오버 확률을
// '현재 스코어 + 남은 시간 (+퇴장)'으로 갱신한다.
// 경기 전 기대득점(λ, 스코어 모델)에 남은 시간 비율을 곱해 '남은 득점'을 포아송으로
// 시뮬한 뒤, 현재 스코어에 더해 최종 결과 분포를 계산한다.
// ※ 백테스트된 경기 전 모델과 별개의 '라이브 추정' 휴리스틱(투명하게 표기).

const MAXADD = 8; // 남은 추가골 격자 0..7

function pois(k: number, lam: number): number {
  // 작은 k 포아송 pmf
  let f = 1;
  for (let i = 2; i <= k; i++) f *= i;
  return (Math.pow(lam, k) * Math.exp(-lam)) / f;
}

export type InPlay = {
  pH: number;
  pD: number;
  pA: number;
  over25: number;
  expFinal: string; // 예상 최종 스코어
  remMin: number; // 남은 분
};

export function inPlay(
  lhPre: number,
  laPre: number,
  minute: number,
  curH: number,
  curA: number,
  redH = 0,
  redA = 0,
): InPlay {
  // 소수 분 허용 → 매 폴링(수초)마다 남은 시간이 줄며 확률이 연속적으로 변함.
  const remMinExact = Math.max(0, 90 - Math.min(minute, 90));
  const frac = Math.max(0.02, remMinExact / 90); // 막판에도 추가시간 약간
  let lh = lhPre * frac;
  let la = laPre * frac;
  // 퇴장 보정: 수적 열세 팀의 남은 득점↓, 상대↑ (장당 누적)
  for (let i = 0; i < redH; i++) {
    lh *= 0.7;
    la *= 1.1;
  }
  for (let i = 0; i < redA; i++) {
    la *= 0.7;
    lh *= 1.1;
  }

  const ph = Array.from({ length: MAXADD }, (_, i) => pois(i, lh));
  const pa = Array.from({ length: MAXADD }, (_, j) => pois(j, la));
  let pH = 0,
    pD = 0,
    pA = 0,
    over = 0,
    s = 0;
  for (let i = 0; i < MAXADD; i++) {
    for (let j = 0; j < MAXADD; j++) {
      const w = ph[i] * pa[j];
      s += w;
      const fh = curH + i,
        fa = curA + j;
      if (fh > fa) pH += w;
      else if (fh === fa) pD += w;
      else pA += w;
      if (curH + curA + i + j > 2.5) over += w;
    }
  }
  return {
    pH: pH / s,
    pD: pD / s,
    pA: pA / s,
    over25: over / s,
    expFinal: `${curH + Math.round(lh)}-${curA + Math.round(la)}`,
    remMin: Math.round(remMinExact), // 표시용 정수(확률은 소수 분으로 계산됨)
  };
}
