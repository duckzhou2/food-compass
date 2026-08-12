"use client";

import { useEffect, useMemo, useState } from "react";
import {
  excludeLabels,
  flavorLabels,
  fullnessLabels,
  getMealCategory,
  mealCategories,
  priceLabels,
  sceneLabels,
  timeLabels,
} from "@/lib/meals/constants";
import { applyMealImport, createMealExport, validateMealExport, type MealPersonalData } from "@/lib/meals/storage";
import {
  excludeTags,
  flavorTags,
  fullnessTags,
  mealEntryTypes,
  mealTimeTags,
  priceBands,
  sceneTags,
  type MealFood,
} from "@/types/meals";

type ManagerTab = "custom" | "favorites" | "history" | "excluded" | "transfer";

export function MealDataManager({
  open,
  onClose,
  foods,
  data,
  onChange,
  onSelectFood,
  initialEditId,
}: {
  open: boolean;
  onClose: () => void;
  foods: MealFood[];
  data: MealPersonalData;
  onChange: (data: MealPersonalData) => void;
  onSelectFood: (food: MealFood) => void;
  initialEditId: string | null;
}) {
  const [tab, setTab] = useState<ManagerTab>("custom");
  const [editing, setEditing] = useState<MealFood | null>(() => foods.find((item) => item.id === initialEditId && item.source === "custom") ?? null);
  const [message, setMessage] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const byId = useMemo(() => new Map(foods.map((food) => [food.id, food])), [foods]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const removeCustom = (food: MealFood) => {
    onChange({
      ...data,
      customFoods: data.customFoods.filter((item) => item.id !== food.id),
      favorites: data.favorites.filter((id) => id !== food.id),
      permanentlyExcluded: data.permanentlyExcluded.filter((id) => id !== food.id),
      sessionExclusions: data.sessionExclusions.filter((id) => id !== food.id),
    });
    if (editing?.id === food.id) setEditing(null);
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(createMealExport(data), null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `食物罗盘-我的食物库-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const incoming = validateMealExport(parsed);
      const builtinIds = new Set(foods.filter((food) => food.source === "builtin").map((food) => food.id));
      onChange(applyMealImport(data, incoming, importMode, builtinIds));
      setMessage(importMode === "merge" ? "导入完成，个人数据已合并。" : "导入完成，个人数据已覆盖。旧的内置食物未受影响。");
    } catch (error) {
      setMessage(error instanceof Error ? `导入失败：${error.message}` : "导入失败：文件格式不正确。");
    }
  };

  const tabs: Array<[ManagerTab, string, number | null]> = [
    ["custom", "自定义", data.customFoods.length],
    ["favorites", "收藏", data.favorites.length],
    ["history", "最近吃过", data.history.length],
    ["excluded", "永久排除", data.permanentlyExcluded.length],
    ["transfer", "导入导出", null],
  ];

  return (
    <div className="fixed inset-0 z-[80] grid place-items-end bg-stone-950/45 p-0 sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="meal-manager-title" className="max-h-[94svh] w-full overflow-hidden rounded-t-[2rem] bg-[var(--color-paper-alt)] shadow-2xl sm:max-w-5xl sm:rounded-[2rem]">
        <header className="flex items-start justify-between gap-5 border-b border-stone-200 px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[var(--color-jade-brand)]">MY MEAL DATA</p>
            <h2 id="meal-manager-title" className="mt-1 font-serif text-2xl font-bold text-[var(--color-forest-brand)]">管理我的食物</h2>
          </div>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700">关闭</button>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-stone-200 px-4 py-2 sm:px-7" aria-label="数据管理分类">
          {tabs.map(([id, label, count]) => (
            <button key={id} type="button" aria-pressed={tab === id} onClick={() => { setTab(id); setMessage(""); }} className={`min-h-11 whitespace-nowrap rounded-xl px-3 text-sm font-semibold ${tab === id ? "bg-[var(--color-forest-brand)] text-white" : "text-stone-600 hover:bg-white"}`}>
              {label}{count === null ? "" : ` ${count}`}
            </button>
          ))}
        </div>

        <div className="max-h-[calc(94svh-145px)] overflow-y-auto px-5 py-6 sm:px-7">
          {message && <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">{message}</p>}

          {tab === "custom" && (
            <div className="grid gap-7 lg:grid-cols-[1fr_1.15fr]">
              <MealFoodForm key={editing?.id ?? "new"} initial={editing} onSave={(food) => {
                const customFoods = editing
                  ? data.customFoods.map((item) => item.id === food.id ? food : item)
                  : [food, ...data.customFoods];
                onChange({ ...data, customFoods });
                setEditing(null);
                setMessage(editing ? "自定义食物已更新。" : "自定义食物已添加。 ");
              }} onCancel={() => setEditing(null)} />
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-900">已有自定义食物</h3>
                {data.customFoods.length ? (
                  <div className="mt-4 space-y-3">
                    {data.customFoods.map((food) => (
                      <article key={food.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><p className="font-semibold text-stone-900">{food.name}</p><p className="mt-1 text-xs text-stone-500">{getMealCategory(food.categoryId).name}{food.note ? ` · ${food.note}` : ""}</p></div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setEditing(food)} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">编辑</button>
                            <button type="button" onClick={() => removeCustom(food)} className="min-h-11 rounded-xl border border-red-200 px-3 text-sm text-red-700">删除</button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : <p className="mt-4 text-sm leading-6 text-stone-500">还没有自定义食物。可以添加食堂窗口、附近餐厅、常点外卖或自己会做的菜。</p>}
              </div>
            </div>
          )}

          {tab === "favorites" && <FoodReferenceList ids={data.favorites} byId={byId} empty="还没有收藏。" actionLabel="取消收藏" onAction={(id) => onChange({ ...data, favorites: data.favorites.filter((item) => item !== id) })} onSelect={(food) => { onSelectFood(food); onClose(); }} />}

          {tab === "excluded" && <FoodReferenceList ids={data.permanentlyExcluded} byId={byId} empty="没有永久排除的食物。" actionLabel="恢复" onAction={(id) => onChange({ ...data, permanentlyExcluded: data.permanentlyExcluded.filter((item) => item !== id) })} />}

          {tab === "history" && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-500">最多保留最近 50 条。</p><button type="button" onClick={() => onChange({ ...data, history: [] })} className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 text-sm">清空记录</button></div>
              {data.history.length ? <div className="mt-4 space-y-2">{data.history.map((entry, index) => (
                <article key={`${entry.foodId}-${entry.selectedAt}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4">
                  <button type="button" onClick={() => { const food = byId.get(entry.foodId); if (food) { onSelectFood(food); onClose(); } }} className="min-h-11 text-left"><span className="block font-semibold text-stone-900">{entry.foodName}</span><span className="mt-1 block text-xs text-stone-500">{new Date(entry.selectedAt).toLocaleString("zh-CN")}</span></button>
                  <button type="button" onClick={() => onChange({ ...data, history: data.history.filter((_, itemIndex) => itemIndex !== index) })} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">删除</button>
                </article>
              ))}</div> : <p className="mt-5 text-sm text-stone-500">点击结果卡中的“就吃这个”后，会在这里留下记录。</p>}
            </div>
          )}

          {tab === "transfer" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <section className="rounded-3xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-stone-900">导出个人数据</h3><p className="mt-3 text-sm leading-6 text-stone-500">导出自定义食物、收藏、排除、历史和设置。内置 459 条食物不会重复写入文件。</p><button type="button" onClick={download} className="mt-5 min-h-11 rounded-xl bg-[var(--color-forest-brand)] px-5 text-sm font-semibold text-white">导出 JSON</button></section>
              <section className="rounded-3xl border border-stone-200 bg-white p-5"><h3 className="font-serif text-xl font-bold text-stone-900">导入个人数据</h3><div className="mt-4 flex gap-2">{(["merge", "replace"] as const).map((mode) => <button key={mode} type="button" aria-pressed={importMode === mode} onClick={() => setImportMode(mode)} className={`min-h-11 rounded-xl px-4 text-sm ${importMode === mode ? "bg-[var(--color-forest-brand)] text-white" : "border border-stone-300"}`}>{mode === "merge" ? "合并" : "覆盖"}</button>)}</div><label className="mt-5 block"><span className="block text-sm font-semibold text-stone-700">选择 JSON 文件</span><input type="file" accept="application/json,.json" onChange={(event) => void importFile(event.target.files?.[0])} className="mt-2 block w-full text-sm" /></label><p className="mt-3 text-xs leading-5 text-stone-500">覆盖只影响个人数据，不会修改内置食物。</p></section>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MealFoodForm({ initial, onSave, onCancel }: { initial: MealFood | null; onSave: (food: MealFood) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "rice");
  const [entryType, setEntryType] = useState(initial?.entryType ?? "dish");
  const [selectedPriceBands, setSelectedPriceBands] = useState(initial?.priceBands ?? []);
  const [selectedFlavors, setSelectedFlavors] = useState(initial?.flavorTags ?? []);
  const [selectedTimes, setSelectedTimes] = useState(initial?.timeTags ?? []);
  const [selectedFullness, setSelectedFullness] = useState(initial?.fullnessTags ?? []);
  const [selectedScenes, setSelectedScenes] = useState(initial?.sceneTags ?? []);
  const [selectedExcludes, setSelectedExcludes] = useState(initial?.excludeTags ?? []);
  const [vegetarian, setVegetarian] = useState(initial?.dietTags.includes("vegetarian_friendly") ?? false);
  const [note, setNote] = useState(initial?.note ?? "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const createdAt = initial?.createdAt ?? new Date().toISOString();
    onSave({ id: initial?.id ?? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: name.trim(), aliases: initial?.aliases ?? [], categoryId, entryType, priceBands: selectedPriceBands, flavorTags: selectedFlavors, timeTags: selectedTimes, fullnessTags: selectedFullness, sceneTags: selectedScenes, excludeTags: selectedExcludes, dietTags: vegetarian ? ["vegetarian_friendly"] : [], source: "custom", enabled: true, note: note.trim(), createdAt });
  };

  return (
    <form onSubmit={submit} className="rounded-3xl border border-stone-200 bg-white p-5">
      <h3 className="font-serif text-xl font-bold text-stone-900">{initial ? "编辑自定义食物" : "添加自定义食物"}</h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2"><span className="text-sm font-semibold text-stone-700">名称 *</span><input required value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 px-3" /></label>
        <SelectField label="主分类" value={categoryId} onChange={(value) => setCategoryId(value as typeof categoryId)} options={mealCategories.map((item) => [item.id, item.name])} />
        <SelectField label="条目类型" value={entryType} onChange={(value) => setEntryType(value as typeof entryType)} options={mealEntryTypes.map((item) => [item, item === "dish" ? "具体食物" : "餐厅 / 食堂窗口"])} />
      </div>
      <CheckGroup title="价格（可多选）" values={priceBands} selected={selectedPriceBands} labels={priceLabels} onChange={setSelectedPriceBands} />
      <CheckGroup title="口味（可多选）" values={flavorTags} selected={selectedFlavors} labels={flavorLabels} onChange={setSelectedFlavors} />
      <CheckGroup title="用餐时间" values={mealTimeTags} selected={selectedTimes} labels={timeLabels} onChange={setSelectedTimes} />
      <CheckGroup title="饱腹程度" values={fullnessTags} selected={selectedFullness} labels={fullnessLabels} onChange={setSelectedFullness} />
      <CheckGroup title="适用场景" values={sceneTags} selected={selectedScenes} labels={sceneLabels} onChange={setSelectedScenes} />
      <CheckGroup title="常见食材 / 形态标签" values={excludeTags.filter((tag) => tag !== "mala" && tag !== "vegetarian_friendly")} selected={selectedExcludes} labels={excludeLabels} onChange={setSelectedExcludes} />
      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={vegetarian} onChange={(event) => setVegetarian(event.target.checked)} className="size-4 accent-[var(--color-jade-brand)]" />素食友好（仅作一般参考）</label>
      <label className="mt-4 block"><span className="text-sm font-semibold text-stone-700">位置或备注</span><textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-stone-300 p-3" /></label>
      <div className="mt-5 flex gap-2"><button type="submit" className="min-h-11 rounded-xl bg-[var(--color-forest-brand)] px-5 text-sm font-semibold text-white">{initial ? "保存修改" : "添加"}</button>{initial && <button type="button" onClick={onCancel} className="min-h-11 rounded-xl border border-stone-300 px-4 text-sm">取消</button>}</div>
    </form>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label><span className="text-sm font-semibold text-stone-700">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3">{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}

function CheckGroup<T extends string>({ title, values, selected, labels, onChange }: { title: string; values: readonly T[]; selected: T[]; labels: Record<T, string>; onChange: (value: T[]) => void }) {
  return <fieldset className="mt-5"><legend className="text-sm font-semibold text-stone-700">{title}</legend><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <label key={value} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-sm ${selected.includes(value) ? "border-[var(--color-jade-brand)] bg-emerald-50" : "border-stone-200"}`}><input type="checkbox" checked={selected.includes(value)} onChange={() => onChange(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value])} className="size-4 accent-[var(--color-jade-brand)]" />{labels[value]}</label>)}</div></fieldset>;
}

function FoodReferenceList({ ids, byId, empty, actionLabel, onAction, onSelect }: { ids: string[]; byId: Map<string, MealFood>; empty: string; actionLabel: string; onAction: (id: string) => void; onSelect?: (food: MealFood) => void }) {
  const foods = ids.map((id) => byId.get(id)).filter((food): food is MealFood => Boolean(food));
  if (!foods.length) return <p className="text-sm text-stone-500">{empty}</p>;
  return <div className="space-y-3">{foods.map((food) => <article key={food.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"><button type="button" disabled={!onSelect} onClick={() => onSelect?.(food)} className="min-h-11 text-left disabled:cursor-default"><span className="block font-semibold text-stone-900">{food.name}</span><span className="mt-1 block text-xs text-stone-500">{getMealCategory(food.categoryId).name}</span></button><button type="button" onClick={() => onAction(food.id)} className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm">{actionLabel}</button></article>)}</div>;
}
