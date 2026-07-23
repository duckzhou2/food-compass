import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const projectRoot = process.cwd();
const offlineUrl = pathToFileURL(path.join(projectRoot, "offline", "食物罗盘-离线版.html")).href;
const outputDirectory = path.join(projectRoot, "artifacts", "visual-qa-offline-meals");
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 900 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 1000 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const externalRequests = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("request", (request) => { if (!request.url().startsWith("file:")) externalRequests.push(request.url()); });
    await page.goto(`${offlineUrl}#food`, { waitUntil: "load" });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); location.reload(); });
    await page.waitForLoadState("load");
    await page.waitForFunction(() => document.querySelector("#food")?.classList.contains("active"));

    const initial = await page.evaluate(() => ({
      meals: MEAL_FOODS.length,
      candidateCount: Number(document.querySelector("#mealCandidateCount")?.textContent),
      categoryCount: Number(document.querySelector("#mealCategoryCount")?.textContent),
      uniqueIds: new Set(MEAL_FOODS.map((food) => food.id)).size === MEAL_FOODS.length,
    }));

    await page.getByRole("button", { name: "浏览食物" }).click();
    await page.getByLabel("搜索食物").fill("黄焖鸡米饭");
    await page.locator("[data-meal-food='meal-001']").click();
    const browseResult = (await page.locator("#mealBrowseResultSlot .result-head h2").textContent())?.trim();
    await page.getByRole("button", { name: "重置" }).click();
    await page.getByRole("button", { name: "转盘抽一个" }).click();
    await page.getByText(/盘面展示 24 个代表选项/).waitFor();
    await page.locator("#mealSelectAllCategories").click();
    await page.locator("#mealSelectAllCategories").click();
    await page.getByRole("button", { name: "重置" }).click();
    await page.locator("#mealSpinButton").click();
    await page.locator("#mealWheelResultSlot .result-head h2").waitFor({ timeout: 6_000 });
    const wheelResult = (await page.locator("#mealWheelResultSlot .result-head h2").textContent())?.trim();
    await page.locator("#mealWheelResultSlot [data-meal-action='confirm']").click();
    const historyCount = await page.evaluate(() => JSON.parse(localStorage.getItem("foodCompass.meal.history") || "[]").length);
    await page.getByRole("button", { name: "管理我的食物" }).click();
    await page.locator("#mealCustomName").fill("测试食堂窗口");
    await page.locator("#mealCustomNote").fill("离线验收");
    await page.getByRole("button", { name: "保存自定义食物" }).click();
    const customCount = await page.evaluate(() => JSON.parse(localStorage.getItem("foodCompass.meal.customFoods") || "[]").length);
    await page.getByRole("button", { name: "关闭" }).click();
    await page.reload({ waitUntil: "load" });
    const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem("foodCompass.meal.customFoods") || "[]").some((food) => food.name === "测试食堂窗口"));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    await page.screenshot({ path: path.join(outputDirectory, `food-${viewport.name}.png`), fullPage: true });
    results.push({ viewport: viewport.name, initial, browseResult, wheelResult, historyCount, customCount, persisted, overflow, consoleErrors, externalRequests });
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.some((result) =>
  result.initial.meals !== 459 || result.initial.candidateCount !== 459 || result.initial.categoryCount !== 9 ||
  !result.initial.uniqueIds || result.browseResult !== "黄焖鸡米饭" || !result.wheelResult ||
  result.historyCount !== 1 || result.customCount !== 1 || !result.persisted || result.overflow ||
  result.consoleErrors.length || result.externalRequests.length,
);

console.log(JSON.stringify(results, null, 2));
if (failed) throw new Error("离线正餐模块浏览器验收未通过");
