export const canteenStorageKeys = {
  favorites: "foodCompass.canteen.favorites", recentViews: "foodCompass.canteen.recentViews", recentSelections: "foodCompass.canteen.recentSelections",
  eatenHistory: "foodCompass.canteen.eatenHistory", loweredFrequency: "foodCompass.canteen.loweredFrequency", schemaVersion: "foodCompass.canteen.schemaVersion",
  sessionExclusions: "foodCompass.canteen.sessionExclusions",
} as const;

export interface CanteenHistoryEntry { entityId: string; canteenId: string; dishId: string | null; name: string; at: string; }
export interface CanteenPersonalData {
  favorites: { canteens: string[]; windows: string[]; dishes: string[] };
  recentViews: CanteenHistoryEntry[]; recentSelections: CanteenHistoryEntry[]; eatenHistory: CanteenHistoryEntry[];
  loweredFrequency: string[]; sessionExclusions: string[];
}
export const defaultCanteenPersonalData: CanteenPersonalData = { favorites: { canteens: [], windows: [], dishes: [] }, recentViews: [], recentSelections: [], eatenHistory: [], loweredFrequency: [], sessionExclusions: [] };
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");
const histories = (value: unknown): value is CanteenHistoryEntry[] => Array.isArray(value) && value.every((item) => item && typeof item === "object" && typeof (item as CanteenHistoryEntry).entityId === "string" && typeof (item as CanteenHistoryEntry).at === "string");
const parse = <T,>(storage: Storage, key: string, guard: (value: unknown) => value is T, fallback: T): T => { const raw = storage.getItem(key); if (!raw) return fallback; const value: unknown = JSON.parse(raw); return guard(value) ? value : fallback; };

export function loadCanteenPersonalData() {
  if (typeof window === "undefined") return { data: defaultCanteenPersonalData, storageAvailable: true };
  try {
    const favorites = parse(localStorage, canteenStorageKeys.favorites, (value): value is CanteenPersonalData["favorites"] => Boolean(value && typeof value === "object" && strings((value as CanteenPersonalData["favorites"]).canteens) && strings((value as CanteenPersonalData["favorites"]).windows) && strings((value as CanteenPersonalData["favorites"]).dishes)), defaultCanteenPersonalData.favorites);
    const data = { favorites, recentViews: parse(localStorage, canteenStorageKeys.recentViews, histories, []).slice(0, 50), recentSelections: parse(localStorage, canteenStorageKeys.recentSelections, histories, []).slice(0, 50), eatenHistory: parse(localStorage, canteenStorageKeys.eatenHistory, histories, []).slice(0, 50), loweredFrequency: parse(localStorage, canteenStorageKeys.loweredFrequency, strings, []), sessionExclusions: parse(sessionStorage, canteenStorageKeys.sessionExclusions, strings, []) };
    return { data, storageAvailable: true };
  } catch { return { data: defaultCanteenPersonalData, storageAvailable: false }; }
}

export function saveCanteenPersonalData(data: CanteenPersonalData) {
  if (typeof window === "undefined") return true;
  try {
    localStorage.setItem(canteenStorageKeys.favorites, JSON.stringify(data.favorites)); localStorage.setItem(canteenStorageKeys.recentViews, JSON.stringify(data.recentViews.slice(0, 50)));
    localStorage.setItem(canteenStorageKeys.recentSelections, JSON.stringify(data.recentSelections.slice(0, 50))); localStorage.setItem(canteenStorageKeys.eatenHistory, JSON.stringify(data.eatenHistory.slice(0, 50)));
    localStorage.setItem(canteenStorageKeys.loweredFrequency, JSON.stringify(data.loweredFrequency)); localStorage.setItem(canteenStorageKeys.schemaVersion, "1"); sessionStorage.setItem(canteenStorageKeys.sessionExclusions, JSON.stringify(data.sessionExclusions)); return true;
  } catch { return false; }
}
