import type { Metadata } from "next";
import { TakeoutExperience } from "@/components/takeout-experience";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "北大外卖",
  description: "浏览或随机选择北京大学南门周边公开餐饮候选商户，配送范围和营业状态请以外卖平台为准。",
};

export default function TakeoutPage() {
  return (
    <main id="takeout" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro eyebrow="PKU TAKEOUT" title="北大外卖" description="以北京大学南门为基准，浏览或随机选择周边餐饮商户。距离来自公开资料，实际配送范围、营业状态和价格请以外卖平台为准。" />
      <TakeoutExperience />
    </main>
  );
}
