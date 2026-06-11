import matches from "@/data/matches.json";
import { ko } from "@/lib/teams";

type Match = {
  date: string;
  home: string;
  away: string;
  city: string;
  eloDiff: number;
  pHome: number;
  pDraw: number;
  pAway: number;
};

function fmtDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(m)}월 ${Number(day)}일`;
}

export default function MatchList() {
  const all = matches as Match[];
  const byDate = new Map<string, Match[]>();
  for (const m of all) {
    if (!byDate.has(m.date)) byDate.set(m.date, []);
    byDate.get(m.date)!.push(m);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div>
      {dates.map((d) => (
        <div className="matchday" key={d}>
          <h3>{fmtDate(d)}</h3>
          {byDate.get(d)!.map((m, i) => (
            <div className="match" key={i}>
              <div>
                <div className="teams">
                  {ko(m.home)} <span className="city">vs</span> {ko(m.away)}
                </div>
                <div className="city">{m.city}</div>
              </div>
              <div>
                <div className="barwrap" title="홈승 / 무 / 원정승">
                  <span className="b-home" style={{ width: `${m.pHome * 100}%` }} />
                  <span className="b-draw" style={{ width: `${m.pDraw * 100}%` }} />
                  <span className="b-away" style={{ width: `${m.pAway * 100}%` }} />
                </div>
                <div className="probs" style={{ marginTop: 6 }}>
                  <span>
                    <i>홈</i>
                    <b>{(m.pHome * 100).toFixed(0)}%</b>
                  </span>
                  <span>
                    <i>무</i>
                    {(m.pDraw * 100).toFixed(0)}%
                  </span>
                  <span>
                    <i>원정</i>
                    {(m.pAway * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
