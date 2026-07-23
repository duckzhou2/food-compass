import { isMealFood } from "@/lib/data/meals";
import { mealCategoryIds } from "@/types/meals";
import type { MealExportV1, MealFood, MealHistoryEntry, MealSettings } from "@/types/meals";

export const mealStorageKeys = {
  customFoods: "foodCompass.meal.customFoods",
  favorites: "foodCompass.meal.favorites",
  permanentlyExcluded: "foodCompass.meal.permanentExclusions",
  history: "foodCompass.meal.history",
  settings: "foodCompass.meal.settings",
  schemaVersion: "foodCompass.meal.schemaVersion",
  sessionExclusions: "foodCompass.meal.sessionExclusions",
} as const;

export interface MealPersonalData {
  customFoods: MealFood[];
  favorites: string[];
  permanentlyExcluded: string[];
  history: MealHistoryEntry[];
  settings: MealSettings;
  sessionExclusions: string[];
}

export const defaultMealPersonalData: MealPersonalData = {
  customFoods: [],
  favorites: [],
  permanentlyExcluded: [],
  history: [],
  settings: { avoidRecent: true },
  sessionExclusions: [],
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function isHistoryEntry(value: unknown): value is MealHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.foodId === "string" &&
    typeof item.foodName === "string" &&
    typeof item.categoryId === "string" && mealCategoryIds.includes(item.categoryId as never) &&
    typeof item.selectedAt === "string" && !Number.isNaN(Date.parse(item.selectedAt)) &&
    (item.source === "builtin" || item.source === "custom")
  );
}

function parseStored<T>(storage: Storage, key: string, guard: (value: unknown) => value is T, fallback: T): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  const value: unknown = JSON.parse(raw);
  return guard(value) ? value : fallback;
}

export function loadMealPersonalData(): { data: MealPersonalData; storageAvailable: boolean } {
  if (typeof window === "undefined") return { data: defaultMealPersonalData, storageAvailable: true };
  try {
    const customFoods = parseStored(localStorage, mealStorageKeys.customFoods, (value): value is MealFood[] => Array.isArray(value) && value.every((food) => isMealFood(food, "custom")), []);
    const favorites = parseStored(localStorage, mealStorageKeys.favorites, isStringArray, []);
    const permanentlyExcluded = parseStored(localStorage, mealStorageKeys.permanentlyExcluded, isStringArray, []);
    const history = parseStored(localStorage, mealStorageKeys.history, (value): value is MealHistoryEntry[] => Array.isArray(value) && value.every(isHistoryEntry), []).slice(0, 50);
    const settings = parseStored(localStorage, mealStorageKeys.settings, (value): value is MealSettings => Boolean(value && typeof value === "object" && typeof (value as MealSettings).avoidRecent === "boolean"), { avoidRecent: true });
    const sessionExclusions = parseStored(sessionStorage, mealStorageKeys.sessionExclusions, isStringArray, []);
    return { data: { customFoods, favorites, permanentlyExcluded, history, settings, sessionExclusions }, storageAvailable: true };
  } catch {
    return { data: defaultMealPersonalData, storageAvailable: false };
  }
}

export function saveMealPersonalData(data: MealPersonalData): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(mealStorageKeys.customFoods, JSON.stringify(data.customFoods));
    localStorage.setItem(mealStorageKeys.favorites, JSON.stringify(data.favorites));
    localStorage.setItem(mealStorageKeys.permanentlyExcluded, JSON.stringify(data.permanentlyExcluded));
    localStorage.setItem(mealStorageKeys.history, JSON.stringify(data.history.slice(0, 50)));
    localStorage.setItem(mealStorageKeys.settings, JSON.stringify(data.settings));
    localStorage.setItem(mealStorageKeys.schemaVersion, "1");
    sessionStorage.setItem(mealStorageKeys.sessionExclusions, JSON.stringify(data.sessionExclusions));
    return true;
  } catch {
    return false;
  }
}

export function createMealExport(data: MealPersonalData): MealExportV1 {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    customFoods: data.customFoods,
    favorites: data.favorites,
    permanentlyExcluded: data.permanentlyExcluded,
    history: data.history.slice(0, 50),
    settings: data.settings,
  };
}

export function validateMealExport(value: unknown): MealExportV1 {
  if (!value || typeof value !== "object") throw new Error("导入文件必须是 JSON 对象。");
  const item = value as Record<string, unknown>;
  if (item.schemaVersion !== 1) throw new Error("仅支持 schemaVersion 为 1 的备份文件。");
  if (!Array.isArray(item.customFoods) || !item.customFoods.every((food) => isMealFood(food, "custom"))) throw new Error("自定义食物数据格式不正确。");
  if (!isStringArray(item.favorites) || !isStringArray(item.permanentlyExcluded)) throw new Error("收藏或永久排除数据格式不正确。");
  if (!Array.isArray(item.history) || !item.history.every(isHistoryEntry)) throw new Error("最近记录格式不正确。");
  if (!item.settings || typeof item.settings !== "object" || typeof (item.settings as MealSettings).avoidRecent !== "boolean") throw new Error("设置数据格式不正确。");
  const customFoods = item.customFoods as MealFood[];
  if (new Set(customFoods.map((food) => food.id)).size !== customFoods.length) throw new Error("导入文件中存在重复的自定义食物 ID。");
  return {
    schemaVersion: 1,
    exportedAt: typeof item.exportedAt === "string" ? item.exportedAt : new Date(0).toISOString(),
    customFoods,
    favorites: item.favorites,
    permanentlyExcluded: item.permanentlyExcluded,
    history: (item.history as MealHistoryEntry[]).slice(0, 50),
    settings: item.settings as MealSettings,
  };
}

function uniqueCustomId(used: Set<string>) {
  let id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  while (used.has(id)) id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  used.add(id);
  return id;
}

export function applyMealImport(
  current: MealPersonalData,
  incoming: MealExportV1,
  mode: "merge" | "replace",
  builtinIds: ReadonlySet<string>,
): MealPersonalData {
  const base = mode === "merge" ? current : defaultMealPersonalData;
  const used = new Set([...builtinIds, ...base.customFoods.map((food) => food.id)]);
  const remap = new Map<string, string>();
  const customFoods = [...base.customFoods];

  for (const imported of incoming.customFoods) {
    const existing = customFoods.find((food) => food.id === imported.id);
    if (existing && JSON.stringify(existing) === JSON.stringify(imported)) {
      remap.set(imported.id, imported.id);
      continue;
    }
    const id = used.has(imported.id) ? uniqueCustomId(used) : imported.id;
    used.add(id);
    remap.set(imported.id, id);
    customFoods.push({ ...imported, id, source: "custom" });
  }

  const mapId = (id: string) => remap.get(id) ?? id;
  const knownIds = new Set([...builtinIds, ...customFoods.map((food) => food.id)]);
  const favorites = [...new Set([...base.favorites, ...incoming.favorites.map(mapId)])].filter((id) => knownIds.has(id));
  const permanentlyExcluded = [...new Set([...base.permanentlyExcluded, ...incoming.permanentlyExcluded.map(mapId)])].filter((id) => knownIds.has(id));
  const histories = [...base.history, ...incoming.history.map((entry) => ({ ...entry, foodId: mapId(entry.foodId) }))]
    .toSorted((a, b) => b.selectedAt.localeCompare(a.selectedAt));
  const seenHistory = new Set<string>();
  const history = histories.filter((entry) => {
    const key = `${entry.foodId}|${entry.selectedAt}`;
    if (seenHistory.has(key)) return false;
    seenHistory.add(key);
    return true;
  }).slice(0, 50);

  return {
    customFoods,
    favorites,
    permanentlyExcluded,
    history,
    settings: incoming.settings,
    sessionExclusions: mode === "merge" ? current.sessionExclusions : [],
  };
}
