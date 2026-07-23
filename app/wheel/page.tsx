import type { Metadata } from "next";
import { WheelExperience } from "@/components/wheel-experience";
import { PageIntro } from "@/components/page-intro";
import { milkTeaProducts } from "@/lib/data/milk-tea";

export const metadata: Metadata = {
  title: "奶茶罗盘",
  description: "从八个饮品品牌中选择产品、已有规格和小料，实时计算参考热量。",
};

export default function WheelPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro eyebrow="MILK TEA COMPASS" title="把选择困难，转成一点期待。" description="浏览八个品牌的完整产品目录，可同时选择多个品牌，或让转盘随机抽一款，再选择已有热量记录的规格，并参考该品牌常见小料。" accent="coral" />
      <WheelExperience products={milkTeaProducts} />
    </main>
  );
}
