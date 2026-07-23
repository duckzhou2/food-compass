import Link from "next/link";

const links = [
  { href: "/", label: "首页" },
  { href: "/meals", label: "今天吃什么" },
  { href: "/canteens", label: "北大食堂" },
  { href: "/takeout", label: "外卖罗盘" },
  { href: "/wheel", label: "奶茶罗盘" },
  { href: "/data", label: "数据" },
  { href: "/about", label: "说明" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#f8f5ee]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="食物罗盘首页">
          <span className="grid size-10 place-items-center rounded-full bg-[#173f35] text-lg text-[#f9e8a8] shadow-sm">
            ◈
          </span>
          <span>
            <span className="block whitespace-nowrap font-serif text-base font-bold tracking-[0.1em] text-[#173f35] sm:text-lg sm:tracking-[0.12em]">
              食物罗盘
            </span>
            <span className="hidden text-[10px] tracking-[0.18em] text-stone-500 sm:block">
              FOOD COMPASS
            </span>
          </span>
        </Link>
        <nav aria-label="主导航" className="flex items-center gap-1 overflow-x-auto">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${index === 0 || index >= 5 ? "hidden md:block" : "block"} whitespace-nowrap px-2 py-2 text-xs text-stone-600 transition hover:text-[#173f35] sm:px-3 sm:text-sm lg:px-4`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
