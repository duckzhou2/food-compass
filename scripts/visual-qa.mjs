import { mkdir } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const round = process.argv[2] ?? "round-1";
const port = 3100;
const baseUrl = `http://127.0.0.1:${port}`;
const projectRoot = process.cwd();
const outputDirectory = path.join(projectRoot, "artifacts", "visual-qa", round);
const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const viewports = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 1000 },
];

await mkdir(outputDirectory, { recursive: true });

const server = spawn(
  process.execPath,
  [path.join(projectRoot, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)],
  { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
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
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `home-${viewport.name}.png`), fullPage: true });
    const homeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await page.goto(`${baseUrl}/wheel`, { waitUntil: "networkidle" });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `wheel-${viewport.name}.png`), fullPage: true });
    const wheelOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

    await page.getByRole("button", { name: "转一下" }).click();
    await page.getByText("罗盘选中了").waitFor({ timeout: 5000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `result-${viewport.name}.png`), fullPage: true });

    await page.getByText("查看完整营养、来源与核验说明").click();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(outputDirectory, `result-details-${viewport.name}.png`), fullPage: true });

    if (viewport.width === 375) {
      await page.getByRole("button", { name: "展开" }).click();
      await page.getByLabel("关键词").fill("不存在的饮品-xyz");
      await page.getByText("没有符合条件的饮品").waitFor();
      await page.screenshot({ path: path.join(outputDirectory, "empty-375.png"), fullPage: true });
    }

    results.push({ viewport: viewport.name, homeOverflow, wheelOverflow, consoleErrors });
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  server.kill();
}

const failed = results.some((result) => result.homeOverflow || result.wheelOverflow || result.consoleErrors.length > 0);
console.log(JSON.stringify({ round, outputDirectory, results }, null, 2));
if (failed) process.exitCode = 1;
