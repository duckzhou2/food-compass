import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const sourcePath = path.resolve(projectRoot, "..", "milk_tea_products.json");
const supplementalPath = path.join(projectRoot, "data", "supplemental", "records.json");
const outputDirectory = path.join(projectRoot, "data", "generated");
const outputPath = path.join(outputDirectory, "products.json");
const manifestPath = path.join(outputDirectory, "manifest.json");

const [sourceText, supplementalText] = await Promise.all([
  readFile(sourcePath, "utf8"),
  readFile(supplementalPath, "utf8"),
]);
const sourceRecords = JSON.parse(sourceText);
const supplementalRecords = JSON.parse(supplementalText);
const records = [...sourceRecords, ...supplementalRecords];

if (!Array.isArray(records)) {
  throw new Error("milk_tea_products.json 顶层必须是数组");
}

const generatedAt = new Date().toISOString();
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
await writeFile(
  manifestPath,
  `${JSON.stringify(
    {
      generated_at: generatedAt,
      source_file: "../milk_tea_products.json",
      supplemental_file: "data/supplemental/records.json",
      source_record_count: sourceRecords.length,
      supplemental_record_count: supplementalRecords.length,
      record_count: records.length,
      note: "派生文件；原始数据未修改。",
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Generated ${records.length} records at ${outputPath}`);
