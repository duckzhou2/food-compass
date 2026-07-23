export function BrandMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path d="M12 2.8 20.2 12 12 21.2 3.8 12 12 2.8Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <path d="m12 7.4 1.5 3.1L12 12l-1.5-1.5L12 7.4Z" fill="currentColor" opacity=".55" />
    </svg>
  );
}
