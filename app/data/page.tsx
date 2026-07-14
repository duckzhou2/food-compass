import type { Metadata } from "next";
import { products } from "@/lib/data/products";
import { getDataStats } from "@/lib/data/stats";
import { sourceOriginLabels } from "@/lib/formatters";

export const metadata: Metadata = { title: "数据透明度" };

const nutritionLabels: Record<string, string> = {
  calories_kcal_min: "热量",
  protein_g: "蛋白质",
  fat_g: "脂肪",
  carbohydrate_g: "碳水化合物",
  sugar_g: "糖",
  caffeine_mg: "咖啡因",
  tea_polyphenols_mg: "茶多酚",
};

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = total === 0 ? 0 : (value / total) * 100;
  return (
    <div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-700">{label}</span>
        <span className="font-mono text-stone-500">{value} / {total}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100">
        <div className="h-full rounded-full bg-[#176b55]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

export default function DataPage() {
  const stats = getDataStats(products);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">DATA TRANSPARENCY</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[#173f35] sm:text-5xl">数据有多少，边界就画到哪里。</h1>
        <p className="mt-5 text-base leading-8 text-stone-600">
          当前数据以中国大陆公开资料为范围。大量字段为 null，不是采集失败后的“0”，而是来源没有披露或无法在当前规格下核验。
        </p>
      </header>

      <section className="mt-12 grid grid-cols-3 border-y border-stone-300 py-6">
        {[
          [stats.total, "产品规格记录"],
          [stats.brandCount, "覆盖品牌"],
          [stats.withCalories, "含热量记录"],
        ].map(([value, label]) => (
          <div key={label} className="border-r border-stone-300 px-3 first:pl-0 last:border-r-0 sm:px-6">
            <p className="text-xs text-stone-500 sm:text-sm">{label}</p>
            <p className="mt-3 font-mono text-2xl font-bold text-[#173f35] sm:text-4xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
        <article>
          <h2 className="font-serif text-2xl font-bold">品牌覆盖</h2>
          <div className="mt-6 space-y-5">
            {Object.entries(stats.byBrand).sort(([, a], [, b]) => b - a).map(([brand, count]) => (
              <BarRow key={brand} label={brand} value={count} total={stats.total} />
            ))}
          </div>
        </article>
        <article>
          <h2 className="font-serif text-2xl font-bold">来源构成</h2>
          <div className="mt-6 space-y-5">
            {Object.entries(stats.bySourceOrigin).map(([origin, count]) => (
              <BarRow key={origin} label={sourceOriginLabels[origin as keyof typeof sourceOriginLabels] ?? origin} value={count} total={stats.total} />
            ))}
          </div>
          <p className="mt-6 border-l-2 border-[#e8a54b] pl-4 text-sm leading-6 text-amber-900">
            “品牌官方”只代表来源主体，不代表该记录的规格和全部营养字段均已核验；请同时查看 audit_status 和审计说明。
          </p>
        </article>
      </section>

      <section className="mt-16 border-t border-stone-300 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-2xl font-bold">营养字段完整度</h2>
            <p className="mt-2 text-sm text-stone-500">条形表示已填写记录数；其余均保持 null。</p>
          </div>
          <span className="text-xs text-stone-400">来源访问更新至 {stats.lastAccessedAt}</span>
        </div>
        <div className="mt-7 grid gap-x-10 gap-y-5 md:grid-cols-2">
          {Object.entries(stats.missingNutrition).map(([field, missing]) => (
            <BarRow key={field} label={nutritionLabels[field] ?? field} value={stats.total - missing} total={stats.total} />
          ))}
        </div>
      </section>

      <section className="mt-16 border-t border-stone-300">
        {[
          ["为什么不把 null 当 0？", "0 表示来源确认该营养成分为零；null 表示不知道。混用会让低热量和无咖啡因筛选产生错误结论。"],
          ["为什么热量记录很少？", "多数品牌把营养数据放在动态小程序或计算器中，公开网页只列产品目录。当前不依据产品名猜配方。"],
          ["可以当健康建议吗？", "不可以。门店制作、定制、批次和杯型都会带来变化，随机结果只用于帮你做选择。"],
        ].map(([title, body]) => (
          <article key={title} className="grid gap-3 border-b border-stone-300 py-7 md:grid-cols-[240px_1fr] md:gap-10">
            <h2 className="font-serif text-xl font-bold text-[#173f35]">{title}</h2>
            <p className="text-sm leading-7 text-stone-600">{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
