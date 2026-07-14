import {
  auditStatusLabels,
  availabilityLabels,
  displayValue,
  formatCalories,
  sourceOriginLabels,
} from "@/lib/formatters";
import type { MilkTeaProduct } from "@/types/product";

const primarySpecs: Array<{ key: keyof MilkTeaProduct; label: string; unit?: string }> = [
  { key: "cup_size", label: "杯型" },
  { key: "volume_ml", label: "容量", unit: " ml" },
  { key: "sweetness", label: "甜度" },
  { key: "ice_level", label: "冰量" },
];

const nutritionFields: Array<{ key: keyof MilkTeaProduct; label: string; unit: string }> = [
  { key: "protein_g", label: "蛋白质", unit: " g" },
  { key: "fat_g", label: "脂肪", unit: " g" },
  { key: "carbohydrate_g", label: "碳水", unit: " g" },
  { key: "sugar_g", label: "糖", unit: " g" },
  { key: "caffeine_mg", label: "咖啡因", unit: " mg" },
  { key: "tea_polyphenols_mg", label: "茶多酚", unit: " mg" },
];

export function ProductResultCard({ product }: { product: MilkTeaProduct }) {
  return (
    <article className="result-reveal overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(50,45,35,0.13)]">
      <div className="relative overflow-hidden bg-[#173f35] px-6 pb-8 pt-6 text-white sm:px-9 sm:pb-10 sm:pt-8">
        <div className="absolute -right-16 -top-24 size-64 rounded-full border-[40px] border-white/[0.04]" />
        <div className="relative">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#f6cf72]">罗盘选中了</p>
          <p className="mt-7 text-sm tracking-[0.16em] text-emerald-100">{product.brand_name}</p>
          <h2 className="mt-1 max-w-2xl font-serif text-4xl font-bold leading-tight sm:text-5xl">
            {product.product_name}
          </h2>
          <div className="mt-7 flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-5">
            <p className="font-mono text-2xl font-bold text-white sm:text-3xl">{formatCalories(product)}</p>
            <p className="text-sm text-emerald-100/80">{product.normalized_category}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-7 sm:px-9 sm:py-8">
        <dl className="grid grid-cols-2 gap-x-7 gap-y-5 border-b border-stone-200 pb-7 sm:grid-cols-4">
          {primarySpecs.map(({ key, label, unit }) => (
            <div key={key}>
              <dt className="text-xs tracking-wider text-stone-400">{label}</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-800">
                {displayValue(product[key] as string | number | null, unit)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-stone-500">
          {product.tags.map((tag) => <span key={tag}>#{tag}</span>)}
        </div>

        <details className="group mt-7 border-t border-stone-200 pt-1">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between py-3 text-sm font-semibold text-[#176b55] marker:content-none">
            查看完整营养、来源与核验说明
            <span className="text-lg transition group-open:rotate-45" aria-hidden="true">＋</span>
          </summary>

          <div className="space-y-8 pb-2 pt-5">
            <section aria-labelledby="customization-heading">
              <h3 id="customization-heading" className="text-xs font-semibold tracking-[0.16em] text-stone-400">其他规格</h3>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-stone-400">奶底</dt>
                  <dd className="mt-1 text-sm text-stone-800">{displayValue(product.milk_base)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400">默认小料</dt>
                  <dd className="mt-1 text-sm text-stone-800">{displayValue(product.default_toppings)}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="nutrition-heading">
              <div className="flex items-end justify-between gap-4">
                <h3 id="nutrition-heading" className="text-xs font-semibold tracking-[0.16em] text-stone-400">营养信息</h3>
                <span className="text-xs text-stone-400">整杯口径</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                {nutritionFields.map(({ key, label, unit }) => (
                  <div key={key} className="border-b border-stone-100 pb-3">
                    <dt className="text-xs text-stone-400">{label}</dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-stone-800">
                      {displayValue(product[key] as number | null, unit)}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs leading-5 text-stone-500">
                “待核验”表示来源没有披露，并不等于 0。{product.is_estimated ? "本条包含明确标注的估算值。" : "本条未进行配方估算。"}
              </p>
            </section>

            <section className="bg-[#f5f1e8] px-5 py-5" aria-labelledby="source-heading">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#176b55]">
                {sourceOriginLabels[product.source_origin]} · {auditStatusLabels[product.audit_status] ?? product.audit_status} · 可信度 {product.confidence_grade}
              </p>
              <h3 id="source-heading" className="mt-3 font-semibold text-stone-900">{product.source_title}</h3>
              <p className="mt-1 text-sm text-stone-500">
                {product.source_publisher ?? "发布者待核验"} · 访问于 {product.source_accessed_at}
              </p>
              <p className="mt-4 text-sm leading-6 text-stone-700">{product.audit_reason}</p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4">
                <span className="text-xs text-stone-500">
                  {availabilityLabels[product.availability_status] ?? product.availability_status}
                </span>
                <a href={product.source_url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#176b55] underline decoration-emerald-300 underline-offset-4 hover:text-[#0e4d3d]">
                  查看原始来源 ↗
                </a>
              </div>
            </section>
          </div>
        </details>
      </div>
    </article>
  );
}
