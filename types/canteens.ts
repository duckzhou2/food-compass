export type EvidenceStatus =
  | "current_official"
  | "official_historical"
  | "github_historical"
  | "temporary"
  | "inferred"
  | "unverified";

export type DishType = "主食" | "菜品" | "点心" | "套餐";

export interface Evidence {
  id: string;
  sourceIds: string[];
  sourceDate: string;
  status: EvidenceStatus;
  note: string;
}

export interface CanteenSource {
  id: string;
  title: string;
  url: string;
  date: string;
  sourceClass: string;
  use: string;
}

export interface CanteenHours {
  unit: string;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  notes: string;
  sourceId: string;
  status: EvidenceStatus;
}

export interface Canteen {
  id: string;
  name: string;
  aliases: string[];
  campus: string;
  area: string | null;
  isServicePoint: boolean;
  hours: CanteenHours[];
  summerStatus: {
    unit: string;
    stopDate: string;
    reopenDate: string;
    label: string;
    asOf: string;
  } | null;
  sourceIds: string[];
  notes: string[];
}

export interface CanteenFloor {
  id: string;
  canteenId: string;
  name: string;
  sortOrder: number;
  isPhysical: boolean;
}

export interface CanteenWindow {
  id: string;
  canteenId: string;
  floorId: string;
  zone: string | null;
  name: string;
  cuisine: string[];
  status: EvidenceStatus;
  sourceIds: string[];
  notes: string[];
}

export interface DishSku {
  id: string;
  dishId: string;
  sourceFile: string;
  originalId: string;
  rawName: string;
  portion: string | null;
  priceCny: number;
  energyKcal: number;
  proteinG: number;
  fatG: number;
  isHighSugar: boolean;
  isPepperHot: boolean;
  isVegetarian: boolean;
  sourceStatus: "github_historical";
}

export interface CanteenDish {
  id: string;
  canteenId: string;
  floorId: string;
  windowIds: string[];
  name: string;
  baseDishName: string;
  rawNames: string[];
  portions: string[];
  dishTypes: DishType[];
  categories: string[];
  cuisines: string[];
  rawCuisines: string[];
  cuisineInferred: boolean;
  mealPeriods: Array<"breakfast" | "lunch" | "dinner" | "late_night">;
  skus: DishSku[];
  evidence: Evidence[];
  isTemporary: boolean;
  searchText: string;
}

export interface TemporaryActivity {
  id: string;
  canteenId: string;
  name: string;
  dateLabel: string;
  dishes: string[];
  sourceIds: string[];
  notes: string[];
}

export interface CanteenCatalog {
  generatedAt: string;
  researchDate: string;
  sources: CanteenSource[];
  canteens: Canteen[];
  floors: CanteenFloor[];
  windows: CanteenWindow[];
  dishes: CanteenDish[];
  activities: TemporaryActivity[];
}

export interface NumericRange {
  min: number | null;
  max: number | null;
}

export interface CanteenFilters {
  query: string;
  canteenIds: string[];
  floorIds: string[];
  windowIds: string[];
  cuisines: string[];
  dishTypes: DishType[];
  categories: string[];
  price: NumericRange;
  energy: NumericRange;
  protein: NumericRange;
  spicy: "all" | "yes" | "no";
  vegetarian: "all" | "yes" | "no";
  highSugar: "all" | "yes" | "no";
  mealPeriods: Array<"breakfast" | "lunch" | "dinner" | "late_night">;
  statuses: EvidenceStatus[];
  windowKnown: "all" | "yes" | "no";
  sourceScope: "all" | "official" | "historical";
}

export interface RecommendationResult {
  mode: "canteen" | "window" | "dish";
  entityId: string;
  canteenId: string;
  windowId: string | null;
  dishId: string | null;
  reason: string[];
  relaxed: boolean;
}
