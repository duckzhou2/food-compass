import chageeRaw from "@/data/milk-tea/brands/chagee.json";
import chabaidaoRaw from "@/data/milk-tea/brands/chabaidao.json";
import cocoRaw from "@/data/milk-tea/brands/coco.json";
import gumingRaw from "@/data/milk-tea/brands/guming.json";
import heyteaRaw from "@/data/milk-tea/brands/heytea.json";
import luckinRaw from "@/data/milk-tea/brands/luckin.json";
import mixueRaw from "@/data/milk-tea/brands/mixue.json";
import yidiandianRaw from "@/data/milk-tea/brands/yidiandian.json";
import {
  milkTeaBrandIds,
  milkTeaDisplayCategories,
  variantSelectionFields,
  type MilkTeaBrandData,
  type MilkTeaBrandId,
  type MilkTeaDataStatus,
} from "@/types/milk-tea";

const statuses: MilkTeaDataStatus[] = [
  "detailed",
  "specified_reference",
  "unspecified_reference",
  "missing",
  "needs_review",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function hasSelection(record: Record<string, unknown>): boolean {
  return variantSelectionFields.every((field) => isNullableString(record[field]));
}

function isDataStatus(value: unknown): value is MilkTeaDataStatus {
  return statuses.includes(value as MilkTeaDataStatus);
}

function assertBrandData(value: unknown): asserts value is MilkTeaBrandData {
  if (!isRecord(value)) throw new Error("奶茶品牌数据格式错误");
  if (!milkTeaBrandIds.includes(value.brandId as MilkTeaBrandId)) {
    throw new Error("奶茶品牌 ID 无效");
  }
  if (typeof value.brandName !== "string" || !Array.isArray(value.products) || !Array.isArray(value.toppings)) {
    throw new Error(`${String(value.brandId)} 品牌数据缺少必要字段`);
  }

  const productIds = new Set<string>();
  for (const product of value.products) {
    if (!isRecord(product)) throw new Error("奶茶产品格式错误");
    if (
      typeof product.productId !== "string" ||
      typeof product.productName !== "string" ||
      typeof product.category !== "string" ||
      !milkTeaDisplayCategories.includes(
        product.displayCategory as (typeof milkTeaDisplayCategories)[number],
      ) ||
      !Array.isArray(product.variants) ||
      !Array.isArray(product.toppings) ||
      !Array.isArray(product.notes) ||
      !Array.isArray(product.reviewFlags) ||
      !(product.excludeFromWheel === undefined || typeof product.excludeFromWheel === "boolean") ||
      !isDataStatus(product.dataStatus)
    ) {
      throw new Error(`奶茶产品字段无效: ${String(product.productId)}`);
    }
    if (productIds.has(product.productId)) throw new Error(`重复 productId: ${product.productId}`);
    productIds.add(product.productId);
    if (!isRecord(product.defaultSelection) || !hasSelection(product.defaultSelection) || typeof product.defaultSelection.variantId !== "string") {
      throw new Error(`${product.productId} 默认规格无效`);
    }

    const variantIds = new Set<string>();
    for (const variant of product.variants) {
      if (
        !isRecord(variant) ||
        !hasSelection(variant) ||
        typeof variant.variantId !== "string" ||
        !(variant.calories === null || typeof variant.calories === "number") ||
        !isDataStatus(variant.dataStatus) ||
        !Array.isArray(variant.notes) ||
        !Array.isArray(variant.reviewFlags)
      ) {
        throw new Error(`${product.productId} 规格数据无效`);
      }
      if (variantIds.has(variant.variantId)) throw new Error(`重复 variantId: ${variant.variantId}`);
      variantIds.add(variant.variantId);
    }
    if (!variantIds.has(product.defaultSelection.variantId)) {
      throw new Error(`${product.productId} 默认规格不存在`);
    }
  }
}

function parseBrandData(value: unknown): MilkTeaBrandData {
  assertBrandData(value);
  return value;
}

export const milkTeaBrands: MilkTeaBrandData[] = [
  yidiandianRaw,
  heyteaRaw,
  mixueRaw,
  chageeRaw,
  cocoRaw,
  gumingRaw,
  luckinRaw,
  chabaidaoRaw,
].map(parseBrandData);
export const milkTeaProducts = milkTeaBrands.flatMap((brand) => brand.products);

export function getMilkTeaBrand(brandId: MilkTeaBrandId): MilkTeaBrandData {
  const brand = milkTeaBrands.find((item) => item.brandId === brandId);
  if (!brand) throw new Error(`未知奶茶品牌: ${brandId}`);
  return brand;
}
