# WC2026 Web — 월드컵 예측 대시보드

[wc2026-predictor](https://github.com/choigod1023/wc2026-predictor) 모델의 예측 결과를
누구나 볼 수 있게 보여주는 웹 플랫폼. **모델 vs 베팅 시장** 정확도 검증 프로젝트의 공개 대시보드다.

> ⚠️ 실제 베팅용이 아니며, 모델 정확도 검증·학습 목적입니다.

## 무엇을 보여주나
- 🏆 **대시보드** — 우승 확률(몬테카를로), 모델 vs 시장 견해차 그래프, Elo Top12, 72경기 확률
- 🔴 **라이브** (`/live`) — 실시간 스코어 · 경기별 3-way 배당 · 모델 예측 오버레이 · 실시간 조별 순위 (named.com API, 30초 갱신)
- 🧪 **모델 비교** (`/models`) — 여러 모델 walk-forward Brier 리더보드 + 모델별 우승 확률
- 🪜 **토너먼트** (`/bracket`) — 32강~우승 단계별 진출 확률 히트맵
- ➗ **수식 해설** (`/math`) — Elo·확률변환·Davidson·Brier·몬테카를로 전 수식

## 라이브 데이터
`/api/live` 라우트 핸들러가 named.com 스포츠 API를 **서버에서** 호출(CORS 회피)해
월드컵 경기·배당·실시간 순위를 정규화한다. 키 불필요. 클라이언트는 30초마다 폴링.
팀명 매핑은 `lib/teams.ts`(영↔한 48팀), 조 복원·순위 계산은 `lib/groups.ts`.

## 기술 스택
- Next.js 15 (App Router) · React 19 · TypeScript
- 정적 생성(SSG) — 서버리스, 모든 페이지 prerender
- 예측 데이터는 `data/*.json` (모델 레포 CSV에서 변환한 개막 시점 고정 스냅샷)

## 로컬 실행
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 정적 빌드
```

## 데이터 갱신
모델 레포의 CSV가 갱신되면 `data/*.json` 을 다시 생성한다.
(`championship.json`, `matches.json`, `elo.json`, `modelVsMarket.json`)

## 배포
Vercel에 연결되어 `main` 브랜치 푸시 시 자동 배포된다.

---
모델·수식 상세: [wc2026-predictor / docs/MATH.md](https://github.com/choigod1023/wc2026-predictor/blob/main/docs/MATH.md)
