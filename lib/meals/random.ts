import { mealCategories } from "@/lib/meals/constants";
import { pickRandom } from "@/lib/random/pick-random";
import type { MealCategoryId, MealFood } from "@/types/meals";

export interface BalancedMealPick {
  categoryId: MealCategoryId;
  categoryIndex: number;
  visibleCategoryIds: MealCategoryId[];
  food: MealFood;
}

export function pickMealCategory(
  foods: readonly MealFood[],
  random: () => number = Math.random,
) {
  const visibleCategoryIds = mealCategories
    .map((category) => category.id)
    .filter((categoryId) => foods.some((food) => food.categoryId === categoryId));
  const categoryPick = pickRandom(visibleCategoryIds, random);
  return categoryPick ? { categoryId: categoryPick.item, categoryIndex: categoryPick.index, visibleCategoryIds } : null;
}

export function getMealWheelDisplayFoods(foods: readonly MealFood[], limit = 24) {
  const groups = mealCategories
    .map((category) => foods.filter((food) => food.categoryId === category.id))
    .filter((group) => group.length > 0);
  const visible: MealFood[] = [];
  for (let row = 0; visible.length < Math.min(limit, foods.length); row += 1) {
    let added = false;
    groups.forEach((group) => {
      if (visible.length < limit && group[row]) {
        visible.push(group[row]);
        added = true;
      }
    });
    if (!added) break;
  }
  return visible;
}

export function pickBalancedMeal(
  foods: readonly MealFood[],
  random: () => number = Math.random,
): BalancedMealPick | null {
  const visibleCategoryIds = mealCategories
    .map((category) => category.id)
    .filter((categoryId) => foods.some((food) => food.categoryId === categoryId));
  const categoryPick = pickRandom(visibleCategoryIds, random);
  if (!categoryPick) return null;
  const foodPick = pickRandom(foods.filter((food) => food.categoryId === categoryPick.item), random);
  if (!foodPick) return null;
  return {
    categoryId: categoryPick.item,
    categoryIndex: categoryPick.index,
    visibleCategoryIds,
    food: foodPick.item,
  };
}

export function pickSameCategory(
  foods: readonly MealFood[],
  current: MealFood,
  random: () => number = Math.random,
) {
  const alternatives = foods.filter((food) => food.categoryId === current.categoryId && food.id !== current.id);
  return pickRandom(alternatives.length ? alternatives : foods.filter((food) => food.categoryId === current.categoryId), random)?.item ?? null;
}

export function pickDifferentCategory(
  foods: readonly MealFood[],
  current: MealFood,
  random: () => number = Math.random,
) {
  return pickBalancedMeal(foods.filter((food) => food.categoryId !== current.categoryId), random)
    ?? pickBalancedMeal(foods, random);
}
