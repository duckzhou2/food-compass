"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductResultCard } from "@/components/product-result-card";
import { MilkTeaDataManager } from "@/components/milk-tea-data-manager";
import { MilkTeaFilterPanel } from "@/components/milk-tea/milk-tea-filter-panel";
import { MilkTeaProductBrowser } from "@/components/milk-tea/milk-tea-product-browser";
import { ModeSwitch } from "@/components/ui/experience-controls";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { getMilkTeaBrand } from "@/lib/data/milk-tea";
import {
  defaultMilkTeaFilters,
  filterMilkTeaProducts,
  isWheelEligibleProduct,
  type CalorieBand,
  type MilkTeaProductFilters,
} from "@/lib/milk-tea/filters";
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
  type MilkTeaConfirmedSelection,
  type MilkTeaHistoryEntry,
  type MilkTeaPersonalData,
  type MilkTeaBrandId,
  type MilkTeaDisplayCategory,
  type MilkTeaProduct,
} from "@/types/milk-tea";

const palette = ["#173f35", "#e8a54b", "#c96348", "#8eb7a7", "#945d63", "#d9c88c", "#49737a", "#b86d74"];

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
  const [visibleCount, setVisibleCount] = useState(24);
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
  const reducedMotion = useReducedMotion();
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

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const updateFilter = <K extends keyof MilkTeaProductFilters>(key: K, value: MilkTeaProductFilters[K]) => {
    setSelected(null);
    setVisibleCount(24);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const toggleBrand = (brandId: MilkTeaBrandId) => {
    setSelected(null);
    setVisibleCount(24);
    setFilters((current) => ({
      ...current,
      brandIds: current.brandIds.includes(brandId)
        ? current.brandIds.filter((value) => value !== brandId)
        : [...current.brandIds, brandId],
    }));
  };

  const toggleCategory = (category: MilkTeaDisplayCategory) => {
    setSelected(null);
    setVisibleCount(24);
    setFilters((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((value) => value !== category)
        : [...current.categories, category],
    }));
  };

  const toggleCalorieBand = (band: CalorieBand) => {
    setSelected(null);
    setVisibleCount(24);
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
        <div>
          <MilkTeaFilterPanel
            open={filtersOpen}
            onToggleOpen={() => setFiltersOpen((open) => !open)}
            filters={filters}
            onUpdate={updateFilter}
            onToggleBrand={toggleBrand}
            onToggleCategory={toggleCategory}
            onToggleCalorieBand={toggleCalorieBand}
            onlyFavorites={onlyFavorites}
            onOnlyFavoritesChange={(value) => {
              setOnlyFavorites(value);
              setSelected(null);
              setVisibleCount(24);
            }}
            avoidRecent={personal.settings.avoidRecent}
            onAvoidRecentChange={(value) => changePersonal((current) => ({ ...current, settings: { avoidRecent: value } }))}
            exclusionCount={personal.sessionExclusions.length}
            onRestoreExclusions={() => changePersonal((current) => ({ ...current, sessionExclusions: [] }))}
            disabled={isSpinning}
            onReset={() => {
              setFilters({ ...defaultMilkTeaFilters });
              setOnlyFavorites(false);
              setSelected(null);
              setVisibleCount(24);
            }}
          />
          {!storageAvailable && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900" role="status">浏览器存储不可用，本次仍可使用，但刷新后个人数据不会保留。</p>}
        </div>

        <main className="flex min-w-0 flex-col">
          <div className="order-1 flex flex-wrap items-center justify-between gap-3" aria-label="选择方式">
            <ModeSwitch value={mode} onChange={setMode} options={[{ value: "products", label: "浏览产品" }, { value: "wheel", label: "转盘抽一杯" }]} />
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
              <MilkTeaProductBrowser
                products={filteredProducts}
                selectedId={selected?.productId}
                favoriteIds={personal.favorites}
                visibleCount={visibleCount}
                onSelect={selectProduct}
                onLoadMore={() => setVisibleCount((count) => count + 24)}
              />
            ) : wheelCandidates.length > 0 ? (
              <section className="mt-5 rounded-[2.5rem] bg-[var(--paper-deep)] px-3 py-8 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,.55)] sm:px-8 sm:py-12">
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
