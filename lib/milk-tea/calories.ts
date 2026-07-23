import type { CalorieRange, MilkTeaTopping, ToppingVariant } from "@/types/milk-tea";

export function selectToppingVariant(
  topping: MilkTeaTopping,
  size: string | null,
): ToppingVariant | null {
  if (size !== null) {
    const sizeMatch = topping.variants.find((variant) => variant.size === size);
    if (sizeMatch) return sizeMatch;
  }
  return topping.variants.find((variant) => variant.size === null) ?? topping.variants[0] ?? null;
}

export function sumToppingCalories(variants: ToppingVariant[]): CalorieRange {
  return variants.reduce<CalorieRange>(
    (sum, variant) => ({
      min: sum.min + (variant.calories?.min ?? 0),
      max: sum.max + (variant.calories?.max ?? 0),
    }),
    { min: 0, max: 0 },
  );
}

export function calculateTotalCalories(
  baseCalories: number | null,
  toppingVariants: ToppingVariant[],
): CalorieRange | null {
  if (baseCalories === null) return null;
  const toppings = sumToppingCalories(toppingVariants);
  return { min: baseCalories + toppings.min, max: baseCalories + toppings.max };
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

export function formatCalorieRange(calories: CalorieRange | null): string {
  if (calories === null) return "暂无可靠参考热量";
  if (calories.min === calories.max) return `${formatNumber(calories.min)} kcal`;
  return `${formatNumber(calories.min)}–${formatNumber(calories.max)} kcal`;
}

export function formatCalorieValue(calories: number | null): string {
  return calories === null ? "暂无可靠参考热量" : `${formatNumber(calories)} kcal`;
}
