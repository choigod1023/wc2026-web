// retrodiction.json (predictor 레포 src/retrodict.py 산출) 타입 + 표시용 헬퍼.
// 104경기 전부에 '경기 전 정보만으로 만든 예측'과 실제 결과가 붙어 있다.
import { ko } from "@/lib/teams";

export type Outcome = "H" | "D" | "A";

export type MarketView = {
  oH: number;
  oD: number;
  oA: number;
  pHome: number;
  pDraw: number;
  pAway: number;
  pick: Outcome;
  hit: boolean;
  brier: number;
};

export type ReportMatch = {
  no: number;
  date: string;
  stageKey: StageKey;
  stage: string;
  home: string;
  away: string;
  city: string;
  neutral: boolean;
  eloDiffPre: number;
  pHome: number;
  pDraw: number;
  pAway: number;
  pick: Outcome;
  actual: Outcome;
  hs: number;
  as: number;
  hit: boolean;
  brier: number;
  // 녹아웃 전용
  pAdvHome?: number;
  advPred?: string;
  advActual?: string;
  advHit?: boolean | null;
  decidedBy?: string;
  market?: MarketView;
};

export type StageKey = "GROUP" | "R32" | "R16" | "QF" | "SF" | "TP" | "F";

export type StageSummary = {
  stageKey: StageKey;
  stage: string;
  n: number;
  hits: number;
  acc: number;
  brier: number;
};

export type TeamCard = {
  team: string;
  modelP: number | null;
  modelRank: number | null;
  marketP: number | null;
  marketRank: number | null;
};

export type Report = {
  generated: string;
  method: { feature: string; model: string; leakage: string; koNote: string };
  baseline: {
    uniform: number;
    baseRate: number;
    baseRateProbs: Record<string, number>;
  };
  summary: {
    overall: { n: number; hits: number; acc: number; brier: number };
    byStage: StageSummary[];
    advance: { n: number; hits: number; acc: number };
    market: {
      n: number;
      modelAcc: number;
      marketAcc: number;
      modelBrier: number;
      marketBrier: number;
      note: string;
      winner: "model" | "market";
    } | null;
    ou25: { n: number; hits: number; acc: number; brier: number; note: string } | null;
  };
  tournament: {
    actualChampion: string | null;
    championCard: TeamCard | null;
    preTournamentTop: { team: string; p: number }[];
    finalists: TeamCard[];
    semifinalists: TeamCard[];
    quarterfinalists: TeamCard[];
    topNvsActual: { stage: string; k: number; top: string[]; hits: number }[];
    note: string;
  };
  matches: ReportMatch[];
};

export const STAGE_ORDER: StageKey[] = ["GROUP", "R32", "R16", "QF", "SF", "TP", "F"];

// 적중 지도의 블록당 가로 칸 수 — 라운드 크기에 맞춰 형태가 자연히 좁아진다.
export const STAGE_COLS: Record<StageKey, number> = {
  GROUP: 12,
  R32: 8,
  R16: 4,
  QF: 2,
  SF: 1,
  TP: 1,
  F: 1,
};

/** 승/무/패 코드를 사람 말로. 무승부만 팀명이 없다. */
export function outcomeText(m: ReportMatch, code: Outcome): string {
  if (code === "D") return "무승부";
  return `${ko(code === "H" ? m.home : m.away)} 승`;
}

export function fmtDate(d: string): string {
  const [, mm, dd] = d.split("-");
  return `${Number(mm)}월 ${Number(dd)}일`;
}

export function pct(x: number, digits = 1): string {
  return `${(x * 100).toFixed(digits)}%`;
}
