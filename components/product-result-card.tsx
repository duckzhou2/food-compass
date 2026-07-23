"use client";

import { useMemo, useState } from "react";
import {
  calculateTotalCalories,
  formatCalorieRange,
  formatCalorieValue,
  selectToppingVariant,
  sumToppingCalories,
} from "@/lib/milk-tea/calories";
import {
  findSelectedVariant,
  getValidOptions,
  resolveSelectionFromVariantId,
  updateSelection,
} from "@/lib/milk-tea/selection";
import {
  milkTeaSelectionFields,
  type MilkTeaBrandData,
  type MilkTeaConfirmedSelection,
  type MilkTeaProduct,
  type MilkTeaSelectionField,
} from "@/types/milk-tea";

export interface MilkTeaResultActions {
  favorite: boolean;
  confirmed: boolean;
  status: string;
  onConfirm: (selection: MilkTeaConfirmedSelection) => void;
  onAgain: () => void;
  onSessionExclude: () => void;
  onSameCategory: () => void;
  onDifferentBrand: () => void;
  onToggleFavorite: () => void;
  onPermanentExclude: () => void;
}

const fieldLabels: Record<MilkTeaSelectionField, string> = {
  size: "杯型",
  drinkingMethod: "饮用方式",
  sugar: "甜度",
  version: "版本",
  base: "基底",
};

const statusLabels = {
  detailed: "精细规格参考",
  specified_reference: "明确规格参考",
  unspecified_reference: "规格未说明的参考值",
  missing: "热量待补充",
  needs_review: "待核验",
} as const;

const emptyInitialToppingIds: string[] = [];

export function ProductResultCard({
  product,
  brand,
  initialVariantId,
  initialToppingIds = emptyInitialToppingIds,
  actions,
}: {
  product: MilkTeaProduct;
  brand: MilkTeaBrandData;
  initialVariantId?: string | null;
  initialToppingIds?: string[];
  actions?: MilkTeaResultActions;
}) {
  const [selection, setSelection] = useState(() =>
    resolveSelectionFromVariantId(product, initialVariantId),
  );
  const [selectedToppingIds, setSelectedToppingIds] = useState<string[]>(() =>
    initialToppingIds.filter((id) => brand.toppings.some((topping) => topping.toppingId === id)),
  );

  const selectedVariant = findSelectedVariant(product, selection);
  const selectedToppingVariants = useMemo(
    () =>
      brand.toppings
        .filter((topping) => selectedToppingIds.includes(topping.toppingId))
        .map((topping) => selectToppingVariant(topping, selection.size))
        .filter((variant) => variant !== null),
    [brand.toppings, selectedToppingIds, selection.size],
  );
  const toppingCalories = sumToppingCalories(selectedToppingVariants);
  const totalCalories = calculateTotalCalories(selectedVariant.calories, selectedToppingVariants);

  const toggleTopping = (toppingId: string) => {
    setSelectedToppingIds((current) =>
      current.includes(toppingId)
        ? current.filter((id) => id !== toppingId)
        : [...current, toppingId],
    );
  };

  return (
    <article className="result-reveal overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(50,45,35,0.13)]">
      <div className="relative overflow-hidden bg-[#173f35] px-5 pb-7 pt-6 text-white sm:px-9 sm:pb-9 sm:pt-8">
        <div className="absolute -right-16 -top-24 size-64 rounded-full border-[40px] border-white/[0.04]" />
        <div className="relative min-w-0">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#f6cf72]">当前选择</p>
          <p className="mt-5 text-sm tracking-[0.16em] text-emerald-100">{product.brandName}</p>
          <h2 className="mt-1 break-words font-serif text-3xl font-bold leading-tight sm:text-5xl">
            {product.productName}
          </h2>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-white/15 pt-5">
            <p className="font-mono text-2xl font-bold sm:text-3xl">
              {formatCalorieValue(selectedVariant.calories)}
            </p>
            <p className="text-sm text-emerald-100/80">{product.displayCategory} · {statusLabels[selectedVariant.dataStatus]}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 px-5 py-7 sm:px-9 sm:py-8">
        <section aria-labelledby="specification-heading">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-[#176b55]">规格联动</p>
              <h3 id="specification-heading" className="mt-1 font-serif text-2xl font-bold text-stone-900">选择已有热量记录的规格</h3>
            </div>
            <span className="text-xs text-stone-400">共 {product.variants.length} 条规格记录</span>
          </div>

          <div className="mt-6 space-y-5">
            {milkTeaSelectionFields.map((field) => {
              const options = getValidOptions(product, selection, field);
              if (options.length === 0) return null;
              return (
                <fieldset key={field}>
                  <legend className="text-sm font-semibold text-stone-700">{fieldLabels[field]}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {options.map((option) => (
                      <button
                        key={option}
                        type="button"
                        aria-pressed={selection[field] === option}
                        onClick={() => setSelection((current) => updateSelection(product, current, field, option))}
                        className={`min-h-11 max-w-full break-words rounded-xl border px-3 py-2 text-sm transition ${
                          selection[field] === option
                            ? "border-[#173f35] bg-[#173f35] text-white"
                            : "border-stone-200 bg-[#fbfaf6] text-stone-700 hover:border-stone-400"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </fieldset>
              );
            })}
          </div>
          {selectedVariant.dataStatus === "needs_review" && (
            <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              该规格热量数据存在冲突，仅供参考。
            </p>
          )}
        </section>

        <section className="border-t border-stone-200 pt-7" aria-labelledby="toppings-heading">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#176b55]">额外小料</p>
            <h3 id="toppings-heading" className="mt-1 font-serif text-2xl font-bold text-stone-900">额外添加小料</h3>
            <p className="mt-2 text-sm leading-6 text-stone-500">以下为该品牌常见小料，是否支持添加以门店实际菜单为准。</p>
          </div>
          {brand.toppings.length > 0 ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {brand.toppings.map((topping) => {
                const toppingVariant = selectToppingVariant(topping, selection.size);
                const checked = selectedToppingIds.includes(topping.toppingId);
                return (
                  <label
                    key={topping.toppingId}
                    className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-3 transition ${
                      checked ? "border-[#176b55] bg-emerald-50" : "border-stone-200 bg-[#fbfaf6]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTopping(topping.toppingId)}
                      className="mt-1 size-4 accent-[#176b55]"
                    />
                    <span className="min-w-0">
                      <span className="block break-words text-sm font-semibold text-stone-800">{topping.name}</span>
                      <span className="mt-1 block break-words text-xs leading-5 text-stone-500">
                        {toppingVariant?.unit ?? "规格未说明"} · {formatCalorieRange(toppingVariant?.calories ?? null)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500">原表未提供可独立累计的小料热量。</p>
          )}
          {brand.toppings.length > 0 && (
            <p className="mt-3 text-xs leading-5 text-stone-500">小料热量按一份计算，实际份量可能因门店而异。</p>
          )}
        </section>

        <section className="grid gap-5 rounded-[1.5rem] bg-[#f5f1e8] p-5 sm:grid-cols-[1fr_auto] sm:items-end sm:p-6" aria-labelledby="calorie-result-heading">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#176b55]">热量计算</p>
            <h3 id="calorie-result-heading" className="mt-1 font-serif text-2xl font-bold text-stone-900">本杯参考热量</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-3">
                <dt className="text-stone-500">饮品基础热量</dt>
                <dd className="font-mono font-semibold text-stone-800">{formatCalorieValue(selectedVariant.calories)}</dd>
              </div>
              {selectedToppingVariants.map((variant) => {
                const topping = brand.toppings.find((item) =>
                  item.variants.some((itemVariant) => itemVariant.toppingVariantId === variant.toppingVariantId),
                );
                return (
                  <div key={variant.toppingVariantId} className="flex flex-wrap justify-between gap-3">
                    <dt className="break-words text-stone-500">{topping?.name}（{variant.unit ?? "规格未说明"}）</dt>
                    <dd className="font-mono font-semibold text-stone-800">+ {formatCalorieRange(variant.calories)}</dd>
                  </div>
                );
              })}
              {selectedToppingVariants.length > 0 && (
                <div className="flex flex-wrap justify-between gap-3 border-t border-stone-300 pt-2">
                  <dt className="text-stone-500">额外小料热量</dt>
                  <dd className="font-mono font-semibold text-stone-800">{formatCalorieRange(toppingCalories)}</dd>
                </div>
              )}
            </dl>
          </div>
          <p className="break-words font-mono text-3xl font-bold text-[#c96348] sm:text-right sm:text-4xl">
            {formatCalorieRange(totalCalories)}
          </p>
          <p className="text-xs leading-5 text-stone-500 sm:col-span-2">
            热量仅供参考，可能因杯型、配方、原料及门店制作方式不同而变化。
          </p>
        </section>

        {actions && (
          <section className="border-t border-stone-200 pt-7" aria-label="饮品决策操作">
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  actions.onConfirm({
                    variantId: selectedVariant.variantId,
                    toppingIds: selectedToppingIds,
                  })
                }
                className="min-h-12 rounded-xl bg-[#173f35] px-4 font-semibold text-white"
              >
                {actions.confirmed ? "已记录这杯" : "就喝这个"}
              </button>
              <button type="button" onClick={actions.onAgain} className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 font-semibold text-stone-700">再转一次</button>
              <button type="button" onClick={actions.onSessionExclude} className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 font-semibold text-stone-700">本轮排除</button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <button type="button" onClick={actions.onSameCategory} className="min-h-11 rounded-xl bg-[#f5f1e8] px-3 text-sm font-semibold text-stone-700">换个同类</button>
              <button type="button" onClick={actions.onDifferentBrand} className="min-h-11 rounded-xl bg-[#f5f1e8] px-3 text-sm font-semibold text-stone-700">换个品牌</button>
              <button type="button" aria-pressed={actions.favorite} onClick={actions.onToggleFavorite} className="min-h-11 rounded-xl bg-[#f5f1e8] px-3 text-sm font-semibold text-stone-700">{actions.favorite ? "取消收藏" : "收藏"}</button>
              <button type="button" onClick={actions.onPermanentExclude} className="min-h-11 rounded-xl bg-red-50 px-3 text-sm font-semibold text-red-700">永久排除</button>
            </div>
            <p className="mt-3 min-h-5 text-sm text-[#176b55]" role="status">{actions.status}</p>
          </section>
        )}
      </div>
    </article>
  );
}
