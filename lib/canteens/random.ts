import type { CanteenDish, RecommendationResult } from "@/types/canteens";

export function weightedPick<T extends { id: string }>(items: readonly T[], lowered: ReadonlySet<string>, random: () => number = Math.random) {
  if (!items.length) return null;
  const weights = items.map((item) => lowered.has(item.id) ? 0.35 : 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let point = random() * total;
  for (let index = 0; index < items.length; index += 1) {
    point -= weights[index];
    if (point < 0) return items[index];
  }
  return items.at(-1) ?? null;
}

export function pickCanteenRecommendation(
  dishes: readonly CanteenDish[], mode: "canteen" | "window" | "dish", recentDishIds: readonly string[], recentCanteenIds: readonly string[], lowered: ReadonlySet<string>, random: () => number = Math.random,
): RecommendationResult | null {
  if (!dishes.length) return null;
  let candidates = dishes.filter((dish) => !recentDishIds.slice(0, 5).includes(dish.id) && !recentCanteenIds.slice(0, 3).includes(dish.canteenId));
  let relaxed = false;
  if (!candidates.length) { candidates = [...dishes]; relaxed = true; }
  if (mode === "dish") {
    const dish = weightedPick(candidates, lowered, random);
    return dish ? { mode, entityId: dish.id, canteenId: dish.canteenId, windowId: dish.windowIds[0] ?? null, dishId: dish.id, reason: ["符合当前全部筛选条件", dish.windowIds.length ? "有明确窗口资料" : "窗口位置待确认"], relaxed } : null;
  }
  if (mode === "window") {
    const available = candidates.flatMap((dish) => dish.windowIds.map((windowId) => ({ id: windowId, canteenId: dish.canteenId, dishId: dish.id })));
    const unique = [...new Map(available.map((item) => [item.id, item])).values()];
    const picked = weightedPick(unique, lowered, random);
    return picked ? { mode, entityId: picked.id, canteenId: picked.canteenId, windowId: picked.id, dishId: picked.dishId, reason: ["符合当前筛选且窗口资料明确"], relaxed } : null;
  }
  const available = [...new Map(candidates.map((dish) => [dish.canteenId, { id: dish.canteenId }])).values()];
  const picked = weightedPick(available, lowered, random);
  return picked ? { mode, entityId: picked.id, canteenId: picked.id, windowId: null, dishId: candidates.find((dish) => dish.canteenId === picked.id)?.id ?? null, reason: ["该食堂有符合当前筛选的菜品"], relaxed } : null;
}
