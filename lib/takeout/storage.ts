import { isTakeoutMerchant } from "@/lib/data/takeout";
import type { TakeoutExportV1, TakeoutHistoryEntry, TakeoutMerchant, TakeoutSettings } from "@/types/takeout";

export const takeoutStorageKeys = {
  customMerchants: "foodCompass.takeout.customMerchants",
  favorites: "foodCompass.takeout.favorites",
  permanentExclusions: "foodCompass.takeout.permanentExclusions",
  history: "foodCompass.takeout.history",
  settings: "foodCompass.takeout.settings",
  schemaVersion: "foodCompass.takeout.schemaVersion",
  sessionExclusions: "foodCompass.takeout.sessionExclusions",
} as const;

export interface TakeoutPersonalData {
  customMerchants: TakeoutMerchant[];
  favorites: string[];
  permanentExclusions: string[];
  history: TakeoutHistoryEntry[];
  settings: TakeoutSettings;
  sessionExclusions: string[];
}

export const defaultTakeoutPersonalData: TakeoutPersonalData = {
  customMerchants: [], favorites: [], permanentExclusions: [], history: [], settings: { avoidRecent: true }, sessionExclusions: [],
};

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const isHistory = (value: unknown): value is TakeoutHistoryEntry[] => Array.isArray(value) && value.every((entry) => Boolean(entry && typeof entry === "object" && typeof (entry as TakeoutHistoryEntry).merchantId === "string" && typeof (entry as TakeoutHistoryEntry).selectedAt === "string"));

function parseStored<T>(storage: Storage, key: string, guard: (value: unknown) => value is T, fallback: T) {
  const raw = storage.getItem(key);
  if (raw === null) return fallback;
  const value: unknown = JSON.parse(raw);
  return guard(value) ? value : fallback;
}

export function loadTakeoutPersonalData(): { data: TakeoutPersonalData; storageAvailable: boolean } {
  if (typeof window === "undefined") return { data: defaultTakeoutPersonalData, storageAvailable: true };
  try {
    return { data: {
      customMerchants: parseStored(localStorage, takeoutStorageKeys.customMerchants, (value): value is TakeoutMerchant[] => Array.isArray(value) && value.every((merchant) => isTakeoutMerchant(merchant, "custom")), []),
      favorites: parseStored(localStorage, takeoutStorageKeys.favorites, isStringArray, []),
      permanentExclusions: parseStored(localStorage, takeoutStorageKeys.permanentExclusions, isStringArray, []),
      history: parseStored(localStorage, takeoutStorageKeys.history, isHistory, []).slice(0, 50),
      settings: parseStored(localStorage, takeoutStorageKeys.settings, (value): value is TakeoutSettings => Boolean(value && typeof value === "object" && typeof (value as TakeoutSettings).avoidRecent === "boolean"), { avoidRecent: true }),
      sessionExclusions: parseStored(sessionStorage, takeoutStorageKeys.sessionExclusions, isStringArray, []),
    }, storageAvailable: true };
  } catch { return { data: defaultTakeoutPersonalData, storageAvailable: false }; }
}

export function saveTakeoutPersonalData(data: TakeoutPersonalData) {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(takeoutStorageKeys.customMerchants, JSON.stringify(data.customMerchants));
    localStorage.setItem(takeoutStorageKeys.favorites, JSON.stringify(data.favorites));
    localStorage.setItem(takeoutStorageKeys.permanentExclusions, JSON.stringify(data.permanentExclusions));
    localStorage.setItem(takeoutStorageKeys.history, JSON.stringify(data.history.slice(0, 50)));
    localStorage.setItem(takeoutStorageKeys.settings, JSON.stringify(data.settings));
    localStorage.setItem(takeoutStorageKeys.schemaVersion, "1");
    sessionStorage.setItem(takeoutStorageKeys.sessionExclusions, JSON.stringify(data.sessionExclusions));
    return true;
  } catch { return false; }
}

export function createTakeoutExport(data: TakeoutPersonalData): TakeoutExportV1 {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), customMerchants: data.customMerchants, favorites: data.favorites, permanentExclusions: data.permanentExclusions, history: data.history.slice(0, 50), settings: data.settings };
}

export function validateTakeoutExport(value: unknown): TakeoutExportV1 {
  if (!value || typeof value !== "object") throw new Error("导入文件必须是 JSON 对象。");
  const item = value as Record<string, unknown>;
  if (item.schemaVersion !== 1) throw new Error("仅支持 schemaVersion 为 1 的备份文件。");
  if (!Array.isArray(item.customMerchants) || !item.customMerchants.every((merchant) => isTakeoutMerchant(merchant, "custom"))) throw new Error("自定义商户格式不正确。");
  if (!isStringArray(item.favorites) || !isStringArray(item.permanentExclusions) || !isHistory(item.history)) throw new Error("个人记录格式不正确。");
  if (!item.settings || typeof item.settings !== "object" || typeof (item.settings as TakeoutSettings).avoidRecent !== "boolean") throw new Error("设置格式不正确。");
  return { schemaVersion: 1, exportedAt: typeof item.exportedAt === "string" ? item.exportedAt : new Date(0).toISOString(), customMerchants: item.customMerchants, favorites: item.favorites, permanentExclusions: item.permanentExclusions, history: item.history.slice(0, 50), settings: item.settings as TakeoutSettings } as TakeoutExportV1;
}

export function applyTakeoutImport(current: TakeoutPersonalData, incoming: TakeoutExportV1, mode: "merge" | "replace", builtinIds: ReadonlySet<string>): TakeoutPersonalData {
  if (mode === "replace") return { customMerchants: incoming.customMerchants, favorites: incoming.favorites, permanentExclusions: incoming.permanentExclusions, history: incoming.history.slice(0, 50), settings: incoming.settings, sessionExclusions: [] };
  const customMerchants = [...current.customMerchants];
  const used = new Set([...builtinIds, ...customMerchants.map((merchant) => merchant.id)]);
  const remap = new Map<string, string>();
  incoming.customMerchants.forEach((merchant) => {
    const identical = customMerchants.find((item) => item.id === merchant.id && JSON.stringify(item) === JSON.stringify(merchant));
    if (identical) { remap.set(merchant.id, merchant.id); return; }
    let id = merchant.id;
    while (used.has(id)) id = `custom-takeout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    used.add(id); remap.set(merchant.id, id); customMerchants.push({ ...merchant, id });
  });
  const mapId = (id: string) => remap.get(id) ?? id;
  return {
    customMerchants,
    favorites: [...new Set([...current.favorites, ...incoming.favorites.map(mapId)])],
    permanentExclusions: [...new Set([...current.permanentExclusions, ...incoming.permanentExclusions.map(mapId)])],
    history: [...current.history, ...incoming.history.map((entry) => ({ ...entry, merchantId: mapId(entry.merchantId) }))].toSorted((a, b) => b.selectedAt.localeCompare(a.selectedAt)).slice(0, 50),
    settings: incoming.settings,
    sessionExclusions: current.sessionExclusions,
  };
}
