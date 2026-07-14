import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "关于" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">ABOUT THE PROJECT</p>
      <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">先解决“喝什么”，再慢慢补全“知道多少”。</h1>
      <div className="mt-10 space-y-6 text-base leading-8 text-stone-700">
        <p>
          食物罗盘的第一版只做奶茶：从经过筛选的候选池中等概率随机选择一款，并把这条记录的数据来源、核验状态和缺失项一起展示。
        </p>
        <p>
          它不把媒体转述包装成官方检测，也不会把未知营养值写成 0。当前数据不完整，但产品目录已经足以验证转盘、筛选和证据展示的核心体验。
        </p>
        <div className="border-y border-stone-300 py-7">
          <h2 className="font-serif text-2xl font-bold text-stone-900">当前不做的事情</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7">
            <li>不提供医疗、减重或专业营养建议。</li>
            <li>不抓取没有可靠口径的实时价格。</li>
            <li>不使用海外同名产品数据替代中国大陆配方。</li>
            <li>不为了增加记录数复制规格或制造虚假精度。</li>
          </ul>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/wheel" className="rounded-full bg-[#173f35] px-6 py-3 text-sm font-semibold text-white">去转罗盘 →</Link>
        <Link href="/data" className="rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-700">查看数据边界</Link>
      </div>
    </main>
  );
}
