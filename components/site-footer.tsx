export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-[#173f35] text-stone-200">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 text-sm sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div>
          <p className="font-serif text-lg font-semibold text-white">食物罗盘 · 奶茶 MVP</p>
          <p className="mt-2 max-w-2xl text-stone-300">
            帮你做一次轻松的饮品选择；未知数据保持未知，来源与核验边界公开可见。
          </p>
        </div>
        <p className="max-w-md text-xs leading-6 text-stone-400 md:text-right">
          本网站用于帮助选择饮品，营养数据仅供参考，不构成医疗、减重或专业营养建议。
        </p>
      </div>
    </footer>
  );
}
