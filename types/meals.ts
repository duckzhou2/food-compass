export const mealCategoryIds = [
  "rice",
  "noodles",
  "dumplings",
  "spicy_pot",
  "chinese_snack",
  "asia",
  "western",
  "light",
  "group",
] as const;
export type MealCategoryId = (typeof mealCategoryIds)[number];

export const mealEntryTypes = ["dish", "restaurant"] as const;
export type MealEntryType = (typeof mealEntryTypes)[number];

export const priceBands = ["under15", "15_25", "25_40", "40_70", "70_plus"] as const;
export type PriceBand = (typeof priceBands)[number];

export const flavorTags = [
  "light",
  "savory",
  "sour_spicy",
  "mala",
  "sweet_sour",
  "curry_sauce",
  "fried_grilled",
] as const;
export type FlavorTag = (typeof flavorTags)[number];

export const mealTimeTags = ["fast", "normal", "slow"] as const;
export type MealTimeTag = (typeof mealTimeTags)[number];

export const fullnessTags = ["light", "normal", "heavy"] as const;
export type FullnessTag = (typeof fullnessTags)[number];

export const sceneTags = ["solo", "small_group", "group", "dine_in", "delivery", "takeout"] as const;
export type SceneTag = (typeof sceneTags)[number];

export const excludeTags = [
  "mala",
  "rice",
  "noodle",
  "soup",
  "fried",
  "pork",
  "beef_lamb",
  "seafood",
  "vegetarian_friendly",
] as const;
export type ExcludeTag = (typeof excludeTags)[number];

export type MealSource = "builtin" | "custom";
export type MealSort = "source" | "name" | "price" | "time" | "recent";

export interface MealFood {
  id: string;
  name: string;
  aliases: string[];
  categoryId: MealCategoryId;
  entryType: MealEntryType;
  priceBands: PriceBand[];
  flavorTags: FlavorTag[];
  timeTags: MealTimeTag[];
  fullnessTags: FullnessTag[];
  sceneTags: SceneTag[];
  excludeTags: Exclude<ExcludeTag, "mala" | "vegetarian_friendly">[];
  dietTags: Array<"vegetarian_friendly">;
  source: MealSource;
  enabled: boolean;
  note: string;
  createdAt?: string;
}

export interface MealFilters {
  query: string;
  categoryIds: MealCategoryId[];
  priceBands: PriceBand[];
  flavorTags: FlavorTag[];
  timeTags: MealTimeTag[];
  fullnessTags: FullnessTag[];
  sceneTags: SceneTag[];
  excludeTags: ExcludeTag[];
  excludeEntryTypes: MealEntryType[];
  onlyFavorites: boolean;
  onlyCustom: boolean;
  sort: MealSort;
}

export interface MealHistoryEntry {
  foodId: string;
  foodName: string;
  categoryId: MealCategoryId;
  selectedAt: string;
  source: MealSource;
}

export interface MealSettings {
  avoidRecent: boolean;
}

export interface MealExportV1 {
  schemaVersion: 1;
  exportedAt: string;
  customFoods: MealFood[];
  favorites: string[];
  permanentlyExcluded: string[];
  history: MealHistoryEntry[];
  settings: MealSettings;
}
