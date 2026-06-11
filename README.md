# WC2026 Web — 월드컵 예측 대시보드

[wc2026-predictor](https://github.com/choigod1023/wc2026-predictor) 모델의 예측 결과를
누구나 볼 수 있게 보여주는 웹 플랫폼. **모델 vs 베팅 시장** 정확도 검증 프로젝트의 공개 대시보드다.

> ⚠️ 실제 베팅용이 아니며, 모델 정확도 검증·학습 목적입니다.

## 무엇을 보여주나
- 🏆 **우승 확률** — 몬테카를로 20,000회 시뮬레이션 결과
- 📊 **모델 vs 시장** — 우승 확률 견해차 (북메이커·예측시장 컨센서스 대비)
- 📈 **Elo 레이팅** Top 12
- 🗓 **조별리그 72경기** 홈승/무/원정승 확률
- ➗ **수식 해설** (`/math`) — Elo·확률변환·Brier·몬테카를로 전 수식

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
