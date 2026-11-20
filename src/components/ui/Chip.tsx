import { AlertTriangle, Clock3 } from "lucide-react";
import type { Need, Urgency } from "@/lib/types";
import { NEED_LABEL } from "@/lib/types";
import type { AttentionLevel } from "@/lib/attention";

export const NEED_COLOR: Record<Need, string> = {
  food: "#f59e0b", rent: "#0b93d5", utilities: "#0891b2", housing: "#0b93d5", mediation: "#7c3aed",
  safety: "#dc2626", health: "#db2777", transport: "#0ea5e9", youth: "#16a34a", legal: "#4f46e5", other: "#6b7280",
};
const NEED_TINT: Record<Need, [string, string]> = {
  food: ["#fff4e5", "#b45309"], rent: ["#e7f4fb", "#0a6fa3"], utilities: ["#e0f5f9", "#0e7490"], housing: ["#e7f4fb", "#0a6fa3"],
  mediation: ["#f1ebfd", "#6d28d9"], safety: ["#fdecec", "#b91c1c"], health: ["#fce7f3", "#be185d"], transport: ["#e0f2fe", "#0369a1"],
  youth: ["#e8f7ee", "#15803d"], legal: ["#e0e7ff", "#4338ca"], other: ["#f1f3f5", "#4b5563"],
};

export function NeedChip({ need }: { need: Need }) {
  const [bg, fg] = NEED_TINT[need];
  return <span className="chip chip-soft" style={{ background: bg, color: fg }}>{need === "transport" ? "Transportation" : NEED_LABEL[need]}</span>;
}

export function UrgencyChip({ urgency }: { urgency: Urgency }) {
  if (urgency === "critical") return <span className="chip chip-soft bg-red text-white font-semibold">⚠ Critical</span>;
  if (urgency === "high") return <span className="chip chip-soft bg-orange-soft text-[#b45309] font-semibold">⚠ Urgent</span>;
  return null;
}

/** Red "Needs attention" (overdue) or amber "Follow-up needed" (resident flagged it). */
export function AttentionBadge({ level, className = "" }: { level: AttentionLevel; className?: string }) {
  if (level === "none") return null;
  const red = level === "needs_attention";
  const Icon = red ? AlertTriangle : Clock3;
  return (
    <span className={`chip chip-soft font-semibold ${red ? "bg-red-soft text-red" : "bg-orange-soft text-[#b45309]"} ${className}`}>
      <Icon size={10} /> {red ? "Needs attention" : "Follow-up needed"}
    </span>
  );
}

export function UrgencyDot({ urgency, withLabel = false }: { urgency: Urgency; withLabel?: boolean }) {
  const c = urgency === "critical" ? "bg-red" : urgency === "high" ? "bg-orange" : "bg-muted";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-2">
      <span className={`inline-block h-2 w-2 rounded-full ${c}`} />
      {withLabel && <span className="capitalize">{urgency}</span>}
    </span>
  );
}

export function Avatar({ name, size = 30 }: { name?: string; size?: number }) {
  if (!name) return null;
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-brand-soft text-brand font-semibold" style={{ width: size, height: size, fontSize: size * 0.38 }} title={name}>
      {initials}
    </span>
  );
}
