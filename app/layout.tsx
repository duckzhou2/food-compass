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
  description: "从奶茶、正餐、北大食堂和北大外卖中浏览或随机选择，让决定轻一点。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[var(--paper)] text-stone-900 antialiased">
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
