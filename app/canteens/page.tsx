import type { Metadata } from "next";
import { CanteenExperience } from "@/components/canteen-experience";

export const metadata: Metadata = { title: "北大食堂", description: "搜索、筛选和随机选择北大食堂、窗口与历史菜品资料。" };

export default function CanteensPage() {
  return <CanteenExperience />;
}
