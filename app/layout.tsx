import type { Metadata } from "next";
import "./globals.css";
import { BackToTopButton } from "@/components/back-to-top-button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: {
    default: "食物罗盘｜今天吃什么？",
    template: "%s｜食物罗盘",
  },
  description: "不知道吃什么或喝什么时，按条件筛选或交给分类均衡罗盘。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f8f5ee] text-stone-900 antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </div>
        <BackToTopButton />
      </body>
    </html>
  );
}
