# WC2026 Web — ワールドカップ予測ダッシュボード

[한국어](README.md) · **日本語** · [English](README.en.md)

[wc2026-predictor](https://github.com/choigod1023/wc2026-predictor) モデルの予測結果を
誰でも見られるように公開する Web プラットフォーム。**モデル vs ベッティング市場** の精度検証プロジェクトの公開ダッシュボードです。

🔗 **ライブデモ: [wc2026-web.vercel.app](https://wc2026-web.vercel.app)**

> ⚠️ 実際のベッティング用途ではなく、モデル精度の検証・学習を目的としています。

## 何が見られるか
- 🏆 **ダッシュボード** — 優勝確率（モンテカルロ）、モデル vs 市場の見解差グラフ、Elo Top12、72 試合の確率
- 🔴 **ライブ**（`/live`）— リアルタイムスコア・試合ごとの 3-way オッズ・モデル予測のオーバーレイ・リアルタイム順位表（named.com API、約 5 秒ポーリング）
- 🧪 **モデル比較**（`/models`）— 複数モデルの walk-forward Brier リーダーボード＋モデル別の優勝確率
- 🪜 **トーナメント**（`/bracket`）— ベスト32〜優勝までのラウンド別進出確率ヒートマップ
- ➗ **数式解説**（`/math`）— Elo・確率変換・Davidson・Brier・モンテカルロの全数式

## ライブデータ
`/api/live` ルートハンドラが named.com スポーツ API（`sports-api.named.com/v1.0`, `league.id=639`）を
**サーバー側で** 呼び出し（CORS 回避）、ワールドカップの試合・オッズ・リアルタイム順位を正規化します。API キーは不要です。
クライアント（`/live`）はタブが表示されているときのみ約 5 秒ごとにポーリングし、ルート側は `s-maxage=5` でキャッシュして外部呼び出しを抑制します。
チーム名のマッピングは `lib/teams.ts`（英↔韓 48 チーム）、グループ復元・順位計算は `lib/groups.ts`。

## 技術スタック
- Next.js 15（App Router）· React 19 · TypeScript
- 静的生成（SSG）— サーバーレス、全ページを prerender
- 予測データは `data/*.json`（モデルリポジトリの CSV から変換した開幕時点の固定スナップショット）

## ローカル実行
```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 静的ビルド
```

## データ更新
モデルリポジトリの CSV が更新されたら `data/*.json` を再生成します。
（`championship.json`, `matches.json`, `elo.json`, `modelVsMarket.json`）

## 自動更新
`.github/workflows/refresh-predictions.yml` が 6 時間ごと（＋手動トリガー）に予測リポジトリを
clone してパイプラインを実行し、`export_web.py` で `data/*.json` を更新・コミットします。
モデルはリクエストごとではなくこのスケジュールでのみ実行され（重い学習は無く CPU で十分）、
フロントは静的 JSON を読み込みます。コミットされると Vercel が自動で再デプロイします。

## デプロイ
Vercel に接続されており、`main` ブランチへの push で自動デプロイされます。

---
モデル・数式の詳細: [wc2026-predictor / docs/MATH.md](https://github.com/choigod1023/wc2026-predictor/blob/main/docs/MATH.md)

---

## 👤 コントリビューションと開発環境

| 項目 | 内容 |
|---|---|
| **貢献比率** | **100%**（単独開発） |
| **コミット** | 46 / 46（本人 / 全人力コミット） |
| **参加人数** | 1 名 |
| **AI コーディングツール** | Claude Code |
| **自動化コミット** | 231 件（本人が構成した GitHub Actions による自動収集・更新 — 集計対象外） |

<sub>集計基準: origin の **すべてのブランチ** から到達可能なコミット（マージコミット・空コミットは除外）を対象とし、コミットの author メールアドレス基準で、同一人物の複数のメールアドレスは合算、ボット・自動化コミットは除外しています。</sub>
