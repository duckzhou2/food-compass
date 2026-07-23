import { describe, expect, it } from "vitest";
import { builtinTakeoutMerchants, takeoutCatalog } from "@/lib/data/takeout";
import { applyTakeoutRecentAvoidance, defaultTakeoutFilters, filterTakeoutMerchants } from "@/lib/takeout/filters";
import { pickBalancedTakeout, pickTakeoutCategory } from "@/lib/takeout/random";
import { applyTakeoutImport, defaultTakeoutPersonalData, validateTakeoutExport } from "@/lib/takeout/storage";
import type { TakeoutExportV1, TakeoutMerchant } from "@/types/takeout";

describe("外卖种子数据", () => {
  it("包含 339 个唯一商户且统计与引用表一致", () => {
    expect(builtinTakeoutMerchants).toHaveLength(339);
    expect(new Set(builtinTakeoutMerchants.map((merchant) => merchant.id)).size).toBe(339);
    expect(takeoutCatalog.referenceData.categories).toHaveLength(9);
    expect(takeoutCatalog.referenceData.areas).toHaveLength(9);
    expect(Object.values(takeoutCatalog.statistics.merchantsByCategory).reduce((sum, value) => sum + value, 0)).toBe(339);
    expect(builtinTakeoutMerchants.every((merchant) => merchant.delivery.status === "unverified")).toBe(true);
  });

  it("同组 OR、跨组 AND，并支持搜索、收藏和估算距离排除", () => {
    const sample = builtinTakeoutMerchants.find((merchant) => merchant.location.isEstimated)!;
    const filters = { ...defaultTakeoutFilters, query: sample.name.slice(0, 2), categoryIds: [sample.categoryId], areaIds: [sample.areaId] };
    expect(filterTakeoutMerchants(builtinTakeoutMerchants, filters).some((merchant) => merchant.id === sample.id)).toBe(true);
    expect(filterTakeoutMerchants(builtinTakeoutMerchants, { ...filters, onlyFavorites: true }, new Set([sample.id]))).toHaveLength(1);
    expect(filterTakeoutMerchants(builtinTakeoutMerchants, { ...filters, excludeEstimatedDistance: true })).toHaveLength(0);
  });
});

describe("外卖随机与个人数据", () => {
  it("按类型均衡随机，并支持单独抽类型", () => {
    const pool = builtinTakeoutMerchants.filter((merchant) => merchant.categoryId === "hotpot" || merchant.categoryId === "convenience");
    expect(pickTakeoutCategory(pool, () => .99)?.categoryId).toBe("convenience");
    expect(pickBalancedTakeout(pool, () => .99)?.merchant.categoryId).toBe("convenience");
  });

  it("避免最近三次，在全部命中时逐步放宽", () => {
    const pool = builtinTakeoutMerchants.slice(0, 3);
    const result = applyTakeoutRecentAvoidance(pool, pool.map((merchant) => ({ merchantId: merchant.id })), true);
    expect(result.relaxed).toBe(true);
    expect(result.merchants).toHaveLength(1);
  });

  it("校验并合并自定义商户备份", () => {
    const custom = { ...builtinTakeoutMerchants[0], id: "custom-takeout-test", name: "我的外卖", source: "custom", createdAt: new Date(0).toISOString() } satisfies TakeoutMerchant;
    const payload: TakeoutExportV1 = { schemaVersion: 1, exportedAt: new Date(0).toISOString(), customMerchants: [custom], favorites: [custom.id], permanentExclusions: [], history: [], settings: { avoidRecent: true } };
    expect(validateTakeoutExport(payload).customMerchants).toHaveLength(1);
    const merged = applyTakeoutImport(defaultTakeoutPersonalData, payload, "merge", new Set(builtinTakeoutMerchants.map((merchant) => merchant.id)));
    expect(merged.customMerchants).toHaveLength(1);
    expect(merged.favorites).toEqual([custom.id]);
  });
});
