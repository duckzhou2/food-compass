import Link from "next/link";
import { siteContent } from "@/lib/site-content";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[var(--forest)] text-stone-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-sm sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-serif text-xl font-semibold text-white">{siteContent.brand.name}</p>
          <p className="mt-3 max-w-2xl leading-7 text-stone-300">
            帮你轻松决定一顿饭、一个北大食堂、一家外卖或一杯饮品；选择透明，数据边界清楚，个人记录只留在本地。
          </p>
          <nav aria-label="页脚模块导航" className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {siteContent.modules.map((module) => <Link key={module.id} href={module.href} className="text-xs font-semibold text-white/80 hover:text-white">{module.label}</Link>)}
          </nav>
        </div>
        <p className="max-w-md text-xs leading-6 text-stone-400 md:text-right">
          饮品热量、正餐标签、食堂历史价格/营养与北大外卖公开资料均为参考；配送状态请以平台为准。
        </p>
      </div>
    </footer>
  );
}
