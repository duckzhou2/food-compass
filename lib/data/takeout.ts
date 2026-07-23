import takeoutJson from "@/data/takeout/catalog.json";
import type { TakeoutCatalog, TakeoutMerchant } from "@/types/takeout";

export const takeoutCatalog = takeoutJson as TakeoutCatalog;
export const builtinTakeoutMerchants = takeoutCatalog.merchants;

export function isTakeoutMerchant(value: unknown, source?: "custom"): value is TakeoutMerchant {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<TakeoutMerchant>;
  return Boolean(
    typeof item.id === "string" &&
    typeof item.name === "string" && item.name.trim() &&
    typeof item.categoryId === "string" &&
    typeof item.areaId === "string" &&
    item.location && typeof item.location.distanceBandId === "string" &&
    item.delivery && typeof item.delivery.statusLabel === "string" &&
    item.evidence && (item.evidence.level === "A" || item.evidence.level === "B") &&
    (!source || item.source === source),
  );
}
