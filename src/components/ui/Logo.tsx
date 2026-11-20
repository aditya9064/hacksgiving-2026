export function Logo({ className = "", light = false }: { className?: string; light?: boolean }) {
  const fg = light ? "#ffffff" : "var(--ink)";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
        <rect x="1" y="1" width="20" height="20" fill="none" stroke={fg} strokeWidth="1.5" />
        <path d="M6 16 V6 h5.5 a3 3 0 0 1 0 6 H6 M11 12 l5 4" stroke={fg} strokeWidth="1.6" fill="none" strokeLinecap="square" />
        <circle cx="17" cy="5" r="2" fill="var(--accent)" />
      </svg>
      <span className="font-display text-[22px] leading-none" style={{ color: fg }}>Relay <span className="italic">MKE</span></span>
    </span>
  );
}
