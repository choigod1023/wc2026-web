import changes from "@/data/prediction_changes.json";
import { ko } from "@/lib/teams";

type Move = {
  team: string;
  dir: "up" | "down";
  delta: number;
  opp?: string;
  sf?: number;
  sa?: number;
  result?: "win" | "draw" | "loss";
  upset?: boolean;
  other?: boolean;
};
type Change = { date: string; moves: Move[] };

const RESULT = { win: "승리", draw: "무승부", loss: "패배" } as const;

function fmtDate(d: string): string {
  const p = d.split("-");
  return `${Number(p[1])}월 ${Number(p[2])}일`;
}

export default function ChangesTimeline() {
  const data = changes as unknown as Change[];
  if (data.length === 0) {
    return (
      <div className="card note">
        아직 우승 확률이 크게 바뀐 경기가 없습니다. 결과가 쌓이면 표시됩니다.
      </div>
    );
  }
  return (
    <div className="timeline">
      {data.map((c) => (
        <div className="tl-item" key={c.date}>
          <div className="tl-date">{fmtDate(c.date)}</div>
          <div className="tl-moves">
            {c.moves.map((m, i) => (
              <div className="tl-move" key={i}>
                <span className={`tl-team ${m.dir}`}>
                  {ko(m.team)} {m.dir === "up" ? "▲" : "▼"}
                </span>
                <span className="tl-reason">
                  {m.opp ? (
                    <>
                      {ko(m.opp)}전 {m.sf}-{m.sa}{" "}
                      {RESULT[m.result ?? "draw"]}
                      {m.upset && <span className="tl-upset">예상 밖</span>}
                    </>
                  ) : (
                    <span className="muted2">다른 경기 결과로 상대적 변화</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
