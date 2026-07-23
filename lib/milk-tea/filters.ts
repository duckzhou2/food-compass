import type {
  MilkTeaBrandId,
  MilkTeaDisplayCategory,
  MilkTeaProduct,
} from "@/types/milk-tea";
import {
  getPreferredVariant,
  hasSevereReviewConflict,
  isReliableVariant,
} from "@/lib/milk-tea/selection";

export type CalorieBand = "under100" | "100to199" | "200to299" | "over300";
export type ProductSort = "source" | "caloriesAsc" | "caloriesDesc" | "name";

export interface MilkTeaProductFilters {
  brandIds: MilkTeaBrandId[];
  categories: MilkTeaDisplayCategory[];
  query: string;
  calorieBands: CalorieBand[];
  sort: ProductSort;
}

export const defaultMilkTeaFilters: MilkTeaProductFilters = {
  brandIds: [],
  categories: [],
  query: "",
  calorieBands: [],
  sort: "source",
};

export function getDefaultCalories(product: MilkTeaProduct): number | null {
  const variant = getPreferredVariant(product);
  return isReliableVariant(variant) ? variant.calories : null;
}

export function isWheelEligibleProduct(product: MilkTeaProduct): boolean {
  return (
    product.excludeFromWheel !== true &&
    product.variants.some(isReliableVariant) &&
    !hasSevereReviewConflict(product)
  );
}

export function dedupeProducts(products: MilkTeaProduct[]): MilkTeaProduct[] {
  return [...new Map(products.map((product) => [product.productId, product])).values()];
}

function inCalorieBand(value: number | null, band: CalorieBand): boolean {
  if (value === null) return false;
  if (band === "under100") return value < 100;
  if (band === "100to199") return value >= 100 && value < 200;
  if (band === "200to299") return value >= 200 && value < 300;
  return value >= 300;
}

export function filterMilkTeaProducts(
  products: MilkTeaProduct[],
  filters: MilkTeaProductFilters,
): MilkTeaProduct[] {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  const filtered = dedupeProducts(products).filter((product) => {
    if (filters.brandIds.length > 0 && !filters.brandIds.includes(product.brandId)) return false;
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.displayCategory)
    ) return false;
    if (
      (filters.sort === "caloriesAsc" || filters.sort === "caloriesDesc") &&
      hasSevereReviewConflict(product)
    ) return false;
    if (
      filters.calorieBands.length > 0 &&
      !filters.calorieBands.some((band) => inCalorieBand(getDefaultCalories(product), band))
    ) return false;
    if (query) {
      const searchable = `${product.brandName} ${product.productName} ${product.category} ${product.displayCategory}`.toLocaleLowerCase("zh-CN");
      if (!searchable.includes(query)) return false;
    }
    return true;
  });

  return filtered.sort((left, right) => {
    if (filters.sort === "name") return left.productName.localeCompare(right.productName, "zh-CN");
    if (filters.sort === "source") return 0;
    const leftCalories = getDefaultCalories(left);
    const rightCalories = getDefaultCalories(right);
    if (leftCalories === null) return 1;
    if (rightCalories === null) return -1;
    return filters.sort === "caloriesAsc" ? leftCalories - rightCalories : rightCalories - leftCalories;
  });
}
