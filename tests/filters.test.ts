import { describe, expect, it } from "vitest";
import { products } from "@/lib/data/products";
import { filterProducts } from "@/lib/filters/filter-products";
import { emptyFilters } from "@/types/product";

describe("组合筛选", () => {
  it("按品牌与品类筛选", () => {
    const result = filterProducts(products, {
      ...emptyFilters,
      onlyWithCalories: false,
      brands: ["霸王茶姬"],
      categories: ["原叶鲜奶茶"],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.brand_name === "霸王茶姬" && item.normalized_category === "原叶鲜奶茶")).toBe(true);
  });

  it("热量筛选不会包含 null", () => {
    const result = filterProducts(products, {
      ...emptyFilters,
      onlyWithCalories: false,
      calorieMin: 100,
      calorieMax: 150,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.calories_kcal_min !== null)).toBe(true);
  });

  it("按审计状态和在售状态筛选", () => {
    const result = filterProducts(products, {
      ...emptyFilters,
      onlyWithCalories: false,
      auditStatuses: ["partially_verified"],
      availabilityStatuses: ["official_site_listed"],
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.audit_status === "partially_verified" && item.availability_status === "official_site_listed")).toBe(true);
  });

  it("关键词支持产品、品牌和标签", () => {
    const result = filterProducts(products, { ...emptyFilters, onlyWithCalories: false, query: "茉莉雪芽" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((item) => item.product_name === "伯牙绝弦")).toBe(true);
  });

  it("不可能的组合返回空集合", () => {
    expect(filterProducts(products, { ...emptyFilters, query: "不存在的饮品-xyz" })).toEqual([]);
  });

  it("重置条件对应默认热量候选池", () => {
    const result = filterProducts(products, { ...emptyFilters });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.calories_kcal_min !== null && item.audit_status !== "rejected")).toBe(true);
  });
});
