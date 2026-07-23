import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const round = process.argv[2] ?? "round-1";
const port = 4317;
const baseUrl = `http://127.0.0.1:${port}`;
const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "artifacts", "visual-qa", round);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewports = [
  { name: "360", width: 360, height: 800 },
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 900 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 1000 },
];

await mkdir(outputDirectory, { recursive: true });

const server = spawn(
  process.execPath,
  [path.join(projectRoot, "dist", "local-server.mjs")],
  {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("本地 Next.js 服务未在 10 秒内启动");
}

const results = [];
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, executablePath: chromePath });

  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height } });
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") {
        const location = message.location();
        consoleErrors.push(`${message.text()}${location.url ? ` · ${location.url}` : ""}`);
      }
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `home-${viewport.name}.png`), fullPage: true });
    const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await page.goto(`${baseUrl}/wheel`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `wheel-${viewport.name}.png`), fullPage: true });
    const wheelOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await page.getByRole("region", { name: "产品列表" }).locator("button").first().click();
    const browseResultAboveList = await page.evaluate(() => {
      const panel = document.querySelector("#resultPanel");
      const list = document.querySelector('[aria-label="产品列表"]');
      return document.querySelectorAll("#resultPanel").length === 1 &&
        Boolean(panel && list && panel.getBoundingClientRect().top < list.getBoundingClientRect().top);
    });

    await page.getByRole("button", { name: "转盘抽一杯" }).click();
    await page.getByRole("button", { name: "转一下" }).click();
    await page.getByText("当前选择").waitFor({ timeout: 5000 });
    const wheelResultBelowCard = await page.evaluate(() => {
      const panel = document.querySelector("#resultPanel");
      const wheel = document.querySelector('svg[aria-label*="随机抽取"]')?.closest("section");
      return Boolean(panel && wheel && panel.getBoundingClientRect().top >= wheel.getBoundingClientRect().bottom);
    });
    const hashBeforeTop = await page.evaluate(() => window.location.hash);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => document.querySelector('[aria-label="回到页面顶部"]')?.getAttribute("aria-hidden") === "false");
    await page.getByRole("button", { name: "回到页面顶部" }).click();
    await page.waitForFunction(() => window.scrollY < 2);
    const backToTopValid = await page.evaluate((hash) => window.scrollY < 2 && window.location.hash === hash, hashBeforeTop);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `result-${viewport.name}.png`), fullPage: true });

    if (viewport.width === 360) {
      await page.getByRole("button", { name: "展开" }).click();
      await page.getByLabel("产品名称搜索").fill("不存在的饮品-xyz");
      await page.getByText("没有符合条件的饮品").waitFor();
      await page.screenshot({ path: path.join(outputDirectory, "empty-360.png"), fullPage: true });
    }

    await page.goto(`${baseUrl}/meals`, { waitUntil: "networkidle" });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: "networkidle" });
    const mealCandidateCount = await page.getByText(/当前有/).locator("strong").first().textContent();
    const filterToggle = page.getByRole("button", { name: "展开" });
    if (await filterToggle.isVisible()) await filterToggle.click();
    await page.getByRole("button", { name: "浏览食物" }).click();
    await page.getByLabel("食物名称搜索").fill("黄焖鸡米饭");
    await page.getByRole("region", { name: "食物列表" }).locator("button").click();
    const mealBrowseResult = (await page.getByRole("heading", { name: "黄焖鸡米饭" }).textContent())?.trim();
    await page.screenshot({ path: path.join(outputDirectory, `meals-${viewport.name}.png`), fullPage: true });
    const mealsOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.getByRole("button", { name: "清空筛选" }).click();
    await page.getByRole("button", { name: "转盘抽一个" }).click();
    await page.getByText(/盘面展示 24 个代表选项/).waitFor();
    await page.getByRole("button", { name: "取消全选" }).click();
    await page.getByRole("button", { name: "一键全选" }).click();
    await page.getByRole("button", { name: "清空筛选" }).click();
    await page.getByRole("button", { name: "转一道" }).click();
    await page.getByText("今天吃", { exact: true }).waitFor({ timeout: 6000 });
    const mealWheelResult = await page.locator("article[aria-live='polite'] h2").textContent();

    await page.goto(`${baseUrl}/canteens`, { waitUntil: "networkidle" });
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload({ waitUntil: "networkidle" });
    const canteenHeading = (await page.getByRole("heading", { level: 1, name: "北大食堂" }).textContent())?.trim();
    await page.getByLabel("搜索食堂、窗口或菜品").fill("襄阳牛肉面");
    await page.getByRole("button", { name: "菜品浏览" }).click();
    await page.getByRole("button", { name: "查看菜品详情" }).click();
    const canteenDishDetail = (await page.getByRole("dialog", { name: "襄阳牛肉面详情" }).getByRole("heading", { name: "襄阳牛肉面" }).textContent())?.trim();
    await page.getByRole("dialog", { name: "襄阳牛肉面详情" }).getByRole("button", { name: "关闭" }).click();
    await page.getByRole("button", { name: "转盘帮我选" }).click();
    await page.getByRole("button", { name: "抽食堂" }).click();
    await page.getByRole("button", { name: "就选这个食堂" }).click();
    await page.getByRole("button", { name: "抽窗口" }).click();
    await page.getByRole("button", { name: "就选这个窗口" }).click();
    await page.getByRole("button", { name: "抽菜品" }).click();
    const canteenRecommendation = (await page.locator(".result-reveal h3").textContent())?.trim();
    await page.getByRole("button", { name: "就吃这个" }).click();
    const canteenStored = await page.evaluate(() => JSON.parse(localStorage.getItem("foodCompass.canteen.recentSelections") ?? "[]").length === 1);
    const canteensOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const canteenOverflowElements = await page.evaluate(() => [...document.querySelectorAll("body *")]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1;
      })
      .slice(0, 8)
      .map((element) => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 50), className: element.className })));
    await page.screenshot({ path: path.join(outputDirectory, `canteens-${viewport.name}.png`), fullPage: true });

    results.push({ viewport: viewport.name, homeOverflow, wheelOverflow, mealsOverflow, canteensOverflow, canteenOverflowElements, mealCandidateCount, mealBrowseResult, mealWheelResult, canteenHeading, canteenDishDetail, canteenRecommendation, canteenStored, browseResultAboveList, wheelResultBelowCard, backToTopValid, consoleErrors });
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

const failed = results.some((result) =>
  result.homeOverflow ||
  result.wheelOverflow ||
  result.mealsOverflow ||
  result.canteensOverflow ||
  result.mealCandidateCount !== "459" ||
  result.mealBrowseResult !== "黄焖鸡米饭" ||
  !result.mealWheelResult ||
  result.canteenHeading !== "北大食堂" ||
  result.canteenDishDetail !== "襄阳牛肉面" ||
  !result.canteenRecommendation ||
  !result.canteenStored ||
  !result.browseResultAboveList ||
  !result.wheelResultBelowCard ||
  !result.backToTopValid ||
  result.consoleErrors.length > 0,
);
console.log(JSON.stringify({ round, outputDirectory, results }, null, 2));
if (failed) process.exitCode = 1;
