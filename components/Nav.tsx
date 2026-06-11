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
      { href: "/math", label: "수식 해설" },
    ],
  },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLElement>(null);

  // 라우트 변경 시 닫기
  useEffect(() => setOpen(null), [pathname]);
  // 외부 클릭 / 스크롤 / 리사이즈 시 닫기 (fixed 메뉴 위치 어긋남 방지)
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
    <nav className="nav" ref={ref}>
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

      <a
        href="https://github.com/choigod1023/wc2026-predictor"
        target="_blank"
        rel="noreferrer"
        className="nav-link"
      >
        GitHub ↗
      </a>
    </nav>
  );
}
