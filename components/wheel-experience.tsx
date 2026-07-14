"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { filterProducts } from "@/lib/filters/filter-products";
import { pickRandom } from "@/lib/random/pick-random";
import type { MilkTeaProduct, ProductFilters } from "@/types/product";
import { emptyFilters } from "@/types/product";
import { ProductResultCard } from "@/components/product-result-card";

const palette = ["#173f35", "#e8a54b", "#c96348", "#8eb7a7", "#945d63", "#d9c88c", "#49737a", "#b86d74"];

function pointOnCircle(angle: number, radius = 49) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
}

function sectorPath(index: number, count: number): string {
  if (count === 1) return "M 50,1 A 49,49 0 1,1 49.999,1 Z";
  const angle = 360 / count;
  const start = pointOnCircle(index * angle);
  const end = pointOnCircle((index + 1) * angle);
  const largeArc = angle > 180 ? 1 : 0;
  return `M 50,50 L ${start.x},${start.y} A 49,49 0 ${largeArc},1 ${end.x},${end.y} Z`;
}

function ToggleGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-stone-800">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label key={option} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${checked ? "border-[#173f35] bg-[#173f35] text-white" : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"}`}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(option)} />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function toggleList(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function WheelExperience({ products }: { products: MilkTeaProduct[] }) {
  const brands = useMemo(() => [...new Set(products.map((item) => item.brand_name))].sort((a, b) => a.localeCompare(b, "zh-CN")), [products]);
  const categories = useMemo(() => [...new Set(products.map((item) => item.normalized_category))].sort((a, b) => a.localeCompare(b, "zh-CN")), [products]);
  const auditStatuses = useMemo(() => [...new Set(products.map((item) => item.audit_status))].sort(), [products]);
  const availabilityStatuses = useMemo(() => [...new Set(products.map((item) => item.availability_status))].sort(), [products]);
  const [filters, setFilters] = useState<ProductFilters>({ ...emptyFilters });
  const [selected, setSelected] = useState<MilkTeaProduct | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidates = useMemo(() => filterProducts(products, filters), [products, filters]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setSelected(null);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const spin = () => {
    if (isSpinning) return;
    const pick = pickRandom(candidates);
    if (!pick) return;
    const segmentAngle = 360 / candidates.length;
    const targetModulo = (360 - (pick.index + 0.5) * segmentAngle + 360) % 360;
    const currentModulo = ((rotation % 360) + 360) % 360;
    const delta = (targetModulo - currentModulo + 360) % 360;
    const duration = reducedMotion ? 80 : 2400;

    setSelected(null);
    setIsSpinning(true);
    setRotation((current) => current + (reducedMotion ? 0 : 5 * 360) + delta);
    timeoutRef.current = setTimeout(() => {
      setSelected(pick.item);
      setIsSpinning(false);
    }, duration);
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[1.75rem] bg-[#f0ebdf] p-4 sm:p-5 xl:sticky xl:top-24">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-[#176b55]">候选条件</p>
            <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">想喝什么？</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className="min-h-11 text-sm font-semibold text-[#176b55] xl:hidden"
            >
              {filtersOpen ? "收起" : "展开"}
            </button>
            <button
              type="button"
              disabled={isSpinning}
              onClick={() => {
                setFilters({ ...emptyFilters });
                setSelected(null);
              }}
              className="min-h-11 text-xs font-medium text-stone-500 underline underline-offset-4 hover:text-stone-900 disabled:opacity-50"
            >
              重置
            </button>
          </div>
        </div>

        <fieldset disabled={isSpinning} className={`${filtersOpen ? "block" : "hidden"} mt-6 space-y-6 disabled:opacity-60 xl:block`}>
          <div>
            <label htmlFor="product-search" className="text-sm font-semibold text-stone-800">关键词</label>
            <input
              id="product-search"
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="产品、品牌或标签"
              className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fbfaf6] px-3 py-2.5 text-sm outline-none transition focus:border-[#176b55] focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1" aria-label="候选池模式">
            <button type="button" onClick={() => updateFilter("onlyWithCalories", true)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${filters.onlyWithCalories ? "bg-white text-[#173f35] shadow-sm" : "text-stone-500"}`}>有热量数据</button>
            <button type="button" onClick={() => updateFilter("onlyWithCalories", false)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${!filters.onlyWithCalories ? "bg-white text-[#173f35] shadow-sm" : "text-stone-500"}`}>全部目录</button>
          </div>

          <ToggleGroup legend="品牌（可多选）" options={brands} selected={filters.brands} onToggle={(value) => updateFilter("brands", toggleList(filters.brands, value))} />
          <ToggleGroup legend="品类（可多选）" options={categories} selected={filters.categories} onToggle={(value) => updateFilter("categories", toggleList(filters.categories, value))} />

          <div>
            <span className="text-sm font-semibold text-stone-800">热量区间</span>
            <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input aria-label="最低热量" inputMode="numeric" type="number" min="0" value={filters.calorieMin ?? ""} onChange={(event) => updateFilter("calorieMin", event.target.value === "" ? null : Number(event.target.value))} placeholder="最低" className="min-w-0 rounded-xl border border-stone-200 px-3 py-2 text-sm" />
              <span className="text-stone-400">—</span>
              <input aria-label="最高热量" inputMode="numeric" type="number" min="0" value={filters.calorieMax ?? ""} onChange={(event) => updateFilter("calorieMax", event.target.value === "" ? null : Number(event.target.value))} placeholder="最高" className="min-w-0 rounded-xl border border-stone-200 px-3 py-2 text-sm" />
            </div>
            <p className="mt-2 text-xs leading-5 text-stone-400">设置区间后，缺少热量的数据会自动排除。</p>
          </div>

          <details>
            <summary className="cursor-pointer text-sm font-semibold text-stone-800">更多核验条件</summary>
            <div className="mt-4 space-y-5">
              <ToggleGroup legend="审计状态" options={auditStatuses} selected={filters.auditStatuses} onToggle={(value) => updateFilter("auditStatuses", toggleList(filters.auditStatuses, value))} />
              <ToggleGroup legend="在售状态" options={availabilityStatuses} selected={filters.availabilityStatuses} onToggle={(value) => updateFilter("availabilityStatuses", toggleList(filters.availabilityStatuses, value))} />
            </div>
          </details>
        </fieldset>

        <div className={`${filtersOpen ? "block" : "hidden"} mt-6 border-t border-amber-900/10 pt-4 text-xs leading-5 text-amber-900 xl:block`}>
          价格筛选待数据补充。咖啡因、糖和茶多酚只有非空记录才会展示数值。
        </div>
      </aside>

      <main className="min-w-0">
        <section className="rounded-[2.5rem] bg-[#efe9dc] px-3 py-8 text-center sm:px-8 sm:py-12">
          <p className="text-sm text-stone-500" aria-live="polite">
            当前候选池 <strong className="font-mono text-lg text-[#173f35]">{candidates.length}</strong> 杯 · 完整候选池等概率抽取
          </p>

          {candidates.length > 0 ? (
            <div className="relative mx-auto mt-7 aspect-square w-full max-w-[540px]">
              <div className="absolute left-1/2 top-[-12px] z-20 h-0 w-0 -translate-x-1/2 border-x-[16px] border-t-[30px] border-x-transparent border-t-[#c96348] drop-shadow" aria-hidden="true" />
              <svg
                viewBox="0 0 100 100"
                role="img"
                aria-label={`包含 ${candidates.length} 个等概率候选项的奶茶转盘`}
                className="size-full overflow-visible rounded-full border-[10px] border-white bg-white shadow-[0_24px_55px_rgba(70,60,40,0.18)]"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transitionDuration: reducedMotion ? "80ms" : "2400ms",
                  transitionTimingFunction: "cubic-bezier(.12,.66,.18,1)",
                }}
              >
                {candidates.map((candidate, index) => (
                  <path key={candidate.record_id} d={sectorPath(index, candidates.length)} fill={palette[index % palette.length]} stroke="rgba(255,255,255,.45)" strokeWidth={candidates.length > 30 ? 0.12 : 0.35} />
                ))}
                <circle cx="50" cy="50" r="12" fill="#fffaf0" stroke="#173f35" strokeWidth="1.2" />
                <circle cx="50" cy="50" r="5" fill="#173f35" />
              </svg>
              <button
                type="button"
                onClick={spin}
                disabled={isSpinning}
                className="absolute left-1/2 top-1/2 z-10 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#173f35] font-serif text-xl font-bold text-white shadow-xl transition hover:scale-[1.03] hover:bg-[#0e4d3d] disabled:cursor-wait disabled:opacity-80 sm:size-28"
              >
                {isSpinning ? "转动中" : "转一下"}
              </button>
            </div>
          ) : (
            <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16">
              <p className="font-serif text-2xl font-bold text-stone-800">没有符合条件的饮品</p>
              <p className="mt-3 text-sm leading-6 text-stone-500">试试清空关键词、放宽热量区间，或切换到“全部目录”。</p>
            </div>
          )}
        </section>

        <div className="mt-8" aria-live="polite">
          {selected ? (
            <ProductResultCard product={selected} />
          ) : (
            <div className="rounded-3xl border border-dashed border-stone-300 px-6 py-10 text-center text-sm text-stone-500">
              {isSpinning ? "罗盘正在替你做决定……" : "转动后，这里会展示完整结果、数据来源和核验状态。"}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
