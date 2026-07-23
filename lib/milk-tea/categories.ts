import {
  milkTeaDisplayCategories,
  type MilkTeaDisplayCategory,
  type MilkTeaProduct,
} from "@/types/milk-tea";

export { milkTeaDisplayCategories };

export function getDisplayCategory(product: MilkTeaProduct): MilkTeaDisplayCategory {
  return product.displayCategory;
}
