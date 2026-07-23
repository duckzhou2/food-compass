import { describe, expect, it } from "vitest";
import { milkTeaBrands, milkTeaProducts } from "@/lib/data/milk-tea";
import {
  calculateTotalCalories,
  formatCalorieValue,
  sumToppingCalories,
} from "@/lib/milk-tea/calories";
import {
  dedupeProducts,
  filterMilkTeaProducts,
  getDefaultCalories,
  isWheelEligibleProduct,
} from "@/lib/milk-tea/filters";
import {
  findSelectedVariant,
  getDrinkingMethod,
  getValidOptions,
  isReliableVariant,
  parseDefaultSelection,
  resolveSelection,
  updateSelection,
} from "@/lib/milk-tea/selection";
import {
  milkTeaDisplayCategories,
  milkTeaSelectionFields,
  type ToppingVariant,
} from "@/types/milk-tea";

describe("八品牌饮品数据", () => {
  const getProduct = (brandId: string, productName: string) => {
    const product = milkTeaProducts.find(
      (item) => item.brandId === brandId && item.productName === productName,
    );
    expect(product, `${brandId} / ${productName} 应存在`).toBeDefined();
    return product!;
  };

  it("默认规格解析为真实存在的 variant", () => {
    for (const product of milkTeaProducts) {
      const selection = parseDefaultSelection(product);
      const variant = findSelectedVariant(product, selection);
      expect(product.variants).toContain(variant);
      if (product.variants.some(isReliableVariant)) {
        expect(isReliableVariant(variant)).toBe(true);
        expect(getDefaultCalories(product)).toBe(variant.calories);
      } else if (product.variants.some((item) => item.dataStatus === "needs_review")) {
        expect(getDefaultCalories(product)).toBeNull();
      } else {
        expect(getDefaultCalories(product)).toBe(variant.calories);
      }
    }
  });

  it("规格修改后只保留有效的后续组合", () => {
    const product = milkTeaProducts.find(
      (item) => getValidOptions(item, resolveSelection(item), "sugar").length > 1,
    )!;
    const initial = resolveSelection(product);
    const sugarOptions = getValidOptions(product, initial, "sugar");
    const changed = updateSelection(product, initial, "sugar", sugarOptions.at(-1)!);
    const selectedVariant = findSelectedVariant(product, changed);

    expect(sugarOptions).toContain(changed.sugar);
    expect(selectedVariant.sugar).toBe(changed.sugar);
    expect(product.variants).toContain(selectedVariant);
  });

  it("每个联动选项都能解析到一条完整的有效记录", () => {
    for (const product of milkTeaProducts) {
      const initial = resolveSelection(product);
      for (const field of milkTeaSelectionFields) {
        for (const option of getValidOptions(product, initial, field)) {
          const changed = updateSelection(product, initial, field, option);
          expect(
            product.variants.some((variant) =>
              milkTeaSelectionFields.every((key) =>
                (key === "drinkingMethod" ? getDrinkingMethod(variant) : variant[key]) === changed[key],
              ),
            ),
          ).toBe(true);
        }
      }
    }
  });

  it("小料热量按区间求和且不取平均", () => {
    const toppings: ToppingVariant[] = [
      {
        toppingVariantId: "one",
        size: null,
        unit: "一份",
        calories: { min: 10, max: 20 },
        dataStatus: "unspecified_reference",
        notes: [],
      },
      {
        toppingVariantId: "two",
        size: null,
        unit: "一个",
        calories: { min: 4.7, max: 4.7 },
        dataStatus: "unspecified_reference",
        notes: [],
      },
    ];
    expect(sumToppingCalories(toppings)).toEqual({ min: 14.7, max: 24.7 });
    expect(calculateTotalCalories(100, toppings)).toEqual({ min: 114.7, max: 124.7 });
  });

  it("产品去重以稳定 productId 为准", () => {
    const first = milkTeaProducts[0];
    expect(dedupeProducts([first, first, ...milkTeaProducts])).toHaveLength(milkTeaProducts.length);
  });

  it("缺失热量保持 null，不产生 NaN", () => {
    expect(formatCalorieValue(null)).toBe("暂无可靠参考热量");
    expect(calculateTotalCalories(null, [])).toBeNull();
  });

  it("小数热量原样保留", () => {
    const decimal = milkTeaProducts
      .flatMap((product) => product.variants)
      .find((variant) => variant.calories === 4.7);
    expect(decimal?.calories).toBe(4.7);
    expect(formatCalorieValue(decimal?.calories ?? null)).toBe("4.7 kcal");
  });

  it("真实的 0 kcal 与缺失热量保持区分", () => {
    expect(milkTeaProducts.flatMap((product) => product.variants).some((variant) => variant.calories === 0)).toBe(true);
    expect(formatCalorieValue(0)).toBe("0 kcal");
    expect(formatCalorieValue(null)).toBe("暂无可靠参考热量");
  });

  it("八品牌产品和规格均唯一且数量完整", () => {
    expect(milkTeaBrands.map((brand) => [brand.brandName, brand.products.length])).toEqual([
      ["一点点", 54],
      ["喜茶", 40],
      ["蜜雪冰城", 55],
      ["霸王茶姬", 53],
      ["CoCo都可", 67],
      ["古茗", 52],
      ["瑞幸咖啡", 128],
      ["茶百道", 66],
    ]);
    expect(milkTeaProducts).toHaveLength(515);
    expect(milkTeaProducts.flatMap((product) => product.variants)).toHaveLength(2559);
    expect(milkTeaBrands.flatMap((brand) => brand.toppings)).toHaveLength(82);
    expect(new Set(milkTeaProducts.map((product) => product.productId)).size).toBe(515);
    const globalVariantIds = new Set<string>();
    for (const product of milkTeaProducts) {
      expect(new Set(product.variants.map((variant) => variant.variantId)).size).toBe(product.variants.length);
      expect(product.variants.some((variant) => variant.variantId === product.defaultSelection.variantId)).toBe(true);
      const combinations = product.variants.map((variant) => JSON.stringify([
        variant.size,
        variant.ice,
        variant.temperature,
        variant.sugar,
        variant.version,
        variant.base,
      ]));
      expect(new Set(combinations).size).toBe(combinations.length);
      for (const variant of product.variants) {
        expect(globalVariantIds.has(variant.variantId)).toBe(false);
        globalVariantIds.add(variant.variantId);
        expect(variant.calories === null || Number.isFinite(variant.calories)).toBe(true);
      }
    }
    for (const brand of milkTeaBrands) {
      expect(new Set(brand.toppings.map((topping) => topping.toppingId)).size).toBe(brand.toppings.length);
    }
  });

  it("所有原始分类映射到统一的七个前台大类", () => {
    const categories = new Set(milkTeaProducts.map((product) => product.displayCategory));
    expect([...categories]).toEqual(expect.arrayContaining([...milkTeaDisplayCategories]));
    expect(categories.size).toBe(milkTeaDisplayCategories.length);
    expect(milkTeaProducts.some((product) => product.category !== product.displayCategory)).toBe(true);
  });

  it("冰量和温度合并为饮用方式且热饮不会被冰量过滤掉", () => {
    const product = milkTeaProducts.find((item) => item.productName === "月抹静山")!;
    const initial = resolveSelection(product);
    const methods = getValidOptions(product, initial, "drinkingMethod");
    expect(methods).toEqual(expect.arrayContaining(["标准冰", "少冰", "热"]));

    const hot = updateSelection(product, initial, "drinkingMethod", "热");
    const variant = findSelectedVariant(product, hot);
    expect(getDrinkingMethod(variant)).toBe("热");
    expect(variant.calories).not.toBeNull();
  });

  it("六窨香柠绿恢复为 5 kcal 普通参考产品", () => {
    const product = getProduct("yidiandian", "六窨香柠绿");
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0]).toMatchObject({
      size: null,
      ice: null,
      temperature: null,
      sugar: null,
      version: null,
      base: null,
      calories: 5,
      dataStatus: "unspecified_reference",
      reviewFlags: [],
    });
    expect(getDefaultCalories(product)).toBe(5);
    expect(isWheelEligibleProduct(product)).toBe(true);
    expect(filterMilkTeaProducts(milkTeaProducts, {
      brandIds: [], categories: [], query: "六窨香柠绿", calorieBands: [], sort: "source",
    })).toContain(product);
    expect(filterMilkTeaProducts(milkTeaProducts, {
      brandIds: [], categories: [], query: "六窨香柠绿", calorieBands: ["under100"], sort: "source",
    })).toContain(product);
    expect(filterMilkTeaProducts(milkTeaProducts, {
      brandIds: [], categories: [], query: "六窨香柠绿", calorieBands: [], sort: "caloriesAsc",
    })).toContain(product);
  });

  it("精确应用本次指定的产品数据口径", () => {
    expect(milkTeaProducts.some(
      (product) => product.brandId === "yidiandian" && product.productName === "奶香普洱",
    )).toBe(false);

    const singleReferenceValues: Record<string, number> = {
      波霸奶茶: 400,
      阿华田: 319,
      A2牛乳红茶: 128,
      奶绿装芒: 275,
      QQ美莓奶茶: 300,
      苹果奶绿: 247,
      四季奶青: 184,
      草莓A2牛乳绿茶: 205,
    };
    for (const [name, calories] of Object.entries(singleReferenceValues)) {
      const product = getProduct("yidiandian", name);
      expect(product.variants).toHaveLength(1);
      expect(product.variants[0]).toMatchObject({
        size: null, ice: null, temperature: null, sugar: null, version: null, base: null,
        calories,
        dataStatus: "unspecified_reference",
        reviewFlags: [],
      });
    }

    const longjing = getProduct("chagee", "龙井玄米酪");
    expect(longjing.variants).toHaveLength(1);
    expect(longjing.variants[0]).toMatchObject({ calories: 125, dataStatus: "unspecified_reference" });
    expect(isWheelEligibleProduct(longjing)).toBe(true);

    const superFruit = getProduct("chabaidao", "超级杯水果茶");
    expect(superFruit.variants.map((variant) => [variant.size, variant.ice, variant.sugar, variant.calories])).toEqual([
      ["大杯", "标准冰", "无糖", 275],
      ["大杯", "标准冰", "三分糖", 305],
      ["大杯", "标准冰", "五分糖", 319],
      ["大杯", "标准冰", "七分糖", 334],
    ]);

    const xiaonaimoProducts = milkTeaProducts.filter(
      (product) => product.brandId === "heytea" && product.productName.startsWith("小奶茉"),
    );
    expect(xiaonaimoProducts).toHaveLength(1);
    expect(xiaonaimoProducts[0].productName).toBe("小奶茉");
    expect(xiaonaimoProducts[0].variants).toContainEqual(expect.objectContaining({ size: "超大杯", calories: 202 }));
    expect(
      xiaonaimoProducts[0].variants.find(
        (variant) => variant.variantId === xiaonaimoProducts[0].defaultSelection.variantId,
      )?.size,
    ).not.toBe("超大杯");

    const matcha = getProduct("luckin", "抹茶好喝椰");
    expect(getDefaultCalories(matcha)).toBe(273);
    expect(matcha.variants.some((variant) => variant.calories === 149 || variant.calories === 279)).toBe(false);

    const butter = getProduct("luckin", "小黄油拿铁");
    expect(butter.variants).toHaveLength(1);
    expect(butter.variants[0]).toMatchObject({
      size: "大杯", ice: "正常冰", sugar: "不另外加糖", calories: 282,
      dataStatus: "specified_reference", reviewFlags: [],
    });
    expect(isWheelEligibleProduct(butter)).toBe(true);
  });

  it("指定糖度组按热量单调对应，橙香四季仍保留原异常数据", () => {
    const strawberry = getProduct("chabaidao", "草莓流心半熟芝士");
    expect(Object.fromEntries(strawberry.variants.map((variant) => [variant.sugar, variant.calories]))).toEqual({
      无糖: 263,
      全糖: 278,
    });

    const mango = getProduct("heytea", "椰椰芒芒");
    const mangoGroup = mango.variants.filter((variant) => variant.ice === "冰沙-少冰");
    expect(Object.fromEntries(mangoGroup.map((variant) => [variant.sugar, variant.calories]))).toEqual({
      不另外加糖: 215,
      少少少甜: 281,
      少少甜: 364,
      少甜: 377,
    });

    const moon = getProduct("chagee", "月抹静山");
    const hotGroup = moon.variants.filter((variant) => variant.temperature === "热");
    expect(Object.fromEntries(hotGroup.map((variant) => [variant.sugar, variant.calories]))).toEqual({
      不另外加糖: 360,
      少糖: 432,
      标准糖: 448,
    });

    const orange = getProduct("chagee", "橙香四季");
    expect(orange.variants.map((variant) => [variant.ice, variant.sugar, variant.calories])).toEqual([
      ["标准冰", "不另外加糖", 82],
      ["标准冰", "微糖", 250],
      ["标准冰", "半糖", 261],
      ["标准冰", "少糖", 269],
      ["标准冰", "标准糖", 271],
      ["少冰", "不另外加糖", 82],
      ["少冰", "微糖", 250],
      ["少冰", "半糖", 261],
      ["少冰", "少糖", 269],
      ["少冰", "标准糖", 271],
    ]);
    expect(orange.variants.filter((variant) => variant.dataStatus === "needs_review")).toHaveLength(4);
  });

  it("瑞幸 49 款简餐保留浏览但全部排除转盘", () => {
    const meals = milkTeaProducts.filter(
      (product) => product.brandId === "luckin" && product.category === "简餐家族",
    );
    expect(meals).toHaveLength(49);
    expect(meals.every((product) => product.excludeFromWheel === true)).toBe(true);
    expect(meals.every((product) => !isWheelEligibleProduct(product))).toBe(true);
    const browsed = filterMilkTeaProducts(milkTeaProducts, {
      brandIds: ["luckin"], categories: [], query: "", calorieBands: [], sort: "source",
    });
    expect(meals.every((product) => browsed.includes(product))).toBe(true);
  });

  it("品牌、分类和热量区间支持组内多选并集", () => {
    const filtered = filterMilkTeaProducts(milkTeaProducts, {
      brandIds: ["yidiandian", "heytea"],
      categories: ["纯茶", "果茶 / 果饮"],
      calorieBands: ["under100", "100to199"],
      query: "",
      sort: "source",
    });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((product) => ["yidiandian", "heytea"].includes(product.brandId))).toBe(true);
    expect(filtered.every((product) => ["纯茶", "果茶 / 果饮"].includes(product.displayCategory))).toBe(true);
    expect(filtered.every((product) => {
      const calories = getDefaultCalories(product);
      return calories !== null && calories < 200;
    })).toBe(true);
  });
});
