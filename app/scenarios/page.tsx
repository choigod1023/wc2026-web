"use client";

import { useEffect, useState } from "react";
import { ko } from "@/lib/teams";

type TeamScenario = {
  team: string;
  status: "qualified" | "eliminated" | "alive";
  qualProb: number;
  r32Prob: number;
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

export default function ScenariosPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState(false);

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
        <h1 style={{ fontSize: 32 }}>32강 진출 경우의 수</h1>
        <p>
          각 조의 <strong>잔여 경기 결과 조합을 전부 열거</strong>해, 팀별 직접
          진출(조 1·2위) <strong>확정 / 탈락 / 경쟁 중</strong> 상태와 진출 확률을
          계산한다. 동률은 2026 룰대로 <strong>승자승(맞대결)</strong>을 먼저 적용.
          개막 전에는 모든 팀이 &lsquo;경쟁 중&rsquo;이며 확률만 표시된다.
        </p>
        {err && (
          <p className="note">데이터를 불러오지 못했습니다. 잠시 후 재시도합니다.</p>
        )}
      </section>

      <section>
        {!data && !err && <div className="card">계산 중…</div>}
        {data && (
          <div className="standings-grid">
            {data.groups.map((g) => (
              <div className="card" key={g.label}>
                <p className="grp-title">
                  {g.label}{" "}
                  <span className="note" style={{ fontWeight: 400 }}>
                    {g.decided}/6 경기 종료
                  </span>
                </p>
                <table className="tbl-scn">
                  <thead>
                    <tr>
                      <th>팀</th>
                      <th>상태</th>
                      <th className="num">직접진출</th>
                      <th className="num">32강*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.teams.map((t) => {
                      const s = STATUS[t.status];
                      return (
                        <tr key={t.team}>
                          <td className="team-cell">{ko(t.team)}</td>
                          <td>
                            <span className={`st ${s.cls}`}>{s.text}</span>
                          </td>
                          <td className="num">
                            <strong>{(t.qualProb * 100).toFixed(0)}%</strong>
                          </td>
                          <td className="num note">
                            {(t.r32Prob * 100).toFixed(0)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
            ))}
          </div>
        )}
        <p className="note" style={{ marginTop: 12 }}>
          &lsquo;직접진출&rsquo;은 조 1·2위 확률(잔여 경기를 모델 승무패 확률로 가중).
          &lsquo;32강*&rsquo;는 3위 와일드카드를 포함한 개막 전 시뮬레이션 기준
          진출 확률(참고용). 잔여 경기 동률의 골득실 세부 타이브레이크는 일부
          근사된다.
        </p>
      </section>
    </>
  );
}
