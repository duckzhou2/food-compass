"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TakeoutDataManager } from "@/components/takeout-data-manager";
import { FilterShell, ModeSwitch } from "@/components/ui/experience-controls";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { builtinTakeoutMerchants, takeoutCatalog } from "@/lib/data/takeout";
import { applyTakeoutRecentAvoidance, defaultTakeoutFilters, filterTakeoutMerchants } from "@/lib/takeout/filters";
import { getTakeoutWheelMerchants, pickBalancedTakeout, pickDifferentTakeoutCategory, pickSameTakeoutCategory } from "@/lib/takeout/random";
import { defaultTakeoutPersonalData, loadTakeoutPersonalData, saveTakeoutPersonalData, type TakeoutPersonalData } from "@/lib/takeout/storage";
import type { TakeoutFilters, TakeoutMerchant, TakeoutReferenceItem } from "@/types/takeout";

const palette = ["#173f35", "#e8a54b", "#c96348", "#8eb7a7", "#945d63", "#49737a", "#b86d74", "#a78663", "#6f8f7d"];
const quickPresets: Array<[string, string, Partial<TakeoutFilters>]> = [
  ["random", "随便点", {}],
  ["nearby", "离南门近", { distanceBandIds: ["near_gate", "km_1_2"] }],
  ["proper_meal", "正经吃饭", { categoryIds: ["local_cuisine", "international", "fast_main", "hotpot", "bbq_grill"] }],
  ["quick", "简单快捷", { categoryIds: ["fast_main", "snacks_late_night", "convenience"], distanceBandIds: ["near_gate", "km_1_2", "km_2_3"] }],
  ["late_night", "夜宵", { categoryIds: ["bbq_grill", "snacks_late_night", "convenience"] }],
  ["drink", "喝点东西", { categoryIds: ["drinks", "dessert_bakery"] }],
  ["group", "多人聚餐", { categoryIds: ["hotpot", "bbq_grill", "local_cuisine", "international"] }],
];

export function TakeoutExperience() {
  const { categories, areas, distanceBands, evidenceLevels } = takeoutCatalog.referenceData;
  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const areaById = useMemo(() => new Map(areas.map((item) => [item.id, item])), [areas]);
  const [filters, setFilters] = useState<TakeoutFilters>({ ...defaultTakeoutFilters });
  const [personal, setPersonal] = useState<TakeoutPersonalData>(defaultTakeoutPersonalData);
  const [hydrated, setHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [mode, setMode] = useState<"browse" | "wheel">("wheel");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [selected, setSelected] = useState<TakeoutMerchant | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [status, setStatus] = useState("");
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = window.setTimeout(() => { const loaded = loadTakeoutPersonalData(); setPersonal(loaded.data); setStorageAvailable(loaded.storageAvailable); setHydrated(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated || saveTakeoutPersonalData(personal)) return;
    const timer = window.setTimeout(() => setStorageAvailable(false), 0);
    return () => window.clearTimeout(timer);
  }, [hydrated, personal]);

  const merchants = useMemo(() => [...builtinTakeoutMerchants, ...personal.customMerchants], [personal.customMerchants]);
  const favorites = useMemo(() => new Set(personal.favorites), [personal.favorites]);
  const permanentExclusions = useMemo(() => new Set(personal.permanentExclusions), [personal.permanentExclusions]);
  const sessionExclusions = useMemo(() => new Set(personal.sessionExclusions), [personal.sessionExclusions]);
  const browseMerchants = useMemo(() => filterTakeoutMerchants(merchants, filters, favorites, permanentExclusions), [favorites, filters, merchants, permanentExclusions]);
  const sessionPool = useMemo(() => browseMerchants.filter((merchant) => merchant.wheelEligible && !sessionExclusions.has(merchant.id)), [browseMerchants, sessionExclusions]);
  const recentPool = useMemo(() => applyTakeoutRecentAvoidance(sessionPool, personal.history, personal.settings.avoidRecent), [personal.history, personal.settings.avoidRecent, sessionPool]);
  const activeCategories = categories.filter((category) => recentPool.merchants.some((merchant) => merchant.categoryId === category.id));
  const wheelMerchants = getTakeoutWheelMerchants(recentPool.merchants);

  useEffect(() => {
    const canvas = wheelRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const center = canvas.width / 2;
    const segments = wheelMerchants;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!segments.length) { context.beginPath(); context.arc(center, center, center - 8, 0, Math.PI * 2); context.fillStyle = "#e7e0d5"; context.fill(); context.fillStyle = "#716d66"; context.font = "700 22px Microsoft YaHei UI"; context.textAlign = "center"; context.fillText("暂无候选商户", center, center); return; }
    const step = Math.PI * 2 / segments.length;
    segments.forEach((item, index) => {
      const start = -Math.PI / 2 + index * step;
      context.beginPath(); context.moveTo(center, center); context.arc(center, center, center - 8, start, start + step); context.closePath();
      const categoryId = item.categoryId;
      const categoryIndex = categories.findIndex((category) => category.id === categoryId);
      context.fillStyle = palette[(categoryIndex + index) % palette.length]; context.fill();
      context.strokeStyle = "rgba(255,255,255,.58)"; context.lineWidth = 2; context.stroke();
    });
    context.beginPath(); context.arc(center, center, 78, 0, Math.PI * 2); context.fillStyle = "#173f35"; context.fill();
  }, [categories, wheelMerchants]);

  const persist = (data: TakeoutPersonalData, message = "") => { setPersonal(data); setStatus(message); };
  const resetSelection = () => { setSelected(null); setConfirmedId(null); };
  const changeFilters = (update: Partial<TakeoutFilters>) => { setFilters((current) => ({ ...current, ...update })); resetSelection(); setVisibleCount(24); };
  const reveal = (merchant: TakeoutMerchant, message = "") => { setSelected(merchant); setConfirmedId(null); setStatus(message); };

  const spin = () => {
    if (spinning || !recentPool.merchants.length) return;
    const picked = pickBalancedTakeout(recentPool.merchants); if (!picked) return;
    const index = Math.max(0, wheelMerchants.findIndex((merchant) => merchant.id === picked.merchant.id));
    setSpinning(true); setRotation((value) => value + 2160 + 360 - (index + .5) * (360 / Math.max(1, wheelMerchants.length)));
    window.setTimeout(() => { reveal(picked.merchant, recentPool.relaxed ? "为保留候选，已适度放宽最近三次防重复。" : ""); setSpinning(false); }, reducedMotion ? 80 : 3200);
  };

  const confirm = () => {
    if (!selected || confirmedId === selected.id) return;
    const source = selected.source === "custom" ? "custom" as const : "builtin" as const;
    persist({ ...personal, history: [{ merchantId: selected.id, merchantName: selected.name, categoryId: selected.categoryId, selectedAt: new Date().toISOString(), source }, ...personal.history].slice(0, 50) }, "已记入最近点过。");
    setConfirmedId(selected.id);
  };

  const toggleFavorite = () => { if (selected) persist({ ...personal, favorites: favorites.has(selected.id) ? personal.favorites.filter((id) => id !== selected.id) : [...personal.favorites, selected.id] }); };
  const sessionExclude = () => { if (selected) { persist({ ...personal, sessionExclusions: [...new Set([...personal.sessionExclusions, selected.id])] }, `本轮已排除“${selected.name}”。`); setSelected(null); } };
  const permanentExclude = () => { if (selected) { persist({ ...personal, permanentExclusions: [...new Set([...personal.permanentExclusions, selected.id])] }, "已永久排除，可在“管理我的北大外卖”中恢复。"); setSelected(null); } };
  const result = selected ? <TakeoutResultCard merchant={selected} category={categoryById.get(selected.categoryId)} area={areaById.get(selected.areaId)} favorite={favorites.has(selected.id)} confirmed={confirmedId === selected.id} status={status} onConfirm={confirm} onAgain={spin} onSessionExclude={sessionExclude} onSame={() => { const merchant = pickSameTakeoutCategory(recentPool.merchants, selected); if (merchant) reveal(merchant); }} onDifferent={() => { const merchant = pickDifferentTakeoutCategory(recentPool.merchants, selected); if (merchant) reveal(merchant); }} onFavorite={toggleFavorite} onPermanentExclude={permanentExclude} /> : null;

  return <>
    {!storageAvailable && <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">浏览器存储当前不可用；本次仍可使用，但刷新后个人数据可能无法保留。</p>}
    <div className="grid items-start gap-6 lg:grid-cols-[310px_minmax(0,1fr)]">
      <FilterShell open={filtersOpen} onToggle={() => setFiltersOpen((value) => !value)}>
          <label className="block"><span className="text-sm font-semibold text-stone-700">搜索商户</span><input aria-label="外卖商户搜索" value={filters.query} onChange={(event) => changeFilters({ query: event.target.value })} placeholder="搜索店铺、菜系、商圈或地址" className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm" /></label>
          <FilterSection title="快速选择"><div className="flex flex-wrap gap-2">{quickPresets.map(([id, label, preset]) => <FilterButton key={id} active={isPresetActive(filters, preset)} onClick={() => { const active = isPresetActive(filters, preset); setFilters({ ...defaultTakeoutFilters, ...(active ? {} : preset) }); resetSelection(); }}>{label}</FilterButton>)}</div></FilterSection>
          <FilterSection title="商户类型"><PillGroup items={categories} selected={filters.categoryIds} onChange={(categoryIds) => changeFilters({ categoryIds })} /></FilterSection>
          <FilterSection title="距南门参考距离"><PillGroup items={distanceBands} selected={filters.distanceBandIds} onChange={(distanceBandIds) => changeFilters({ distanceBandIds })} /></FilterSection>
          <FilterSection title="商圈"><PillGroup items={areas} selected={filters.areaIds} onChange={(areaIds) => changeFilters({ areaIds })} /></FilterSection>
          <details className="mt-5 border-t border-stone-200 pt-4"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[#173f35]">更多条件</summary><FilterSection title="信息可信度"><PillGroup items={evidenceLevels} selected={filters.evidenceLevels} onChange={(values) => changeFilters({ evidenceLevels: values as ("A" | "B")[] })} /></FilterSection><label className="mt-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={filters.onlyFavorites} onChange={(event) => changeFilters({ onlyFavorites: event.target.checked })} className="size-4 accent-[#176b55]" />只看收藏</label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={personal.settings.avoidRecent} onChange={(event) => persist({ ...personal, settings: { avoidRecent: event.target.checked } })} className="size-4 accent-[#176b55]" />避免最近三次重复</label><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={filters.excludeEstimatedDistance} onChange={(event) => changeFilters({ excludeEstimatedDistance: event.target.checked })} className="size-4 accent-[#176b55]" />排除商圈中心估算距离</label></details>
          <div className="mt-5 grid gap-2"><button type="button" onClick={() => { setFilters({ ...defaultTakeoutFilters }); resetSelection(); }} className="min-h-11 rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">清空筛选</button>{personal.sessionExclusions.length > 0 && <button type="button" onClick={() => persist({ ...personal, sessionExclusions: [] }, "已恢复本轮排除。") } className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 text-sm font-semibold text-amber-900">恢复本轮排除（{personal.sessionExclusions.length}）</button>}</div>
          <p className="mt-4 border-t border-stone-200 pt-4 text-[11px] leading-5 text-stone-500">公开候选库不代表当前可配送、营业或在售；请在外卖平台确认。</p>
      </FilterShell>

      <main className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3"><ModeSwitch value={mode} onChange={setMode} options={[{ value: "browse", label: "浏览商户" }, { value: "wheel", label: "转盘抽一家" }]} /><button type="button" onClick={() => setManagerOpen(true)} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-[#173f35]">管理我的北大外卖</button></div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-500">当前有 <strong className="font-mono text-lg text-[#173f35]">{mode === "browse" ? browseMerchants.length : recentPool.merchants.length}</strong> 家候选，覆盖 {activeCategories.length} 个类型。</p>{mode === "browse" && <label className="text-sm text-stone-500">排序 <select aria-label="外卖商户排序" value={filters.sort} onChange={(event) => changeFilters({ sort: event.target.value as TakeoutFilters["sort"] })} className="ml-2 min-h-11 rounded-xl border border-stone-300 bg-white px-3 text-stone-700"><option value="source">推荐顺序</option><option value="distance">距离由近到远</option><option value="name">店名</option><option value="category">按类型</option></select></label>}</div>

        {mode === "browse" ? <div className="mt-5">{result && <div className="mb-6">{result}</div>}{browseMerchants.length ? <><section aria-label="外卖商户列表" className="grid gap-3 sm:grid-cols-2">{browseMerchants.slice(0, visibleCount).map((merchant) => <button key={merchant.id} type="button" onClick={() => reveal(merchant)} className={`min-w-0 rounded-3xl border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#176b55] ${selected?.id === merchant.id ? "border-[#176b55] shadow-md" : "border-stone-200"}`}><span className="text-xs font-semibold tracking-[.1em] text-[#176b55]">{categoryById.get(merchant.categoryId)?.name}{merchant.source === "custom" ? " · 自定义" : ""}</span><span className="mt-2 block break-words font-serif text-xl font-bold text-stone-900">{merchant.name}</span><span className="mt-3 block text-xs leading-5 text-stone-500">{merchant.detailCategory} · {areaById.get(merchant.areaId)?.shortLabel ?? areaById.get(merchant.areaId)?.name}<br />{merchant.location.distanceDisplay} · 配送待平台确认</span></button>)}</section>{visibleCount < browseMerchants.length && <button type="button" onClick={() => setVisibleCount((value) => value + 24)} className="mt-5 min-h-11 w-full rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-700">加载更多（还剩 {browseMerchants.length - visibleCount} 家）</button>}</> : <EmptyState onReset={() => changeFilters({ ...defaultTakeoutFilters })} />}</div> :
        <div className="mt-5">{recentPool.merchants.length ? <section className="overflow-hidden rounded-[2rem] bg-[#efe9dc] px-4 py-7 text-center sm:px-8"><p className="text-xs font-semibold tracking-[.16em] text-[#176b55]">商户转盘</p><h2 className="mt-2 font-serif text-2xl font-bold text-[#173f35]">按类型均衡，直接抽一家</h2><div className="relative mx-auto mt-6 aspect-square max-w-[540px]"><div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 border-x-[16px] border-t-[30px] border-x-transparent border-t-[#c96348] drop-shadow" /><canvas ref={wheelRef} width="600" height="600" className="size-full rounded-full border-[9px] border-white bg-white shadow-[0_24px_55px_rgba(70,60,40,.18)]" style={{ transform: `rotate(${rotation}deg)`, transition: reducedMotion ? "none" : "transform 3.2s cubic-bezier(.08,.72,.16,1)" }} /><button type="button" onClick={spin} disabled={spinning || !recentPool.merchants.length} className="absolute left-1/2 top-1/2 z-30 grid size-28 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[9px] border-white bg-[#173f35] px-3 text-center font-serif text-base font-bold text-white shadow-xl disabled:opacity-70">{spinning ? "转动中" : "抽一家"}</button></div><p className="mt-4 text-xs text-stone-500">一次点击直接得到商户；转盘仅用于随机动画，最终结果以下方结果卡为准。</p></section> : <EmptyState onReset={() => changeFilters({ ...defaultTakeoutFilters })} />}{result && <div className="mt-6">{result}</div>}</div>}
      </main>
    </div>
    <TakeoutDataManager open={managerOpen} onClose={() => setManagerOpen(false)} personal={personal} onChange={persist} merchants={merchants} categories={categories} areas={areas} builtinIds={new Set(builtinTakeoutMerchants.map((merchant) => merchant.id))} />
  </>;
}

function TakeoutResultCard({ merchant, category, area, favorite, confirmed, status, onConfirm, onAgain, onSessionExclude, onSame, onDifferent, onFavorite, onPermanentExclude }: { merchant: TakeoutMerchant; category?: TakeoutReferenceItem; area?: TakeoutReferenceItem; favorite: boolean; confirmed: boolean; status: string; onConfirm: () => void; onAgain: () => void; onSessionExclude: () => void; onSame: () => void; onDifferent: () => void; onFavorite: () => void; onPermanentExclude: () => void }) {
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { const input = document.createElement("textarea"); input.value = value; document.body.append(input); input.select(); document.execCommand("copy"); input.remove(); } };
  const details = [["细分类", merchant.detailCategory], ["商圈", area?.name], ["商场 / 街区", merchant.place], ["地址", merchant.address], ["距离精度", merchant.location.isEstimated ? "商圈/楼宇中心估算" : merchant.location.precisionLabel], ["证据等级", `${merchant.evidence.level}级 · ${merchant.evidence.level === "A" ? "近期/官方确认" : "公开地图候选"}`], ["公开参考人均", merchant.publicReference.averageSpendCny == null ? null : `${merchant.publicReference.averageSpendCny} 元`], ["营业时间线索", merchant.publicReference.openingHoursText]];
  return <article className="result-reveal overflow-hidden rounded-[2rem] bg-white shadow-[0_22px_60px_rgba(50,45,35,.12)]"><header className="bg-[#173f35] p-6 text-white sm:p-8"><p className="text-xs font-semibold tracking-[.14em] text-[#f6cf72]">{category?.name ?? "自定义商户"}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-3"><h2 className="break-words font-serif text-3xl font-bold sm:text-4xl">{merchant.name}</h2><strong className="font-mono text-xl">{merchant.location.distanceDisplay}</strong></div></header><div className="p-6 sm:p-8"><dl className="grid gap-3 sm:grid-cols-2">{details.filter(([, value]) => value).map(([label, value]) => <div key={label} className="rounded-2xl bg-stone-50 p-4"><dt className="text-xs text-stone-400">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-stone-800">{value}</dd></div>)}</dl><p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">当前未验证美团或饿了么配送，请复制店名后在外卖平台确认。</p>{status && <p role="status" className="mt-3 text-sm font-semibold text-[#176b55]">{status}</p>}<div className="mt-5 grid gap-2 sm:grid-cols-3"><button type="button" disabled={confirmed} onClick={onConfirm} className="min-h-11 rounded-xl bg-[#c96348] px-4 font-semibold text-white disabled:opacity-60">{confirmed ? "已记入最近点过" : "就点这家"}</button><button type="button" onClick={onAgain} className="min-h-11 rounded-xl bg-[#173f35] px-4 font-semibold text-white">换一家</button><button type="button" onClick={onSessionExclude} className="min-h-11 rounded-xl border border-stone-300 px-4 font-semibold">本轮排除</button><button type="button" onClick={onSame} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">同类换一家</button><button type="button" onClick={onDifferent} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">换个类型</button><button type="button" onClick={onFavorite} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">{favorite ? "★ 取消收藏" : "☆ 收藏"}</button><button type="button" onClick={onPermanentExclude} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">永久排除</button><button type="button" onClick={() => copy(merchant.name)} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">复制店名</button><button type="button" onClick={() => copy([merchant.name, merchant.address].filter(Boolean).join(" "))} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">复制店名和地址</button>{merchant.evidence.sourceUrl && <a href={merchant.evidence.sourceUrl} target="_blank" rel="noreferrer" className="grid min-h-11 place-items-center rounded-xl border border-stone-300 px-3 text-sm">查看公开来源</a>}</div></div></article>;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mt-5"><h3 className="mb-2 text-sm font-semibold text-stone-700">{title}</h3>{children}</section>; }
function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-10 rounded-full border px-3 text-xs font-semibold ${active ? "border-[#173f35] bg-[#173f35] text-white" : "border-stone-300 bg-white text-stone-600"}`}>{children}</button>; }
function PillGroup({ items, selected, onChange }: { items: TakeoutReferenceItem[]; selected: string[]; onChange: (values: string[]) => void }) { return <div className="flex flex-wrap gap-2">{items.map((item) => <FilterButton key={item.id} active={selected.includes(item.id)} onClick={() => onChange(selected.includes(item.id) ? selected.filter((id) => id !== item.id) : [...selected, item.id])}>{item.shortLabel ?? item.name}</FilterButton>)}</div>; }
function isPresetActive(filters: TakeoutFilters, preset: Partial<TakeoutFilters>) { const keys = Object.keys(preset) as Array<keyof TakeoutFilters>; return keys.length === 0 ? !filters.categoryIds.length && !filters.distanceBandIds.length && !filters.areaIds.length : keys.every((key) => JSON.stringify(filters[key]) === JSON.stringify(preset[key])); }
function EmptyState({ onReset }: { onReset: () => void }) { return <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/60 p-10 text-center"><h3 className="font-serif text-2xl font-bold text-[#173f35]">没有符合条件的商户</h3><p className="mt-2 text-sm text-stone-500">可以放宽类型、商圈或距离条件后再试。</p><button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-xl bg-[#173f35] px-5 font-semibold text-white">清空全部条件</button></div>; }
