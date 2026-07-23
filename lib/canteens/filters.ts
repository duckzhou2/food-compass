import { canteenById, canteenFloorById, canteenWindowById } from "@/lib/data/canteens";
import type { CanteenDish, CanteenFilters, DishSku, EvidenceStatus } from "@/types/canteens";

export const defaultCanteenFilters: CanteenFilters = {
  query: "", canteenIds: [], floorIds: [], windowIds: [], cuisines: [], dishTypes: [], categories: [],
  price: { min: null, max: null }, energy: { min: null, max: null }, protein: { min: null, max: null },
  spicy: "all", vegetarian: "all", highSugar: "all", mealPeriods: [], statuses: [], windowKnown: "all", sourceScope: "all",
};

function inRange(value: number, range: { min: number | null; max: number | null }) {
  return (range.min === null || value >= range.min) && (range.max === null || value <= range.max);
}

function skuMatchesBoolean(skus: DishSku[], key: "isPepperHot" | "isVegetarian" | "isHighSugar", filter: "all" | "yes" | "no") {
  if (filter === "all") return true;
  return skus.length > 0 && skus.some((sku) => sku[key] === (filter === "yes"));
}

export function filterCanteenDishes(dishes: readonly CanteenDish[], filters: CanteenFilters, excluded = new Set<string>()) {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  return dishes.filter((dish) => {
    if (excluded.has(dish.id) || dish.isTemporary) return false;
    if (query && !dish.searchText.includes(query)) return false;
    if (filters.canteenIds.length && !filters.canteenIds.includes(dish.canteenId)) return false;
    if (filters.floorIds.length && !filters.floorIds.includes(dish.floorId)) return false;
    if (filters.windowIds.length && !dish.windowIds.some((id) => filters.windowIds.includes(id))) return false;
    if (filters.cuisines.length && !dish.cuisines.some((item) => filters.cuisines.includes(item))) return false;
    if (filters.dishTypes.length && !dish.dishTypes.some((item) => filters.dishTypes.includes(item))) return false;
    if (filters.categories.length && !dish.categories.some((item) => filters.categories.includes(item))) return false;
    if (filters.mealPeriods.length && !dish.mealPeriods.some((item) => filters.mealPeriods.includes(item))) return false;
    if (filters.statuses.length && !dish.evidence.some((item) => filters.statuses.includes(item.status))) return false;
    if (filters.windowKnown === "yes" && dish.windowIds.length === 0) return false;
    if (filters.windowKnown === "no" && dish.windowIds.length > 0) return false;
    if (filters.sourceScope === "official" && !dish.evidence.some((item) => item.status === "current_official" || item.status === "official_historical")) return false;
    if (filters.sourceScope === "historical" && !dish.evidence.some((item) => item.status === "github_historical")) return false;
    if ((filters.price.min !== null || filters.price.max !== null) && !dish.skus.some((sku) => inRange(sku.priceCny, filters.price))) return false;
    if ((filters.energy.min !== null || filters.energy.max !== null) && !dish.skus.some((sku) => inRange(sku.energyKcal, filters.energy))) return false;
    if ((filters.protein.min !== null || filters.protein.max !== null) && !dish.skus.some((sku) => inRange(sku.proteinG, filters.protein))) return false;
    if (!skuMatchesBoolean(dish.skus, "isPepperHot", filters.spicy) || !skuMatchesBoolean(dish.skus, "isVegetarian", filters.vegetarian) || !skuMatchesBoolean(dish.skus, "isHighSugar", filters.highSugar)) return false;
    return true;
  });
}

export function dishStatusLabel(status: EvidenceStatus) {
  return ({ current_official: "当前官方", official_historical: "官方历史", github_historical: "GitHub 历史", temporary: "临时活动", inferred: "推断", unverified: "待核验" })[status];
}

export function summarizeDish(dish: CanteenDish) {
  const prices = dish.skus.map((sku) => sku.priceCny);
  const energy = dish.skus.map((sku) => sku.energyKcal);
  const protein = dish.skus.map((sku) => sku.proteinG);
  return {
    canteen: canteenById.get(dish.canteenId), floor: canteenFloorById.get(dish.floorId),
    windows: dish.windowIds.map((id) => canteenWindowById.get(id)).filter(Boolean),
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
    energy: energy.length ? { min: Math.min(...energy), max: Math.max(...energy) } : null,
    protein: protein.length ? { min: Math.min(...protein), max: Math.max(...protein) } : null,
  };
}
