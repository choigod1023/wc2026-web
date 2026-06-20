"use client";

import { useEffect, useState } from "react";
import { ko } from "@/lib/teams";
import { ROUNDS, slotLabel, type Slot } from "@/lib/bracket";

type GroupStanding = {
  label: string;
  teams: { team: string }[];
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

  const resolve = (s: Slot): { text: string; known: boolean } => {
    if (s.kind === "W" || s.kind === "R") {
      const g = groups.get(s.group);
      const idx = s.kind === "W" ? 0 : 1;
      if (g && g.decided === 6 && g.teams[idx])
        return { text: ko(g.teams[idx].team), known: true };
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
                const h = resolve(m.home);
                const a = resolve(m.away);
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
