import Image from "next/image";
import Link from "next/link";
import { builtinMealFoods } from "@/lib/data/meals";
import { milkTeaBrands, milkTeaProducts } from "@/lib/data/milk-tea";
import { canteenCatalog } from "@/lib/data/canteens";
import { builtinTakeoutMerchants } from "@/lib/data/takeout";
import { siteContent } from "@/lib/site-content";
import type { SiteModuleId, SiteModuleTone } from "@/types/site";

const moduleDescriptions: Record<SiteModuleId, string> = {
  milkTea: `从 ${milkTeaBrands.length} 个品牌、${milkTeaProducts.length} 款产品中筛选或随机，再查看规格与热量参考。`,
  meals: `按预算、口味和用餐时间，从 ${builtinMealFoods.length} 种正餐选择中抽一个。`,
  canteens: `浏览 ${canteenCatalog.canteens.filter((item) => !item.isServicePoint).length} 个餐饮单位、${canteenCatalog.windows.length} 个窗口和 ${canteenCatalog.dishes.length} 个结构化菜品。`,
  takeout: `从北京大学南门周边 ${builtinTakeoutMerchants.length} 家公开候选商户中浏览或随机，实际配送请到平台确认。`,
};

const toneClasses: Record<SiteModuleTone, { surface: string; eyebrow: string; button: string }> = {
  coral: { surface: "bg-[#fff1ed]", eyebrow: "text-[var(--coral)]", button: "bg-[var(--coral)] text-white" },
  forest: { surface: "bg-[var(--forest)] text-white", eyebrow: "text-[var(--gold-light)]", button: "bg-[var(--coral)] text-white" },
  amber: { surface: "bg-[#fff5dc]", eyebrow: "text-[var(--amber-dark)]", button: "bg-[var(--amber)] text-[var(--forest-deep)]" },
  jade: { surface: "bg-[#eaf7f2]", eyebrow: "text-[var(--jade)]", button: "bg-[var(--jade)] text-white" },
};

export default function HomePage() {
  return (
    <main className="overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="relative z-10">
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[var(--forest)]">
              <span className="size-2 rounded-full bg-[var(--amber)]" />
              {siteContent.brand.englishName}
            </p>
            <h1 className="mt-7 text-balance font-serif text-[3.1rem] font-bold leading-[1.04] tracking-tight text-[var(--forest)] sm:text-6xl lg:text-[4.9rem]">
              今天吃什么？
              <span className="mt-2 block text-[var(--coral)]">让罗盘替你选。</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-stone-600 sm:text-lg">
              不知道吃什么、喝什么时，不必反复纠结。按条件筛一下，或者直接交给随机。
            </p>
          </div>
          <div className="relative min-h-[300px] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_28px_80px_rgba(14,77,64,.12)] sm:min-h-[420px] lg:min-h-[500px]">
            <Image
              src="/brand/hero-food.webp"
              alt="一碗搭配蔬菜和鸡蛋的米饭与一杯珍珠奶茶"
              fill
              priority
              sizes="(min-width: 1024px) 56vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {siteContent.modules.map((module) => {
            const tone = toneClasses[module.tone];
            return (
              <article
                key={module.id}
                className={`group relative flex min-h-[410px] flex-col overflow-hidden rounded-[2rem] border border-black/[0.05] p-6 shadow-[0_20px_55px_rgba(70,60,40,.09)] ${tone.surface}`}
              >
                <div className="relative z-10">
                  <p className={`text-xs font-bold tracking-[0.18em] ${tone.eyebrow}`}>{module.eyebrow}</p>
                  <h2 className={`mt-3 font-serif text-3xl font-bold ${module.tone === "forest" ? "text-white" : "text-[var(--forest)]"}`}>
                    {module.label}
                  </h2>
                  <p className={`mt-3 text-sm leading-6 ${module.tone === "forest" ? "text-emerald-50/80" : "text-stone-600"}`}>
                    {moduleDescriptions[module.id]}
                  </p>
                  <Link href={module.href} className={`mt-5 inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold shadow-sm ${tone.button}`}>
                    {module.cta}
                    <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-[44%] overflow-hidden">
                  <Image
                    src={module.asset}
                    alt=""
                    fill
                    loading="eager"
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className={`absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${module.tone === "forest" ? "from-[var(--forest)]" : module.tone === "coral" ? "from-[#fff1ed]" : module.tone === "amber" ? "from-[#fff5dc]" : "from-[#eaf7f2]"} to-transparent`} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
