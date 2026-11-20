export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
        <rect width="28" height="28" rx="7" fill={light ? "#ffffff" : "var(--brand)"} />
        <path d="M7 19 L7 9 L13 9 C16 9 17.5 10.5 17.5 12.5 C17.5 14.3 16.4 15.4 14.6 15.8 L18.5 19 M7 14 L13 14" stroke={light ? "#0f5132" : "var(--surface)"} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="21" cy="8" r="2.4" fill="#dc2626" />
      </svg>
      <span className={`font-display text-[21px] font-semibold tracking-tight ${light ? "text-white" : "text-ink"}`}>Relay <span className="font-light">MKE</span></span>
    </span>
  );
}
