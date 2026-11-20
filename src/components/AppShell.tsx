"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Users, BarChart3, Activity, BookOpen, Settings, LogOut, Search, Bell, Smartphone, MessageSquare } from "lucide-react";
import { Logo } from "./ui/Logo";

const NAV = [
  { href: "/board", label: "Board", Icon: LayoutGrid },
  { href: "/partners", label: "Partners", Icon: Users },
  { href: "/impact", label: "Impact", Icon: BarChart3 },
  { href: "/pulse", label: "Pulse", Icon: Activity },
  { href: "/guide", label: "Guide", Icon: BookOpen },
];

export function useClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Sidebar() {
  const path = usePathname();
  const item = "flex h-10 w-10 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-2";
  return (
    <aside className="sticky top-0 h-screen w-[62px] shrink-0 flex flex-col items-center bg-surface border-r border-line py-3">
      <Link href="/board"><Logo /></Link>
      <nav className="mt-7 flex flex-col items-center gap-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = path.startsWith(href);
          return <Link key={href} href={href} title={label} className={`${item} ${active ? "!bg-brand-soft !text-brand" : ""}`}><Icon size={18} strokeWidth={1.8} /></Link>;
        })}
        <Link href="/r" title="Resident intake" className={item}><MessageSquare size={18} strokeWidth={1.8} /></Link>
        <Link href="/m" title="Volunteer phone" className={item}><Smartphone size={18} strokeWidth={1.8} /></Link>
        <span className={item}><Settings size={18} strokeWidth={1.8} /></span>
      </nav>
      <span className={`${item} mt-auto`}><LogOut size={18} strokeWidth={1.8} /></span>
    </aside>
  );
}

function TopBar({ badge, me }: { badge?: number; me?: string }) {
  const initials = (me ?? "You").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="sticky top-0 z-20 flex h-[52px] items-center justify-between border-b border-line bg-surface px-5">
      <div className="relative w-[240px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input !h-[34px] !text-[13px]" placeholder="Search requests, partners..." />
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-1.5 text-ink-2 hover:text-ink"><Bell size={17} />{!!badge && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9.5px] font-bold text-white">{badge}</span>}</button>
        <button className="p-1.5 text-ink-2 hover:text-ink"><Settings size={17} /></button>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-semibold text-white">{initials}</span>
      </div>
    </div>
  );
}

export function AppShell({ children, title, subtitle, actions, badge, me }: { children: React.ReactNode; title: React.ReactNode; subtitle?: string; actions?: React.ReactNode; badge?: number; me?: string }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar badge={badge} me={me} />
        <main className="flex-1 px-5 py-5">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div>
              <h1 className="text-[23px] font-bold leading-tight text-ink flex items-center gap-2">{title}</h1>
              {subtitle && <p className="mt-1 text-[14px] text-ink-2">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export function Btn({ children, onClick, href, variant = "ghost", className = "", disabled, title }: { children: React.ReactNode; onClick?: () => void; href?: string; variant?: "ghost" | "solid" | "danger"; className?: string; disabled?: boolean; title?: string }) {
  const v = variant === "solid" ? "bg-brand text-white border-brand hover:bg-brand-2" : variant === "danger" ? "bg-red text-white border-red hover:opacity-90" : "border-line bg-surface text-ink hover:bg-surface-2";
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg border px-3.5 h-[38px] text-[13px] font-medium transition-colors disabled:opacity-40 ${v} ${className}`;
  if (href) return <Link href={href} className={cls} title={title}>{children}</Link>;
  return <button onClick={onClick} disabled={disabled} title={title} className={cls}>{children}</button>;
}
