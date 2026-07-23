"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { primaryNavigation, siteContent } from "@/lib/site-content";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/75 bg-[var(--paper)]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:min-h-[4.5rem] lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="食物罗盘首页">
          <span className="grid size-10 place-items-center rounded-full bg-[var(--forest)] text-[var(--gold-light)] shadow-sm">
            <BrandMark />
          </span>
          <span>
            <span className="block whitespace-nowrap font-serif text-base font-bold tracking-[0.1em] text-[var(--forest)] sm:text-lg sm:tracking-[0.12em]">
              {siteContent.brand.name}
            </span>
            <span className="hidden text-[10px] tracking-[0.18em] text-stone-500 sm:block">
              {siteContent.brand.englishName}
            </span>
          </span>
        </Link>
        <nav aria-label="主导航" className="hidden items-center gap-1 lg:flex">
          {primaryNavigation.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="relative whitespace-nowrap px-3 py-2 text-sm text-stone-600 transition hover:text-[var(--forest)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--forest)]"
            >
              {link.label}
              {pathname === link.href && <span className="absolute inset-x-3 -bottom-[0.95rem] h-0.5 bg-[var(--forest)]" />}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          aria-label={open ? "关闭主菜单" : "打开主菜单"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="grid size-11 place-items-center rounded-2xl bg-[var(--forest)] text-white shadow-sm lg:hidden"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M5 7h14M5 12h14M5 17h14" />}
          </svg>
        </button>
      </div>
      {open && (
        <nav aria-label="移动端主导航" className="border-t border-stone-200 bg-[var(--paper)] px-4 py-3 shadow-xl lg:hidden">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 sm:grid-cols-4">
            {primaryNavigation.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === link.href ? "page" : undefined}
                className="min-h-11 rounded-xl px-3 py-3 text-sm font-medium text-stone-700 transition hover:bg-white aria-[current=page]:bg-[var(--forest)] aria-[current=page]:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
