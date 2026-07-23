export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-[#173f35] text-stone-200">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-serif text-lg font-semibold text-white">食物罗盘</p>
          <p className="mt-2 max-w-2xl text-stone-300">
            帮你轻松决定一顿饭、一个北大食堂、一家外卖或一杯饮品；选择透明，数据边界清楚，个人记录只留在本地。
          </p>
        </div>
        <p className="max-w-md text-xs leading-6 text-stone-400 md:text-right">
          正餐标签、食堂历史价格/营养、外卖公开资料和饮品热量均为参考；外卖配送状态请以平台为准。
        </p>
      </div>
    </footer>
  );
}
