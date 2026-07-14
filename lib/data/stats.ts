import type { MilkTeaProduct } from "@/types/product";

function countBy(records: MilkTeaProduct[], key: keyof MilkTeaProduct): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    const value = String(record[key]);
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function getDataStats(records: MilkTeaProduct[]) {
  const nutritionFields = [
    "calories_kcal_min",
    "protein_g",
    "fat_g",
    "carbohydrate_g",
    "sugar_g",
    "caffeine_mg",
    "tea_polyphenols_mg",
  ] as const;

  return {
    total: records.length,
    brandCount: new Set(records.map((record) => record.brand_name)).size,
    withCalories: records.filter((record) => record.calories_kcal_min !== null).length,
    byBrand: countBy(records, "brand_name"),
    byAuditStatus: countBy(records, "audit_status"),
    bySourceOrigin: countBy(records, "source_origin"),
    missingNutrition: Object.fromEntries(
      nutritionFields.map((field) => [
        field,
        records.filter((record) => record[field] === null).length,
      ]),
    ),
    lastAccessedAt: [...records]
      .map((record) => record.source_accessed_at)
      .sort()
      .at(-1),
  };
}
