import { milkTeaBrandIds } from "@/types/milk-tea";
import type {
  MilkTeaExportV1,
  MilkTeaHistoryEntry,
  MilkTeaPersonalData,
  MilkTeaSettings,
} from "@/types/milk-tea";

export const milkTeaStorageKeys = {
  favorites: "foodCompass.milkTea.favorites",
  permanentlyExcluded: "foodCompass.milkTea.permanentExclusions",
  history: "foodCompass.milkTea.history",
  settings: "foodCompass.milkTea.settings",
  schemaVersion: "foodCompass.milkTea.schemaVersion",
  sessionExclusions: "foodCompass.milkTea.sessionExclusions",
} as const;

export const defaultMilkTeaPersonalData: MilkTeaPersonalData = {
  favorites: [],
  permanentlyExcluded: [],
  history: [],
  settings: { avoidRecent: true },
  sessionExclusions: [],
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

function isHistoryEntry(value: unknown): value is MilkTeaHistoryEntry {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.productId === "string" &&
    typeof item.productName === "string" &&
    typeof item.brandId === "string" &&
    milkTeaBrandIds.includes(item.brandId as never) &&
    typeof item.brandName === "string" &&
    typeof item.selectedAt === "string" &&
    !Number.isNaN(Date.parse(item.selectedAt)) &&
    typeof item.variantId === "string" &&
    isStringArray(item.toppingIds)
  );
}

function isSettings(value: unknown): value is MilkTeaSettings {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as MilkTeaSettings).avoidRecent === "boolean",
  );
}

function parseStored<T>(
  storage: Storage,
  key: string,
  guard: (value: unknown) => value is T,
  fallback: T,
): T {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  const value: unknown = JSON.parse(raw);
  return guard(value) ? value : fallback;
}

export function loadMilkTeaPersonalData(): {
  data: MilkTeaPersonalData;
  storageAvailable: boolean;
} {
  if (typeof window === "undefined") {
    return { data: defaultMilkTeaPersonalData, storageAvailable: true };
  }
  try {
    const favorites = parseStored(localStorage, milkTeaStorageKeys.favorites, isStringArray, []);
    const permanentlyExcluded = parseStored(
      localStorage,
      milkTeaStorageKeys.permanentlyExcluded,
      isStringArray,
      [],
    );
    const history = parseStored(
      localStorage,
      milkTeaStorageKeys.history,
      (value): value is MilkTeaHistoryEntry[] =>
        Array.isArray(value) && value.every(isHistoryEntry),
      [],
    ).slice(0, 50);
    const settings = parseStored(
      localStorage,
      milkTeaStorageKeys.settings,
      isSettings,
      { avoidRecent: true },
    );
    const sessionExclusions = parseStored(
      sessionStorage,
      milkTeaStorageKeys.sessionExclusions,
      isStringArray,
      [],
    );
    return {
      data: { favorites, permanentlyExcluded, history, settings, sessionExclusions },
      storageAvailable: true,
    };
  } catch {
    return { data: defaultMilkTeaPersonalData, storageAvailable: false };
  }
}

export function saveMilkTeaPersonalData(data: MilkTeaPersonalData): boolean {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(milkTeaStorageKeys.favorites, JSON.stringify(data.favorites));
    localStorage.setItem(
      milkTeaStorageKeys.permanentlyExcluded,
      JSON.stringify(data.permanentlyExcluded),
    );
    localStorage.setItem(milkTeaStorageKeys.history, JSON.stringify(data.history.slice(0, 50)));
    localStorage.setItem(milkTeaStorageKeys.settings, JSON.stringify(data.settings));
    localStorage.setItem(milkTeaStorageKeys.schemaVersion, "1");
    sessionStorage.setItem(
      milkTeaStorageKeys.sessionExclusions,
      JSON.stringify(data.sessionExclusions),
    );
    return true;
  } catch {
    return false;
  }
}

export function createMilkTeaExport(data: MilkTeaPersonalData): MilkTeaExportV1 {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    favorites: data.favorites,
    permanentlyExcluded: data.permanentlyExcluded,
    history: data.history.slice(0, 50),
    settings: data.settings,
  };
}

export function validateMilkTeaExport(value: unknown): MilkTeaExportV1 {
  if (!value || typeof value !== "object") throw new Error("导入文件必须是 JSON 对象。");
  const item = value as Record<string, unknown>;
  if (item.schemaVersion !== 1) throw new Error("仅支持 schemaVersion 为 1 的备份文件。");
  if (!isStringArray(item.favorites) || !isStringArray(item.permanentlyExcluded)) {
    throw new Error("收藏或永久排除数据格式不正确。");
  }
  if (!Array.isArray(item.history) || !item.history.every(isHistoryEntry)) {
    throw new Error("最近喝过记录格式不正确。");
  }
  if (!isSettings(item.settings)) throw new Error("设置数据格式不正确。");
  return {
    schemaVersion: 1,
    exportedAt:
      typeof item.exportedAt === "string" ? item.exportedAt : new Date(0).toISOString(),
    favorites: item.favorites,
    permanentlyExcluded: item.permanentlyExcluded,
    history: (item.history as MilkTeaHistoryEntry[]).slice(0, 50),
    settings: item.settings,
  };
}

export function applyMilkTeaImport(
  current: MilkTeaPersonalData,
  incoming: MilkTeaExportV1,
  mode: "merge" | "replace",
  knownProductIds: ReadonlySet<string>,
): MilkTeaPersonalData {
  const base = mode === "merge" ? current : defaultMilkTeaPersonalData;
  const favorites = [...new Set([...base.favorites, ...incoming.favorites])].filter((id) =>
    knownProductIds.has(id),
  );
  const permanentlyExcluded = [
    ...new Set([...base.permanentlyExcluded, ...incoming.permanentlyExcluded]),
  ].filter((id) => knownProductIds.has(id));
  const histories = [...base.history, ...incoming.history].toSorted((left, right) =>
    right.selectedAt.localeCompare(left.selectedAt),
  );
  const seen = new Set<string>();
  const history = histories
    .filter((entry) => {
      const key = `${entry.productId}|${entry.selectedAt}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 50);
  return {
    favorites,
    permanentlyExcluded,
    history,
    settings: incoming.settings,
    sessionExclusions: mode === "merge" ? current.sessionExclusions : [],
  };
}
