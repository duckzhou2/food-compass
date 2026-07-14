import rawProducts from "@/data/generated/products.json";
import type { MilkTeaProduct } from "@/types/product";

function assertProducts(value: unknown): asserts value is MilkTeaProduct[] {
  if (!Array.isArray(value)) throw new Error("产品数据必须是数组");
  const ids = new Set<string>();
  for (const item of value) {
    if (typeof item !== "object" || item === null) throw new Error("产品记录格式错误");
    const record = item as Partial<MilkTeaProduct>;
    if (!record.record_id || !record.brand_name || !record.product_name) {
      throw new Error("产品记录缺少必要字段");
    }
    if (ids.has(record.record_id)) throw new Error(`重复 record_id: ${record.record_id}`);
    ids.add(record.record_id);
    if (record.region !== "中国大陆") throw new Error(`非中国大陆记录: ${record.record_id}`);
  }
}

assertProducts(rawProducts);

export const products: MilkTeaProduct[] = rawProducts;

export function getBrands(): string[] {
  return [...new Set(products.map((product) => product.brand_name))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function getCategories(): string[] {
  return [...new Set(products.map((product) => product.normalized_category))].sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function getAuditStatuses(): string[] {
  return [...new Set(products.map((product) => product.audit_status))].sort();
}

export function getAvailabilityStatuses(): string[] {
  return [...new Set(products.map((product) => product.availability_status))].sort();
}
