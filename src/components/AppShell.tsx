"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, BookOpen, Handshake, KanbanSquare, MoonStar, PieChart, QrCode, Smartphone, SunMedium } from "lucide-react";
import { Logo } from "./ui/Logo";

const NAV = [
  { href: "/board", label: "Board", sub: "Requests & referrals", icon: KanbanSquare },
  { href: "/partners", label: "Partners", sub: "Information sharing", icon: Handshake },
  { href: "/impact", label: "Impact", sub: "Data & measurement", icon: PieChart },
  { href: "/pulse", label: "Pulse", sub: "Awareness & decisions", icon: Activity },
  { href: "/guide", label: "Guide", sub: "Training & knowledge", icon: BookOpen },
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

export function AppShell({ children, title, subtitle, actions }: { children: React.ReactNode; title: string; subtitle?: string; actions?: React.ReactNode }) {
  const path = usePathname();
  const { dark, toggle } = useLiveOps();
  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-[232px] shrink-0 flex-col bg-[#0f5132] dark:bg-[#0d1411] text-white dark:border-r dark:border-line">
        <div className="px-5 pt-5 pb-4">
          <Logo light />
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ href, label, sub, icon: Icon }) => {
            const active = path.startsWith(href);
            return (
              <Link key={href} href={href} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${active ? "bg-white/15 dark:bg-brand/15" : "hover:bg-white/8"}`}>
                <Icon size={18} className={active ? "text-white dark:text-brand" : "text-white/70"} />
                <span className="flex flex-col leading-tight">
                  <span className={`text-[14px] font-medium ${active ? "text-white" : "text-white/85"}`}>{label}</span>
                  <span className="text-[10.5px] text-white/45 group-hover:text-white/60">{sub}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-3 space-y-0.5 border-t border-white/10 pt-3">
          <Link href="/m" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/75 hover:bg-white/8"><Smartphone size={16} /> Volunteer phone view</Link>
          <Link href="/r" className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/75 hover:bg-white/8"><QrCode size={16} /> Resident intake</Link>
          <button onClick={toggle} className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-white/75 hover:bg-white/8">
            {dark ? <SunMedium size={16} /> : <MoonStar size={16} />} {dark ? "Exit Live Ops mode" : "Live Ops mode"}
          </button>
        </div>
        <div className="px-5 pb-5 text-[10.5px] leading-snug text-white/40">
          Stronger neighbors.<br />A healthier Milwaukee.
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col grid-bg">
        <header className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 pb-3">
          <div>
            <h1 className="font-display text-[34px] md:text-[40px] leading-none font-semibold text-ink rule-accent">{title}</h1>
            {subtitle && <p className="mt-3 text-[13.5px] text-ink-2">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 pt-1">{actions}</div>
        </header>
        <main className="flex-1 px-6 md:px-8 pb-8">{children}</main>
      </div>
    </div>
  );
}
