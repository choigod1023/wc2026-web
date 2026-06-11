import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "WC2026 예측 — 모델 vs 베팅 시장",
  description:
    "2026 월드컵 조별리그 72경기를 검증장으로, Elo + 로지스틱 확률 모델이 베팅 시장보다 정확한지 검증하는 프로젝트의 공개 대시보드.",
  openGraph: {
    title: "WC2026 예측 — 모델 vs 베팅 시장",
    description:
      "Elo + 로지스틱 확률 모델의 우승 확률·72경기 예측·시장 비교·수식 해설.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="wrap header-inner">
            <Link href="/" className="brand">
              <span className="brand-ball">⚽</span>
              <span>
                WC<b>2026</b> 예측
              </span>
            </Link>
            <nav className="nav">
              <Link href="/">대시보드</Link>
              <Link href="/math">수식</Link>
              <a
                href="https://github.com/choigod1023/wc2026-predictor"
                target="_blank"
                rel="noreferrer"
              >
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer">
          <div className="wrap">
            <p>
              실제 베팅용이 아닙니다. 모델 정확도 검증·학습 목적의 프로젝트입니다.
              데이터 기준: 2026-06-08 경기까지 · 시장 스냅샷: 2026-06-10.
            </p>
            <p className="muted">
              모델 레포{" "}
              <a href="https://github.com/choigod1023/wc2026-predictor">
                wc2026-predictor
              </a>{" "}
              · 웹 레포{" "}
              <a href="https://github.com/choigod1023/wc2026-web">wc2026-web</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
