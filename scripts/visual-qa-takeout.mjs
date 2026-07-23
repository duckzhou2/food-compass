import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = process.cwd();
const port = 4318;
const baseUrl = `http://127.0.0.1:${port}`;
const output = path.join(root, "artifacts", "visual-qa", "takeout");
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const server = spawn(process.execPath, [path.join(root, "dist", "local-server.mjs")], { cwd: root, env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore", windowsHide: true });
await mkdir(output, { recursive: true });

for (let attempt = 0; attempt < 40; attempt += 1) {
  try { if ((await fetch(baseUrl)).ok) break; } catch { /* server is starting */ }
  await new Promise((resolve) => setTimeout(resolve, 250));
}

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const results = [];
try {
  for (const viewport of [{ name: "mobile", width: 390, height: 844 }, { name: "desktop", width: 1440, height: 1000 }]) {
    const page = await browser.newPage({ viewport });
    const consoleErrors = [];
    page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
    await page.goto(`${baseUrl}/takeout`, { waitUntil: "networkidle" });
    const initialCount = await page.getByText(/当前有/).locator("strong").textContent();
    await page.getByRole("button", { name: "浏览商户", exact: true }).click();
    const filterToggle = page.getByRole("button", { name: /筛选条件/ });
    if (await filterToggle.isVisible()) await filterToggle.click();
    await page.getByLabel("外卖商户搜索").fill("102蹄花火锅");
    await page.getByRole("button", { name: /102蹄花火锅/ }).click();
    const browseResult = await page.getByRole("heading", { name: "102蹄花火锅（北大南门店）", exact: true }).textContent();
    await page.getByRole("button", { name: "清空筛选", exact: true }).click();
    await page.getByRole("button", { name: "转盘抽一家", exact: true }).click();
    await page.getByRole("button", { name: "抽一家", exact: true }).click();
    await page.waitForFunction(() => [...document.querySelectorAll("button")].some((button) => button.textContent === "换一家"), null, { timeout: 5_000 });
    const wheelResult = await page.locator("article.result-reveal h2").textContent();
    await page.getByRole("button", { name: "就点这家", exact: true }).click();
    await page.locator("article.result-reveal").getByRole("button", { name: /收藏/ }).click();
    const saved = await page.evaluate(() => ({ history: JSON.parse(localStorage.getItem("foodCompass.takeout.history") ?? "[]").length, favorites: JSON.parse(localStorage.getItem("foodCompass.takeout.favorites") ?? "[]").length }));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    await page.screenshot({ path: path.join(output, `${viewport.name}.png`), fullPage: false });
    results.push({ viewport: viewport.name, initialCount: initialCount?.trim(), browseResult: browseResult?.trim(), wheelResult: wheelResult?.trim(), saved, overflow, consoleErrors });
    await page.close();
  }
} finally { await browser.close(); server.kill(); }

console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.initialCount !== "339" || result.browseResult !== "102蹄花火锅（北大南门店）" || !result.wheelResult || result.saved.history !== 1 || result.saved.favorites !== 1 || result.overflow || result.consoleErrors.length)) throw new Error("外卖本地站浏览器验收未通过");
