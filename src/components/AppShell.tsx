"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { Logo } from "./ui/Logo";

const NAV = [
  { href: "/board", label: "Board", n: "01" },
  { href: "/partners", label: "Partners", n: "02" },
  { href: "/impact", label: "Impact", n: "03" },
  { href: "/pulse", label: "Pulse", n: "04" },
  { href: "/guide", label: "Guide", n: "05" },
];

export function useLiveOps() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("relay-liveops") === "1";
    setDark(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("relay-liveops", next ? "1" : "0");
    document.documentElement.classList.toggle("dark", next);
  };
  return { dark, toggle };
}

export function useClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function Ticker({ items }: { items: string[] }) {
  if (!items.length) return null;
  const row = items.map((t, i) => (
    <span key={i} className="mono inline-flex items-center gap-3 pr-10 text-[11px] text-ink-2">
      <span className="h-1 w-1 bg-brand" />
      {t}
    </span>
  ));
  return (
    <div className="overflow-hidden border-b border-line bg-surface-2 py-1.5">
      <div className="ticker flex w-max whitespace-nowrap">{row}{row}</div>
    </div>
  );
}

export function AppShell({ children, title, titleAccent, kicker, subtitle, actions, aside, ticker }: { children: React.ReactNode; title: string; titleAccent?: string; kicker?: string; subtitle?: string; actions?: React.ReactNode; aside?: React.ReactNode; ticker?: string[] }) {
  const path = usePathname();
  const { dark, toggle } = useLiveOps();
  const now = useClock();
  const clock = now ? new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--";

  return (
    <div className="min-h-screen flex flex-col">
      <div className="h-[3px] bg-brand" />
      <nav className="sticky top-0 z-30 bg-surface border-b border-line">
        <div className="flex h-12 items-center px-6">
          <Link href="/board"><Logo /></Link>
          <div className="hidden md:flex items-stretch h-full ml-10">
            {NAV.map(({ href, label, n }) => {
              const active = path.startsWith(href);
              return (
                <Link key={href} href={href} className={`relative inline-flex items-center gap-2 px-4 text-[13px] font-medium transition-colors ${active ? "text-ink" : "text-muted hover:text-ink"}`}>
                  <span className="mono text-[10px] text-muted">{n}</span> {label}
                  {active && <span className="absolute inset-x-4 -bottom-px h-[2px] bg-ink" />}
                </Link>
              );
            })}
          </div>
          <div className="ml-auto flex items-center gap-5">
            <span className="mono inline-flex items-center gap-2 text-[11px] text-ink-2"><span className="h-1.5 w-1.5 rounded-full bg-accent blink" /> LIVE · {clock}</span>
            <Link href="/m" className="mono text-[11px] text-muted hover:text-ink">PHONE</Link>
            <Link href="/r" className="mono text-[11px] text-muted hover:text-ink">INTAKE</Link>
            <button onClick={toggle} className="inline-flex items-center gap-1.5 text-muted hover:text-ink" title="Toggle Live Ops mode">{dark ? <SunMedium size={15} /> : <MoonStar size={15} />}</button>
          </div>
        </div>
      </nav>
      {ticker && <Ticker items={ticker} />}

      <header className="px-6 pt-10 pb-6 border-b-2 border-line-strong">
        <div className="flex flex-col xl:flex-row xl:items-end gap-8">
          <div className="flex-1 min-w-0">
            {kicker && <div className="label mb-3">{kicker}</div>}
            <h1 className="font-display text-[64px] md:text-[84px] leading-[0.9] text-ink">
              {title}{titleAccent && <> <span className="italic text-brand">{titleAccent}</span></>}
            </h1>
            {subtitle && <p className="mt-4 max-w-[560px] text-[14.5px] leading-relaxed text-ink-2">{subtitle}</p>}
            {actions && <div className="mt-5 flex items-center gap-2">{actions}</div>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}

export function Btn({ children, onClick, variant = "ghost", className = "", disabled, title }: { children: React.ReactNode; onClick?: () => void; variant?: "ghost" | "solid" | "danger"; className?: string; disabled?: boolean; title?: string }) {
  const v = variant === "solid" ? "bg-ink text-bg hover:bg-brand border-ink hover:border-brand" : variant === "danger" ? "border-accent text-accent hover:bg-accent hover:text-white" : "border-line text-ink hover:border-ink";
  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`inline-flex items-center justify-center gap-2 border px-3.5 py-2 text-[12.5px] font-medium transition-colors disabled:opacity-40 ${v} ${className}`}>{children}</button>
  );
}
