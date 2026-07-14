export type AuditStatus = "verified" | "partially_verified" | "unverified" | "rejected";

export type SourceOrigin =
  | "brand_official"
  | "government"
  | "laboratory"
  | "media"
  | "academic"
  | "estimated";

export interface MilkTeaProduct {
  record_id: string;
  brand_name: string;
  product_name: string;
  normalized_category: string;
  tags: string[];
  region: string;
  city_or_store_scope: string | null;
  availability_status: string;
  availability_verified_at: string | null;
  cup_size: string | null;
  volume_ml: number | null;
  sweetness: string | null;
  ice_level: string | null;
  milk_base: string | null;
  default_toppings: string | null;
  calories_kcal_min: number | null;
  calories_kcal_max: number | null;
  calories_kj_min: number | null;
  calories_kj_max: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbohydrate_g: number | null;
  sugar_g: number | null;
  caffeine_mg: number | null;
  tea_polyphenols_mg: number | null;
  source_id: string;
  source_origin: SourceOrigin;
  evidence_type: string;
  source_title: string;
  source_publisher: string | null;
  source_url: string;
  source_publish_date: string | null;
  source_accessed_at: string;
  confidence_grade: "A" | "B" | "C" | "D";
  is_estimated: boolean;
  estimation_method: string | null;
  access_status: string;
  audit_status: AuditStatus;
  audit_reason: string;
  snapshot_note: string | null;
  notes: string | null;
}

export interface ProductFilters {
  brands: string[];
  categories: string[];
  auditStatuses: string[];
  availabilityStatuses: string[];
  query: string;
  onlyWithCalories: boolean;
  calorieMin: number | null;
  calorieMax: number | null;
}

export const emptyFilters: ProductFilters = {
  brands: [],
  categories: [],
  auditStatuses: [],
  availabilityStatuses: [],
  query: "",
  onlyWithCalories: true,
  calorieMin: null,
  calorieMax: null,
};
