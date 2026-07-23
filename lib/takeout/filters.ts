import type { TakeoutFilters, TakeoutMerchant } from "@/types/takeout";

export const defaultTakeoutFilters: TakeoutFilters = {
  query: "",
  categoryIds: [],
  distanceBandIds: [],
  areaIds: [],
  evidenceLevels: ["A", "B"],
  onlyFavorites: false,
  excludeEstimatedDistance: false,
  sort: "source",
};

export function filterTakeoutMerchants(
  merchants: TakeoutMerchant[],
  filters: TakeoutFilters,
  favorites = new Set<string>(),
  permanentExclusions = new Set<string>(),
) {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");
  return merchants
    .filter((merchant) => merchant.enabled && !permanentExclusions.has(merchant.id))
    .filter((merchant) => !query || merchant.searchText.toLocaleLowerCase("zh-CN").includes(query) || merchant.name.toLocaleLowerCase("zh-CN").includes(query))
    .filter((merchant) => !filters.categoryIds.length || filters.categoryIds.includes(merchant.categoryId))
    .filter((merchant) => !filters.distanceBandIds.length || filters.distanceBandIds.includes(merchant.location.distanceBandId))
    .filter((merchant) => !filters.areaIds.length || filters.areaIds.includes(merchant.areaId))
    .filter((merchant) => filters.evidenceLevels.includes(merchant.evidence.level))
    .filter((merchant) => !filters.onlyFavorites || favorites.has(merchant.id))
    .filter((merchant) => !filters.excludeEstimatedDistance || !merchant.location.isEstimated)
    .toSorted((a, b) => {
      if (filters.sort === "distance") return (a.location.distanceFromPkuSouthGateKm ?? Number.POSITIVE_INFINITY) - (b.location.distanceFromPkuSouthGateKm ?? Number.POSITIVE_INFINITY);
      if (filters.sort === "name") return a.name.localeCompare(b.name, "zh-CN");
      if (filters.sort === "category") return a.categoryId.localeCompare(b.categoryId) || a.name.localeCompare(b.name, "zh-CN");
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    });
}

export function applyTakeoutRecentAvoidance(
  merchants: TakeoutMerchant[],
  history: Array<{ merchantId: string }>,
  enabled: boolean,
) {
  if (!enabled || !history.length) return { merchants, relaxed: false };
  const recent = history.slice(0, 3).map((entry) => entry.merchantId);
  for (let excludedCount = recent.length; excludedCount >= 0; excludedCount -= 1) {
    const excluded = new Set(recent.slice(0, excludedCount));
    const filtered = merchants.filter((merchant) => !excluded.has(merchant.id));
    if (filtered.length) return { merchants: filtered, relaxed: excludedCount < recent.length };
  }
  return { merchants, relaxed: true };
}
