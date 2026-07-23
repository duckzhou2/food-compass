import type { Metadata } from "next";
import { DataOverview } from "@/components/data-overview";
import { milkTeaBrands, milkTeaProducts } from "@/lib/data/milk-tea";
import { canteenImportReport } from "@/lib/data/canteens";
import { takeoutCatalog } from "@/lib/data/takeout";

export const metadata: Metadata = { title: "数据" };

export default function DataPage() {
  const brandSummaries = milkTeaBrands.map((brand) => ({ name: brand.brandName, products: brand.products.length, variants: brand.products.reduce((sum, product) => sum + product.variants.length, 0), toppings: brand.toppings.length }));
  return <DataOverview canteenStats={canteenImportReport.entities} brandSummaries={brandSummaries} milkStats={{ products: milkTeaProducts.length, variants: milkTeaProducts.reduce((sum, product) => sum + product.variants.length, 0), toppings: milkTeaBrands.reduce((sum, brand) => sum + brand.toppings.length, 0), detailed: milkTeaProducts.filter((product) => product.dataStatus === "detailed").length }} takeoutStats={{ merchants: takeoutCatalog.metadata.merchantCount, categories: takeoutCatalog.metadata.categoryCount, areas: takeoutCatalog.metadata.areaCount, evidenceA: takeoutCatalog.metadata.evidenceCounts.A }} takeoutCategories={takeoutCatalog.referenceData.categories} />;
}
