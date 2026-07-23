"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ModeSwitch } from "@/components/ui/experience-controls";
import { builtinMealFoods } from "@/lib/data/meals";
import { mealCategories } from "@/lib/meals/constants";
import {
  defaultMealPersonalData,
  loadMealPersonalData,
  type MealPersonalData,
} from "@/lib/meals/storage";
import {
  defaultMilkTeaPersonalData,
  loadMilkTeaPersonalData,
} from "@/lib/milk-tea/storage";
import {
  defaultTakeoutPersonalData,
  loadTakeoutPersonalData,
  type TakeoutPersonalData,
} from "@/lib/takeout/storage";
import type { MilkTeaPersonalData } from "@/types/milk-tea";
import type { TakeoutReferenceItem } from "@/types/takeout";

type DataTab = "milk" | "meals" | "canteens" | "takeout";

type DataOverviewProps = {
  brandSummaries: Array<{
    name: string;
    products: number;
    variants: number;
    toppings: number;
  }>;
  milkStats: {
    products: number;
    variants: number;
    toppings: number;
    detailed: number;
  };
  canteenStats: {
    canteens: number;
    servicePoints: number;
    physicalFloors: number;
    structuralFloorNodes: number;
    windows: number;
    dishes: number;
    skus: number;
    activities: number;
    windowPendingDishes: number;
  };
  takeoutStats: {
    merchants: number;
    categories: number;
    areas: number;
    evidenceA: number;
  };
  takeoutCategories: TakeoutReferenceItem[];
};

const tabOptions = [
  { value: "milk", label: "奶茶数据" },
  { value: "meals", label: "食物选项" },
  { value: "canteens", label: "北大食堂" },
  { value: "takeout", label: "北大外卖" },
] as const;

export function DataOverview({
  brandSummaries,
  milkStats,
  canteenStats,
  takeoutStats,
  takeoutCategories,
}: DataOverviewProps) {
  const [tab, setTab] = useState<DataTab>("milk");
  const [mealPersonal, setMealPersonal] = useState<MealPersonalData>(defaultMealPersonalData);
  const [milkPersonal, setMilkPersonal] = useState<MilkTeaPersonalData>(defaultMilkTeaPersonalData);
  const [takeoutPersonal, setTakeoutPersonal] = useState<TakeoutPersonalData>(defaultTakeoutPersonalData);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMealPersonal(loadMealPersonalData().data);
      setMilkPersonal(loadMilkTeaPersonalData().data);
      setTakeoutPersonal(loadTakeoutPersonalData().data);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--jade)]">DATA OVERVIEW</p>
        <h1 className="mt-3 font-serif text-4xl font-bold text-[var(--forest)] sm:text-5xl">
          四套选择，一处说明数据边界。
        </h1>
        <p className="mt-5 text-base leading-8 text-stone-600">
          奶茶、正餐、北大食堂和北大外卖使用彼此独立的数据结构与本地存储。
        </p>
      </header>

      <div className="mt-10 max-w-full overflow-x-auto">
        <ModeSwitch value={tab} onChange={setTab} options={tabOptions} label="数据类别" />
      </div>

      {tab === "milk" && (
        <MilkStats summaries={brandSummaries} stats={milkStats} personal={milkPersonal} />
      )}
      {tab === "meals" && <MealStats personal={mealPersonal} />}
      {tab === "canteens" && <CanteenStats stats={canteenStats} />}
      {tab === "takeout" && (
        <TakeoutStats
          stats={takeoutStats}
          categories={takeoutCategories}
          personal={takeoutPersonal}
        />
      )}
    </main>
  );
}

function TakeoutStats({
  stats,
  categories,
  personal,
}: {
  stats: DataOverviewProps["takeoutStats"];
  categories: TakeoutReferenceItem[];
  personal: TakeoutPersonalData;
}) {
  return (
    <>
      <StatsRow>
        <Stat value={stats.merchants} label="候选商户" />
        <Stat value={stats.categories} label="主分类" />
        <Stat value={stats.areas} label="覆盖商圈" />
        <Stat value={stats.evidenceA} label="A级证据" />
      </StatsRow>
      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <DataCard
            key={category.id}
            eyebrow={category.shortLabel ?? "商户类型"}
            title={category.name}
            value={category.merchantCount ?? 0}
          />
        ))}
      </section>
      <Footnote>
        个人数据：{personal.customMerchants.length} 家自定义、{personal.favorites.length} 项收藏、
        {personal.permanentExclusions.length} 项永久排除、{personal.history.length} 条最近记录。
        公开候选库未接入美团或饿了么，不能据此判断当前是否可送。
      </Footnote>
    </>
  );
}

function CanteenStats({ stats }: { stats: DataOverviewProps["canteenStats"] }) {
  return (
    <>
      <StatsRow>
        <Stat value={stats.canteens - stats.servicePoints} label="正式食堂" />
        <Stat value={stats.physicalFloors} label="可靠物理楼层" />
        <Stat value={stats.windows} label="窗口/档口" />
        <Stat value={stats.dishes} label="结构化菜品" />
      </StatsRow>
      <section className="mt-12 grid gap-5 sm:grid-cols-3">
        <SimpleStatCard label="GitHub 历史 SKU" value={stats.skus} />
        <SimpleStatCard label="窗口待确认菜品" value={stats.windowPendingDishes} />
        <SimpleStatCard label="临时活动记录" value={stats.activities} />
      </section>
      <Footnote>
        历史价格和营养均不代表当前在售、现价或医学精确测量；窗口不明确的历史菜品不会根据名称自动绑定。
      </Footnote>
    </>
  );
}

function MealStats({ personal }: { personal: MealPersonalData }) {
  const stats = [
    [builtinMealFoods.length, "内置食物"],
    [mealCategories.length, "主分类"],
    [personal.customFoods.length, "自定义"],
    [personal.history.length, "最近记录"],
  ] as const;

  return (
    <>
      <StatsRow>
        {stats.map(([value, label]) => (
          <Stat key={label} value={value} label={label} />
        ))}
      </StatsRow>
      <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mealCategories.map((category) => (
          <DataCard
            key={category.id}
            eyebrow={category.shortLabel}
            title={category.name}
            value={category.count}
            accent="coral"
          />
        ))}
      </section>
      <Footnote>
        另有 {personal.favorites.length} 项收藏、{personal.permanentlyExcluded.length} 项永久排除。
        价格、口味、时间和饱腹标签是一般化决策参考，不是官方门店数据。
      </Footnote>
    </>
  );
}

function MilkStats({
  summaries,
  stats,
  personal,
}: {
  summaries: DataOverviewProps["brandSummaries"];
  stats: DataOverviewProps["milkStats"];
  personal: MilkTeaPersonalData;
}) {
  return (
    <>
      <StatsRow>
        <Stat value={stats.products} label="独立产品" />
        <Stat value={stats.variants} label="规格热量记录" />
        <Stat value={stats.toppings} label="独立小料" />
        <Stat value={stats.detailed} label="含精细规格产品" />
      </StatsRow>
      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        {summaries.map((brand) => (
          <article key={brand.name} className="rounded-[1.75rem] border border-stone-200 bg-white p-6">
            <p className="text-xs font-semibold tracking-[.14em] text-[var(--jade)]">{brand.name}</p>
            <p className="mt-3 font-serif text-3xl font-bold text-stone-900">{brand.products} 款</p>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {brand.variants} 条规格热量记录 · {brand.toppings} 种独立小料
            </p>
          </article>
        ))}
      </section>
      <Footnote>
        个人数据：{personal.favorites.length} 项收藏、{personal.permanentlyExcluded.length} 项永久排除、
        {personal.history.length} 条最近记录。在线站与离线版分别保存在各自浏览器环境中。
      </Footnote>
    </>
  );
}

function StatsRow({ children }: { children: ReactNode }) {
  return (
    <section className="mt-10 grid grid-cols-2 gap-y-6 border-y border-stone-300 py-6 sm:grid-cols-4">
      {children}
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-0 border-r border-stone-300 px-3 last:border-r-0 sm:px-6">
      <p className="break-words text-xs text-stone-500 sm:text-sm">{label}</p>
      <p className="mt-3 font-mono text-2xl font-bold text-[var(--forest)] sm:text-4xl">{value}</p>
    </div>
  );
}

function DataCard({
  eyebrow,
  title,
  value,
  accent = "jade",
}: {
  eyebrow: string;
  title: string;
  value: number;
  accent?: "jade" | "coral";
}) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6">
      <p className={`text-xs font-semibold tracking-[.14em] ${accent === "coral" ? "text-[var(--coral)]" : "text-[var(--jade)]"}`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-2xl font-bold text-[var(--forest)]">{title}</h2>
      <p className="mt-4 font-mono text-3xl font-bold text-stone-900">{value}</p>
    </article>
  );
}

function SimpleStatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-3xl border border-stone-200 bg-white p-6">
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-3 font-mono text-3xl font-bold text-[var(--forest)]">{value}</p>
    </article>
  );
}

function Footnote({ children }: { children: ReactNode }) {
  return <p className="mt-8 text-sm leading-7 text-stone-500">{children}</p>;
}
