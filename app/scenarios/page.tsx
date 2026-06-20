"use client";

import { useEffect, useState } from "react";
import { ko } from "@/lib/teams";

type Cond = "in" | "maybe" | "out";
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
const sgn = (n: number) => (n > 0 ? `+${n}` : `${n}`);
type OwnScenario = { own: "w" | "d" | "l"; leaves: Leaf[] };
type TeamScenario = {
  team: string;
  status: "qualified" | "eliminated" | "alive";
  qualProb: number;
  r32Prob: number;
  pld: number;
  pts: number;
  gd: number;
  gf: number;
  nextOpp: string | null;
  nextHome: boolean | null;
  cond: { w: Cond; d: Cond; l: Cond } | null;
  detail: OwnScenario[] | null;
};
type GroupScenario = {
  label: string;
  teams: TeamScenario[];
  remaining: { home: string; away: string }[];
  decided: number;
};
type Payload = { asOf: string; groups: GroupScenario[] };

const STATUS: Record<string, { text: string; cls: string }> = {
  qualified: { text: "진출 확정", cls: "st-q" },
  eliminated: { text: "탈락", cls: "st-e" },
  alive: { text: "경쟁 중", cls: "st-a" },
};
const COND: Record<Cond, { text: string; cls: string }> = {
  in: { text: "진출", cls: "c-in" },
  maybe: { text: "경우의수", cls: "c-maybe" },
  out: { text: "탈락", cls: "c-out" },
};
const RES: Record<Res, { text: string; cls: string }> = {
  in: { text: "진출", cls: "c-in" },
  out: { text: "탈락", cls: "c-out" },
  gd: { text: "골득실 승부", cls: "c-maybe" },
};
const OWN: Record<"w" | "d" | "l", string> = {
  w: "이기면",
  d: "비기면",
  l: "지면",
};

// 다른 경기 결과를 말로 ("프랑스 승" / "프랑스·세네갈 무")
function otherText(o: NonNullable<Leaf["other"]>, koFn: (s: string) => string) {
  if (o.r === "H") return `${koFn(o.home)} 승`;
  if (o.r === "A") return `${koFn(o.away)} 승`;
  return `${koFn(o.home)}·${koFn(o.away)} 무`;
}

export default function ScenariosPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);
  const [modal, setModal] = useState<TeamScenario | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/scenarios", { cache: "no-store" });
        if (!res.ok) throw new Error();
        const j = (await res.json()) as Payload;
        if (alive) {
          setData(j);
          setErr(false);
        }
      } catch {
        if (alive) setErr(true);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <section className="hero" style={{ padding: "40px 0 8px" }}>
        <h1 className="ph1" style={{ fontSize: 32 }}>
          32강 진출 경우의 수
        </h1>
        <p>
          각 조의 현재 순위와, <strong>마지막 경기가 어떻게 되면 누가 올라가는지</strong>를
          한눈에 보여줍니다. 동률은 2026 룰대로 <strong>승자승(맞대결)</strong>을 먼저
          적용합니다.
        </p>
        {err && (
          <p className="note">데이터를 불러오지 못했습니다. 잠시 후 재시도합니다.</p>
        )}
      </section>

      <section>
        {!data && !err && <div className="card">계산 중…</div>}
        {data && (
          <div className="standings-grid">
            {data.groups.map((g) => {
              const scenTeams = g.teams.filter(
                (t) => t.cond && t.status === "alive",
              );
              return (
                <div className="card" key={g.label}>
                  <p className="grp-title">
                    {g.label}{" "}
                    <span className="note" style={{ fontWeight: 400 }}>
                      {g.decided}/6 경기 종료
                    </span>
                  </p>

                  {/* 현재 순위 */}
                  <table className="tbl-scn2">
                    <thead>
                      <tr>
                        <th>팀</th>
                        <th className="num">경기</th>
                        <th className="num">승점</th>
                        <th className="num">득실</th>
                        <th>상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.teams.map((t, idx) => {
                        const s = STATUS[t.status];
                        return (
                          <tr key={t.team} className={idx < 2 ? "qual" : undefined}>
                            <td className="team-cell">
                              <span className="scn-rank">{idx + 1}</span>
                              {ko(t.team)}
                            </td>
                            <td className="num">{t.pld}</td>
                            <td className="num">
                              <strong>{t.pts}</strong>
                            </td>
                            <td className="num">
                              {t.gd > 0 ? `+${t.gd}` : t.gd}
                            </td>
                            <td>
                              <span className={`st ${s.cls}`}>{s.text}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* 마지막 경기 시나리오 */}
                  {scenTeams.length > 0 && (
                    <div className="scn-board">
                      <div className="scn-board-title">
                        🔑 마지막 경기 — 이렇게 되면?
                      </div>
                      {scenTeams.map((t) => (
                        <div className="scn-line" key={t.team}>
                          <div className="scn-line-head">
                            <span>
                              <b>{ko(t.team)}</b>
                              <span className="muted2"> vs {ko(t.nextOpp ?? "")}</span>
                            </span>
                            {t.detail && (
                              <button
                                type="button"
                                className="scn-more"
                                onClick={() => setModal(t)}
                              >
                                시나리오 ▸
                              </button>
                            )}
                          </div>
                          <div className="scn-cells">
                            {(["w", "d", "l"] as const).map((k) => {
                              const c = COND[t.cond![k]];
                              const lbl = k === "w" ? "승" : k === "d" ? "무" : "패";
                              return (
                                <span key={k} className={`scn-cell ${c.cls}`}>
                                  <span className="scn-cell-k">{lbl}</span>
                                  {c.text}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {g.remaining.length > 0 && (
                    <div className="rem-fix">
                      <span className="note">잔여: </span>
                      {g.remaining.map((f, i) => (
                        <span key={i} className="rem-pill">
                          {ko(f.home)}–{ko(f.away)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          &lsquo;경우의수&rsquo;는 다른 경기 결과나 골득실에 따라 갈리는 경우입니다. 잔여
          경기 동률의 골득실 세부 타이브레이크는 일부 근사됩니다. (조 1·2위 직접 진출
          기준 · 3위 와일드카드는 별도)
        </p>
      </section>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>
                {ko(modal.team)}{" "}
                <span className="muted2">진출 시나리오</span>
              </h3>
              <button className="modal-x" onClick={() => setModal(null)}>
                ✕
              </button>
            </div>
            <p className="note" style={{ margin: "0 0 12px" }}>
              마지막 경기 <b>vs {ko(modal.nextOpp ?? "")}</b> 결과별로 정리했어요.
            </p>
            {modal.detail!.map((sc) => {
              const allSame = sc.leaves.every(
                (l) => l.res === sc.leaves[0].res,
              );
              return (
                <div className="modal-own" key={sc.own}>
                  <div className="modal-own-head">
                    <span className="modal-own-k">{OWN[sc.own]}</span>
                    {allSame && (
                      <span className={`res-tag ${RES[sc.leaves[0].res].cls}`}>
                        {RES[sc.leaves[0].res].text}
                      </span>
                    )}
                  </div>
                  {!allSame && (
                    <ul className="modal-leaves">
                      {sc.leaves.map((l, i) => (
                        <li key={i}>
                          <span className="leaf-cond">
                            {l.other ? otherText(l.other, ko) : "결과 무관"}
                            {l.res === "gd" && l.rival != null && (
                              <span className="leaf-gd">
                                {ko(modal.team)} 득실 {sgn(l.tGd!)}·{l.tGf}득점 vs{" "}
                                {ko(l.rival)} {sgn(l.rGd!)}·{l.rGf}득점
                              </span>
                            )}
                          </span>
                          <span className="leaf-arrow">→</span>
                          <span className={`res-tag ${RES[l.res].cls}`}>
                            {RES[l.res].text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            <p className="note" style={{ marginTop: 12 }}>
              &lsquo;골득실 승부&rsquo;는 승점·맞대결까지 같아 골득실로 갈리는 경우입니다.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
