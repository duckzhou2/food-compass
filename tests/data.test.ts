import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { describe, expect, it } from "vitest";
import { products } from "@/lib/data/products";
import { getDataStats } from "@/lib/data/stats";

const rawJson = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "../milk_tea_products.json"), "utf8"),
) as Array<{ record_id: string }>;
const rawCsv = parse(
  readFileSync(path.resolve(process.cwd(), "../milk_tea_products.csv"), "utf8"),
  { columns: true, bom: true, skip_empty_lines: true },
) as Array<{ record_id: string }>;

describe("产品数据", () => {
  it("原始 CSV 和 JSON 记录数一致", () => {
    expect(rawCsv).toHaveLength(rawJson.length);
  });

  it("派生数据 ID 唯一且全部属于中国大陆", () => {
    const ids = products.map((product) => product.record_id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(products.every((product) => product.region === "中国大陆")).toBe(true);
  });

  it("非估算记录均有逐条来源", () => {
    for (const product of products.filter((item) => !item.is_estimated)) {
      expect(product.source_url).toMatch(/^https:\/\//);
      expect(product.source_title.length).toBeGreaterThan(0);
    }
  });

  it("热量上下限及 kcal/kJ 换算合理", () => {
    for (const product of products) {
      if (product.calories_kcal_min === null || product.calories_kcal_max === null) continue;
      expect(product.calories_kcal_min).toBeLessThanOrEqual(product.calories_kcal_max);
      expect(product.calories_kj_min).not.toBeNull();
      expect(Math.abs(Math.round(product.calories_kcal_min * 4.184) - product.calories_kj_min!)).toBeLessThanOrEqual(1);
    }
  });

  it("真实零值有来源说明，未知值保留 null", () => {
    const numericFields = ["protein_g", "fat_g", "carbohydrate_g", "sugar_g", "caffeine_mg", "tea_polyphenols_mg"] as const;
    for (const product of products) {
      for (const field of numericFields) {
        const value = product[field];
        expect(value === null || typeof value === "number").toBe(true);
        if (value === 0) {
          expect(product.source_url).toMatch(/^https:\/\//);
          expect(product.notes).toContain("0");
        }
      }
    }
  });

  it("统计结果由当前快照动态计算", () => {
    const stats = getDataStats(products);
    expect(stats.total).toBe(products.length);
    expect(stats.brandCount).toBe(new Set(products.map((product) => product.brand_name)).size);
    expect(stats.withCalories).toBe(products.filter((product) => product.calories_kcal_min !== null).length);
  });
});
