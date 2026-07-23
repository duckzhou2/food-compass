"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyMilkTeaImport,
  createMilkTeaExport,
  validateMilkTeaExport,
} from "@/lib/milk-tea/storage";
import type {
  MilkTeaHistoryEntry,
  MilkTeaPersonalData,
  MilkTeaProduct,
} from "@/types/milk-tea";

type ManagerTab = "favorites" | "history" | "excluded" | "transfer";

export function MilkTeaDataManager({
  open,
  onClose,
  products,
  data,
  onChange,
  onOpenHistory,
}: {
  open: boolean;
  onClose: () => void;
  products: MilkTeaProduct[];
  data: MilkTeaPersonalData;
  onChange: (data: MilkTeaPersonalData) => void;
  onOpenHistory: (product: MilkTeaProduct, entry: MilkTeaHistoryEntry) => void;
}) {
  const [tab, setTab] = useState<ManagerTab>("favorites");
  const [message, setMessage] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const byId = useMemo(
    () => new Map(products.map((product) => [product.productId, product])),
    [products],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const download = () => {
    const blob = new Blob([JSON.stringify(createMilkTeaExport(data), null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `食物罗盘-我的奶茶-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const incoming = validateMilkTeaExport(parsed);
      const knownIds = new Set(products.map((product) => product.productId));
      onChange(applyMilkTeaImport(data, incoming, importMode, knownIds));
      setMessage(importMode === "merge" ? "导入完成，个人数据已合并。" : "导入完成，个人数据已覆盖。");
    } catch (error) {
      setMessage(error instanceof Error ? `导入失败：${error.message}` : "导入失败：文件格式不正确。");
    }
  };

  const tabs: Array<[ManagerTab, string, number | null]> = [
    ["favorites", "收藏", data.favorites.length],
    ["history", "最近喝过", data.history.length],
    ["excluded", "永久排除", data.permanentlyExcluded.length],
    ["transfer", "导入导出", null],
  ];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-stone-950/45 sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="milk-tea-manager-title" className="max-h-[94svh] w-full overflow-hidden rounded-t-[2rem] bg-[#f8f5ee] shadow-2xl sm:max-w-4xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between gap-5 border-b border-stone-200 px-5 py-5 sm:px-7">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-[#176b55]">MY MILK TEA DATA</p><h2 id="milk-tea-manager-title" className="mt-1 font-serif text-2xl font-bold text-[#173f35]">管理我的奶茶</h2></div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700">关闭</button>
        </header>
        <div className="flex gap-1 overflow-x-auto border-b border-stone-200 px-4 py-2 sm:px-7" aria-label="奶茶数据管理分类">
          {tabs.map(([id, label, count]) => <button key={id} type="button" aria-pressed={tab === id} onClick={() => { setTab(id); setMessage(""); }} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-semibold ${tab === id ? "bg-[#173f35] text-white" : "text-stone-600 hover:bg-white"}`}>{label}{count === null ? "" : ` ${count}`}</button>)}
        </div>
        <div className="max-h-[calc(94svh-145px)] overflow-y-auto px-5 py-6 sm:px-7">
          {message && <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{message}</p>}
          {tab === "favorites" && <ProductList ids={data.favorites} byId={byId} empty="还没有收藏的饮品。" actionLabel="取消收藏" onAction={(id) => onChange({ ...data, favorites: data.favorites.filter((item) => item !== id) })} />}
          {tab === "excluded" && <ProductList ids={data.permanentlyExcluded} byId={byId} empty="没有永久排除的饮品。" actionLabel="恢复" onAction={(id) => onChange({ ...data, permanentlyExcluded: data.permanentlyExcluded.filter((item) => item !== id) })} />}
          {tab === "history" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-500">最多保留最近 50 条；已下架饮品只保留文字快照。</p><button type="button" onClick={() => onChange({ ...data, history: [] })} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm">清空记录</button></div>
              {data.history.length > 0 ? <div className="mt-4 space-y-2">{data.history.map((entry, index) => {
                const product = byId.get(entry.productId);
                return <article key={`${entry.productId}-${entry.selectedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><button type="button" disabled={!product} onClick={() => { if (product) { onOpenHistory(product, entry); onClose(); } }} className="min-h-11 text-left disabled:cursor-default"><span className="block font-semibold text-stone-900">{entry.brandName} · {entry.productName}</span><span className="mt-1 block text-xs text-stone-500">{new Date(entry.selectedAt).toLocaleString("zh-CN")}{product ? "" : " · 已下架"}</span></button><button type="button" onClick={() => onChange({ ...data, history: data.history.filter((_, itemIndex) => itemIndex !== index) })} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">删除</button></article>;
              })}</div> : <p className="mt-5 text-sm text-stone-500">点击结果卡中的“就喝这个”后，会在这里留下记录。</p>}
            </div>
          )}
          {tab === "transfer" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-3xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-stone-900">导出个人数据</h3><p className="mt-3 text-sm leading-6 text-stone-500">导出收藏、排除、历史和设置，不包含内置饮品数据。</p><button type="button" onClick={download} className="mt-5 min-h-11 rounded-xl bg-[#173f35] px-5 text-sm font-semibold text-white">导出 JSON</button></section>
              <section className="rounded-3xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-stone-900">导入个人数据</h3><div className="mt-4 flex gap-2">{(["merge", "replace"] as const).map((mode) => <button key={mode} type="button" aria-pressed={importMode === mode} onClick={() => setImportMode(mode)} className={`min-h-11 rounded-xl px-4 text-sm ${importMode === mode ? "bg-[#173f35] text-white" : "border border-stone-300"}`}>{mode === "merge" ? "合并" : "覆盖"}</button>)}</div><label className="mt-5 block"><span className="block text-sm font-semibold text-stone-700">选择 JSON 文件</span><input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} className="mt-2 block w-full text-sm" /></label><p className="mt-3 text-xs leading-5 text-stone-500">覆盖仅影响个人数据，未知产品不会进入候选池。</p></section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ProductList({ ids, byId, empty, actionLabel, onAction }: { ids: string[]; byId: Map<string, MilkTeaProduct>; empty: string; actionLabel: string; onAction: (id: string) => void }) {
  const products = ids.map((id) => byId.get(id)).filter((product): product is MilkTeaProduct => Boolean(product));
  if (products.length === 0) return <p className="text-sm text-stone-500">{empty}</p>;
  return <div className="space-y-3">{products.map((product) => <article key={product.productId} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><div><p className="font-semibold text-stone-900">{product.productName}</p><p className="mt-1 text-xs text-stone-500">{product.brandName} · {product.displayCategory}</p></div><button type="button" onClick={() => onAction(product.productId)} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">{actionLabel}</button></article>)}</div>;
}
