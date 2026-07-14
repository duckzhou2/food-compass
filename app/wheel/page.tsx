import type { Metadata } from "next";
import { WheelExperience } from "@/components/wheel-experience";
import { products } from "@/lib/data/products";

export const metadata: Metadata = {
  title: "奶茶罗盘",
  description: "筛选候选饮品，转动罗盘并查看可追溯的营养与来源信息。",
};

export default function WheelPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">MILK TEA COMPASS</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">把选择困难，转成一点期待。</h1>
        <p className="mt-4 leading-7 text-stone-600">
          默认只抽取有热量数据的记录；切换到“全部目录”可从完整产品池抽取，无热量产品会明确标为待核验。
        </p>
      </header>
      <WheelExperience products={products} />
    </main>
  );
}
