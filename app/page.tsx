import Link from "next/link";
import { builtinMealFoods } from "@/lib/data/meals";
import { milkTeaBrands, milkTeaProducts } from "@/lib/data/milk-tea";
import { canteenCatalog } from "@/lib/data/canteens";
import { builtinTakeoutMerchants } from "@/lib/data/takeout";

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-4xl">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[#176b55]"><span className="size-2 rounded-full bg-[#e8a54b]" />FOOD COMPASS</p>
          <h1 className="mt-7 font-serif text-[2.9rem] font-bold leading-[1.04] tracking-tight text-[#173f35] sm:text-6xl lg:text-7xl">今天吃什么？<span className="mt-2 block text-[#c96348]">让罗盘替你选。</span></h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-stone-600 sm:text-lg">不知道吃什么、喝什么时，不必反复纠结。按条件筛一下，或者直接交给随机。</p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <article className="relative overflow-hidden rounded-[2.25rem] bg-[#173f35] p-7 text-white shadow-[0_28px_70px_rgba(23,63,53,.2)] sm:p-9">
            <div className="absolute -right-16 -top-16 size-56 rounded-full border-[34px] border-white/[0.05]" />
            <p className="relative text-xs font-semibold tracking-[0.18em] text-[#f6cf72]">MEAL COMPASS</p>
            <h2 className="relative mt-4 font-serif text-3xl font-bold sm:text-4xl">今天吃什么</h2>
            <p className="relative mt-4 max-w-md leading-7 text-emerald-50/80">按预算、口味和用餐时间，从 {builtinMealFoods.length} 种正餐选择中抽一个。</p>
            <Link href="/meals" className="relative mt-8 inline-flex min-h-12 items-center rounded-full bg-[#c96348] px-6 text-sm font-semibold text-white">开始选一顿 →</Link>
          </article>
          <article className="relative overflow-hidden rounded-[2.25rem] border border-stone-200 bg-[#fff8e8] p-7 shadow-[0_24px_60px_rgba(70,60,40,.08)] sm:p-9">
            <div className="absolute -right-12 -top-16 size-52 rounded-full bg-amber-100/70" />
            <p className="relative text-xs font-semibold tracking-[0.18em] text-[#8a5a12]">PKU CANTEEN</p>
            <h2 className="relative mt-4 font-serif text-3xl font-bold text-[#173f35] sm:text-4xl">北大食堂</h2>
            <p className="relative mt-4 max-w-md leading-7 text-stone-600">浏览 {canteenCatalog.canteens.filter((item) => !item.isServicePoint).length} 个餐饮单位、{canteenCatalog.windows.length} 个窗口和 {canteenCatalog.dishes.length} 个结构化菜品。</p>
            <Link href="/canteens" className="relative mt-8 inline-flex min-h-12 items-center rounded-full bg-[#e8a54b] px-6 text-sm font-semibold text-[#173f35]">去逛食堂 →</Link>
          </article>
          <article className="relative overflow-hidden rounded-[2.25rem] border border-stone-200 bg-[#f0f7f3] p-7 shadow-[0_24px_60px_rgba(70,60,40,.08)] sm:p-9">
            <div className="absolute -right-14 -top-16 size-56 rounded-full border-[32px] border-[#176b55]/[0.06]" />
            <p className="relative text-xs font-semibold tracking-[0.18em] text-[#176b55]">TAKEOUT COMPASS</p>
            <h2 className="relative mt-4 font-serif text-3xl font-bold text-[#173f35] sm:text-4xl">外卖罗盘</h2>
            <p className="relative mt-4 max-w-md leading-7 text-stone-600">从北京大学南门周边 {builtinTakeoutMerchants.length} 家公开候选商户中浏览或随机，实际配送请到平台确认。</p>
            <Link href="/takeout" className="relative mt-8 inline-flex min-h-12 items-center rounded-full bg-[#176b55] px-6 text-sm font-semibold text-white">去抽一家 →</Link>
          </article>
          <article className="relative overflow-hidden rounded-[2.25rem] border border-stone-200 bg-white p-7 shadow-[0_24px_60px_rgba(70,60,40,.08)] sm:p-9">
            <div className="absolute -bottom-20 -right-12 size-60 rounded-full bg-emerald-50" />
            <p className="relative text-xs font-semibold tracking-[0.18em] text-[#176b55]">MILK TEA COMPASS</p>
            <h2 className="relative mt-4 font-serif text-3xl font-bold text-[#173f35] sm:text-4xl">奶茶罗盘</h2>
            <p className="relative mt-4 max-w-md leading-7 text-stone-600">从 {milkTeaBrands.length} 个品牌、{milkTeaProducts.length} 款产品中筛选或随机，再查看规格与热量参考。</p>
            <Link href="/wheel" className="relative mt-8 inline-flex min-h-12 items-center rounded-full bg-[#176b55] px-6 text-sm font-semibold text-white">去选一杯 →</Link>
          </article>
        </div>
      </section>
    </main>
  );
}
