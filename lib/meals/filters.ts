import type { MealFilters, MealFood, MealHistoryEntry, PriceBand } from "@/types/meals";

const priceOrder: PriceBand[] = ["under15", "15_25", "25_40", "40_70", "70_plus"];
const timeOrder = ["fast", "normal", "slow"];

function intersects<T>(left: readonly T[], right: readonly T[]) {
  return left.length === 0 || left.some((item) => right.includes(item));
}

export function filterMealFoods(
  foods: readonly MealFood[],
  filters: MealFilters,
  favoriteIds: ReadonlySet<string> = new Set(),
  permanentlyExcludedIds: ReadonlySet<string> = new Set(),
): MealFood[] {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  const filtered = foods.filter((food) => {
    if (!food.enabled || permanentlyExcludedIds.has(food.id)) return false;
    if (filters.onlyFavorites && !favoriteIds.has(food.id)) return false;
    if (filters.onlyCustom && food.source !== "custom") return false;
    if (filters.excludeEntryTypes.includes(food.entryType)) return false;
    if (filters.categoryIds.length && !filters.categoryIds.includes(food.categoryId)) return false;
    if (!intersects(filters.priceBands, food.priceBands)) return false;
    if (!intersects(filters.flavorTags, food.flavorTags)) return false;
    if (!intersects(filters.timeTags, food.timeTags)) return false;
    if (!intersects(filters.fullnessTags, food.fullnessTags)) return false;
    if (!intersects(filters.sceneTags, food.sceneTags)) return false;
    if (query && ![food.name, ...food.aliases].some((text) => text.toLocaleLowerCase("zh-CN").includes(query))) return false;

    for (const tag of filters.excludeTags) {
      if (tag === "mala" && food.flavorTags.includes("mala")) return false;
      if (tag === "vegetarian_friendly" && !food.dietTags.includes("vegetarian_friendly")) return false;
      if (tag !== "mala" && tag !== "vegetarian_friendly" && food.excludeTags.includes(tag)) return false;
    }
    return true;
  });

  if (filters.sort === "name") return filtered.toSorted((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (filters.sort === "price") return filtered.toSorted((a, b) => Math.min(...a.priceBands.map((band) => priceOrder.indexOf(band))) - Math.min(...b.priceBands.map((band) => priceOrder.indexOf(band))));
  if (filters.sort === "time") return filtered.toSorted((a, b) => Math.min(...a.timeTags.map((tag) => timeOrder.indexOf(tag))) - Math.min(...b.timeTags.map((tag) => timeOrder.indexOf(tag))));
  if (filters.sort === "recent") return filtered.toSorted((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  return filtered;
}

export function applyRecentAvoidance(
  foods: readonly MealFood[],
  history: readonly MealHistoryEntry[],
  enabled: boolean,
): { foods: MealFood[]; relaxed: "none" | "oldest" | "all" } {
  if (!enabled || foods.length === 0) return { foods: [...foods], relaxed: "none" };
  const recent = history.slice(0, 3).map((entry) => entry.foodId);
  const recentSet = new Set(recent);
  const avoided = foods.filter((food) => !recentSet.has(food.id));
  if (avoided.length > 0) return { foods: avoided, relaxed: "none" };
  const oldest = recent.at(-1);
  const restoredOldest = foods.filter((food) => food.id === oldest || !recentSet.has(food.id));
  if (restoredOldest.length > 0) return { foods: restoredOldest, relaxed: "oldest" };
  return { foods: [...foods], relaxed: "all" };
}
