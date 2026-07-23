export type SiteModuleId = "milkTea" | "meals" | "canteens" | "takeout";

export type SiteModuleTone = "coral" | "forest" | "amber" | "jade";

export type SiteModuleDescriptor = {
  id: SiteModuleId;
  href: string;
  label: string;
  eyebrow: string;
  cta: string;
  asset: string;
  tone: SiteModuleTone;
};
