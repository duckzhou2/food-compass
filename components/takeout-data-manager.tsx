"use client";

import { useMemo, useState } from "react";
import { applyTakeoutImport, createTakeoutExport, type TakeoutPersonalData, validateTakeoutExport } from "@/lib/takeout/storage";
import type { TakeoutMerchant, TakeoutReferenceItem } from "@/types/takeout";

type Tab = "custom" | "favorites" | "history" | "excluded" | "transfer";

export function TakeoutDataManager({
  open,
  onClose,
  personal,
  onChange,
  merchants,
  categories,
  areas,
  builtinIds,
}: {
  open: boolean;
  onClose: () => void;
  personal: TakeoutPersonalData;
  onChange: (data: TakeoutPersonalData, message?: string) => void;
  merchants: TakeoutMerchant[];
  categories: TakeoutReferenceItem[];
  areas: TakeoutReferenceItem[];
  builtinIds: ReadonlySet<string>;
}) {
  const [tab, setTab] = useState<Tab>("custom");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const byId = useMemo(() => new Map(merchants.map((merchant) => [merchant.id, merchant])), [merchants]);
  if (!open) return null;

  const removeCustom = (id: string) => {
    onChange({
      ...personal,
      customMerchants: personal.customMerchants.filter((merchant) => merchant.id !== id),
      favorites: personal.favorites.filter((item) => item !== id),
      permanentExclusions: personal.permanentExclusions.filter((item) => item !== id),
      history: personal.history.filter((entry) => entry.merchantId !== id),
    }, "已删除自定义商户。");
    if (editingId === id) setEditingId(null);
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="takeout-manager-title" className="fixed inset-0 z-[90] flex justify-end bg-black/45">
      <div className="h-full w-full max-w-3xl overflow-auto bg-[var(--color-paper-alt)] p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-semibold tracking-[.16em] text-[var(--color-jade-brand)]">MY PKU TAKEOUT</p><h2 id="takeout-manager-title" className="mt-2 font-serif text-3xl font-bold text-[var(--color-forest-brand)]">管理我的北大外卖</h2></div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-full border border-stone-300 bg-white px-4">关闭</button>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto rounded-2xl bg-stone-200/70 p-1">
          {([['custom','自定义商户'],['favorites','收藏'],['history','最近点过'],['excluded','永久排除'],['transfer','导入导出']] as const).map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-semibold ${tab === id ? "bg-white text-[var(--color-forest-brand)] shadow-sm" : "text-stone-500"}`}>{label}</button>)}
        </div>
        {message && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}

        {tab === "custom" && <section className="mt-6">
          <CustomMerchantForm
            editing={personal.customMerchants.find((merchant) => merchant.id === editingId) ?? null}
            categories={categories}
            areas={areas}
            onCancel={() => setEditingId(null)}
            onSave={(merchant) => {
              const customMerchants = editingId ? personal.customMerchants.map((item) => item.id === editingId ? merchant : item) : [merchant, ...personal.customMerchants];
              onChange({ ...personal, customMerchants }, editingId ? "已更新自定义商户。" : "已添加自定义商户。");
              setEditingId(null);
            }}
          />
          <div className="mt-6 grid gap-3">{personal.customMerchants.map((merchant) => <article key={merchant.id} className="rounded-2xl border border-stone-200 bg-white p-4"><p className="font-serif text-xl font-bold text-[var(--color-forest-brand)]">{merchant.name}</p><p className="mt-1 text-xs text-stone-500">{categories.find((item) => item.id === merchant.categoryId)?.name} · {areas.find((item) => item.id === merchant.areaId)?.name} · {merchant.location.distanceDisplay}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => setEditingId(merchant.id)} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm">编辑</button><button type="button" onClick={() => removeCustom(merchant.id)} className="min-h-10 rounded-xl border border-red-200 px-3 text-sm text-red-700">删除</button></div></article>)}{!personal.customMerchants.length && <Empty text="还没有自定义商户。" />}</div>
        </section>}

        {tab === "favorites" && <ManagerList ids={personal.favorites} byId={byId} empty="还没有收藏商户。" actionLabel="取消收藏" onAction={(id) => onChange({ ...personal, favorites: personal.favorites.filter((item) => item !== id) })} />}
        {tab === "excluded" && <ManagerList ids={personal.permanentExclusions} byId={byId} empty="没有永久排除的商户。" actionLabel="恢复" onAction={(id) => onChange({ ...personal, permanentExclusions: personal.permanentExclusions.filter((item) => item !== id) })} />}
        {tab === "history" && <section className="mt-6"><button type="button" onClick={() => onChange({ ...personal, history: [] }, "最近记录已清空。") } className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold">清空记录</button><div className="mt-4 grid gap-2">{personal.history.map((entry) => <article key={`${entry.merchantId}-${entry.selectedAt}`} className="rounded-xl border border-stone-200 bg-white p-4"><p className="font-semibold text-[var(--color-forest-brand)]">{entry.merchantName}</p><p className="mt-1 text-xs text-stone-500">{new Date(entry.selectedAt).toLocaleString("zh-CN")}</p></article>)}{!personal.history.length && <Empty text="还没有“就点这家”的记录。" />}</div></section>}
        {tab === "transfer" && <TransferPanel personal={personal} builtinIds={builtinIds} onChange={onChange} setMessage={setMessage} />}
      </div>
    </div>
  );
}

function CustomMerchantForm({ editing, categories, areas, onSave, onCancel }: { editing: TakeoutMerchant | null; categories: TakeoutReferenceItem[]; areas: TakeoutReferenceItem[]; onSave: (merchant: TakeoutMerchant) => void; onCancel: () => void }) {
  const key = editing?.id ?? "new";
  return <form key={key} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const categoryId = String(data.get("categoryId") ?? categories[0]?.id ?? "");
    const areaId = String(data.get("areaId") ?? areas[0]?.id ?? "");
    const address = String(data.get("address") ?? "").trim();
    const distanceRaw = String(data.get("distance") ?? "").trim();
    const distance = distanceRaw ? Number(distanceRaw) : null;
    const distanceBandId = distance === null ? "" : distance < 1 ? "near_gate" : distance < 2 ? "km_1_2" : distance < 3 ? "km_2_3" : "km_3_5";
    const now = new Date().toISOString();
    onSave({
      id: editing?.id ?? `custom-takeout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name, aliases: [], searchText: `${name} ${categoryId} ${areaId} ${address}`, categoryId, detailCategory: "自定义商户", areaId,
      place: null, address: address || null,
      location: { referenceLatitude: null, referenceLongitude: null, distanceFromPkuSouthGateKm: distance, distanceBandId, distanceDisplay: distance === null ? "距离未填写" : distance < 0.05 ? "南门附近" : `约 ${distance.toFixed(1)} km`, precisionLabel: distance === null ? "用户未填写" : "用户填写", isEstimated: distance !== null },
      publicReference: { averageSpendCny: null, openingHoursText: null },
      delivery: { status: "unverified", statusLabel: "配送待平台确认", targetAddress: "北京大学南门", meituanVerified: false, elemeVerified: false, lastVerifiedAt: null },
      evidence: { level: "B", status: "user_custom", sourceDate: now.slice(0, 10), sourceUrl: null, note: "用户自定义" },
      sourceBatch: "用户自定义", enabled: true, wheelEligible: true, source: "custom", createdAt: editing?.createdAt ?? now,
    });
    event.currentTarget.reset();
  }} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2">
    <label className="sm:col-span-2"><span className="text-sm font-semibold">名称 *</span><input name="name" required defaultValue={editing?.name} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
    <label><span className="text-sm font-semibold">商户类型</span><select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label><span className="text-sm font-semibold">商圈</span><select name="areaId" defaultValue={editing?.areaId ?? areas[0]?.id} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">{areas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label><span className="text-sm font-semibold">地址或备注</span><input name="address" defaultValue={editing?.address ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
    <label><span className="text-sm font-semibold">参考距离（km，可选）</span><input name="distance" type="number" min="0" max="20" step="0.1" defaultValue={editing?.location.distanceFromPkuSouthGateKm ?? ""} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
    <div className="flex gap-2 sm:col-span-2"><button type="submit" className="min-h-11 rounded-xl bg-[var(--color-forest-brand)] px-5 font-semibold text-white">{editing ? "保存修改" : "添加商户"}</button>{editing && <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-stone-300 px-4">取消编辑</button>}</div>
  </form>;
}

function ManagerList({ ids, byId, empty, actionLabel, onAction }: { ids: string[]; byId: Map<string, TakeoutMerchant>; empty: string; actionLabel: string; onAction: (id: string) => void }) {
  return <section className="mt-6 grid gap-3">{ids.map((id) => <article key={id} className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><div><p className="font-semibold text-[var(--color-forest-brand)]">{byId.get(id)?.name ?? id}</p><p className="mt-1 text-xs text-stone-500">{byId.get(id)?.location.distanceDisplay}</p></div><button type="button" onClick={() => onAction(id)} className="min-h-10 rounded-xl border border-stone-300 px-3 text-sm">{actionLabel}</button></article>)}{!ids.length && <Empty text={empty} />}</section>;
}

function TransferPanel({ personal, builtinIds, onChange, setMessage }: { personal: TakeoutPersonalData; builtinIds: ReadonlySet<string>; onChange: (data: TakeoutPersonalData, message?: string) => void; setMessage: (message: string) => void }) {
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  return <section className="mt-6 grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-[var(--color-forest-brand)]">导出个人数据</h3><p className="mt-2 text-sm leading-6 text-stone-500">包含自定义商户、收藏、永久排除、历史与设置，不重复导出 339 条内置数据。</p><button type="button" onClick={() => { const url = URL.createObjectURL(new Blob([JSON.stringify(createTakeoutExport(personal), null, 2)], { type: "application/json" })); const link = document.createElement("a"); link.href = url; link.download = `食物罗盘-外卖个人数据-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url); }} className="mt-4 min-h-11 rounded-xl bg-[var(--color-forest-brand)] px-4 font-semibold text-white">导出 JSON</button></article><article className="rounded-2xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-[var(--color-forest-brand)]">导入个人数据</h3><div className="mt-3 flex gap-4 text-sm"><label><input type="radio" checked={mode === "merge"} onChange={() => setMode("merge")} /> 合并</label><label><input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} /> 覆盖</label></div><input type="file" accept="application/json,.json" className="mt-4 w-full text-sm" onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; try { const incoming = validateTakeoutExport(JSON.parse(await file.text())); onChange(applyTakeoutImport(personal, incoming, mode, builtinIds), `已${mode === "merge" ? "合并" : "覆盖"}导入个人数据。`); setMessage(""); } catch (error) { setMessage(error instanceof Error ? error.message : "导入失败。"); } event.target.value = ""; }} /><p className="mt-3 text-xs leading-5 text-stone-500">覆盖只影响外卖个人数据，不修改内置商户库。</p></article></section>;
}

function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">{text}</p>; }
