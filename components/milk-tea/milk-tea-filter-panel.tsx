import { ChoiceChip, FilterGroup, FilterShell } from "@/components/ui/experience-controls";
import { milkTeaBrands } from "@/lib/data/milk-tea";
import { milkTeaDisplayCategories } from "@/lib/milk-tea/categories";
import type { MilkTeaBrandId, MilkTeaDisplayCategory } from "@/types/milk-tea";
import type {
  CalorieBand,
  MilkTeaProductFilters,
  ProductSort,
} from "@/lib/milk-tea/filters";

const calorieBands: Array<{ value: CalorieBand; label: string }> = [
  { value: "under100", label: "100 kcal 以下" },
  { value: "100to199", label: "100–199 kcal" },
  { value: "200to299", label: "200–299 kcal" },
  { value: "over300", label: "300 kcal 及以上" },
];

export function MilkTeaFilterPanel({
  open,
  onToggleOpen,
  filters,
  onUpdate,
  onToggleBrand,
  onToggleCategory,
  onToggleCalorieBand,
  onlyFavorites,
  onOnlyFavoritesChange,
  avoidRecent,
  onAvoidRecentChange,
  exclusionCount,
  onRestoreExclusions,
  disabled,
  onReset,
}: {
  open: boolean;
  onToggleOpen: () => void;
  filters: MilkTeaProductFilters;
  onUpdate: <K extends keyof MilkTeaProductFilters>(key: K, value: MilkTeaProductFilters[K]) => void;
  onToggleBrand: (brandId: MilkTeaBrandId) => void;
  onToggleCategory: (category: MilkTeaDisplayCategory) => void;
  onToggleCalorieBand: (band: CalorieBand) => void;
  onlyFavorites: boolean;
  onOnlyFavoritesChange: (value: boolean) => void;
  avoidRecent: boolean;
  onAvoidRecentChange: (value: boolean) => void;
  exclusionCount: number;
  onRestoreExclusions: () => void;
  disabled: boolean;
  onReset: () => void;
}) {
  return (
    <FilterShell open={open} onToggle={onToggleOpen}>
      <fieldset disabled={disabled} className="space-y-6 disabled:opacity-60">
        <label className="block">
          <span className="text-sm font-semibold text-stone-800">产品名称搜索</span>
          <input
            aria-label="产品名称搜索"
            value={filters.query}
            onChange={(event) => onUpdate("query", event.target.value)}
            placeholder="输入饮品名称"
            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-[var(--color-paper-bright)] px-3 text-sm outline-none focus:border-[var(--jade)]"
          />
        </label>

        <FilterGroup title="品牌">
          <div className="flex flex-wrap gap-2">
            <ChoiceChip active={filters.brandIds.length === 0} onClick={() => onUpdate("brandIds", [])}>全部品牌</ChoiceChip>
            {milkTeaBrands.map((brand) => (
              <ChoiceChip key={brand.brandId} active={filters.brandIds.includes(brand.brandId)} onClick={() => onToggleBrand(brand.brandId)}>
                {brand.brandName}
              </ChoiceChip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="分类">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceChip active={filters.categories.length === 0} onClick={() => onUpdate("categories", [])}>全部分类</ChoiceChip>
            {milkTeaDisplayCategories.map((category) => (
              <ChoiceChip key={category} active={filters.categories.includes(category)} onClick={() => onToggleCategory(category)}>
                {category}
              </ChoiceChip>
            ))}
          </div>
        </FilterGroup>

        <FilterGroup title="默认规格热量">
          <div className="grid grid-cols-2 gap-2">
            <ChoiceChip active={filters.calorieBands.length === 0} onClick={() => onUpdate("calorieBands", [])}>全部热量</ChoiceChip>
            {calorieBands.map((band) => (
              <ChoiceChip key={band.value} active={filters.calorieBands.includes(band.value)} onClick={() => onToggleCalorieBand(band.value)}>
                {band.label}
              </ChoiceChip>
            ))}
          </div>
        </FilterGroup>

        <label className="block">
          <span className="text-sm font-semibold text-stone-800">排序</span>
          <select
            value={filters.sort}
            onChange={(event) => onUpdate("sort", event.target.value as ProductSort)}
            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700"
          >
            <option value="source">原表顺序</option>
            <option value="caloriesAsc">默认热量从低到高</option>
            <option value="caloriesDesc">默认热量从高到低</option>
            <option value="name">产品名称</option>
          </select>
        </label>

        <details className="rounded-2xl border border-stone-200 bg-white p-4">
          <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-stone-800">更多条件</summary>
          <div className="mt-3 space-y-3">
            <label className="flex min-h-11 items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={onlyFavorites} onChange={(event) => onOnlyFavoritesChange(event.target.checked)} className="size-4 accent-[var(--jade)]" />
              只看收藏
            </label>
            <label className="flex min-h-11 items-center gap-3 text-sm text-stone-700">
              <input type="checkbox" checked={avoidRecent} onChange={(event) => onAvoidRecentChange(event.target.checked)} className="size-4 accent-[var(--jade)]" />
              避免最近三次重复
            </label>
            <button type="button" disabled={exclusionCount === 0} onClick={onRestoreExclusions} className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm disabled:opacity-40">
              恢复本轮排除（{exclusionCount}）
            </button>
          </div>
        </details>

        <button type="button" onClick={onReset} className="min-h-11 w-full rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">
          清空筛选
        </button>
      </fieldset>
    </FilterShell>
  );
}
