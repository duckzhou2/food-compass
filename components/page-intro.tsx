export function PageIntro({
  eyebrow,
  title,
  description,
  accent = "jade",
}: {
  eyebrow: string;
  title: string;
  description: string;
  accent?: "jade" | "coral" | "amber";
}) {
  const accentClass = {
    jade: "text-[var(--jade)]",
    coral: "text-[var(--coral)]",
    amber: "text-[var(--amber-dark)]",
  }[accent];

  return (
    <header className="page-intro mb-8 max-w-4xl">
      <p className={`text-xs font-bold tracking-[0.2em] ${accentClass}`}>{eyebrow}</p>
      <h1 className="mt-3 text-balance font-serif text-4xl font-bold leading-tight text-[var(--forest)] sm:text-5xl lg:text-[3.5rem]">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-base leading-8 text-stone-600 sm:text-lg">{description}</p>
    </header>
  );
}
