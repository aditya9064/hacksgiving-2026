"use client";
import { ListChecks, Hand, Clock, ShieldCheck, RotateCcw, AlertTriangle } from "lucide-react";

type Tone = "default" | "red" | "orange";
function Stat({ label, value, hint, Icon, tone = "default", bar, color }: { label: string; value: string; hint: string; Icon: typeof Clock; tone?: Tone; bar?: number; color?: string }) {
  const toneCls = tone === "red" ? "!bg-red-soft !border-[#f3c4c4]" : tone === "orange" ? "!bg-orange-soft !border-[#f6dcb0]" : "";
  const iconColor = tone === "red" ? "text-red" : tone === "orange" ? "text-orange" : "text-brand";
  const valueColor = color ?? (tone === "red" ? "text-red" : tone === "orange" ? "text-orange" : "text-ink");
  return (
    <div className={`card flex-1 min-w-[150px] px-4 py-3.5 ${toneCls}`}>
      <div className="flex items-center gap-1.5 text-[12.5px] text-ink-2"><Icon size={13} className={iconColor} /> {label}</div>
      <div className={`num mt-1 text-[24px] font-bold leading-tight ${valueColor}`}>{value}</div>
      {bar !== undefined ? <div className="bar mt-2.5 mb-1"><span style={{ width: `${bar}%` }} /></div> : <div className="mt-1 text-[11.5px] text-muted">{hint}</div>}
    </div>
  );
}

export function StatBand({ open, unclaimed, median, verifiedPct, reopened, critical }: { open: number; unclaimed: number; median: number; verifiedPct: number; reopened: number; critical: number }) {
  const med = median ? (median >= 60 ? `${(median / 60).toFixed(1)} h` : `${median} min`) : "—";
  return (
    <div className="flex gap-3">
      <Stat label="Open Requests" value={String(open)} hint="across all partners" Icon={ListChecks} />
      <Stat label="Unclaimed" value={String(unclaimed)} hint="need a partner" Icon={Hand} />
      <Stat label="Median Response" value={med} hint="first text → delivered" Icon={Clock} color="text-green" />
      <Stat label="Resident-Verified" value={`${verifiedPct}%`} hint="" Icon={ShieldCheck} bar={verifiedPct} />
      <Stat label="Reopened" value={String(reopened)} hint="resident said not helped" Icon={RotateCcw} tone="red" />
      <Stat label="Urgent/Critical" value={String(critical)} hint="need immediate action" Icon={AlertTriangle} tone="orange" />
    </div>
  );
}
