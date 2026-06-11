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
  const ref = useRef<HTMLElement>(null);

  // 라우트 변경 / 외부 클릭 시 닫기
  useEffect(() => setOpen(null), [pathname]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, []);

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
              onClick={(e) => {
                e.stopPropagation();
                setOpen(open === g.label ? null : g.label);
              }}
              aria-expanded={open === g.label}
            >
              {g.label}
              <span className="caret">▾</span>
            </button>
            {open === g.label && (
              <div className="nav-menu">
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
