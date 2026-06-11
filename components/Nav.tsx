"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };

const DIRECT: Item[] = [
  { href: "/", label: "대시보드" },
  { href: "/live", label: "라이브" },
];
const GROUPS: Group[] = [
  {
    label: "분석",
    items: [
      { href: "/score", label: "스코어·언오버·핸디캡" },
      { href: "/scenarios", label: "32강 경우의 수" },
      { href: "/models", label: "모델 비교" },
      { href: "/bracket", label: "토너먼트 진출" },
    ],
  },
  {
    label: "정보",
    items: [
      { href: "/rules", label: "바뀐 룰" },
      { href: "/math", label: "어떻게 예측하나요?" },
    ],
  },
];
const GH = "https://github.com/choigod1023/wc2026-predictor";

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null); // 데스크톱 드롭다운
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false); // 모바일 드로어
  const ref = useRef<HTMLDivElement>(null);

  // 라우트 변경 시 전부 닫기
  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  // 데스크톱 드롭다운: 외부 클릭/스크롤/리사이즈 시 닫기
  useEffect(() => {
    const close = (e: Event) => {
      if (e.type === "click" && ref.current && ref.current.contains(e.target as Node))
        return;
      setOpen(null);
    };
    document.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, []);

  // 모바일 드로어 열릴 때 배경 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const toggle = (label: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (open === label) {
      setOpen(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const menuW = 220;
    const left = Math.min(r.left, window.innerWidth - menuW - 8);
    setAnchor({ left: Math.max(8, left), top: r.bottom + 6 });
    setOpen(label);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="nav-wrap" ref={ref}>
      {/* ── 데스크톱 네비 ── */}
      <nav className="nav nav-desktop">
        {DIRECT.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`nav-link ${isActive(it.href) ? "active" : ""}`}
          >
            {it.label}
          </Link>
        ))}
        {GROUPS.map((g) => {
          const groupActive = g.items.some((it) => isActive(it.href));
          return (
            <div className="nav-group" key={g.label}>
              <button
                type="button"
                className={`nav-link nav-toggle ${groupActive ? "active" : ""}`}
                onClick={(e) => toggle(g.label, e)}
                aria-expanded={open === g.label}
              >
                {g.label}
                <span className="caret">▾</span>
              </button>
              {open === g.label && anchor && (
                <div
                  className="nav-menu"
                  style={{ position: "fixed", left: anchor.left, top: anchor.top }}
                >
                  {g.items.map((it) => (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={`nav-menu-item ${isActive(it.href) ? "active" : ""}`}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <a href={GH} target="_blank" rel="noreferrer" className="nav-link">
          GitHub ↗
        </a>
      </nav>

      {/* ── 모바일 햄버거 ── */}
      <button
        type="button"
        className="nav-burger"
        aria-label="메뉴 열기"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        <span className={`burger-icon ${mobileOpen ? "open" : ""}`}>
          <span />
          <span />
          <span />
        </span>
      </button>

      {/* ── 모바일 드로어 ── */}
      {mobileOpen && (
        <div className="drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            {DIRECT.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={`drawer-item ${isActive(it.href) ? "active" : ""}`}
              >
                {it.label}
              </Link>
            ))}
            {GROUPS.map((g) => (
              <div className="drawer-group" key={g.label}>
                <div className="drawer-head">{g.label}</div>
                {g.items.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`drawer-item ${isActive(it.href) ? "active" : ""}`}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            ))}
            <a
              href={GH}
              target="_blank"
              rel="noreferrer"
              className="drawer-item"
              onClick={() => setMobileOpen(false)}
            >
              GitHub ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
