import type { Need, Urgency } from "@/lib/types";
import { NEED_LABEL } from "@/lib/types";

const NEED_COLORS: Record<Need, string> = {
  food: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  rent: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  utilities: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  housing: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  mediation: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  safety: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  health: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  transport: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  youth: "bg-lime-100 text-lime-800 dark:bg-lime-950 dark:text-lime-300",
  legal: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  other: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export function NeedChip({ need }: { need: Need }) {
  return <span className={`chip ${NEED_COLORS[need]}`}>{NEED_LABEL[need]}</span>;
}

export function UrgencyDot({ urgency, withLabel = false }: { urgency: Urgency; withLabel?: boolean }) {
  const color = urgency === "critical" ? "bg-accent" : urgency === "high" ? "bg-amber" : urgency === "normal" ? "bg-brand" : "bg-muted";
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-2">
      <span className={`h-2 w-2 rounded-full ${color} ${urgency === "critical" ? "pulse-ring" : ""}`} />
      {withLabel && <span className="capitalize">{urgency}</span>}
    </span>
  );
}

export function Avatar({ name, size = 24 }: { name?: string; size?: number }) {
  if (!name) return null;
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center rounded-full bg-brand text-white font-semibold" style={{ width: size, height: size, fontSize: size * 0.4 }} title={name}>
      {initials}
    </span>
  );
}
