import type {
  ExcludeTag,
  FlavorTag,
  FullnessTag,
  MealCategoryId,
  MealFilters,
  MealTimeTag,
  PriceBand,
  SceneTag,
} from "@/types/meals";

export const mealCategories: Array<{
  id: MealCategoryId;
  name: string;
  shortLabel: string;
  count: number;
}> = [
  { id: "rice", name: "米饭套餐", shortLabel: "米饭", count: 55 },
  { id: "noodles", name: "面 / 粉", shortLabel: "面粉", count: 74 },
  { id: "dumplings", name: "饺子包点", shortLabel: "饺子", count: 41 },
  { id: "spicy_pot", name: "麻辣锅物", shortLabel: "麻辣", count: 38 },
  { id: "chinese_snack", name: "中式小吃", shortLabel: "中式", count: 55 },
  { id: "asia", name: "日韩东南亚", shortLabel: "亚洲", count: 47 },
  { id: "western", name: "西式快餐", shortLabel: "西式", count: 46 },
  { id: "light", name: "汤粥轻食", shortLabel: "轻食", count: 49 },
  { id: "group", name: "聚餐烧烤", shortLabel: "聚餐", count: 54 },
];

export const priceLabels: Record<PriceBand, string> = {
  under15: "15 元以内",
  "15_25": "15～25 元",
  "25_40": "25～40 元",
  "40_70": "40～70 元",
  "70_plus": "70 元以上",
};

export const flavorLabels: Record<FlavorTag, string> = {
  light: "清淡鲜香",
  savory: "咸香下饭",
  sour_spicy: "酸辣开胃",
  mala: "麻辣重口",
  sweet_sour: "酸甜",
  curry_sauce: "咖喱 / 酱香",
  fried_grilled: "烧烤 / 油炸",
};

export const timeLabels: Record<MealTimeTag, string> = {
  fast: "赶时间",
  normal: "正常吃",
  slow: "慢慢吃",
};

export const fullnessLabels: Record<FullnessTag, string> = {
  light: "轻一点",
  normal: "正常吃",
  heavy: "很顶饱",
};

export const sceneLabels: Record<SceneTag, string> = {
  solo: "一个人",
  small_group: "两三个人",
  group: "多人聚餐",
  dine_in: "堂食",
  delivery: "外卖",
  takeout: "打包带走",
};

export const excludeLabels: Record<ExcludeTag, string> = {
  mala: "不吃辣",
  rice: "不想吃米饭",
  noodle: "不想吃面或粉",
  soup: "不想吃汤汤水水",
  fried: "不想吃油炸",
  pork: "不吃猪肉",
  beef_lamb: "不吃牛羊肉",
  seafood: "不吃海鲜",
  vegetarian_friendly: "素食优先",
};

export const defaultMealFilters: MealFilters = {
  query: "",
  categoryIds: mealCategories.map((category) => category.id),
  priceBands: [],
  flavorTags: [],
  timeTags: [],
  fullnessTags: [],
  sceneTags: [],
  excludeTags: [],
  excludeEntryTypes: [],
  onlyFavorites: false,
  onlyCustom: false,
  sort: "source",
};

export const mealPresets = [
  { id: "random", label: "随便吃" },
  { id: "under20", label: "20 元内" },
  { id: "hurry", label: "赶时间" },
  { id: "light", label: "清淡一点" },
  { id: "spicy", label: "想吃辣的" },
  { id: "treat", label: "吃顿好的" },
  { id: "solo", label: "一个人" },
  { id: "group", label: "多人聚餐" },
] as const;

export type MealPresetId = (typeof mealPresets)[number]["id"];

export function filtersForPreset(id: MealPresetId): MealFilters {
  const filters = { ...defaultMealFilters };
  if (id === "under20") filters.priceBands = ["under15", "15_25"];
  if (id === "hurry") filters.timeTags = ["fast"];
  if (id === "light") {
    filters.flavorTags = ["light"];
    filters.excludeTags = ["mala", "fried"];
  }
  if (id === "spicy") filters.flavorTags = ["mala", "sour_spicy"];
  if (id === "treat") {
    filters.priceBands = ["40_70", "70_plus"];
    filters.timeTags = ["normal", "slow"];
  }
  if (id === "solo") {
    filters.sceneTags = ["solo"];
    filters.excludeEntryTypes = ["restaurant"];
  }
  if (id === "group") filters.sceneTags = ["group", "small_group"];
  return filters;
}

export function getMealCategory(id: MealCategoryId) {
  return mealCategories.find((category) => category.id === id)!;
}

export function formatMealPrice(bands: readonly PriceBand[]): string {
  if (bands.length === 0) return "价格未填写";
  const ordered = ["under15", "15_25", "25_40", "40_70", "70_plus"] as const;
  const selected = ordered.filter((band) => bands.includes(band));
  if (selected.length === 1) return priceLabels[selected[0]];
  const lows: Record<PriceBand, number> = { under15: 0, "15_25": 15, "25_40": 25, "40_70": 40, "70_plus": 70 };
  const highs: Record<PriceBand, number | null> = { under15: 15, "15_25": 25, "25_40": 40, "40_70": 70, "70_plus": null };
  const first = selected[0];
  const last = selected.at(-1)!;
  return highs[last] === null ? `约 ${lows[first]} 元以上` : `约 ${lows[first]}～${highs[last]} 元`;
}
