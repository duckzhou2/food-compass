import type { Metadata } from "next";
import { MealExperience } from "@/components/meal-experience";

export const metadata: Metadata = {
  title: "今天吃什么",
  description: "按分类、预算、口味和用餐时间筛选，或用分类均衡转盘随机决定今天吃什么。",
};

export default function MealsPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#c96348]">MEAL COMPASS</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">今天吃什么</h1>
        <p className="mt-4 leading-7 text-stone-600">不区分午饭和晚饭。可以直接交给随机，也可以先按预算、口味和用餐时间缩小范围。</p>
      </header>
      <MealExperience />
    </main>
  );
}
