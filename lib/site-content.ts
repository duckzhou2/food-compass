import siteContentJson from "@/config/site-content.json";
import type { SiteModuleDescriptor } from "@/types/site";

export const siteContent = {
  ...siteContentJson,
  modules: siteContentJson.modules as SiteModuleDescriptor[],
};

export const primaryNavigation = [
  { href: "/", label: "首页" },
  ...siteContent.modules.map(({ href, label }) => ({ href, label })),
  ...siteContent.utilityNav,
];
