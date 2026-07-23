import { describe, expect, it } from "vitest";
import { milkTeaProducts } from "@/lib/data/milk-tea";
import {
  applyRecentMilkTeaAvoidance,
  pickDifferentMilkTeaBrand,
  pickSameMilkTeaCategory,
} from "@/lib/milk-tea/personal";
import {
  applyMilkTeaImport,
  defaultMilkTeaPersonalData,
  validateMilkTeaExport,
} from "@/lib/milk-tea/storage";
import type { MilkTeaHistoryEntry } from "@/types/milk-tea";

const historyEntry = (index: number): MilkTeaHistoryEntry => {
  const product = milkTeaProducts[index];
  return {
    productId: product.productId,
    productName: product.productName,
    brandId: product.brandId,
    brandName: product.brandName,
    selectedAt: new Date(2026, 6, 15, 12, index).toISOString(),
    variantId: product.defaultSelection.variantId,
    toppingIds: [],
  };
};

describe("奶茶个人决策逻辑", () => {
  it("默认避开最近三次，并在候选不足时逐级恢复", () => {
    const products = milkTeaProducts.slice(0, 3);
    const history = [historyEntry(0), historyEntry(1), historyEntry(2)];
    expect(applyRecentMilkTeaAvoidance(products, history, true).map((item) => item.productId))
      .toEqual([products[2].productId]);
    expect(applyRecentMilkTeaAvoidance(products, history, false)).toHaveLength(3);
  });

  it("换同类优先避开当前产品，换品牌优先使用其他品牌", () => {
    const current = milkTeaProducts.find((product) =>
      milkTeaProducts.some(
        (other) =>
          other.productId !== product.productId &&
          other.displayCategory === product.displayCategory,
      ),
    )!;
    const sameCategory = pickSameMilkTeaCategory(milkTeaProducts, current, () => 0);
    expect(sameCategory?.displayCategory).toBe(current.displayCategory);
    expect(sameCategory?.productId).not.toBe(current.productId);
    expect(pickDifferentMilkTeaBrand(milkTeaProducts, current, () => 0)?.brandId)
      .not.toBe(current.brandId);
  });

  it("导入只接受已知产品的收藏与排除，但保留下架历史快照", () => {
    const known = milkTeaProducts[0];
    const incoming = validateMilkTeaExport({
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      favorites: [known.productId, "removed-product"],
      permanentlyExcluded: ["removed-product"],
      history: [
        historyEntry(0),
        {
          ...historyEntry(0),
          productId: "removed-product",
          productName: "已下架饮品",
          selectedAt: new Date(2026, 6, 16).toISOString(),
        },
      ],
      settings: { avoidRecent: false },
    });
    const result = applyMilkTeaImport(
      defaultMilkTeaPersonalData,
      incoming,
      "replace",
      new Set(milkTeaProducts.map((product) => product.productId)),
    );
    expect(result.favorites).toEqual([known.productId]);
    expect(result.permanentlyExcluded).toEqual([]);
    expect(result.history.some((entry) => entry.productId === "removed-product")).toBe(true);
  });

  it("合并历史去重、排序并截取 50 条", () => {
    const product = milkTeaProducts[0];
    const history = Array.from({ length: 55 }, (_, index) => ({
      ...historyEntry(0),
      selectedAt: new Date(2026, 0, index + 1).toISOString(),
      variantId: product.defaultSelection.variantId,
    }));
    const result = applyMilkTeaImport(
      defaultMilkTeaPersonalData,
      {
        schemaVersion: 1,
        exportedAt: new Date().toISOString(),
        favorites: [],
        permanentlyExcluded: [],
        history,
        settings: { avoidRecent: true },
      },
      "merge",
      new Set(milkTeaProducts.map((item) => item.productId)),
    );
    expect(result.history).toHaveLength(50);
    expect(result.history[0].selectedAt >= result.history[1].selectedAt).toBe(true);
  });
});
