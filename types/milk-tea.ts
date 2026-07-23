export const milkTeaBrandIds = [
  "yidiandian",
  "heytea",
  "mixue",
  "chagee",
  "coco",
  "guming",
  "luckin",
  "chabaidao",
] as const;

export type MilkTeaBrandId = (typeof milkTeaBrandIds)[number];

export type MilkTeaDataStatus =
  | "detailed"
  | "specified_reference"
  | "unspecified_reference"
  | "missing"
  | "needs_review";

export const milkTeaDisplayCategories = [
  "奶茶 / 奶绿",
  "鲜奶茶 / 轻乳茶",
  "纯茶",
  "果茶 / 果饮",
  "茶特调",
  "冰淇淋 / 甜品",
  "咖啡",
] as const;

export type MilkTeaDisplayCategory = (typeof milkTeaDisplayCategories)[number];

export interface VariantSelection {
  size: string | null;
  ice: string | null;
  temperature: string | null;
  sugar: string | null;
  version: string | null;
  base: string | null;
}

export interface MilkTeaVariant extends VariantSelection {
  variantId: string;
  calories: number | null;
  dataStatus: MilkTeaDataStatus;
  notes: string[];
  reviewFlags: string[];
}

export interface DefaultSelection extends VariantSelection {
  variantId: string;
}

export interface MilkTeaSelection {
  size: string | null;
  drinkingMethod: string | null;
  sugar: string | null;
  version: string | null;
  base: string | null;
}

export interface CalorieRange {
  min: number;
  max: number;
}

export interface ToppingVariant {
  toppingVariantId: string;
  size: string | null;
  unit: string | null;
  calories: CalorieRange | null;
  dataStatus: MilkTeaDataStatus;
  notes: string[];
}

export interface MilkTeaTopping {
  toppingId: string;
  name: string;
  variants: ToppingVariant[];
}

export interface MilkTeaProduct {
  brandId: MilkTeaBrandId;
  brandName: string;
  productId: string;
  productName: string;
  category: string;
  displayCategory: MilkTeaDisplayCategory;
  defaultSelection: DefaultSelection;
  variants: MilkTeaVariant[];
  toppings: string[];
  notes: string[];
  dataStatus: MilkTeaDataStatus;
  reviewFlags: string[];
  excludeFromWheel?: boolean;
}

export interface MilkTeaBrandData {
  brandId: MilkTeaBrandId;
  brandName: string;
  products: MilkTeaProduct[];
  toppings: MilkTeaTopping[];
}

export interface MilkTeaHistoryEntry {
  productId: string;
  productName: string;
  brandId: MilkTeaBrandId;
  brandName: string;
  selectedAt: string;
  variantId: string;
  toppingIds: string[];
}

export interface MilkTeaSettings {
  avoidRecent: boolean;
}

export interface MilkTeaPersonalData {
  favorites: string[];
  permanentlyExcluded: string[];
  history: MilkTeaHistoryEntry[];
  settings: MilkTeaSettings;
  sessionExclusions: string[];
}

export interface MilkTeaExportV1 {
  schemaVersion: 1;
  exportedAt: string;
  favorites: string[];
  permanentlyExcluded: string[];
  history: MilkTeaHistoryEntry[];
  settings: MilkTeaSettings;
}

export interface MilkTeaConfirmedSelection {
  variantId: string;
  toppingIds: string[];
}

export const variantSelectionFields = [
  "size",
  "ice",
  "temperature",
  "sugar",
  "version",
  "base",
] as const satisfies ReadonlyArray<keyof VariantSelection>;

export type VariantSelectionField = (typeof variantSelectionFields)[number];

export const milkTeaSelectionFields = [
  "size",
  "drinkingMethod",
  "sugar",
  "version",
  "base",
] as const satisfies ReadonlyArray<keyof MilkTeaSelection>;

export type MilkTeaSelectionField = (typeof milkTeaSelectionFields)[number];
