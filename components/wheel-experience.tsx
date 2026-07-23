"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductResultCard } from "@/components/product-result-card";
import { MilkTeaDataManager } from "@/components/milk-tea-data-manager";
import { getMilkTeaBrand, milkTeaBrands } from "@/lib/data/milk-tea";
import {
  defaultMilkTeaFilters,
  filterMilkTeaProducts,
  getDefaultCalories,
  isWheelEligibleProduct,
  type CalorieBand,
  type MilkTeaProductFilters,
  type ProductSort,
} from "@/lib/milk-tea/filters";
import { formatCalorieValue } from "@/lib/milk-tea/calories";
import { pickRandom } from "@/lib/random/pick-random";
import {
  applyRecentMilkTeaAvoidance,
  pickDifferentMilkTeaBrand,
  pickSameMilkTeaCategory,
} from "@/lib/milk-tea/personal";
import {
  defaultMilkTeaPersonalData,
  loadMilkTeaPersonalData,
  saveMilkTeaPersonalData,
} from "@/lib/milk-tea/storage";
import {
  milkTeaDisplayCategories,
  type MilkTeaConfirmedSelection,
  type MilkTeaHistoryEntry,
  type MilkTeaPersonalData,
  type MilkTeaBrandId,
  type MilkTeaDisplayCategory,
  type MilkTeaProduct,
} from "@/types/milk-tea";

const palette = ["#173f35", "#e8a54b", "#c96348", "#8eb7a7", "#945d63", "#d9c88c", "#49737a", "#b86d74"];

const calorieBands: Array<{ value: CalorieBand; label: string }> = [
  { value: "under100", label: "100 kcal 以下" },
  { value: "100to199", label: "100–199 kcal" },
  { value: "200to299", label: "200–299 kcal" },
  { value: "over300", label: "300 kcal 及以上" },
];

function pointOnCircle(angle: number, radius = 49) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(radians), y: 50 + radius * Math.sin(radians) };
}

function sectorPath(index: number, count: number): string {
  if (count === 1) return "M 50,1 A 49,49 0 1,1 49.999,1 Z";
  const angle = 360 / count;
  const start = pointOnCircle(index * angle);
  const end = pointOnCircle((index + 1) * angle);
  return `M 50,50 L ${start.x},${start.y} A 49,49 0 ${angle > 180 ? 1 : 0},1 ${end.x},${end.y} Z`;
}

export function WheelExperience({ products }: { products: MilkTeaProduct[] }) {
  const [filters, setFilters] = useState<MilkTeaProductFilters>({ ...defaultMilkTeaFilters });
  const [selected, setSelected] = useState<MilkTeaProduct | null>(null);
  const [mode, setMode] = useState<"products" | "wheel">("products");
  const [isSpinning, setIsSpinning] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [personal, setPersonal] = useState<MilkTeaPersonalData>({
    ...defaultMilkTeaPersonalData,
    settings: { ...defaultMilkTeaPersonalData.settings },
  });
  const [personalHydrated, setPersonalHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [selectedConfiguration, setSelectedConfiguration] = useState<{
    variantId: string | null;
    toppingIds: string[];
  }>({ variantId: null, toppingIds: [] });
  const [confirmed, setConfirmed] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  const [selectionVersion, setSelectionVersion] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultPanelRef = useRef<HTMLDivElement | null>(null);
  const personalTouchedRef = useRef(false);
  const changePersonal = (
    update: MilkTeaPersonalData | ((current: MilkTeaPersonalData) => MilkTeaPersonalData),
  ) => {
    personalTouchedRef.current = true;
    setPersonal(update);
  };

  const filteredProducts = useMemo(
    () => filterMilkTeaProducts(products, filters).filter((product) =>
      !personal.permanentlyExcluded.includes(product.productId) &&
      (!onlyFavorites || personal.favorites.includes(product.productId)),
    ),
    [filters, onlyFavorites, personal.favorites, personal.permanentlyExcluded, products],
  );
  const baseWheelCandidates = useMemo(
    () => filteredProducts.filter(isWheelEligibleProduct).filter(
      (product) => !personal.sessionExclusions.includes(product.productId),
    ),
    [filteredProducts, personal.sessionExclusions],
  );
  const wheelCandidates = useMemo(
    () => applyRecentMilkTeaAvoidance(
      baseWheelCandidates,
      personal.history,
      personal.settings.avoidRecent,
    ),
    [baseWheelCandidates, personal.history, personal.settings.avoidRecent],
  );
  const candidates = mode === "wheel" ? wheelCandidates : filteredProducts;
  const wheelSegmentCount = Math.min(Math.max(wheelCandidates.length, 1), 24);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadMilkTeaPersonalData();
      if (!personalTouchedRef.current) setPersonal(loaded.data);
      setStorageAvailable(loaded.storageAvailable);
      setPersonalHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!personalHydrated) return;
    if (!saveMilkTeaPersonalData(personal)) {
      const timer = window.setTimeout(() => setStorageAvailable(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [personal, personalHydrated]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const updateFilter = <K extends keyof MilkTeaProductFilters>(key: K, value: MilkTeaProductFilters[K]) => {
    setSelected(null);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleBrand = (brandId: MilkTeaBrandId) => {
    setSelected(null);
    setFilters((current) => ({
      ...current,
      brandIds: current.brandIds.includes(brandId)
        ? current.brandIds.filter((value) => value !== brandId)
        : [...current.brandIds, brandId],
    }));
  };

  const toggleCategory = (category: MilkTeaDisplayCategory) => {
    setSelected(null);
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((value) => value !== category)
        : [...current.categories, category],
    }));
  };

  const toggleCalorieBand = (band: CalorieBand) => {
    setSelected(null);
    setFilters((current) => ({
      ...current,
      calorieBands: current.calorieBands.includes(band)
        ? current.calorieBands.filter((value) => value !== band)
        : [...current.calorieBands, band],
    }));
  };

  const scrollToResult = () => {
    window.requestAnimationFrame(() => {
      resultPanelRef.current?.scrollIntoView?.({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const selectProduct = (
    product: MilkTeaProduct,
    configuration: { variantId: string | null; toppingIds: string[] } = {
      variantId: null,
      toppingIds: [],
    },
  ) => {
    setSelected(product);
    setSelectedConfiguration(configuration);
    setSelectionVersion((current) => current + 1);
    setConfirmed(false);
    setActionStatus("");
    scrollToResult();
  };

  const updatePersonal = (next: MilkTeaPersonalData) => changePersonal(next);

  const confirmDrink = (configuration: MilkTeaConfirmedSelection) => {
    if (!selected) return;
    const entry: MilkTeaHistoryEntry = {
      productId: selected.productId,
      productName: selected.productName,
      brandId: selected.brandId,
      brandName: selected.brandName,
      selectedAt: new Date().toISOString(),
      variantId: configuration.variantId,
      toppingIds: configuration.toppingIds,
    };
    setSelectedConfiguration(configuration);
    changePersonal((current) => ({ ...current, history: [entry, ...current.history].slice(0, 50) }));
    setConfirmed(true);
    setActionStatus("已记录当前规格和小料。");
  };

  const toggleFavorite = () => {
    if (!selected) return;
    changePersonal((current) => ({
      ...current,
      favorites: current.favorites.includes(selected.productId)
        ? current.favorites.filter((id) => id !== selected.productId)
        : [selected.productId, ...current.favorites],
    }));
  };

  const excludeSelected = (kind: "session" | "permanent") => {
    if (!selected) return;
    changePersonal((current) => kind === "session"
      ? { ...current, sessionExclusions: [...new Set([selected.productId, ...current.sessionExclusions])] }
      : {
          ...current,
          permanentlyExcluded: [...new Set([selected.productId, ...current.permanentlyExcluded])],
          favorites: current.favorites.filter((id) => id !== selected.productId),
          sessionExclusions: current.sessionExclusions.filter((id) => id !== selected.productId),
        });
    setSelected(null);
    setActionStatus("");
  };

  const selectAlternative = (kind: "category" | "brand") => {
    if (!selected) return;
    const product = kind === "category"
      ? pickSameMilkTeaCategory(wheelCandidates, selected)
      : pickDifferentMilkTeaBrand(wheelCandidates, selected);
    if (product) selectProduct(product);
  };

  const spin = () => {
    if (isSpinning) return;
    const pick = pickRandom(wheelCandidates);
    if (!pick) return;
    const targetModulo = (pick.index * 137) % 360;
    const currentModulo = ((rotation % 360) + 360) % 360;
    const delta = (targetModulo - currentModulo + 360) % 360;
    const duration = reducedMotion ? 80 : 3200;
    setSelected(null);
    setSelectedConfiguration({ variantId: null, toppingIds: [] });
    setConfirmed(false);
    setActionStatus("");
    setIsSpinning(true);
    setRotation((current) => current + (reducedMotion ? 0 : 7 * 360) + delta);
    timeoutRef.current = setTimeout(() => {
      selectProduct(pick.item);
      setIsSpinning(false);
    }, duration);
  };

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 rounded-[1.75rem] border border-stone-200 bg-white/75 p-4 lg:sticky lg:top-24">
          <button type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left font-semibold text-[#173f35] lg:hidden"><span>筛选条件</span><span>{filtersOpen ? "收起" : "展开"}</span></button>

          <fieldset disabled={isSpinning} className={`${filtersOpen ? "block" : "hidden"} space-y-6 disabled:opacity-60 lg:block`}>
            <div>
              <label htmlFor="product-search" className="text-sm font-semibold text-stone-800">产品名称搜索</label>
              <input id="product-search" value={filters.query} onChange={(event) => updateFilter("query", event.target.value)} placeholder="输入饮品名称" className="mt-2 w-full rounded-xl border border-stone-200 bg-[#fbfaf6] px-3 py-2.5 text-sm outline-none focus:border-[#176b55] focus:ring-2 focus:ring-emerald-100" />
            </div>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">品牌</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" aria-pressed={filters.brandIds.length === 0} onClick={() => updateFilter("brandIds", [])} className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${filters.brandIds.length === 0 ? "border-[#173f35] bg-[#173f35] text-white" : "border-stone-200 bg-white text-stone-600"}`}>全部品牌</button>
                {milkTeaBrands.map((brand) => (
                  <button key={brand.brandId} type="button" aria-pressed={filters.brandIds.includes(brand.brandId)} onClick={() => toggleBrand(brand.brandId)} className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold ${filters.brandIds.includes(brand.brandId) ? "border-[#173f35] bg-[#173f35] text-white" : "border-stone-200 bg-white text-stone-600"}`}>{brand.brandName}</button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">分类</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={filters.categories.length === 0} onClick={() => updateFilter("categories", [])} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${filters.categories.length === 0 ? "border-[#176b55] bg-emerald-50 text-[#176b55]" : "border-stone-200 bg-white text-stone-600"}`}>全部分类</button>
                {milkTeaDisplayCategories.map((category) => (
                  <button key={category} type="button" aria-pressed={filters.categories.includes(category)} onClick={() => toggleCategory(category)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${filters.categories.includes(category) ? "border-[#176b55] bg-emerald-50 text-[#176b55]" : "border-stone-200 bg-white text-stone-600"}`}>{category}</button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">默认规格热量</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" aria-pressed={filters.calorieBands.length === 0} onClick={() => updateFilter("calorieBands", [])} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${filters.calorieBands.length === 0 ? "border-[#176b55] bg-emerald-50 text-[#176b55]" : "border-stone-200 bg-white text-stone-600"}`}>全部热量</button>
                {calorieBands.map((band) => (
                  <button key={band.value} type="button" aria-pressed={filters.calorieBands.includes(band.value)} onClick={() => toggleCalorieBand(band.value)} className={`min-h-11 rounded-xl border px-3 py-2 text-left text-xs font-semibold ${filters.calorieBands.includes(band.value) ? "border-[#176b55] bg-emerald-50 text-[#176b55]" : "border-stone-200 bg-white text-stone-600"}`}>{band.label}</button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="product-sort" className="text-sm font-semibold text-stone-800">排序</label>
              <select id="product-sort" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value as ProductSort)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-700">
                <option value="source">原表顺序</option>
                <option value="caloriesAsc">默认热量从低到高</option>
                <option value="caloriesDesc">默认热量从高到低</option>
                <option value="name">产品名称</option>
              </select>
            </div>

            <details className="rounded-2xl border border-stone-200 bg-white p-4">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-stone-800">更多条件</summary>
              <div className="mt-3 space-y-3">
                <label className="flex min-h-11 items-center gap-3 text-sm text-stone-700"><input type="checkbox" checked={onlyFavorites} onChange={(event) => { setOnlyFavorites(event.target.checked); setSelected(null); }} className="size-4 accent-[#176b55]" />只看收藏</label>
                <label className="flex min-h-11 items-center gap-3 text-sm text-stone-700"><input type="checkbox" checked={personal.settings.avoidRecent} onChange={(event) => changePersonal((current) => ({ ...current, settings: { avoidRecent: event.target.checked } }))} className="size-4 accent-[#176b55]" />避免最近三次重复</label>
                <button type="button" disabled={personal.sessionExclusions.length === 0} onClick={() => changePersonal((current) => ({ ...current, sessionExclusions: [] }))} className="min-h-11 w-full rounded-xl border border-stone-300 px-3 text-sm disabled:opacity-40">恢复本轮排除（{personal.sessionExclusions.length}）</button>
              </div>
            </details>

            <button type="button" disabled={isSpinning} onClick={() => { setFilters({ ...defaultMilkTeaFilters }); setOnlyFavorites(false); setSelected(null); }} className="min-h-11 w-full rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700 disabled:opacity-50">清空筛选</button>
          </fieldset>

          {!storageAvailable && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900" role="status">浏览器存储不可用，本次仍可使用，但刷新后个人数据不会保留。</p>}
        </aside>

        <main className="flex min-w-0 flex-col">
          <div className="order-1 flex flex-wrap items-center justify-between gap-3" aria-label="选择方式">
            <div className="inline-grid grid-cols-2 rounded-2xl bg-stone-200/70 p-1">
              <button type="button" aria-pressed={mode === "products"} onClick={() => setMode("products")} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${mode === "products" ? "bg-white text-[#173f35] shadow-sm" : "text-stone-500"}`}>浏览产品</button>
              <button type="button" aria-pressed={mode === "wheel"} onClick={() => setMode("wheel")} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${mode === "wheel" ? "bg-white text-[#173f35] shadow-sm" : "text-stone-500"}`}>转盘抽一杯</button>
            </div>
            <button type="button" onClick={() => setManagerOpen(true)} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-[#173f35]">管理我的奶茶</button>
          </div>

          <p className="order-2 mt-4 text-sm text-stone-500" aria-live="polite">当前共 <strong className="font-mono text-lg text-[#173f35]">{candidates.length}</strong> 款产品，每款只出现一次。</p>

          <div
            id="resultPanel"
            ref={resultPanelRef}
            aria-live="polite"
            className={`${mode === "products" ? "order-3 mt-5" : "order-5 mt-6"} scroll-mt-[92px] ${mode === "wheel" && !selected ? "hidden" : ""}`}
          >
            {selected ? (
              <ProductResultCard
                key={`${selected.productId}-${selectionVersion}`}
                product={selected}
                brand={getMilkTeaBrand(selected.brandId)}
                initialVariantId={selectedConfiguration.variantId}
                initialToppingIds={selectedConfiguration.toppingIds}
                actions={{
                  favorite: personal.favorites.includes(selected.productId),
                  confirmed,
                  status: actionStatus,
                  onConfirm: confirmDrink,
                  onAgain: spin,
                  onSessionExclude: () => excludeSelected("session"),
                  onSameCategory: () => selectAlternative("category"),
                  onDifferentBrand: () => selectAlternative("brand"),
                  onToggleFavorite: toggleFavorite,
                  onPermanentExclude: () => excludeSelected("permanent"),
                }}
              />
            ) : (
              <div className="rounded-3xl border border-dashed border-stone-300 px-6 py-9 text-center text-sm text-stone-500">从产品列表选择一款，选择已有热量记录的规格，并参考该品牌常见小料。</div>
            )}
          </div>

          <div className="order-4">
            {mode === "products" ? (
              filteredProducts.length > 0 ? (
                <section className="mt-5 max-h-[720px] overflow-y-auto overscroll-contain rounded-[2rem] border border-stone-200 bg-white/60 p-3 sm:p-4" aria-label="产品列表">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredProducts.map((product) => {
                    const calories = getDefaultCalories(product);
                    const isSelected = selected?.productId === product.productId;
                    return (
                      <button key={product.productId} type="button" aria-pressed={isSelected} onClick={() => selectProduct(product)} className={`min-w-0 rounded-2xl border p-4 text-left transition ${isSelected ? "border-[#176b55] bg-emerald-50 shadow-sm" : "border-stone-200 bg-white hover:-translate-y-0.5 hover:border-stone-400"}`}>
                        <span className="flex items-start justify-between gap-2 text-xs font-semibold text-[#176b55]"><span>{product.brandName} · {product.displayCategory}</span>{personal.favorites.includes(product.productId) && <span aria-label="已收藏" title="已收藏">★</span>}</span>
                        <span className="mt-2 block break-words font-serif text-lg font-bold leading-6 text-stone-900">{product.productName}</span>
                        <span className="mt-3 block font-mono text-sm font-semibold text-[#c96348]">{formatCalorieValue(calories)}</span>
                        <span className={`mt-1 block text-xs ${product.dataStatus === "needs_review" ? "font-semibold text-amber-700" : "text-stone-400"}`}>{product.dataStatus === "detailed" ? "可选精细规格" : product.dataStatus === "missing" ? "暂无可靠参考热量" : product.dataStatus === "needs_review" ? "待核验，不参与热量筛选和默认转盘" : "单一参考规格"}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : (
              <EmptyState />
            )
            ) : wheelCandidates.length > 0 ? (
              <section className="mt-5 rounded-[2.5rem] bg-[#efe9dc] px-3 py-8 text-center sm:px-8 sm:py-12">
              <div className="relative mx-auto aspect-square w-full max-w-[540px]">
                <div className="absolute left-1/2 top-[-12px] z-20 h-0 w-0 -translate-x-1/2 border-x-[16px] border-t-[30px] border-x-transparent border-t-[#c96348] drop-shadow" aria-hidden="true" />
                <svg viewBox="0 0 100 100" role="img" aria-label={`从 ${wheelCandidates.length} 款产品中随机抽取的动画转盘`} className="size-full overflow-visible rounded-full border-[10px] border-white bg-white shadow-[0_24px_55px_rgba(70,60,40,0.18)]" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: reducedMotion ? "80ms" : "3200ms", transitionTimingFunction: "cubic-bezier(.08,.72,.16,1)" }}>
                  {Array.from({ length: wheelSegmentCount }, (_, index) => <path key={index} d={sectorPath(index, wheelSegmentCount)} fill={palette[index % palette.length]} stroke="rgba(255,255,255,.45)" strokeWidth={0.35} />)}
                  <circle cx="50" cy="50" r="12" fill="#fffaf0" stroke="#173f35" strokeWidth="1.2" />
                  <circle cx="50" cy="50" r="5" fill="#173f35" />
                </svg>
                <button type="button" onClick={spin} disabled={isSpinning} className="absolute left-1/2 top-1/2 z-10 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#173f35] font-serif text-xl font-bold text-white shadow-xl transition hover:scale-[1.03] disabled:cursor-wait disabled:opacity-80 sm:size-28">
                  {isSpinning ? "转动中" : "转一下"}
                </button>
              </div>
              <p className="mt-7 text-xs leading-5 text-stone-500">转盘仅用于随机动画，最终结果以下方显示为准。</p>
            </section>
            ) : (
              <EmptyState />
            )}

            {mode === "wheel" && !selected && (
              <div className="mt-6 rounded-3xl border border-dashed border-stone-300 px-6 py-7 text-center text-sm text-stone-500" aria-live="polite">
                {isSpinning ? "罗盘正在替你做决定……" : "抽中产品后，下方会自动使用默认规格并开放有效组合。"}
              </div>
            )}
          </div>
        </main>
      </div>
      <MilkTeaDataManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        products={products}
        data={personal}
        onChange={updatePersonal}
        onOpenHistory={(product, entry) => {
          setMode("products");
          selectProduct(product, { variantId: entry.variantId, toppingIds: entry.toppingIds });
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <p className="font-serif text-2xl font-bold text-stone-800">没有符合条件的饮品</p>
      <p className="mt-3 text-sm leading-6 text-stone-500">试试清空关键词、切换分类或放宽热量区间。</p>
    </div>
  );
}
