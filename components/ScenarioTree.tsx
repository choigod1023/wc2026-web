"use client";

import { ko } from "@/lib/teams";

type Res = "in" | "out" | "gd";
type Leaf = {
  other: { home: string; away: string; r: "H" | "D" | "A" } | null;
  res: Res;
  rival?: string;
  tGd?: number;
  tGf?: number;
  rGd?: number;
  rGf?: number;
};
type OwnScenario = { own: "w" | "d" | "l"; leaves: Leaf[] };

const RES: Record<Res, { text: string; cls: string }> = {
  in: { text: "진출", cls: "c-in" },
  out: { text: "탈락", cls: "c-out" },
  gd: { text: "골득실", cls: "c-maybe" },
};
const OWN: Record<"w" | "d" | "l", string> = { w: "승", d: "무", l: "패" };
const sgn = (n: number) => (n > 0 ? `+${n}` : `${n}`);

function otherText(o: NonNullable<Leaf["other"]>) {
  if (o.r === "H") return `${ko(o.home)} 승`;
  if (o.r === "A") return `${ko(o.away)} 승`;
  return `${ko(o.home)}·${ko(o.away)} 무`;
}

export default function ScenarioTree({
  team,
  nextOpp,
  detail,
}: {
  team: string;
  nextOpp: string | null;
  detail: OwnScenario[];
}) {
  return (
    <div className="tree">
      <div className="tree-root">
        <b>{ko(team)}</b>
        <span className="muted2"> vs {ko(nextOpp ?? "")}</span>
      </div>
      <div className="tree-stem" />
      <div className="tree-branches">
        {detail.map((sc, ci) => {
          const allSame = sc.leaves.every((l) => l.res === sc.leaves[0].res);
          return (
            <div
              className="tree-branch"
              key={sc.own}
              style={{ animationDelay: `${ci * 0.12}s` }}
            >
              <div className={`branch-head own-${sc.own}`}>{OWN[sc.own]}</div>
              {allSame ? (
                <div
                  className={`leaf-node solo ${RES[sc.leaves[0].res].cls}`}
                  style={{ animationDelay: `${ci * 0.12 + 0.15}s` }}
                >
                  {RES[sc.leaves[0].res].text}
                </div>
              ) : (
                <div className="branch-children">
                  {sc.leaves.map((l, li) => (
                    <div
                      className={`leaf-node ${RES[l.res].cls}`}
                      key={li}
                      style={{ animationDelay: `${ci * 0.12 + 0.15 + li * 0.08}s` }}
                    >
                      <span className="leaf-when">
                        {l.other ? otherText(l.other) : "무관"}
                      </span>
                      <span className="leaf-res">{RES[l.res].text}</span>
                      {l.res === "gd" && l.rival != null && (
                        <span className="leaf-gd">
                          {ko(team)} {sgn(l.tGd!)}·{l.tGf} vs {ko(l.rival)}{" "}
                          {sgn(l.rGd!)}·{l.rGf}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
