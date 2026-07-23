import type { Metadata } from "next";
import { WheelExperience } from "@/components/wheel-experience";
import { milkTeaProducts } from "@/lib/data/milk-tea";

export const metadata: Metadata = {
  title: "奶茶罗盘",
  description: "从八个饮品品牌中选择产品、已有规格和小料，实时计算参考热量。",
};

export default function WheelPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">MILK TEA COMPASS</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">把选择困难，转成一点期待。</h1>
        <p className="mt-4 leading-7 text-stone-600">
          浏览八个品牌的完整产品目录，可同时选择多个品牌，或让转盘随机抽一款，再选择已有热量记录的规格，并参考该品牌常见小料。
        </p>
      </header>
      <WheelExperience products={milkTeaProducts} />
    </main>
  );
}
