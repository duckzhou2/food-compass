import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = process.cwd();
const output = path.join(root, "artifacts", "visual-qa", "offline-takeout");
const url = `${pathToFileURL(path.join(root, "offline", "食物罗盘-离线版.html")).href}#takeout`;
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewports = [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 1000 }];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    const externalRequests = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    page.on("request", (request) => { if (!request.url().startsWith("file:") && !request.url().startsWith("data:")) externalRequests.push(request.url()); });
    await page.goto(url, { waitUntil: "load" });
    const data = await page.evaluate(() => ({ count: TAKEOUT_MODULE_DATA.merchants.length, unique: new Set(TAKEOUT_MODULE_DATA.merchants.map((item) => item.id)).size, categories: takeoutRefs.categories.length, areas: takeoutRefs.areas.length, pool: takeoutWheelPool().length }));
    await page.locator("#takeoutModeSwitch [data-takeout-mode='browse']").click();
    await page.locator("#takeoutSearch").fill("102蹄花火锅");
    await page.locator("#takeoutGrid .product-card").first().click();
    const browseResult = await page.locator("#takeoutBrowseResult .result-head h2").textContent();
    await page.locator("#takeoutReset").click();
    await page.locator("#takeoutModeSwitch [data-takeout-mode='wheel']").click();
    await page.locator("#takeoutSpin").click();
    await page.waitForFunction(() => !takeoutState.spinning && Boolean(takeoutState.selectedId), null, { timeout: 5_000 });
    const wheelResult = await page.locator("#takeoutWheelResult .result-head h2").textContent();
    await page.locator("#takeoutWheelResult [data-takeout-action='confirm']").click();
    await page.locator("#takeoutWheelResult [data-takeout-action='favorite']").click();
    const saved = await page.evaluate(() => ({ history: JSON.parse(localStorage.getItem("foodCompass.takeout.history") ?? "[]").length, favorites: JSON.parse(localStorage.getItem("foodCompass.takeout.favorites") ?? "[]").length }));
    await page.locator("#takeoutManagerOpen").click();
    await page.locator("#takeoutCustomName").fill("测试自定义商户");
    await page.locator("#takeoutCustomAddress").fill("北京大学南门测试地址");
    await page.locator("#takeoutCustomDistance").fill("1.2");
    await page.locator("#takeoutCustomForm .takeout-primary").click();
    const customSaved = await page.evaluate(() => JSON.parse(localStorage.getItem("foodCompass.takeout.customMerchants") ?? "[]").length);
    const transferAvailable = await page.locator("[data-takeout-tab='transfer']").click().then(async () => page.locator("#takeoutImport").count());
    await page.locator("#takeoutManagerClose").click();
    await page.screenshot({ path: path.join(output, `takeout-${viewport.name}.png`), fullPage: false });
    await page.goto(`${url.slice(0, url.indexOf("#"))}#data`, { waitUntil: "load" });
    await page.locator("[data-offline-data='takeout']").click();
    const dataPanelVisible = await page.locator("#offlineTakeoutData").isVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(output, `data-${viewport.name}.png`), fullPage: false });
    results.push({ viewport: viewport.name, data, browseResult: browseResult?.trim(), wheelResult: wheelResult?.trim(), saved, customSaved, transferAvailable, dataPanelVisible, overflow, consoleErrors, externalRequests });
    await page.close();
  }
} finally { await browser.close(); }

console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.data.count !== 339 || result.data.unique !== 339 || result.data.categories !== 9 || result.data.areas !== 9 || result.data.pool !== 339 || result.browseResult !== "102蹄花火锅（北大南门店）" || !result.wheelResult || result.saved.history !== 1 || result.saved.favorites !== 1 || result.customSaved !== 1 || result.transferAvailable !== 1 || !result.dataPanelVisible || result.overflow || result.consoleErrors.length || result.externalRequests.length)) throw new Error("外卖离线版浏览器验收未通过");
