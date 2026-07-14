import type { MilkTeaProduct, SourceOrigin } from "@/types/product";

export function displayValue(
  value: string | number | null,
  unit = "",
  fallback = "待核验",
): string {
  if (value === null || value === "") return fallback;
  return `${value}${unit}`;
}

export function formatCalories(product: MilkTeaProduct): string {
  const min = product.calories_kcal_min;
  const max = product.calories_kcal_max;
  if (min === null || max === null) return "热量待核验";
  const prefix = product.is_estimated ? "估算 " : "约 ";
  return min === max ? `${prefix}${min} kcal` : `${prefix}${min}–${max} kcal`;
}

export const sourceOriginLabels: Record<SourceOrigin, string> = {
  brand_official: "品牌官方",
  government: "政府机构",
  laboratory: "实验室",
  media: "媒体转述",
  academic: "学术来源",
  estimated: "配料估算",
};

export const auditStatusLabels: Record<string, string> = {
  verified: "已核验",
  partially_verified: "部分核验",
  unverified: "未核验",
  rejected: "已拒绝",
};

export const availabilityLabels: Record<string, string> = {
  official_site_listed: "官网列出",
  historically_reported_current_unverified: "历史报道，当前未核验",
  verified_in_store: "门店在售已核验",
  seasonal: "季节限定",
  regional: "地区限定",
  discontinued: "已下架",
  unverified: "在售状态未核验",
};
