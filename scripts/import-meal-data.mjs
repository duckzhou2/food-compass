import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const guidePath = path.resolve(projectRoot, "..", "资料源", "今天吃什么", "食物罗盘_今天吃什么模块_Codex开发指导.md");
const outputPath = path.join(projectRoot, "data", "meals", "foods.json");

const categoryCounts = {
  rice: 55,
  noodles: 74,
  dumplings: 41,
  spicy_pot: 38,
  chinese_snack: 55,
  asia: 47,
  western: 46,
  light: 49,
  group: 54,
};

const guide = await readFile(guidePath, "utf8");
const match = guide.match(
  /# 12\. 可直接嵌入的结构化种子数据[\s\S]*?```json\s*(\[[\s\S]*?\])\s*```/,
);

if (!match) throw new Error("未在指导文档中找到餐食 JSON 数据块。");

const foods = JSON.parse(match[1]);
if (!Array.isArray(foods) || foods.length !== 459) {
  throw new Error(`餐食种子数据应为 459 条，实际为 ${foods.length} 条。`);
}

const ids = new Set();
const names = new Set();
const actualCounts = Object.fromEntries(Object.keys(categoryCounts).map((id) => [id, 0]));

for (const food of foods) {
  if (ids.has(food.id)) throw new Error(`餐食 ID 重复：${food.id}`);
  if (names.has(food.name)) throw new Error(`餐食名称重复：${food.name}`);
  if (!(food.categoryId in actualCounts)) throw new Error(`未知餐食分类：${food.categoryId}`);
  ids.add(food.id);
  names.add(food.name);
  actualCounts[food.categoryId] += 1;
}

for (const [categoryId, expected] of Object.entries(categoryCounts)) {
  if (actualCounts[categoryId] !== expected) {
    throw new Error(`${categoryId} 应为 ${expected} 条，实际为 ${actualCounts[categoryId]} 条。`);
  }
}

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(foods, null, 2)}\n`, "utf8");
console.log(`已生成 ${path.relative(projectRoot, outputPath)}：${foods.length} 条餐食。`);
