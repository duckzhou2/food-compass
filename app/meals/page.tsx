import type { Metadata } from "next";
import { MealExperience } from "@/components/meal-experience";
import { PageIntro } from "@/components/page-intro";

export const metadata: Metadata = {
  title: "今天吃什么",
  description: "按分类、预算、口味和用餐时间筛选，或用分类均衡转盘随机决定今天吃什么。",
};

export default function MealsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageIntro eyebrow="MEAL COMPASS" title="今天吃什么" description="不区分午饭和晚饭。可以直接交给随机，也可以先按预算、口味和用餐时间缩小范围。" accent="coral" />
      <MealExperience />
    </main>
  );
}
