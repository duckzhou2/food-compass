import { describe, expect, it, vi } from "vitest";
import { canteenCatalog, canteenImportReport } from "@/lib/data/canteens";
import { defaultCanteenFilters, filterCanteenDishes } from "@/lib/canteens/filters";
import { pickCanteenRecommendation, weightedPick } from "@/lib/canteens/random";
import { canteenStorageKeys, defaultCanteenPersonalData, loadCanteenPersonalData, saveCanteenPersonalData } from "@/lib/canteens/storage";

describe("北大食堂数据", () => {
  it("完整导入14个食堂、1个服务点和514条历史SKU", () => {
    expect(canteenCatalog.canteens.filter((item) => !item.isServicePoint)).toHaveLength(14);
    expect(canteenCatalog.canteens.filter((item) => item.isServicePoint)).toHaveLength(1);
    expect(canteenCatalog.dishes.flatMap((dish) => dish.skus)).toHaveLength(514);
    expect(canteenImportReport.githubFileCounts).toEqual({ "jia1.csv":25,"jia2.csv":36,"jia3.csv":10,"xue1.csv":71,"yan.csv":57,"song.csv":46,"shao1.csv":33,"shao2.csv":26,"xue5.csv":53,"nong1.csv":63,"nong2.csv":36,"tong.csv":58 });
  });

  it("所有ID唯一且关联有效", () => {
    const ids = canteenCatalog.dishes.map((dish) => dish.id);
    const skus = canteenCatalog.dishes.flatMap((dish) => dish.skus);
    const floorIds = new Set(canteenCatalog.floors.map((floor) => floor.id));
    const windowIds = new Set(canteenCatalog.windows.map((window) => window.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(skus.map((sku) => sku.id)).size).toBe(514);
    expect(canteenCatalog.dishes.every((dish) => floorIds.has(dish.floorId) && dish.windowIds.every((id) => windowIds.has(id)) && dish.skus.every((sku) => sku.dishId === dish.id))).toBe(true);
    expect(canteenImportReport.hardChecks.brokenRelations).toBe(0);
  });

  it("份量变体保留为独立SKU且窗口未知时不自动绑定", () => {
    const buns = canteenCatalog.dishes.find((dish) => dish.rawNames.includes("生煎包*1"));
    expect(buns?.portions).toContain("1个/份");
    expect(buns?.skus.length).toBeGreaterThan(1);
    const pending = canteenCatalog.dishes.filter((dish) => dish.windowIds.length === 0);
    expect(pending).toHaveLength(427);
    expect(pending.some((dish) => dish.skus.length > 0)).toBe(true);
  });

  it("650个菜品均归入一个统一风味分类并保留原始分类", () => {
    const canonicalCuisines = new Set([
      "家常中餐", "点心烘焙", "汤粥轻食", "川渝麻辣", "西北新疆",
      "西式餐食", "湘赣风味", "粤式烧腊", "江浙淮扬", "东北风味",
      "东南亚风味", "日韩料理", "饮品甜品", "京鲁北方",
    ]);
    expect(canteenCatalog.dishes).toHaveLength(650);
    expect(canteenCatalog.dishes.every((dish) =>
      dish.cuisines.length === 1
      && canonicalCuisines.has(dish.cuisines[0])
      && dish.cuisineInferred
      && Array.isArray(dish.rawCuisines),
    )).toBe(true);
  });
});

describe("北大食堂筛选与推荐", () => {
  it("同组OR、跨组AND，并覆盖搜索和历史数值", () => {
    const result = filterCanteenDishes(canteenCatalog.dishes, { ...defaultCanteenFilters, query: "襄阳牛肉面", dishTypes: ["主食", "套餐"], price: { min: 1, max: 30 } });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((dish) => dish.searchText.includes("襄阳牛肉面") && dish.dishTypes.some((type) => type === "主食" || type === "套餐") && dish.skus.some((sku) => sku.priceCny >= 1 && sku.priceCny <= 30))).toBe(true);
  });

  it("窗口条件和多项饮食条件严格叠加", () => {
    const result = filterCanteenDishes(canteenCatalog.dishes, { ...defaultCanteenFilters, windowKnown: "no", spicy: "yes", vegetarian: "no", highSugar: "no" });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((dish) => dish.windowIds.length === 0 && dish.skus.some((sku) => sku.isPepperHot) && dish.skus.some((sku) => !sku.isVegetarian) && dish.skus.some((sku) => !sku.isHighSugar))).toBe(true);
  });

  it("随机结果服从候选并应用0.35降频权重", () => {
    const dishes = canteenCatalog.dishes.filter((dish) => dish.skus.length).slice(0, 3);
    const result = pickCanteenRecommendation(dishes, "dish", [], [], new Set(), () => 0);
    expect(dishes.map((dish) => dish.id)).toContain(result?.dishId);
    expect(weightedPick(dishes, new Set([dishes[0].id]), () => 0.2)?.id).not.toBe(dishes[0].id);
  });
});

describe("北大食堂本地存储", () => {
  it("使用独立命名空间并可保存恢复", () => {
    localStorage.setItem("foodCompass.meal.history", "meal-sentinel");
    localStorage.setItem("foodCompass.milkTea.history", "milk-sentinel");
    const data = { ...defaultCanteenPersonalData, favorites: { canteens: ["canteen-jiayuan"], windows: [], dishes: [] }, loweredFrequency: ["canteen-jiayuan"] };
    expect(saveCanteenPersonalData(data)).toBe(true);
    expect(loadCanteenPersonalData().data).toMatchObject(data);
    expect(localStorage.getItem("foodCompass.meal.history")).toBe("meal-sentinel");
    expect(localStorage.getItem("foodCompass.milkTea.history")).toBe("milk-sentinel");
    expect(localStorage.getItem(canteenStorageKeys.schemaVersion)).toBe("1");
  });

  it("损坏数据安全回退", () => {
    localStorage.setItem(canteenStorageKeys.favorites, "{");
    expect(loadCanteenPersonalData().storageAvailable).toBe(false);
    expect(loadCanteenPersonalData().data).toEqual(defaultCanteenPersonalData);
    vi.restoreAllMocks();
  });
});
