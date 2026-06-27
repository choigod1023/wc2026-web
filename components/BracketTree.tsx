"use client";

import { useEffect, useState } from "react";
import { ko } from "@/lib/teams";
import { ROUNDS, slotLabel, type Slot } from "@/lib/bracket";
import alloc from "@/data/third_place_allocation.json";

// FIFA 공식 3위 배정표(Annex C, 495조합): 정렬된 8개 조 → {경기no(str): 3위 조라벨}
const THIRD_ALLOC = alloc as Record<string, Record<string, string>>;

type TeamRow = { team: string; pts?: number; gd?: number; gf?: number };
type GroupStanding = {
  label: string;
  teams: TeamRow[];
  decided: number;
};

export default function BracketTree() {
  // 조별 순위(결정 시 1·2위 팀명 채우기)
  const [groups, setGroups] = useState<Map<string, GroupStanding>>(new Map());

  useEffect(() => {
    let alive = true;
    fetch("/api/scenarios", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const m = new Map<string, GroupStanding>();
        for (const g of j.groups ?? []) {
          const letter = g.label.replace("그룹 ", "").trim();
          m.set(letter, g);
        }
        setGroups(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // 12개 조가 모두 끝났으면 → 8개 베스트 3위를 가려 공식 표(Annex C)로 슬롯 배정.
  // 반환: {경기no: 그 슬롯에 올 3위 팀명}. 아직 미확정이면 빈 맵.
  const thirdSlots = (() => {
    const out = new Map<number, string>();
    const letters = "ABCDEFGHIJKL".split("");
    const all = letters.map((L) => groups.get(L));
    if (all.some((g) => !g || g.decided < 6)) return out; // 전 조 종료 전엔 미확정
    // 각 조 3위 + 성적 → 베스트 8 (승점→골득실→다득점)
    const thirds = letters
      .map((L) => {
        const g = groups.get(L)!;
        const t = g.teams[2] ?? { team: "", pts: 0, gd: 0, gf: 0 };
        return { L, pts: t.pts ?? 0, gd: t.gd ?? 0, gf: t.gf ?? 0, team: t.team };
      })
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
    const best8 = thirds.slice(0, 8);
    const key = best8
      .map((x) => x.L)
      .sort()
      .join("");
    const map = THIRD_ALLOC[key];
    if (!map) return out;
    const teamOf = new Map(best8.map((x) => [x.L, x.team]));
    for (const [no, gLetter] of Object.entries(map)) {
      const team = teamOf.get(gLetter);
      if (team) out.set(Number(no), team);
    }
    return out;
  })();

  const resolve = (
    s: Slot,
    matchNo: number,
  ): { text: string; known: boolean } => {
    if (s.kind === "W" || s.kind === "R") {
      const g = groups.get(s.group);
      const idx = s.kind === "W" ? 0 : 1;
      if (g && g.decided === 6 && g.teams[idx])
        return { text: ko(g.teams[idx].team), known: true };
    }
    if (s.kind === "T") {
      const team = thirdSlots.get(matchNo); // 공식 표로 채워진 3위
      if (team) return { text: ko(team), known: true };
    }
    return { text: slotLabel(s), known: false };
  };

  return (
    <div className="bracket-scroll">
      <div className="bracket-cols">
        {ROUNDS.map((rd) => (
          <div className="bracket-col" key={rd.name}>
            <div className="bracket-col-head">{rd.name}</div>
            <div className="bracket-col-body">
              {rd.matches.map((m) => {
                const h = resolve(m.home, m.no);
                const a = resolve(m.away, m.no);
                return (
                  <div className="bm" key={m.no}>
                    <span className="bm-no">{m.no}</span>
                    <div className={`bm-slot ${h.known ? "known" : ""}`}>
                      {h.text}
                    </div>
                    <div className={`bm-slot ${a.known ? "known" : ""}`}>
                      {a.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
