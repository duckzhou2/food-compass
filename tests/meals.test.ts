import { describe, expect, it } from "vitest";
import { builtinMealFoods } from "@/lib/data/meals";
import { defaultMealFilters, mealCategories } from "@/lib/meals/constants";
import { applyRecentAvoidance, filterMealFoods } from "@/lib/meals/filters";
import { getMealWheelDisplayFoods, pickBalancedMeal, pickMealCategory } from "@/lib/meals/random";
import { applyMealImport, defaultMealPersonalData, validateMealExport } from "@/lib/meals/storage";
import type { MealExportV1, MealFilters, MealFood, MealHistoryEntry } from "@/types/meals";

describe("正餐种子数据", () => {
  it("包含 459 个唯一条目并符合九类固定统计", () => {
    expect(builtinMealFoods).toHaveLength(459);
    expect(new Set(builtinMealFoods.map((food) => food.id)).size).toBe(459);
    expect(new Set(builtinMealFoods.map((food) => food.name)).size).toBe(459);
    expect(mealCategories.map((category) => [category.id, builtinMealFoods.filter((food) => food.categoryId === category.id).length])).toEqual(mealCategories.map((category) => [category.id, category.count]));
  });

  it("同组使用 OR、跨组使用 AND，并在最后应用排除条件", () => {
    const filters: MealFilters = { ...defaultMealFilters, priceBands: ["under15", "15_25"], flavorTags: ["mala", "sour_spicy"], timeTags: ["fast"] };
    const foods = filterMealFoods(builtinMealFoods, filters);
    expect(foods.length).toBeGreaterThan(0);
    expect(foods.every((food) => food.priceBands.some((tag) => filters.priceBands.includes(tag as never)) && food.flavorTags.some((tag) => filters.flavorTags.includes(tag as never)) && food.timeTags.includes("fast"))).toBe(true);
    const noSpicy = filterMealFoods(builtinMealFoods, { ...filters, excludeTags: ["mala"] });
    expect(noSpicy.every((food) => !food.flavorTags.includes("mala"))).toBe(true);
  });

  it("搜索名称和别名，永久排除不进入候选", () => {
    const aliasFood = { ...builtinMealFoods[0], id: "alias-test", aliases: ["测试别名"] };
    expect(filterMealFoods([aliasFood], { ...defaultMealFilters, query: "测试别名" })).toEqual([aliasFood]);
    expect(filterMealFoods([aliasFood], defaultMealFilters, new Set(), new Set([aliasFood.id]))).toEqual([]);
  });
});

describe("正餐随机与历史", () => {
  it("先选分类再选具体食物，两次随机都可注入", () => {
    const foods = [builtinMealFoods.find((food) => food.categoryId === "rice")!, builtinMealFoods.find((food) => food.categoryId === "noodles")!, builtinMealFoods.find((food) => food.categoryId === "noodles" && food.id !== "meal-056")!];
    const samples = [0.75, 0.99];
    const picked = pickBalancedMeal(foods, () => samples.shift()!);
    expect(picked?.categoryId).toBe("noodles");
    expect(picked?.food).toBe(foods[2]);
  });

  it("未选择主分类时可单独抽大类，具体食物盘面最多展示 24 项", () => {
    const foods = builtinMealFoods.filter((food) => food.categoryId === "rice" || food.categoryId === "noodles");
    expect(pickMealCategory(foods, () => 0.99)?.categoryId).toBe("noodles");
    const visible = getMealWheelDisplayFoods(foods);
    expect(visible).toHaveLength(24);
    expect(new Set(visible.map((food) => food.categoryId))).toEqual(new Set(["rice", "noodles"]));
  });

  it("避免最近三次；无候选时先恢复最早一次", () => {
    const foods = builtinMealFoods.slice(0, 3);
    const history: MealHistoryEntry[] = foods.map((food, index) => ({ foodId: food.id, foodName: food.name, categoryId: food.categoryId, selectedAt: new Date(Date.now() - index * 1000).toISOString(), source: food.source }));
    const result = applyRecentAvoidance(foods, history, true);
    expect(result.relaxed).toBe("oldest");
    expect(result.foods.map((food) => food.id)).toEqual([foods[2].id]);
  });
});

describe("正餐导入", () => {
  const custom = { ...builtinMealFoods[0], id: "custom-one", name: "我的食堂", source: "custom", createdAt: "2026-07-15T00:00:00.000Z" } satisfies MealFood;
  const payload: MealExportV1 = { schemaVersion: 1, exportedAt: "2026-07-15T00:00:00.000Z", customFoods: [custom], favorites: [custom.id], permanentlyExcluded: [], history: [], settings: { avoidRecent: false } };

  it("拒绝非法版本且不会把内置来源当作自定义数据", () => {
    expect(() => validateMealExport({ ...payload, schemaVersion: 2 })).toThrow(/schemaVersion/);
    expect(() => validateMealExport({ ...payload, customFoods: [{ ...custom, source: "builtin" }] })).toThrow(/自定义食物/);
  });

  it("合并时保留 ID 相同但内容不同的两条自定义数据", () => {
    const current = { ...defaultMealPersonalData, customFoods: [{ ...custom, name: "本地食堂" }] };
    const merged = applyMealImport(current, payload, "merge", new Set(builtinMealFoods.map((food) => food.id)));
    expect(merged.customFoods).toHaveLength(2);
    expect(new Set(merged.customFoods.map((food) => food.id)).size).toBe(2);
    expect(merged.favorites).toContain(merged.customFoods.find((food) => food.name === "我的食堂")?.id);
  });
});
