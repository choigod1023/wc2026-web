// 2026 월드컵 공식 녹아웃 대진 구조 (R32~결승).
// 출처: FIFA 공식 대진 / Wikipedia 2026 FIFA World Cup knockout stage.
// 3위 슬롯은 어느 조 3위가 올지 대회 막판 조합표로 정해지므로, 후보 조 집합으로 표기.

export type Slot =
  | { kind: "W"; group: string } // 조 1위
  | { kind: "R"; group: string } // 조 2위
  | { kind: "T"; cands: string[] } // 3위(후보 조들)
  | { kind: "M"; match: number }; // 앞 라운드 승자

export type BracketMatch = { no: number; home: Slot; away: Slot };

const W = (g: string): Slot => ({ kind: "W", group: g });
const R = (g: string): Slot => ({ kind: "R", group: g });
const T = (...c: string[]): Slot => ({ kind: "T", cands: c });
const M = (n: number): Slot => ({ kind: "M", match: n });

// Round of 32 (73~88)
export const R32: BracketMatch[] = [
  { no: 73, home: R("A"), away: R("B") },
  { no: 74, home: W("E"), away: T("A", "B", "C", "D", "F") },
  { no: 75, home: W("F"), away: R("C") },
  { no: 76, home: W("C"), away: R("F") },
  { no: 77, home: W("I"), away: T("C", "D", "F", "G", "H") },
  { no: 78, home: R("E"), away: R("I") },
  { no: 79, home: W("A"), away: T("C", "E", "F", "H", "I") },
  { no: 80, home: W("L"), away: T("E", "H", "I", "J", "K") },
  { no: 81, home: W("D"), away: T("B", "E", "F", "I", "J") },
  { no: 82, home: W("G"), away: T("A", "E", "H", "I", "J") },
  { no: 83, home: R("K"), away: R("L") },
  { no: 84, home: W("H"), away: R("J") },
  { no: 85, home: W("B"), away: T("E", "F", "G", "I", "J") },
  { no: 86, home: W("J"), away: R("H") },
  { no: 87, home: W("K"), away: T("D", "E", "I", "J", "L") },
  { no: 88, home: R("D"), away: R("G") },
];

export const R16: BracketMatch[] = [
  { no: 89, home: M(74), away: M(77) },
  { no: 90, home: M(73), away: M(75) },
  { no: 91, home: M(76), away: M(78) },
  { no: 92, home: M(79), away: M(80) },
  { no: 93, home: M(83), away: M(84) },
  { no: 94, home: M(81), away: M(82) },
  { no: 95, home: M(86), away: M(88) },
  { no: 96, home: M(85), away: M(87) },
];
export const QF: BracketMatch[] = [
  { no: 97, home: M(89), away: M(90) },
  { no: 98, home: M(93), away: M(94) },
  { no: 99, home: M(91), away: M(92) },
  { no: 100, home: M(95), away: M(96) },
];
export const SF: BracketMatch[] = [
  { no: 101, home: M(97), away: M(98) },
  { no: 102, home: M(99), away: M(100) },
];
export const FINAL: BracketMatch[] = [{ no: 104, home: M(101), away: M(102) }];

export const ROUNDS: { name: string; matches: BracketMatch[] }[] = [
  { name: "32강", matches: R32 },
  { name: "16강", matches: R16 },
  { name: "8강", matches: QF },
  { name: "4강", matches: SF },
  { name: "결승", matches: FINAL },
];

// 슬롯 라벨 (팀이 정해지지 않았을 때)
export function slotLabel(s: Slot): string {
  if (s.kind === "W") return `${s.group}조 1위`;
  if (s.kind === "R") return `${s.group}조 2위`;
  if (s.kind === "T") return `3위(${s.cands.join("·")})`;
  return `${s.match}경기 승자`;
}
