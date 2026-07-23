import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = path.resolve(projectRoot, "..", "资料源", "北大食堂", "PKU_Canteen_Data_Pack_2026-07-15");
const outputRoot = path.join(projectRoot, "data", "canteens");
const readCsv = async (name) => parse(await readFile(path.join(sourceRoot, name), "utf8"), { columns: true, skip_empty_lines: true, bom: true });
const stableHash = (value) => createHash("sha256").update(value).digest("hex").slice(0, 12);
const clean = (value) => String(value ?? "").trim();
const nullableTime = (value) => clean(value) && clean(value) !== "—" ? clean(value) : null;

const registry = [
  ["zhongguanyuan", "中关园食堂", [], "区域待核验", false],
  ["songlin", "松林快餐", ["松林食堂"], "燕园校区", false],
  ["shaoyuan", "勺园食堂", [], "燕园校区", false],
  ["yannan", "燕南美食", ["燕南食堂"], "燕园校区", false],
  ["changchunyuan", "畅春园食堂", [], "区域待核验", false],
  ["tongyuan", "佟园食堂", [], "燕园校区", false],
  ["nongyuan", "农园食堂", [], "燕园校区", false],
  ["jiayuan", "家园食堂", [], "燕园校区", false],
  ["xuewu", "学五食堂", [], "燕园校区", false],
  ["xueyi", "学一食堂", [], "燕园校区", false],
  ["yiyuan-f2", "艺园二楼", [], "燕园校区", false],
  ["chengfuyuan", "成府园食堂", [], "区域待核验", false],
  ["xinyuan", "馨园食堂", [], "新燕园校区", false],
  ["changpingyuan", "昌平园食堂", ["昌平200号食堂", "昌平校区200号食堂"], "昌平校区", false],
  ["mobile-cart", "移动餐车", [], "点位待核验", true],
];

const canteenByAlias = new Map();
for (const [slug, name, aliases] of registry) for (const alias of [name, ...aliases]) canteenByAlias.set(alias, slug);
const normalizeCanteen = (name) => {
  const id = canteenByAlias.get(clean(name));
  if (!id) throw new Error(`未知食堂名称：${name}`);
  return id;
};

const floorAliases = new Map([
  ["地下", "B1"], ["地下一层", "B1"], ["B1自选", "B1"], ["B1咖啡厅", "B1"],
  ["整体", "未细分"], ["未细分", "未细分"], ["一至四层", "未细分"], ["一至三层", "未细分"],
]);
const zones = new Set(["东厅", "中厅", "西厅", "临时活动", "历史临时售卖点"]);
const normalizeFloor = (value) => zones.has(clean(value)) ? "未细分" : ((floorAliases.get(clean(value)) ?? clean(value)) || "未细分");
const floorCode = (name) => ({ "B1": "b1", "一层": "f1", "二层": "f2", "三层": "f3", "四层": "f4", "未细分": "unspecified" })[name] ?? `unit-${stableHash(name)}`;
const floorSort = (name) => ({ "B1": -1, "一层": 1, "二层": 2, "三层": 3, "四层": 4, "未细分": 99 })[name] ?? 50;
const floorId = (canteenId, name) => `floor-${canteenId}-${floorCode(name)}`;

function normalizePortion(name) {
  let base = clean(name);
  let portion = null;
  const count = base.match(/\*(\d+)$/);
  const sized = base.match(/[（(](小份?|中份?|大份?)[）)]$/);
  if (count) { portion = `${count[1]}个/份`; base = base.slice(0, count.index).trim(); }
  else if (sized) { portion = sized[1].replace(/^(小|中|大)$/, "$1份"); base = base.slice(0, sized.index).trim(); }
  return { base, portion };
}

const typeMap = { "0": "主食", "1": "菜品", "2": "点心", "3": "套餐" };
function inferCategory(name) {
  const rules = [
    ["米饭", /饭|盖浇|拌饭|木桶饭|煲仔/], ["面", /面|刀削|馄饨/], ["粉", /粉|米线/],
    ["包子", /包子|生煎包|水煎包/], ["饺子", /饺|水饺|抄手/], ["点心", /糕|酥|挞|饼|馒头|花卷|烧麦|油条/],
    ["炒菜", /炒|烧|焖|炖|蒸|煎|炸|烤|鱼|肉|鸡|鸭|虾|蛋|菜/], ["西餐", /披萨|汉堡|意面|牛排/],
    ["火锅/麻辣烫", /火锅|麻辣烫|香锅/], ["汤粥", /汤|粥|羹/],
  ];
  return rules.filter(([, re]) => re.test(name)).map(([label]) => label).slice(0, 2).length ? rules.filter(([, re]) => re.test(name)).map(([label]) => label).slice(0, 2) : ["其他"];
}
function inferCuisine(name) {
  const rules = [["川渝", /川|麻辣|担担|重庆|水煮|辣子鸡|酸菜鱼/], ["粤菜", /粤|广式|烧腊|白切鸡|叉烧/], ["西北/新疆", /新疆|西北|手抓饭|烤包子|馕|羊肉串/], ["日韩", /日韩|石锅|鳗鱼|咖喱鱼排/], ["西式", /披萨|汉堡|意面|牛排/], ["江浙", /江浙|江南|无锡|西湖|苏式/], ["东北", /东北|锅包肉|小鸡炖蘑菇/]];
  return rules.filter(([, re]) => re.test(name)).map(([label]) => label);
}
function classifyCuisine(name, observed, categories) {
  const text = `${observed.join(" ")} ${name}`;
  const rules = [
    ["川渝麻辣", /川渝|川菜|重庆|麻辣|担担|水煮|辣子鸡|酸菜鱼|冒菜/],
    ["湘赣风味", /湘菜|湘味|川湘|江西|赣|剁椒/],
    ["西北新疆", /西北|新疆|兰州|手抓|馕|羊肉串|肉夹馍|油泼|臊子/],
    ["粤式烧腊", /粤菜|闽粤|粤式|烧腊|叉烧|白切鸡|肠粉|潮汕/],
    ["江浙淮扬", /江浙|江南|淮扬|淮菜|无锡|西湖|苏式|杭州/],
    ["东北风味", /东北|龙江|锅包肉|小鸡炖蘑菇|地三鲜/],
    ["京鲁北方", /北京菜|鲁菜|京味|炸酱|卤煮/],
    ["日韩料理", /日韩|日式|韩式|石锅|鳗鱼|寿司|部队锅/],
    ["东南亚风味", /东南亚|泰式|越南|新加坡|叻沙|冬阴功/],
    ["西式餐食", /西式|披萨|汉堡|意面|牛排|焗饭|沙拉/],
    ["饮品甜品", /饮品|奶茶|咖啡|果汁|甜品|糖水|冰粉|酸奶/],
    ["点心烘焙", /烘焙|点心|糕|酥|挞|蛋糕|面包|包子|馒头|花卷|烧麦|油条/],
    ["汤粥轻食", /健康轻食|健康|米粉汤类|汤|粥|羹|轻食/],
  ];
  return rules.find(([, expression]) => expression.test(text))?.[0]
    ?? (categories.includes("点心") ? "点心烘焙" : categories.includes("汤粥") ? "汤粥轻食" : "家常中餐");
}
const genericDish = (name) => /未公开|未找到|每餐\d+种|按100克计价|各类|多种|时令蔬菜|菌菇仿荤类|荤素食材|淮、川、鲁家常菜/.test(name);
const statusFromOfficial = (status) => /临时|季节/.test(status) ? "temporary" : /2025|2026|当前|改造后/.test(status) ? "current_official" : "official_historical";

const sourceRows = await readCsv("source_index.csv");
const sources = sourceRows.map((row) => ({ id: row.source_id, title: row.title, url: row.url, date: row.date_or_status, sourceClass: row.source_class, use: row.use }));
const sourceById = new Map(sources.map((source) => [source.id, source]));
const hoursRows = await readCsv("official_hours_2022_reference.csv");
const summerRows = await readCsv("summer_2026_status.csv");
const officialRows = await readCsv("official_windows_dishes_extracted.csv");
const mergedRows = await readCsv("PKUHealthier_514_records_merged.csv");
const exactDuplicates = await readCsv("duplicate_exact_names.csv");
const normalizedDuplicates = await readCsv("duplicate_normalized_names.csv");

const expectedFiles = { "jia1.csv":25,"jia2.csv":36,"jia3.csv":10,"xue1.csv":71,"yan.csv":57,"song.csv":46,"shao1.csv":33,"shao2.csv":26,"xue5.csv":53,"nong1.csv":63,"nong2.csv":36,"tong.csv":58 };
const rawFields = ["id","name","type","energy","protein","fat","sugar","pepper","all_veg","money","scores"];
const numericFields = new Set(["id","type","energy","protein","fat","sugar","pepper","all_veg","money","scores"]);
let rawCompared = 0;
for (const [file, count] of Object.entries(expectedFiles)) {
  const raw = await readCsv(path.join("raw_github", file));
  const merged = mergedRows.filter((row) => row.source_file === file);
  if (raw.length !== count || merged.length !== count) throw new Error(`${file} 记录数不符`);
  raw.forEach((row, index) => {
    for (const field of rawFields) {
      const same = numericFields.has(field) ? Number(row[field]) === Number(merged[index][field]) : clean(row[field]) === clean(merged[index][field]);
      if (!same) throw new Error(`${file}:${index + 2}:${field} 与合并文件不一致`);
    }
    rawCompared += 1;
  });
}
if (rawCompared !== 514 || mergedRows.length !== 514) throw new Error("GitHub 原始数据必须恰好为 514 条");

const hoursByCanteen = new Map();
for (const row of hoursRows) {
  const id = normalizeCanteen(row.canteen);
  const item = { unit: row.unit, breakfast: nullableTime(row.breakfast), lunch: nullableTime(row.lunch), dinner: nullableTime(row.dinner), notes: row.notes, sourceId: "WEB-04", status: "official_historical" };
  hoursByCanteen.set(id, [...(hoursByCanteen.get(id) ?? []), item]);
}
const summerByCanteen = new Map(summerRows.map((row) => [normalizeCanteen(row.canteen), { unit: row.unit, stopDate: row.stop_date, reopenDate: row.reopen_date, label: row.status_as_of_2026_07_15, asOf: "2026-07-15" }]));
const canteens = registry.map(([slug, name, aliases, campus, isServicePoint]) => ({ id: `canteen-${slug}`, name, aliases, campus, area: campus.includes("待核验") || campus.includes("点位") ? null : campus, isServicePoint, hours: hoursByCanteen.get(slug) ?? [], summerStatus: summerByCanteen.get(slug) ?? null, sourceIds: ["WEB-01", ...(summerByCanteen.has(slug) ? ["WEB-05"] : [])], notes: [] }));
const canteenId = (slug) => `canteen-${slug}`;

const floorMap = new Map();
function ensureFloor(slug, name) {
  const normalized = normalizeFloor(name);
  const id = floorId(slug, normalized);
  if (!floorMap.has(id)) floorMap.set(id, { id, canteenId: canteenId(slug), name: normalized, sortOrder: floorSort(normalized), isPhysical: normalized !== "未细分" });
  return id;
}
for (const row of officialRows) if (!/临时活动|历史临时售卖点/.test(row.floor)) ensureFloor(normalizeCanteen(row.canteen), row.floor);
for (const row of mergedRows) ensureFloor(normalizeCanteen(row.canteen), row.floor);
for (const row of hoursRows) {
  const slug = normalizeCanteen(row.canteen);
  for (const match of clean(row.unit).matchAll(/B1|一层|二层|三层|四层/g)) ensureFloor(slug, match[0]);
  if (![...clean(row.unit).matchAll(/B1|一层|二层|三层|四层/g)].length) ensureFloor(slug, "未细分");
}
for (const [slug] of registry) if (![...floorMap.values()].some((floor) => floor.canteenId === canteenId(slug))) ensureFloor(slug, "未细分");
const floors = [...floorMap.values()].sort((a, b) => a.canteenId.localeCompare(b.canteenId) || a.sortOrder - b.sortOrder);

const windows = [];
const activities = [];
const dishMap = new Map();
const skuIds = new Set();
function dishKey(slug, floorName, base) { return `${slug}|${normalizeFloor(floorName)}|${base}`; }
function ensureDish(slug, floorName, rawName) {
  const { base, portion } = normalizePortion(rawName);
  const key = dishKey(slug, floorName, base);
  if (!dishMap.has(key)) dishMap.set(key, { id: `dish-${slug}-${floorCode(normalizeFloor(floorName))}-${stableHash(key)}`, canteenId: canteenId(slug), floorId: ensureFloor(slug, floorName), windowIds: [], name: base, baseDishName: base, rawNames: [], portions: [], dishTypes: [], categories: [], cuisines: [], mealPeriods: [], skus: [], evidence: [], isTemporary: false, searchText: "" });
  const dish = dishMap.get(key);
  if (!dish.rawNames.includes(rawName)) dish.rawNames.push(rawName);
  if (portion && !dish.portions.includes(portion)) dish.portions.push(portion);
  return { dish, portion };
}

for (let index = 0; index < officialRows.length; index += 1) {
  const row = officialRows[index];
  const slug = normalizeCanteen(row.canteen);
  const sourceIds = row.source_id.split(";").map(clean).filter(Boolean);
  const items = row.dishes.split("；").map(clean).filter(Boolean);
  if (/临时活动|历史临时售卖点/.test(row.floor)) {
    activities.push({ id: `activity-${slug}-${index + 1}`, canteenId: canteenId(slug), name: row.window_or_category, dateLabel: row.status, dishes: items, sourceIds, notes: [row.notes].filter(Boolean) });
    continue;
  }
  const fId = ensureFloor(slug, row.floor);
  const windowId = `window-${slug}-${floorCode(normalizeFloor(row.floor))}-${stableHash(`${row.window_or_category}|${index}`)}`;
  const status = statusFromOfficial(row.status);
  const notes = [row.notes, ...items.filter(genericDish)].filter(Boolean);
  windows.push({ id: windowId, canteenId: canteenId(slug), floorId: fId, zone: zones.has(row.floor) ? row.floor : null, name: row.window_or_category, cuisine: row.cuisine.split(/[；/]/).map(clean).filter(Boolean), status, sourceIds, notes });
  for (const item of items.filter((name) => !genericDish(name))) {
    const { dish } = ensureDish(slug, row.floor, item.replace(/（[^）]*元[^）]*）/g, "").trim());
    if (!dish.windowIds.includes(windowId)) dish.windowIds.push(windowId);
    const inferredTypes = /主食|面食|米粉|点心|糕点|包点/.test(row.window_or_category) ? ["主食"] : /套餐|拌饭|木桶饭/.test(row.window_or_category) ? ["套餐"] : ["菜品"];
    dish.dishTypes.push(...inferredTypes.filter((value) => !dish.dishTypes.includes(value)));
    dish.categories.push(...inferCategory(dish.name).filter((value) => !dish.categories.includes(value)));
    dish.cuisines.push(...row.cuisine.split(/[；/]/).map(clean).filter((value) => value && !dish.cuisines.includes(value)));
    const date = sourceIds.map((id) => sourceById.get(id)?.date).filter(Boolean).join("；");
    dish.evidence.push({ id: `evidence-official-${index + 1}-${stableHash(item)}`, sourceIds, sourceDate: date || "日期待核验", status, note: row.status });
  }
}

for (const row of mergedRows) {
  const slug = normalizeCanteen(row.canteen);
  const { dish, portion } = ensureDish(slug, row.floor, row.name);
  const skuId = `sku-gh-${row.source_file.replace(".csv", "")}-${String(row.id).padStart(3, "0")}`;
  if (skuIds.has(skuId)) throw new Error(`重复 SKU ID：${skuId}`);
  skuIds.add(skuId);
  const type = typeMap[row.type];
  if (!type) throw new Error(`未知菜品类型：${row.type}`);
  if (!dish.dishTypes.includes(type)) dish.dishTypes.push(type);
  dish.categories.push(...inferCategory(dish.name).filter((value) => !dish.categories.includes(value)));
  dish.cuisines.push(...inferCuisine(dish.name).filter((value) => !dish.cuisines.includes(value)));
  dish.skus.push({ id: skuId, dishId: dish.id, sourceFile: row.source_file, originalId: row.id, rawName: row.name, portion, priceCny: Number(row.money), energyKcal: Number(row.energy), proteinG: Number(row.protein), fatG: Number(row.fat), isHighSugar: row.sugar === "1", isPepperHot: row.pepper === "1", isVegetarian: row.all_veg === "1", sourceStatus: "github_historical" });
  if (!dish.evidence.some((item) => item.id === `evidence-gh-${row.source_file}`)) dish.evidence.push({ id: `evidence-gh-${row.source_file}`, sourceIds: ["GH-01"], sourceDate: "核心数据主要形成于2024；具体采集日期未知", status: "github_historical", note: "价格与每份营养均为历史参考；份量克重和测算来源未注明" });
}

function periodsFor(dish) {
  const canteen = canteens.find((item) => item.id === dish.canteenId);
  const floor = floors.find((item) => item.id === dish.floorId)?.name;
  const matching = canteen.hours.filter((hour) => hour.unit.includes(floor) || floor === "未细分" || hour.unit === "整体");
  const periods = new Set();
  for (const hour of matching) {
    if (hour.breakfast) periods.add("breakfast");
    if (hour.lunch) periods.add("lunch");
    if (hour.dinner) periods.add("dinner");
    if ([hour.breakfast, hour.lunch, hour.dinner].some((value) => value && Number(value.match(/-(\d{1,2}):/)?.[1] ?? 0) >= 21)) periods.add("late_night");
  }
  return [...periods];
}
const dishes = [...dishMap.values()].map((dish) => {
  dish.mealPeriods = periodsFor(dish);
  dish.rawCuisines = [...dish.cuisines];
  dish.cuisines = [classifyCuisine(dish.name, dish.rawCuisines, dish.categories)];
  dish.cuisineInferred = true;
  dish.evidence.push({ id: `evidence-inferred-cuisine-${dish.id}`, sourceIds: [], sourceDate: "2026-07-15", status: "inferred", note: `风味分类“${dish.cuisines[0]}”根据菜名、原始菜系和菜品形态统一推断，不代表食堂官方分类` });
  const canteen = canteens.find((item) => item.id === dish.canteenId);
  const floor = floors.find((item) => item.id === dish.floorId);
  const windowNames = dish.windowIds.map((id) => windows.find((item) => item.id === id)?.name).filter(Boolean);
  dish.searchText = [canteen.name, ...canteen.aliases, floor.name, ...windowNames, dish.name, ...dish.rawNames, ...dish.categories, ...dish.cuisines, ...dish.dishTypes].join(" ").toLocaleLowerCase("zh-CN");
  return dish;
}).sort((a, b) => a.canteenId.localeCompare(b.canteenId) || a.name.localeCompare(b.name, "zh-CN"));

const dishIds = new Set(dishes.map((dish) => dish.id));
const floorIds = new Set(floors.map((floor) => floor.id));
const windowIds = new Set(windows.map((window) => window.id));
if (dishIds.size !== dishes.length || floorIds.size !== floors.length || windowIds.size !== windows.length || skuIds.size !== 514) throw new Error("生成数据存在重复 ID");
for (const dish of dishes) {
  if (!floorIds.has(dish.floorId) || dish.windowIds.some((id) => !windowIds.has(id)) || dish.skus.some((sku) => sku.dishId !== dish.id)) throw new Error(`菜品关联失效：${dish.id}`);
}

const catalog = { generatedAt: "2026-07-15T00:00:00+08:00", researchDate: "2026-07-15", sources, canteens, floors, windows, dishes, activities };
const report = {
  generatedAt: catalog.generatedAt,
  hardChecks: { rawGithubRecords: rawCompared, mergedGithubRecords: mergedRows.length, githubSkuIds: skuIds.size, sourceFiles: Object.keys(expectedFiles).length, canteens: canteens.filter((item) => !item.isServicePoint).length, servicePoints: canteens.filter((item) => item.isServicePoint).length, uniqueDishIds: dishIds.size, uniqueFloorIds: floorIds.size, uniqueWindowIds: windowIds.size, brokenRelations: 0 },
  githubFileCounts: Object.fromEntries(Object.keys(expectedFiles).map((file) => [file, mergedRows.filter((row) => row.source_file === file).length])),
  entities: { sources: sources.length, canteens: canteens.length, servicePoints: canteens.filter((item) => item.isServicePoint).length, physicalFloors: floors.filter((floor) => floor.isPhysical).length, structuralFloorNodes: floors.length, windows: windows.length, dishes: dishes.length, skus: skuIds.size, activities: activities.length, windowPendingDishes: dishes.filter((dish) => dish.windowIds.length === 0).length },
  duplicateInputs: { exactGroups: exactDuplicates.length, normalizedGroups: normalizedDuplicates.length },
  notes: ["官网聚合描述保存在窗口说明中，不计为具体菜品。", "GitHub 菜品不依据菜名自动绑定官方窗口。", "GitHub 价格与营养统一作为历史参考。"],
};

await mkdir(outputRoot, { recursive: true });
await writeFile(path.join(outputRoot, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
await writeFile(path.join(outputRoot, "import-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
