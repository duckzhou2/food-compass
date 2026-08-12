import type { ReactNode } from "react";

export function ModeSwitch<T extends string>({
  value,
  options,
  onChange,
  label = "选择方式",
}: {
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  label?: string;
}) {
  return (
    <div aria-label={label} className="inline-grid rounded-2xl bg-stone-200/70 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-11 rounded-xl px-4 text-sm font-semibold transition ${
            value === option.value ? "bg-white text-[var(--forest)] shadow-sm" : "text-stone-500 hover:text-stone-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function FilterShell({
  open,
  onToggle,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <aside className="h-fit min-w-0 rounded-[1.75rem] border border-[var(--line)] bg-white/85 p-4 shadow-[var(--shadow-panel)] lg:sticky lg:top-24">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex min-h-11 w-full items-center justify-between rounded-xl px-2 text-left font-semibold text-[var(--forest)] lg:hidden"
      >
        <span>筛选条件</span>
        <span>{open ? "收起" : "展开"}</span>
      </button>
      <div className={`${open ? "block" : "hidden"} lg:block`}>{children}</div>
    </aside>
  );
}

export function ChoiceChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
        active
          ? "border-[var(--forest)] bg-[var(--forest)] text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-stone-400"
      }`}
    >
      {children}
    </button>
  );
}

export function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-stone-800">{title}</legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

export function EmptyState({
  title,
  description,
  onReset,
}: {
  title: string;
  description: string;
  onReset?: () => void;
}) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
      <h3 className="font-serif text-2xl font-bold text-[var(--forest)]">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-stone-500">{description}</p>
      {onReset && (
        <button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-xl bg-[var(--forest)] px-5 text-sm font-semibold text-white">
          清空全部条件
        </button>
      )}
    </div>
  );
}
