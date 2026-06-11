import scores from "@/data/score_predictions.json";
import { ko } from "@/lib/teams";

type Score = {
  date: string;
  home: string;
  away: string;
  eloDiff: number;
  lambdaHome: number;
  lambdaAway: number;
  expScore: string;
  topScores: { h: number; a: number; p: number }[];
  overUnder: Record<string, number>;
  handicap: Record<string, number>;
  fairHandicap: number;
  rationale: string;
};

function fmtDate(d: string): string {
  const [, m, day] = d.split("-");
  return `${Number(m)}월 ${Number(day)}일`;
}

export default function ScoreList() {
  const all = scores as Score[];
  const byDate = new Map<string, Score[]>();
  for (const s of all) {
    if (!byDate.has(s.date)) byDate.set(s.date, []);
    byDate.get(s.date)!.push(s);
  }
  const dates = [...byDate.keys()].sort();

  return (
    <div>
      {dates.map((d) => (
        <div className="matchday" key={d}>
          <h3>{fmtDate(d)}</h3>
          {byDate.get(d)!.map((s, i) => {
            const o25 = s.overUnder["2.5"] * 100;
            const fh = s.fairHandicap;
            const fhSide = fh > 0 ? ko(s.home) : ko(s.away);
            return (
              <div className="score-card" key={i}>
                <div className="sc-head">
                  <div className="sc-teams">
                    {ko(s.home)} <span className="muted2">vs</span> {ko(s.away)}
                  </div>
                  <div className="sc-exp" title="가장 가능성 큰 스코어">
                    {s.expScore}
                  </div>
                </div>

                <div className="sc-meta">
                  <span>
                    기대득점{" "}
                    <b>
                      {s.lambdaHome.toFixed(2)} : {s.lambdaAway.toFixed(2)}
                    </b>
                  </span>
                  <span className="muted2">Elo {s.eloDiff >= 0 ? "+" : ""}{s.eloDiff}</span>
                </div>

                <div className="sc-grid">
                  <div className="sc-block">
                    <div className="sc-label">언더/오버 2.5</div>
                    <div className="ou-bar">
                      <span className="ou-over" style={{ width: `${o25}%` }}>
                        오버 {o25.toFixed(0)}%
                      </span>
                      <span className="ou-under" style={{ width: `${100 - o25}%` }}>
                        언더 {(100 - o25).toFixed(0)}%
                      </span>
                    </div>
                    <div className="sc-lines">
                      {Object.entries(s.overUnder).map(([line, p]) => (
                        <span key={line} className="sc-line">
                          O{line} <b>{(p * 100).toFixed(0)}%</b>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="sc-block">
                    <div className="sc-label">
                      적정 핸디캡 {fh === 0 ? "없음(박빙)" : `${fhSide} -${Math.abs(fh).toFixed(1)}`}
                    </div>
                    <div className="sc-lines">
                      {s.topScores.slice(0, 4).map((t, j) => (
                        <span key={j} className="sc-line">
                          {t.h}-{t.a} <b>{(t.p * 100).toFixed(0)}%</b>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="sc-why">
                  {s.rationale.split(s.away).join(ko(s.away)).split(s.home).join(ko(s.home))}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
