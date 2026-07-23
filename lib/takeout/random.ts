import type { TakeoutMerchant } from "@/types/takeout";

const randomIndex = (length: number, random: () => number) => Math.min(length - 1, Math.floor(random() * length));

export function pickTakeoutCategory(merchants: TakeoutMerchant[], random = Math.random) {
  const categoryIds = [...new Set(merchants.map((merchant) => merchant.categoryId))];
  if (!categoryIds.length) return null;
  const categoryIndex = randomIndex(categoryIds.length, random);
  return { categoryId: categoryIds[categoryIndex], categoryIndex, visibleCategoryIds: categoryIds };
}

export function pickBalancedTakeout(merchants: TakeoutMerchant[], random = Math.random) {
  const pickedCategory = pickTakeoutCategory(merchants, random);
  if (!pickedCategory) return null;
  const inCategory = merchants.filter((merchant) => merchant.categoryId === pickedCategory.categoryId);
  const merchant = inCategory[randomIndex(inCategory.length, random)];
  return { ...pickedCategory, merchant };
}

export function pickSameTakeoutCategory(merchants: TakeoutMerchant[], current: TakeoutMerchant, random = Math.random) {
  const pool = merchants.filter((merchant) => merchant.categoryId === current.categoryId && merchant.id !== current.id);
  return pool.length ? pool[randomIndex(pool.length, random)] : null;
}

export function pickDifferentTakeoutCategory(merchants: TakeoutMerchant[], current: TakeoutMerchant, random = Math.random) {
  return pickBalancedTakeout(merchants.filter((merchant) => merchant.categoryId !== current.categoryId), random)?.merchant ?? null;
}

export function getTakeoutWheelMerchants(merchants: TakeoutMerchant[], limit = 24) {
  if (merchants.length <= limit) return merchants;
  const grouped = new Map<string, TakeoutMerchant[]>();
  merchants.forEach((merchant) => grouped.set(merchant.categoryId, [...(grouped.get(merchant.categoryId) ?? []), merchant]));
  const result: TakeoutMerchant[] = [];
  while (result.length < limit && [...grouped.values()].some((items) => items.length)) {
    for (const items of grouped.values()) {
      const next = items.shift();
      if (next) result.push(next);
      if (result.length === limit) break;
    }
  }
  return result;
}
