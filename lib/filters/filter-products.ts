import type { MilkTeaProduct, ProductFilters } from "@/types/product";

export function filterProducts(
  products: MilkTeaProduct[],
  filters: ProductFilters,
): MilkTeaProduct[] {
  const query = filters.query.trim().toLocaleLowerCase("zh-CN");

  return products.filter((product) => {
    if (product.audit_status === "rejected") return false;
    if (filters.brands.length > 0 && !filters.brands.includes(product.brand_name)) return false;
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(product.normalized_category)
    ) {
      return false;
    }
    if (
      filters.auditStatuses.length > 0 &&
      !filters.auditStatuses.includes(product.audit_status)
    ) {
      return false;
    }
    if (
      filters.availabilityStatuses.length > 0 &&
      !filters.availabilityStatuses.includes(product.availability_status)
    ) {
      return false;
    }
    if (filters.onlyWithCalories && product.calories_kcal_min === null) return false;

    const hasCalorieRange = filters.calorieMin !== null || filters.calorieMax !== null;
    if (hasCalorieRange) {
      if (product.calories_kcal_min === null || product.calories_kcal_max === null) return false;
      if (filters.calorieMin !== null && product.calories_kcal_max < filters.calorieMin) return false;
      if (filters.calorieMax !== null && product.calories_kcal_min > filters.calorieMax) return false;
    }

    if (query) {
      const searchable = [
        product.brand_name,
        product.product_name,
        product.normalized_category,
        ...product.tags,
      ]
        .join(" ")
        .toLocaleLowerCase("zh-CN");
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}
