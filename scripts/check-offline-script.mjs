import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";

const projectRoot = process.cwd();
const offlineDirectory = path.join(projectRoot, "offline");
const htmlPath = path.join(offlineDirectory, "食物罗盘-离线版.html");
const rootHtmlPath = path.resolve(projectRoot, "..", "食物罗盘-离线版.html");
const source = await readFile(htmlPath, "utf8");
const rootSource = await readFile(rootHtmlPath, "utf8");
if (source !== rootSource) throw new Error("项目内与根目录离线文件内容不一致");
const scripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());

if (scripts.length === 0) throw new Error("离线 HTML 中未找到内联 JavaScript");

const outputDirectory = path.join(projectRoot, "artifacts", "checks");
await mkdir(outputDirectory, { recursive: true });

for (const [index, script] of scripts.entries()) {
  const temporaryPath = path.join(outputDirectory, `offline-inline-${index + 1}.js`);
  await writeFile(temporaryPath, script, "utf8");
  const result = spawnSync(process.execPath, ["--check", temporaryPath], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  await rm(temporaryPath, { force: true });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
}

console.log(`node --check 已通过：${scripts.length} 段离线内联脚本；两份离线文件内容一致`);
