import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "artifacts", "visual-qa", "offline");
const offlineUrl = pathToFileURL(
  path.join(projectRoot, "offline", "食物罗盘-离线版.html"),
).href;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewports = [
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 1000 },
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const externalRequests = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("request", (request) => {
      if (!request.url().startsWith("file:") && !request.url().startsWith("data:")) {
        externalRequests.push(request.url());
      }
    });

    await page.goto(offlineUrl, { waitUntil: "load" });
    const homeCounts = await page.evaluate(() => ({
      products: document.querySelector("#heroProductCount")?.textContent,
      variants: document.querySelector("#heroVariantCount")?.textContent,
      toppings: document.querySelector("#heroToppingCount")?.textContent,
    }));
    await page.screenshot({
      path: path.join(outputDirectory, `home-${viewport.name}.png`),
      fullPage: false,
    });

    await page.goto(`${offlineUrl}#wheel`, { waitUntil: "load" });
    const categoryOptions = await page.locator("#categoryPills button").allTextContents();
    const dataLogic = await page.evaluate(() => {
      const hotProduct = PRODUCTS.find((product) => product.productName === "月抹静山");
      const hotSelection = resolveSelection(hotProduct);
      const methods = validOptions(hotProduct, hotSelection, "drinkingMethod");
      const yidiandianLemon = PRODUCTS.find(
        (product) => product.brandId === "yidiandian" && product.productName === "六窨香柠绿",
      );
      const luckinMeals = PRODUCTS.filter(
        (product) => product.brandId === "luckin" && product.category === "简餐家族",
      );
      const butter = PRODUCTS.find(
        (product) => product.brandId === "luckin" && product.productName === "小黄油拿铁",
      );
      const productIds = PRODUCTS.map((product) => product.productId);
      const variants = PRODUCTS.flatMap((product) => product.variants);
      const variantIds = variants.map((variant) => variant.variantId);
      const defaultsValid = PRODUCTS.every((product) =>
        product.variants.some((variant) => variant.variantId === product.defaultSelection.variantId),
      );
      const combinationsUnique = PRODUCTS.every((product) => {
        const combinations = product.variants.map((variant) => JSON.stringify([
          variant.size, variant.ice, variant.temperature, variant.sugar, variant.version, variant.base,
        ]));
        return new Set(combinations).size === combinations.length;
      });
      const toppingIdsUnique = BRANDS.every((brand) =>
        new Set(brand.toppings.map((topping) => topping.toppingId)).size === brand.toppings.length,
      );
      return {
        methods,
        brandCount: BRANDS.length,
        productIdsUnique: new Set(productIds).size === productIds.length,
        variantIdsUnique: new Set(variantIds).size === variantIds.length,
        defaultsValid,
        combinationsUnique,
        toppingIdsUnique,
        caloriesValid: variants.every(
          (variant) => variant.calories === null || (typeof variant.calories === "number" && Number.isFinite(variant.calories)),
        ),
        deletedProductAbsent: !PRODUCTS.some(
          (product) => product.brandId === "yidiandian" && product.productName === "奶香普洱",
        ),
        smallMilkJasmineCount: PRODUCTS.filter(
          (product) => product.brandId === "heytea" && product.productName.startsWith("小奶茉"),
        ).length,
        yidiandianLemonCalories: defaultCalories(yidiandianLemon),
        yidiandianLemonWheelEligible: wheelProducts().some(
          (product) => product.productId === yidiandianLemon.productId,
        ),
        luckinMealCount: luckinMeals.length,
        luckinMealsExcluded: luckinMeals.every(
          (product) => product.excludeFromWheel === true && !wheelProducts().some((candidate) => candidate.productId === product.productId),
        ),
        butterCalories: defaultCalories(butter),
        butterWheelEligible: wheelProducts().some((product) => product.productId === butter.productId),
        wheelHasOnlyCalories: wheelProducts().every((product) =>
          product.variants.some((variant) => variant.calories !== null && variant.dataStatus !== "needs_review"),
        ),
      };
    });
    await page.screenshot({
      path: path.join(outputDirectory, `catalog-${viewport.name}.png`),
      fullPage: false,
    });
    await page.getByRole("button", { name: "一点点", exact: true }).click();
    await page.getByRole("button", { name: "喜茶", exact: true }).click();
    const multiBrandValid = await page.evaluate(() =>
      state.brandIds.length === 2 &&
      state.products.every((product) => ["yidiandian", "heytea"].includes(product.brandId)),
    );
    await page.getByRole("button", { name: "喜茶", exact: true }).click();
    await page.getByLabel("搜索产品").fill("养乐多绿");
    await page.locator("#wheel .product-card").click();
    const browseResult = await page.evaluate(() => {
      const panel = document.querySelector("#resultPanel");
      const grid = document.querySelector("#productGrid");
      return {
        panelCount: document.querySelectorAll("#resultPanel").length,
        parentId: panel?.parentElement?.id,
        aboveGrid: Boolean(panel && grid && panel.getBoundingClientRect().top < grid.getBoundingClientRect().top),
      };
    });
    await page.getByRole("button", { name: "大杯", exact: true }).click();
    await page.getByText("仙草", { exact: true }).click();
    const configuredTotal = await page.locator(".calorie-item.total strong").textContent();
    await page.getByRole("button", { name: "就喝这个" }).click();
    await page.getByRole("button", { name: "收藏", exact: true }).click();
    const milkPersonalSaved = await page.evaluate(() => {
      const history = JSON.parse(localStorage.getItem("foodCompass.milkTea.history") ?? "[]");
      const favorites = JSON.parse(localStorage.getItem("foodCompass.milkTea.favorites") ?? "[]");
      return {
        historyCount: history.length,
        variantId: history[0]?.variantId,
        toppingCount: history[0]?.toppingIds?.length,
        favoriteCount: favorites.length,
      };
    });
    await page.reload({ waitUntil: "load" });
    const milkPersonalPersisted = await page.evaluate(() => ({
      historyCount: JSON.parse(localStorage.getItem("foodCompass.milkTea.history") ?? "[]").length,
      favoriteCount: JSON.parse(localStorage.getItem("foodCompass.milkTea.favorites") ?? "[]").length,
    }));
    await page.locator("#wheel .filters").evaluate((element) => { element.open = true; });
    await page.locator("#milkTeaManagerOpen").evaluate((button) => button.click());
    await page.getByRole("button", { name: /最近喝过/ }).click();
    const managerHasHistory = await page.locator("#milkTeaManagerContent").getByText("养乐多绿", { exact: false }).count();
    const importExportAvailable = await page.getByRole("button", { name: "导入导出" }).click().then(async () =>
      page.locator("#milkTeaImportFile").count(),
    );
    await page.getByRole("button", { name: "关闭" }).click();
    await page.screenshot({
      path: path.join(outputDirectory, `configured-${viewport.name}.png`),
      fullPage: false,
    });

    await page.getByRole("button", { name: "重置" }).click();
    await page.getByRole("button", { name: "100 kcal 以下", exact: true }).click();
    const calorieFilterValid = await page.evaluate(() =>
      state.products.every((product) => {
        const variant = product.variants.find(
          (item) => item.variantId === product.defaultSelection.variantId,
        ) ?? product.variants[0];
        return variant?.calories != null && variant.calories < 100;
      }),
    );

    await page.getByRole("button", { name: "重置" }).click();
    await page.getByRole("button", { name: "转盘抽一杯" }).click();
    await page.getByRole("button", { name: "转一下" }).click();
    await page.locator(".result-head h2").waitFor({ timeout: 5_000 });
    const wheelSelected = (await page.locator(".result-head h2").textContent())?.trim() ?? "";
    const wheelResultParent = await page.locator("#resultPanel").evaluate((panel) => panel.parentElement?.id);
    const selectedWheelId = await page.evaluate(() => state.selectedProductId);
    await page.getByRole("button", { name: "本轮排除" }).click();
    const sessionExclusionSaved = await page.evaluate((productId) => {
      const excluded = JSON.parse(sessionStorage.getItem("foodCompass.milkTea.sessionExclusions") ?? "[]");
      return excluded.includes(productId) && !wheelProducts().some((product) => product.productId === productId);
    }, selectedWheelId);
    const hashBeforeTop = await page.evaluate(() => window.location.hash);
    await page.evaluate(() => {
      Object.defineProperty(window, "scrollY", { configurable: true, value: 1000 });
      window.dispatchEvent(new Event("scroll"));
    });
    await page.waitForFunction(() => document.querySelector("#backToTop")?.classList.contains("visible"));
    const backToTopVisible = await page.locator("#backToTop").getAttribute("aria-hidden");
    const backToTop = await page.evaluate((hash) => {
      let requestedTop = -1;
      const originalScrollTo = window.scrollTo;
      window.scrollTo = (options) => {
        requestedTop = typeof options === "object" ? Number(options.top) : Number(options);
      };
      document.querySelector("#backToTop")?.click();
      window.scrollTo = originalScrollTo;
      Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
      return { top: requestedTop, hashUnchanged: window.location.hash === hash };
    }, hashBeforeTop);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );

    results.push({
      viewport: viewport.name,
      homeCounts,
      categoryOptions,
      dataLogic,
      browseResult,
      multiBrandValid,
      configuredTotal,
      milkPersonalSaved,
      milkPersonalPersisted,
      managerHasHistory,
      importExportAvailable,
      calorieFilterValid,
      wheelSelected,
      wheelResultParent,
      sessionExclusionSaved,
      backToTopVisible,
      backToTop,
      overflow,
      consoleErrors,
      externalRequests,
    });
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.some(
  (result) =>
    result.homeCounts.products !== "515" ||
    result.homeCounts.variants !== "2559" ||
    result.homeCounts.toppings !== "82" ||
    JSON.stringify(result.categoryOptions) !== JSON.stringify([
      "全部分类",
      "奶茶 / 奶绿",
      "鲜奶茶 / 轻乳茶",
      "纯茶",
      "果茶 / 果饮",
      "茶特调",
      "冰淇淋 / 甜品",
      "咖啡",
    ]) ||
    !["标准冰", "少冰", "热"].every((method) => result.dataLogic.methods.includes(method)) ||
    result.dataLogic.brandCount !== 8 ||
    !result.dataLogic.productIdsUnique ||
    !result.dataLogic.variantIdsUnique ||
    !result.dataLogic.defaultsValid ||
    !result.dataLogic.combinationsUnique ||
    !result.dataLogic.toppingIdsUnique ||
    !result.dataLogic.caloriesValid ||
    !result.dataLogic.deletedProductAbsent ||
    result.dataLogic.smallMilkJasmineCount !== 1 ||
    result.dataLogic.yidiandianLemonCalories !== 5 ||
    !result.dataLogic.yidiandianLemonWheelEligible ||
    result.dataLogic.luckinMealCount !== 49 ||
    !result.dataLogic.luckinMealsExcluded ||
    result.dataLogic.butterCalories !== 282 ||
    !result.dataLogic.butterWheelEligible ||
    !result.dataLogic.wheelHasOnlyCalories ||
    result.browseResult.panelCount !== 1 ||
    result.browseResult.parentId !== "browseResultSlot" ||
    !result.browseResult.aboveGrid ||
    !result.multiBrandValid ||
    result.configuredTotal !== "155 kcal" ||
    result.milkPersonalSaved.historyCount !== 1 ||
    !result.milkPersonalSaved.variantId ||
    result.milkPersonalSaved.toppingCount !== 1 ||
    result.milkPersonalSaved.favoriteCount !== 1 ||
    result.milkPersonalPersisted.historyCount !== 1 ||
    result.milkPersonalPersisted.favoriteCount !== 1 ||
    result.managerHasHistory !== 1 ||
    result.importExportAvailable !== 1 ||
    !result.calorieFilterValid ||
    !result.wheelSelected ||
    result.wheelResultParent !== "wheelResultSlot" ||
    !result.sessionExclusionSaved ||
    result.backToTopVisible !== "false" ||
    result.backToTop.top >= 2 ||
    !result.backToTop.hashUnchanged ||
    result.overflow ||
    result.consoleErrors.length > 0 ||
    result.externalRequests.length > 0,
);

console.log(JSON.stringify(results, null, 2));
if (failed) throw new Error("离线版浏览器验收未通过");
