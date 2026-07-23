import { EmptyState } from "@/components/ui/experience-controls";
import { formatCalorieValue } from "@/lib/milk-tea/calories";
import { getDefaultCalories } from "@/lib/milk-tea/filters";
import type { MilkTeaProduct } from "@/types/milk-tea";

export function MilkTeaProductBrowser({
  products,
  selectedId,
  favoriteIds,
  visibleCount,
  onSelect,
  onLoadMore,
}: {
  products: MilkTeaProduct[];
  selectedId?: string;
  favoriteIds: string[];
  visibleCount: number;
  onSelect: (product: MilkTeaProduct) => void;
  onLoadMore: () => void;
}) {
  if (!products.length) {
    return <EmptyState title="没有符合条件的饮品" description="试试清空关键词、切换分类或放宽热量区间。" />;
  }

  return (
    <section className="mt-5 rounded-[2rem] border border-stone-200 bg-white/65 p-3 sm:p-4" aria-label="产品列表">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {products.slice(0, visibleCount).map((product) => {
          const isSelected = selectedId === product.productId;
          return (
            <button
              key={product.productId}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(product)}
              className={`min-w-0 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
                isSelected ? "border-[var(--jade)] bg-emerald-50 shadow-sm" : "border-stone-200 bg-white hover:border-stone-400"
              }`}
            >
              <span className="flex items-start justify-between gap-2 text-xs font-semibold text-[var(--jade)]">
                <span>{product.brandName} · {product.displayCategory}</span>
                {favoriteIds.includes(product.productId) && <span aria-label="已收藏" title="已收藏">★</span>}
              </span>
              <span className="mt-2 block break-words font-serif text-lg font-bold leading-6 text-stone-900">{product.productName}</span>
              <span className="mt-3 block font-mono text-sm font-semibold text-[var(--coral)]">{formatCalorieValue(getDefaultCalories(product))}</span>
              <span className={`mt-1 block text-xs ${product.dataStatus === "needs_review" ? "font-semibold text-amber-700" : "text-stone-400"}`}>
                {product.dataStatus === "detailed"
                  ? "可选精细规格"
                  : product.dataStatus === "missing"
                    ? "暂无可靠参考热量"
                    : product.dataStatus === "needs_review"
                      ? "待核验，不参与热量筛选和默认转盘"
                      : "单一参考规格"}
              </span>
            </button>
          );
        })}
      </div>
      {visibleCount < products.length && (
        <button type="button" onClick={onLoadMore} className="mt-4 min-h-11 w-full rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">
          加载更多（还剩 {products.length - visibleCount} 款）
        </button>
      )}
    </section>
  );
}
