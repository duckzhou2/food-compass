import { pickRandom } from "@/lib/random/pick-random";
import type { MilkTeaHistoryEntry, MilkTeaProduct } from "@/types/milk-tea";

export function applyRecentMilkTeaAvoidance(
  products: readonly MilkTeaProduct[],
  history: readonly MilkTeaHistoryEntry[],
  enabled: boolean,
): MilkTeaProduct[] {
  if (!enabled || history.length === 0) return [...products];
  const recentIds = [...new Set(history.slice(0, 3).map((entry) => entry.productId))];
  for (let restoreCount = 0; restoreCount <= recentIds.length; restoreCount += 1) {
    const excluded = new Set(recentIds.slice(0, recentIds.length - restoreCount));
    const candidates = products.filter((product) => !excluded.has(product.productId));
    if (candidates.length > 0) return candidates;
  }
  return [...products];
}

export function pickSameMilkTeaCategory(
  products: readonly MilkTeaProduct[],
  current: MilkTeaProduct,
  random: () => number = Math.random,
): MilkTeaProduct | null {
  const sameCategory = products.filter(
    (product) => product.displayCategory === current.displayCategory,
  );
  const alternatives = sameCategory.filter(
    (product) => product.productId !== current.productId,
  );
  return pickRandom(alternatives.length > 0 ? alternatives : sameCategory, random)?.item ?? null;
}

export function pickDifferentMilkTeaBrand(
  products: readonly MilkTeaProduct[],
  current: MilkTeaProduct,
  random: () => number = Math.random,
): MilkTeaProduct | null {
  const otherBrands = products.filter((product) => product.brandId !== current.brandId);
  return pickRandom(otherBrands.length > 0 ? otherBrands : products, random)?.item ?? null;
}
