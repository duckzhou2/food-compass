import foodsJson from "@/data/meals/foods.json";
import { mealCategories } from "@/lib/meals/constants";
import {
  excludeTags,
  flavorTags,
  fullnessTags,
  mealCategoryIds,
  mealEntryTypes,
  mealTimeTags,
  priceBands,
  sceneTags,
  type MealFood,
} from "@/types/meals";

const allowed = {
  categoryId: new Set<string>(mealCategoryIds),
  entryType: new Set<string>(mealEntryTypes),
  priceBands: new Set<string>(priceBands),
  flavorTags: new Set<string>(flavorTags),
  timeTags: new Set<string>(mealTimeTags),
  fullnessTags: new Set<string>(fullnessTags),
  sceneTags: new Set<string>(sceneTags),
  excludeTags: new Set<string>(excludeTags.filter((tag) => tag !== "mala" && tag !== "vegetarian_friendly")),
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

export function isMealFood(value: unknown, source?: "builtin" | "custom"): value is MealFood {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" && item.id.length > 0 &&
    typeof item.name === "string" && item.name.trim().length > 0 &&
    isStringArray(item.aliases) &&
    typeof item.categoryId === "string" && allowed.categoryId.has(item.categoryId) &&
    typeof item.entryType === "string" && allowed.entryType.has(item.entryType) &&
    isStringArray(item.priceBands) && item.priceBands.every((tag) => allowed.priceBands.has(tag)) &&
    isStringArray(item.flavorTags) && item.flavorTags.every((tag) => allowed.flavorTags.has(tag)) &&
    isStringArray(item.timeTags) && item.timeTags.every((tag) => allowed.timeTags.has(tag)) &&
    isStringArray(item.fullnessTags) && item.fullnessTags.every((tag) => allowed.fullnessTags.has(tag)) &&
    isStringArray(item.sceneTags) && item.sceneTags.every((tag) => allowed.sceneTags.has(tag)) &&
    isStringArray(item.excludeTags) && item.excludeTags.every((tag) => allowed.excludeTags.has(tag)) &&
    isStringArray(item.dietTags) && item.dietTags.every((tag) => tag === "vegetarian_friendly") &&
    (item.source === "builtin" || item.source === "custom") &&
    (source === undefined || item.source === source) &&
    typeof item.enabled === "boolean" &&
    typeof item.note === "string" &&
    (item.createdAt === undefined || typeof item.createdAt === "string")
  );
}

function validateFoods(value: unknown): MealFood[] {
  if (!Array.isArray(value) || value.length !== 459 || !value.every((item) => isMealFood(item, "builtin"))) {
    throw new Error("餐食种子数据无效或数量不是 459 条。");
  }
  const ids = new Set(value.map((item) => item.id));
  const names = new Set(value.map((item) => item.name));
  if (ids.size !== value.length || names.size !== value.length) throw new Error("餐食种子数据存在重复 ID 或名称。");
  for (const category of mealCategories) {
    if (value.filter((item) => item.categoryId === category.id).length !== category.count) {
      throw new Error(`${category.name} 的种子数据数量不正确。`);
    }
  }
  return value as MealFood[];
}

export const builtinMealFoods = validateFoods(foodsJson);
