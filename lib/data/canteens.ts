import catalogJson from "@/data/canteens/catalog.json";
import reportJson from "@/data/canteens/import-report.json";
import type { CanteenCatalog } from "@/types/canteens";

function validateCatalog(value: unknown): asserts value is CanteenCatalog {
  if (!value || typeof value !== "object") throw new Error("北大食堂目录不是有效对象。");
  const catalog = value as Partial<CanteenCatalog>;
  if (!Array.isArray(catalog.canteens) || catalog.canteens.filter((item) => !item.isServicePoint).length !== 14) throw new Error("北大食堂目录需要 14 个正式餐饮单位。");
  if (!Array.isArray(catalog.dishes) || !Array.isArray(catalog.floors) || !Array.isArray(catalog.windows)) throw new Error("北大食堂目录缺少核心实体。");
  const skus = catalog.dishes.flatMap((dish) => dish.skus);
  if (skus.length !== 514 || new Set(skus.map((sku) => sku.id)).size !== 514) throw new Error("北大食堂目录需要 514 个唯一 GitHub SKU。");
  const floorIds = new Set(catalog.floors.map((floor) => floor.id));
  const windowIds = new Set(catalog.windows.map((window) => window.id));
  if (catalog.dishes.some((dish) => !floorIds.has(dish.floorId) || dish.windowIds.some((id) => !windowIds.has(id)))) throw new Error("北大食堂目录存在失效关联。");
}

validateCatalog(catalogJson);

export const canteenCatalog: CanteenCatalog = catalogJson;
export const canteenImportReport = reportJson;
export const canteenById = new Map(canteenCatalog.canteens.map((item) => [item.id, item]));
export const canteenFloorById = new Map(canteenCatalog.floors.map((item) => [item.id, item]));
export const canteenWindowById = new Map(canteenCatalog.windows.map((item) => [item.id, item]));
export const canteenDishById = new Map(canteenCatalog.dishes.map((item) => [item.id, item]));
