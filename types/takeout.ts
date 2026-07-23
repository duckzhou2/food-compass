export type TakeoutCategoryId = string;
export type TakeoutAreaId = string;
export type TakeoutDistanceBandId = string;
export type TakeoutEvidenceLevel = "A" | "B";

export interface TakeoutReferenceItem {
  id: string;
  name: string;
  shortLabel?: string;
  description?: string;
  merchantCount?: number;
  minKm?: number;
  maxKm?: number;
}

export interface TakeoutMerchant {
  id: string;
  sourceCandidateId?: string | null;
  name: string;
  aliases: string[];
  searchText: string;
  categoryId: TakeoutCategoryId;
  detailCategory: string;
  areaId: TakeoutAreaId;
  place: string | null;
  address: string | null;
  location: {
    referenceLatitude: number | null;
    referenceLongitude: number | null;
    distanceFromPkuSouthGateKm: number | null;
    distanceBandId: TakeoutDistanceBandId;
    distanceDisplay: string;
    precisionLabel: string;
    isEstimated: boolean;
  };
  publicReference: {
    averageSpendCny: number | null;
    openingHoursText: string | null;
  };
  delivery: {
    status: "unverified" | "verified";
    statusLabel: string;
    targetAddress: string;
    meituanVerified: boolean;
    elemeVerified: boolean;
    lastVerifiedAt: string | null;
  };
  evidence: {
    level: TakeoutEvidenceLevel;
    status: string;
    sourceDate: string;
    sourceUrl: string | null;
    note: string;
  };
  sourceBatch: string;
  enabled: boolean;
  wheelEligible: boolean;
  source?: "custom";
  createdAt?: string;
}

export interface TakeoutCatalog {
  schemaVersion: number;
  dataVersion: string;
  metadata: {
    title: string;
    collectedAt: string;
    merchantCount: number;
    categoryCount: number;
    areaCount: number;
    evidenceCounts: Record<TakeoutEvidenceLevel, number>;
    distanceMethod: string;
    dataBoundary: string;
  };
  referenceData: {
    categories: TakeoutReferenceItem[];
    areas: TakeoutReferenceItem[];
    distanceBands: TakeoutReferenceItem[];
    evidenceLevels: TakeoutReferenceItem[];
    deliveryStatuses: TakeoutReferenceItem[];
  };
  statistics: {
    merchantsByCategory: Record<string, number>;
    merchantsByArea: Record<string, number>;
    merchantsByDistanceBand: Record<string, number>;
    merchantsByEvidenceLevel: Record<string, number>;
  };
  merchants: TakeoutMerchant[];
}

export interface TakeoutFilters {
  query: string;
  categoryIds: string[];
  distanceBandIds: string[];
  areaIds: string[];
  evidenceLevels: TakeoutEvidenceLevel[];
  onlyFavorites: boolean;
  excludeEstimatedDistance: boolean;
  sort: "source" | "distance" | "name" | "category";
}

export interface TakeoutHistoryEntry {
  merchantId: string;
  merchantName: string;
  categoryId: string;
  selectedAt: string;
  source: "builtin" | "custom";
}

export interface TakeoutSettings {
  avoidRecent: boolean;
}

export interface TakeoutExportV1 {
  schemaVersion: 1;
  exportedAt: string;
  customMerchants: TakeoutMerchant[];
  favorites: string[];
  permanentExclusions: string[];
  history: TakeoutHistoryEntry[];
  settings: TakeoutSettings;
}
