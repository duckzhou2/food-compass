"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MealDataManager } from "@/components/meal-data-manager";
import { FilterShell, ModeSwitch } from "@/components/ui/experience-controls";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { builtinMealFoods } from "@/lib/data/meals";
import {
  defaultMealFilters,
  excludeLabels,
  filtersForPreset,
  flavorLabels,
  formatMealPrice,
  fullnessLabels,
  getMealCategory,
  mealCategories,
  mealPresets,
  priceLabels,
  sceneLabels,
  timeLabels,
  type MealPresetId,
} from "@/lib/meals/constants";
import { applyRecentAvoidance, filterMealFoods } from "@/lib/meals/filters";
import { getMealWheelDisplayFoods, pickBalancedMeal, pickDifferentCategory, pickMealCategory, pickSameCategory } from "@/lib/meals/random";
import {
  defaultMealPersonalData,
  loadMealPersonalData,
  saveMealPersonalData,
  type MealPersonalData,
} from "@/lib/meals/storage";
import {
  excludeTags,
  flavorTags,
  fullnessTags,
  mealTimeTags,
  priceBands,
  sceneTags,
  type MealFilters,
  type MealFood,
  type MealCategoryId,
} from "@/types/meals";

const palette = ["#173f35", "#e8a54b", "#c96348", "#8eb7a7", "#945d63", "#d9c88c", "#49737a", "#b86d74", "#a78663"];

function mealWheelColor(categoryIndex: number, variation?: number) {
  const color = palette[categoryIndex % palette.length];
  if (variation === undefined) return color;
  const value = Number.parseInt(color.slice(1), 16);
  return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${variation % 2 ? 0.76 : 1})`;
}

export function MealExperience() {
  const [filters, setFilters] = useState<MealFilters>({ ...defaultMealFilters });
  const [personal, setPersonal] = useState<MealPersonalData>(defaultMealPersonalData);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [mode, setMode] = useState<"browse" | "wheel">("wheel");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [managerEditId, setManagerEditId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MealFood | null>(null);
  const [proposedCategoryId, setProposedCategoryId] = useState<MealCategoryId | null>(null);
  const [lockedCategoryId, setLockedCategoryId] = useState<MealCategoryId | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [status, setStatus] = useState("");
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const loaded = loadMealPersonalData();
      setPersonal(loaded.data);
      setStorageAvailable(loaded.storageAvailable);
      setHydrated(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const available = saveMealPersonalData(personal);
    if (!available) {
      const timer = window.setTimeout(() => setStorageAvailable(false), 0);
      return () => window.clearTimeout(timer);
    }
  }, [hydrated, personal]);

  const foods = useMemo(() => [...builtinMealFoods, ...personal.customFoods], [personal.customFoods]);
  const favorites = useMemo(() => new Set(personal.favorites), [personal.favorites]);
  const permanentExclusions = useMemo(() => new Set(personal.permanentlyExcluded), [personal.permanentlyExcluded]);
  const sessionExclusions = useMemo(() => new Set(personal.sessionExclusions), [personal.sessionExclusions]);
  const browseFoods = useMemo(() => filterMealFoods(foods, filters, favorites, permanentExclusions), [favorites, filters, foods, permanentExclusions]);
  const sessionPool = useMemo(() => browseFoods.filter((food) => !sessionExclusions.has(food.id)), [browseFoods, sessionExclusions]);
  const recentPool = useMemo(() => applyRecentAvoidance(sessionPool, personal.history, personal.settings.avoidRecent), [personal.history, personal.settings.avoidRecent, sessionPool]);
  const activeFoods = mode === "wheel" ? recentPool.foods : browseFoods;
  const activeCategories = mealCategories.filter((category) => activeFoods.some((food) => food.categoryId === category.id));
  const manualCategorySelection = filters.categoryIds.length > 0;
  const foodStage = manualCategorySelection || lockedCategoryId !== null;
  const foodStagePool = lockedCategoryId && !manualCategorySelection
    ? recentPool.foods.filter((food) => food.categoryId === lockedCategoryId)
    : recentPool.foods;
  const wheelFoods = getMealWheelDisplayFoods(foodStagePool);

  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const size = canvas.width;
    const center = size / 2;
    context.clearRect(0, 0, size, size);
    const segments = foodStage ? wheelFoods : activeCategories;
    if (!segments.length) {
      context.fillStyle = "#e7e0d5";
      context.beginPath(); context.arc(center, center, center - 10, 0, Math.PI * 2); context.fill();
      context.fillStyle = "#716d66"; context.font = "700 24px Microsoft YaHei UI"; context.textAlign = "center"; context.fillText("暂无候选食物", center, center);
      return;
    }
    const segment = Math.PI * 2 / segments.length;
    segments.forEach((item, index) => {
      const start = -Math.PI / 2 + index * segment;
      const end = start + segment;
      const category = foodStage ? getMealCategory((item as MealFood).categoryId) : item as (typeof mealCategories)[number];
      context.beginPath(); context.moveTo(center, center); context.arc(center, center, center - 10, start, end); context.closePath();
      const categoryIndex = mealCategories.findIndex((candidate) => candidate.id === category.id);
      context.fillStyle = mealWheelColor(categoryIndex, foodStage ? index : undefined); context.fill();
      context.strokeStyle = "rgba(255,255,255,.58)"; context.lineWidth = 2; context.stroke();
    });
    context.beginPath(); context.arc(center, center, 82, 0, Math.PI * 2); context.fillStyle = "#173f35"; context.fill();
  }, [activeCategories, foodStage, wheelFoods]);

  const setPersonalAndStatus = (next: MealPersonalData) => {
    setPersonal(next);
    setStatus("");
  };

  const reveal = (food: MealFood, message = "") => {
    setSelected(food);
    setConfirmedId(null);
    setStatus(message);
  };

  const spin = () => {
    if (isSpinning || !recentPool.foods.length) return;
    if (!foodStage) {
      const pickedCategory = pickMealCategory(recentPool.foods);
      if (!pickedCategory) return;
      setIsSpinning(true);
      const segment = 360 / pickedCategory.visibleCategoryIds.length;
      setRotation((current) => current + 2160 + (360 - (pickedCategory.categoryIndex + 0.5) * segment));
      window.setTimeout(() => {
        setProposedCategoryId(pickedCategory.categoryId);
        setSelected(null);
        setIsSpinning(false);
      }, reducedMotion ? 80 : 3200);
      return;
    }
    if (foodStagePool.length === 1) {
      reveal(foodStagePool[0], `只剩“${foodStagePool[0].name}”，看来今天就是它了。`);
      return;
    }
    const picked = pickBalancedMeal(foodStagePool);
    if (!picked) return;
    setIsSpinning(true);
    const visibleIndex = Math.max(0, wheelFoods.findIndex((food) => food.id === picked.food.id));
    const segment = 360 / Math.max(1, wheelFoods.length);
    setRotation((current) => current + 2160 + (360 - (visibleIndex + 0.5) * segment));
    window.setTimeout(() => {
      reveal(picked.food, recentPool.relaxed === "none" ? "" : "为了保留可选项，已适度放宽最近三次防重复。 ");
      setIsSpinning(false);
    }, reducedMotion ? 80 : 3200);
  };

  const confirmMeal = () => {
    if (!selected || confirmedId === selected.id) return;
    const entry = { foodId: selected.id, foodName: selected.name, categoryId: selected.categoryId, selectedAt: new Date().toISOString(), source: selected.source } as const;
    setPersonalAndStatus({ ...personal, history: [entry, ...personal.history].slice(0, 50) });
    setConfirmedId(selected.id);
    setStatus("已记入最近吃过。 ");
  };

  const excludeSession = () => {
    if (!selected) return;
    setPersonalAndStatus({ ...personal, sessionExclusions: [...new Set([...personal.sessionExclusions, selected.id])] });
    setSelected(null);
    setStatus(`本轮已排除“${selected.name}”。`);
  };

  const toggleFavorite = () => {
    if (!selected) return;
    const included = favorites.has(selected.id);
    setPersonalAndStatus({ ...personal, favorites: included ? personal.favorites.filter((id) => id !== selected.id) : [...personal.favorites, selected.id] });
  };

  const excludePermanently = () => {
    if (!selected) return;
    setPersonalAndStatus({ ...personal, permanentlyExcluded: [...new Set([...personal.permanentlyExcluded, selected.id])] });
    setSelected(null);
    setStatus("已永久排除，可在“管理我的食物”中恢复。 ");
  };

  const applyPreset = (id: MealPresetId) => {
    const preset = filtersForPreset(id);
    setFilters(isPresetActive(filters, id) ? { ...defaultMealFilters } : preset);
    setSelected(null);
    setProposedCategoryId(null);
    setLockedCategoryId(null);
  };

  const changeFilters = (update: Partial<MealFilters>) => {
    setFilters((current) => ({ ...current, ...update }));
    setSelected(null);
    setProposedCategoryId(null);
    setLockedCategoryId(null);
  };

  const result = selected ? (
    <MealResultCard
      food={selected}
      favorite={favorites.has(selected.id)}
      confirmed={confirmedId === selected.id}
      status={status}
      onConfirm={confirmMeal}
      onAgain={spin}
      onSessionExclude={excludeSession}
      onSameCategory={() => { const food = pickSameCategory(recentPool.foods, selected); if (food) reveal(food); }}
      onDifferentCategory={() => { const picked = pickDifferentCategory(recentPool.foods, selected); if (picked) { setLockedCategoryId(null); setProposedCategoryId(null); reveal(picked.food); } }}
      onFavorite={toggleFavorite}
      onPermanentExclude={excludePermanently}
      onEdit={() => { setManagerEditId(selected.id); setManagerOpen(true); }}
    />
  ) : null;

  return (
    <>
      {!storageAvailable && <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">浏览器存储当前不可用；本次操作仍可继续，但刷新后可能无法保留。</p>}
      <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
        <FilterShell open={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)}>
            <label className="block"><span className="text-sm font-semibold text-stone-700">搜索食物</span><input aria-label="食物名称搜索" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} placeholder="例如：牛肉面" className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm" /></label>
            <FilterSection title="快速选择"><div className="flex flex-wrap gap-2">{mealPresets.map((preset) => <FilterButton key={preset.id} active={isPresetActive(filters, preset.id)} onClick={() => applyPreset(preset.id)}>{preset.label}</FilterButton>)}</div></FilterSection>
            <FilterSection title="主分类"><div className="mb-2"><FilterButton active={filters.categoryIds.length === mealCategories.length} onClick={() => changeFilters({ categoryIds: filters.categoryIds.length === mealCategories.length ? [] : mealCategories.map((category) => category.id) })}>{filters.categoryIds.length === mealCategories.length ? "取消全选" : "一键全选"}</FilterButton></div><PillGroup values={mealCategories.map((item) => item.id)} selected={filters.categoryIds} label={(value) => getMealCategory(value).name} onChange={(categoryIds) => changeFilters({ categoryIds })} /></FilterSection>
            <FilterSection title="预算"><PillGroup values={priceBands} selected={filters.priceBands} label={(value) => priceLabels[value]} onChange={(value) => changeFilters({ priceBands: value })} /></FilterSection>
            <FilterSection title="口味"><PillGroup values={flavorTags} selected={filters.flavorTags} label={(value) => flavorLabels[value]} onChange={(value) => changeFilters({ flavorTags: value })} /></FilterSection>
            <FilterSection title="用餐时间"><PillGroup values={mealTimeTags} selected={filters.timeTags} label={(value) => timeLabels[value]} onChange={(value) => changeFilters({ timeTags: value })} /></FilterSection>
            <details className="mt-5 border-t border-stone-200 pt-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[#173f35]">更多条件</summary>
              <FilterSection title="饱腹程度"><PillGroup values={fullnessTags} selected={filters.fullnessTags} label={(value) => fullnessLabels[value]} onChange={(value) => changeFilters({ fullnessTags: value })} /></FilterSection>
              <FilterSection title="用餐场景"><PillGroup values={sceneTags} selected={filters.sceneTags} label={(value) => sceneLabels[value]} onChange={(value) => changeFilters({ sceneTags: value })} /></FilterSection>
              <FilterSection title="饮食排除"><PillGroup values={excludeTags} selected={filters.excludeTags} label={(value) => excludeLabels[value]} onChange={(value) => changeFilters({ excludeTags: value })} /></FilterSection>
              <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={filters.onlyFavorites} onChange={(event) => changeFilters({ onlyFavorites: event.target.checked })} className="size-4 accent-[#176b55]" />只看收藏</label>
              <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={filters.onlyCustom} onChange={(event) => changeFilters({ onlyCustom: event.target.checked })} className="size-4 accent-[#176b55]" />只看自定义</label>
              <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={personal.settings.avoidRecent} onChange={(event) => setPersonalAndStatus({ ...personal, settings: { avoidRecent: event.target.checked } })} className="size-4 accent-[#176b55]" />避免最近三次重复</label>
            </details>
            <div className="mt-5 grid gap-2"><button type="button" onClick={() => { setFilters({ ...defaultMealFilters }); setSelected(null); setProposedCategoryId(null); setLockedCategoryId(null); }} className="min-h-11 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">清空筛选</button>{personal.sessionExclusions.length > 0 && <button type="button" onClick={() => setPersonalAndStatus({ ...personal, sessionExclusions: [] })} className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-900">恢复本轮排除（{personal.sessionExclusions.length}）</button>}</div>
        </FilterShell>

        <main className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ModeSwitch value={mode} onChange={setMode} options={[{ value: "browse", label: "浏览食物" }, { value: "wheel", label: "转盘抽一个" }]} />
            <button type="button" onClick={() => { setManagerEditId(null); setManagerOpen(true); }} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-[#173f35]">管理我的食物</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-500">当前有 <strong className="font-mono text-lg text-[#173f35]">{activeFoods.length}</strong> 个选项，覆盖 {activeCategories.length} 个分类。</p>{mode === "browse" && <label className="text-sm text-stone-500">排序 <select aria-label="食物排序" value={filters.sort} onChange={(event) => changeFilters({ sort: event.target.value as MealFilters["sort"] })} className="ml-2 min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-stone-700"><option value="source">推荐顺序</option><option value="name">名称</option><option value="price">价格由低到高</option><option value="time">用餐时间由快到慢</option><option value="recent">最近添加</option></select></label>}</div>

          {mode === "browse" ? (
            <div className="mt-5">
              {result && <div className="mb-6">{result}</div>}
              {browseFoods.length ? <><section aria-label="食物列表" className="grid gap-3 sm:grid-cols-2">{browseFoods.slice(0, visibleCount).map((food) => <button key={food.id} type="button" onClick={() => reveal(food)} className={`min-w-0 rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#176b55] ${selected?.id === food.id ? "border-[#176b55] shadow-md" : "border-stone-200"}`}><span className="text-xs font-semibold tracking-[0.12em] text-[#176b55]">{getMealCategory(food.categoryId).name}{food.source === "custom" ? " · 自定义" : ""}</span><span className="mt-2 block break-words font-serif text-xl font-bold text-stone-900">{food.name}</span><span className="mt-3 block text-xs leading-5 text-stone-500">{formatMealPrice(food.priceBands)} · {food.timeTags.map((tag) => timeLabels[tag]).join(" / ") || "时间未填写"}</span></button>)}</section>{visibleCount < browseFoods.length && <button type="button" onClick={() => setVisibleCount((count) => count + 24)} className="mt-5 min-h-11 w-full rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">加载更多</button>}</> : <EmptyMealState onReset={() => changeFilters({ ...defaultMealFilters })} />}
            </div>
          ) : (
            <div className="mt-5">
              {recentPool.foods.length ? <section className="overflow-hidden rounded-[2rem] bg-[#efe9dc] px-4 py-7 text-center sm:px-8"><p className="text-xs font-semibold tracking-[0.16em] text-[#176b55]">{foodStage ? "具体食物转盘" : "第一步 · 选择大类"}</p><h2 className="mt-2 font-serif text-2xl font-bold text-[#173f35]">{lockedCategoryId && !manualCategorySelection ? `从${getMealCategory(lockedCategoryId).name}中选一个` : foodStage ? "从所选分类中直接选一个" : "先决定今天吃哪一类"}</h2>{lockedCategoryId && !manualCategorySelection && <button type="button" onClick={() => { setLockedCategoryId(null); setProposedCategoryId(null); setSelected(null); }} className="mt-3 min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-[#173f35]">返回重选大类</button>}<div className="relative mx-auto mt-6 aspect-square w-full max-w-[540px]"><div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-[16px] border-t-[30px] border-x-transparent border-t-[#c96348] drop-shadow" /><canvas ref={wheelRef} width="600" height="600" className="size-full rounded-full border-[9px] border-white bg-white shadow-[0_24px_55px_rgba(70,60,40,.18)]" style={{ transform: `rotate(${rotation}deg)`, transition: reducedMotion ? "transform 80ms linear" : "transform 3.2s cubic-bezier(.08,.72,.16,1)" }} /><button type="button" onClick={spin} disabled={isSpinning} className="absolute left-1/2 top-1/2 z-30 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[8px] border-white bg-[#173f35] font-serif text-lg font-bold text-white shadow-xl disabled:opacity-80 sm:size-28">{isSpinning ? "转动中" : foodStage ? "转一道" : proposedCategoryId ? "换一类" : "转大类"}</button></div><p className="mt-5 text-xs leading-5 text-stone-500">{foodStage ? `盘面展示 ${wheelFoods.length} 个代表选项，最终结果从全部 ${foodStagePool.length} 个候选中产生。` : "先抽大类并确认，再进入该分类的具体食物转盘。"}</p></section> : <EmptyMealState onReset={() => changeFilters({ ...defaultMealFilters })} />}
              {proposedCategoryId && !foodStage && <section className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-6 text-center" aria-live="polite"><p className="text-sm text-amber-900">第一步抽中了</p><h3 className="mt-2 font-serif text-3xl font-bold text-[#173f35]">{getMealCategory(proposedCategoryId).name}</h3><p className="mt-2 text-sm text-stone-600">要从这个大类里继续选一道吗？</p><div className="mx-auto mt-5 grid max-w-md gap-2 sm:grid-cols-2"><button type="button" onClick={() => { setLockedCategoryId(proposedCategoryId); setProposedCategoryId(null); setSelected(null); }} className="min-h-12 rounded-xl bg-[#173f35] px-4 font-semibold text-white">就选这个大类</button><button type="button" onClick={spin} className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 font-semibold text-stone-700">换个大类</button></div></section>}
              {result && <div className="mt-6">{result}</div>}
              {!result && !proposedCategoryId && recentPool.foods.length > 0 && <div className="mt-6 rounded-3xl border border-dashed border-stone-300 px-6 py-7 text-center text-sm text-stone-500" aria-live="polite">{isSpinning ? "罗盘正在替你做决定……" : foodStage ? "转动后，具体食物会显示在这里。" : "先转一次大类，再决定是否从该类继续选。"}</div>}
            </div>
          )}
        </main>
      </div>
      <MealDataManager key={`${managerOpen}-${managerEditId ?? "none"}`} open={managerOpen} onClose={() => { setManagerOpen(false); setManagerEditId(null); }} foods={foods} data={personal} onChange={setPersonalAndStatus} onSelectFood={(food) => { setMode("browse"); reveal(food); }} initialEditId={managerEditId} />
    </>
  );
}

function MealResultCard({ food, favorite, confirmed, status, onConfirm, onAgain, onSessionExclude, onSameCategory, onDifferentCategory, onFavorite, onPermanentExclude, onEdit }: { food: MealFood; favorite: boolean; confirmed: boolean; status: string; onConfirm: () => void; onAgain: () => void; onSessionExclude: () => void; onSameCategory: () => void; onDifferentCategory: () => void; onFavorite: () => void; onPermanentExclude: () => void; onEdit: () => void }) {
  return <article className="result-reveal overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_70px_rgba(50,45,35,0.13)]" aria-live="polite"><div className="bg-[#173f35] px-5 py-7 text-white sm:px-8"><p className="text-xs font-semibold tracking-[0.18em] text-[#f6cf72]">今天吃</p><h2 className="mt-3 break-words font-serif text-3xl font-bold sm:text-5xl">{food.name}</h2><p className="mt-4 text-sm text-emerald-100">{getMealCategory(food.categoryId).name} · {food.entryType === "dish" ? "具体食物" : "餐厅 / 食堂窗口"}{food.source === "custom" ? " · 自定义" : ""}</p></div><div className="space-y-5 px-5 py-6 sm:px-8"><div className="grid gap-3 text-sm sm:grid-cols-2"><Info label="常见人均" value={formatMealPrice(food.priceBands)} /><Info label="口味" value={food.flavorTags.map((tag) => flavorLabels[tag]).join(" · ") || "未填写"} /><Info label="饱腹程度" value={food.fullnessTags.map((tag) => fullnessLabels[tag]).join(" / ") || "未填写"} /><Info label="用餐时间" value={food.timeTags.map((tag) => timeLabels[tag]).join(" / ") || "未填写"} /><Info label="适用场景" value={food.sceneTags.map((tag) => sceneLabels[tag]).join(" · ") || "未填写"} />{food.note && <Info label="位置或备注" value={food.note} />}</div><p className="text-xs leading-5 text-stone-500">价格、口味、时间和饮食标签均为一般化参考，实际情况请以门店为准。</p>{status && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{status}</p>}<div className="grid gap-2 sm:grid-cols-3"><button type="button" disabled={confirmed} onClick={onConfirm} className="min-h-12 rounded-xl bg-[#c96348] px-4 font-semibold text-white disabled:bg-stone-400">{confirmed ? "已记入最近吃过" : "就吃这个"}</button><button type="button" onClick={onAgain} className="min-h-12 rounded-xl bg-[#173f35] px-4 font-semibold text-white">再转一次</button><button type="button" onClick={onSessionExclude} className="min-h-12 rounded-xl border border-stone-300 px-4 font-semibold text-stone-700">本轮排除</button></div><div className="flex flex-wrap gap-2 border-t border-stone-200 pt-5"><button type="button" onClick={onSameCategory} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">换个同类</button><button type="button" onClick={onDifferentCategory} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">完全换口味</button><button type="button" onClick={onFavorite} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">{favorite ? "取消收藏" : "收藏"}</button><button type="button" onClick={onPermanentExclude} className="min-h-11 rounded-xl border border-red-200 px-3 text-sm text-red-700">永久排除</button>{food.source === "custom" && <button type="button" onClick={onEdit} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">编辑</button>}</div></div></article>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f5f1e8] p-4"><p className="text-xs text-stone-500">{label}</p><p className="mt-1 font-semibold leading-6 text-stone-800">{value}</p></div>; }
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) { return <fieldset className="mt-5"><legend className="mb-2 text-sm font-semibold text-stone-700">{title}</legend>{children}</fieldset>; }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-11 rounded-xl border px-3 text-sm ${active ? "border-[#173f35] bg-[#173f35] text-white" : "border-stone-200 bg-white text-stone-700"}`}>{children}</button>; }
function PillGroup<T extends string>({ values, selected, label, onChange }: { values: readonly T[]; selected: T[]; label: (value: T) => string; onChange: (selected: T[]) => void }) { return <div className="flex flex-wrap gap-2">{values.map((value) => <FilterButton key={value} active={selected.includes(value)} onClick={() => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])}>{label(value)}</FilterButton>)}</div>; }
function EmptyMealState({ onReset }: { onReset: () => void }) { return <div className="mt-5 rounded-3xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center"><p className="font-serif text-2xl font-bold text-stone-800">没有符合全部条件的选项</p><p className="mt-3 text-sm leading-6 text-stone-500">建议放宽预算、用餐时间或排除条件。</p><button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-xl bg-[#173f35] px-5 text-sm font-semibold text-white">放宽全部条件</button></div>; }

function isPresetActive(filters: MealFilters, id: MealPresetId) {
  const preset = filtersForPreset(id);
  const comparable = (value: MealFilters) => JSON.stringify({ ...value, sort: "source" });
  return comparable(filters) === comparable(preset);
}
