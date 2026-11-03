# WC2026 Web — World Cup Prediction Dashboard

[한국어](README.md) · [日本語](README.ja.md) · **English**

A web platform that makes the predictions of the [wc2026-predictor](https://github.com/choigod1023/wc2026-predictor)
model publicly viewable — the public dashboard of a **model vs. betting market** accuracy-verification project.

🔗 **Live demo: [wc2026-web.vercel.app](https://wc2026-web.vercel.app)**

> ⚠️ Not intended for actual betting. Built for model-accuracy verification and learning.

## Match scoring status (checked 2026-11-03)

On predictor snapshot `9cd48f9`, all 72 matches have matching predictions, results and stored
odds. Brier is **0.5336** for the model and **0.4863** for probabilities derived from the
stored odds (lower is better). This is exploratory: odds observation times and whether each
prediction preceded its match have not been verified. The championship-probability chart is a
separate comparison. See the [predictor repository](https://github.com/choigod1023/wc2026-predictor)
for the reproduction command and limitations.

## What it shows
- 🏆 **Dashboard** — championship probabilities (Monte Carlo), model-vs-market disagreement chart, Elo Top 12, probabilities for all 72 matches
- 🔴 **Live** (`/live`) — live scores, per-match 3-way odds, model-prediction overlay, live group standings (named.com API, ~5s polling)
- 🧪 **Model comparison** (`/models`) — walk-forward Brier leaderboard across models plus per-model championship odds
- 🪜 **Bracket** (`/bracket`) — heatmap of round-by-round advancement probabilities from the Round of 32 to the final
- ➗ **Math** (`/math`) — every formula: Elo, probability transform, Davidson, Brier, Monte Carlo

## Live data
The `/api/live` route handler calls the named.com sports API (`sports-api.named.com/v1.0`, `league.id=639`)
**server-side** (avoiding CORS) and normalizes World Cup fixtures, odds, and live standings. No API key needed.
The client (`/live`) polls roughly every 5 seconds only while the tab is visible, and the route caches with `s-maxage=5` to throttle outbound calls.
Team-name mapping lives in `lib/teams.ts` (48 teams, EN↔KO); group reconstruction and standings in `lib/groups.ts`.

## Tech stack
- Next.js 15 (App Router) · React 19 · TypeScript
- Pages use static generation (SSG); the live-data API is handled by a server route
- Prediction data in `data/*.json` (converted from model-repo CSVs; match predictions are frozen, while other outputs are refreshed)

## Local development
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static build
```

## Refreshing data
When the model repo's CSVs change, regenerate `data/*.json`
(`championship.json`, `matches.json`, `elo.json`, `modelVsMarket.json`).

## Automated refresh
`.github/workflows/refresh-predictions.yml` runs every 6 hours (plus a manual trigger): it clones the
predictor repo, runs the pipeline, and uses `export_web.py` to regenerate and commit `data/*.json`.
The model runs only on this schedule rather than per request (no heavy training — CPU is enough),
and the frontend simply reads static JSON. Each commit triggers an automatic Vercel redeploy.

## Deployment
Connected to Vercel; pushes to `main` deploy automatically.

---
Model and formula details: [wc2026-predictor / docs/MATH.md](https://github.com/choigod1023/wc2026-predictor/blob/main/docs/MATH.md)

---

## 👤 Contribution & development environment

| Item | Detail |
|---|---|
| **Contribution share** | **100%** (solo development) |
| **Commits** | 46 / 46 (mine / all human commits) |
| **Contributors** | 1 |
| **AI coding tool** | Claude Code |
| **Automated commits** | 231 (GitHub Actions collection/refresh that I configured — excluded from the count) |

<sub>Counting basis (snapshot as of 2026-08-12): commits reachable from **every branch** on origin (merge commits and empty commits excluded), counted by commit author email with one person’s multiple addresses merged; bot and automation commits are excluded.</sub>
