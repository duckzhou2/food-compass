import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const dataRoot = path.resolve(projectRoot, "..");
const jsonPath = path.join(dataRoot, "milk_tea_products.json");
const csvPath = path.join(dataRoot, "milk_tea_products.csv");
const supplementalPath = path.join(projectRoot, "data", "supplemental", "records.json");
const numericFields = [
  "volume_ml",
  "calories_kcal_min",
  "calories_kcal_max",
  "calories_kj_min",
  "calories_kj_max",
  "protein_g",
  "fat_g",
  "carbohydrate_g",
  "sugar_g",
  "caffeine_mg",
  "tea_polyphenols_mg",
];

const [jsonText, csvText, supplementalText] = await Promise.all([
  readFile(jsonPath, "utf8"),
  readFile(csvPath, "utf8"),
  readFile(supplementalPath, "utf8"),
]);
const sourceRecords = JSON.parse(jsonText);
const supplementalRecords = JSON.parse(supplementalText);
const records = [...sourceRecords, ...supplementalRecords];
const csvRecords = parse(csvText, { columns: true, bom: true, skip_empty_lines: true });
const errors = [];

if (!Array.isArray(records)) errors.push("JSON 顶层不是数组");
if (sourceRecords.length !== csvRecords.length) {
  errors.push(`原始 CSV/JSON 数量不一致：${csvRecords.length}/${sourceRecords.length}`);
}

const ids = new Set();
for (const [index, record] of records.entries()) {
  const label = record.record_id ?? `index ${index}`;
  if (!record.record_id || ids.has(record.record_id)) errors.push(`${label}: record_id 缺失或重复`);
  ids.add(record.record_id);
  if (record.region !== "中国大陆") errors.push(`${label}: region 不是中国大陆`);
  if (!record.is_estimated && !record.source_url) errors.push(`${label}: 非估算记录缺少来源`);
  if (record.is_estimated && !record.estimation_method) errors.push(`${label}: 估算记录缺少方法`);
  if (
    record.calories_kcal_min !== null &&
    record.calories_kcal_max !== null &&
    record.calories_kcal_min > record.calories_kcal_max
  ) {
    errors.push(`${label}: kcal 下限大于上限`);
  }
  for (const field of numericFields) {
    if (record[field] !== null && typeof record[field] !== "number") {
      errors.push(`${label}: ${field} 必须为数字或 null`);
    }
    if (record[field] === 0 && (!record.source_url || !record.notes)) {
      errors.push(`${label}: ${field}=0 缺少明确来源说明`);
    }
  }
  if (record.calories_kcal_min !== null && record.calories_kj_min !== null) {
    const expected = Math.round(record.calories_kcal_min * 4.184);
    if (Math.abs(expected - record.calories_kj_min) > 1) errors.push(`${label}: kcal/kJ 换算异常`);
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  const brands = Object.fromEntries(
    [...new Set(records.map((record) => record.brand_name))]
      .sort()
      .map((brand) => [brand, records.filter((record) => record.brand_name === brand).length]),
  );
  console.log(
    JSON.stringify(
      {
        valid: true,
        record_count: records.length,
        source_record_count: sourceRecords.length,
        supplemental_record_count: supplementalRecords.length,
        unique_record_ids: ids.size,
        records_with_calories: records.filter((record) => record.calories_kcal_min !== null).length,
        brands,
      },
      null,
      2,
    ),
  );
}
