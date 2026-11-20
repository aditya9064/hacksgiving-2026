import type { Need, Urgency } from "@/lib/types";
import { NEED_LABEL } from "@/lib/types";

export const NEED_COLOR: Record<Need, string> = {
  food: "#e07a1f",
  rent: "#2563eb",
  utilities: "#0891b2",
  housing: "#0d9488",
  mediation: "#7c3aed",
  safety: "#d21f1f",
  health: "#db2777",
  transport: "#0284c7",
  youth: "#65a30d",
  legal: "#4f46e5",
  other: "#737373",
};

export function NeedChip({ need }: { need: Need }) {
  return (
    <span className="tag">
      <i style={{ background: NEED_COLOR[need] }} />
      {NEED_LABEL[need]}
    </span>
  );
}

export function UrgencyTag({ urgency }: { urgency: Urgency }) {
  if (urgency === "critical") return <span className="tag border-accent text-accent"><i className="bg-accent blink" />Critical</span>;
  if (urgency === "high") return <span className="tag border-amber text-amber"><i className="bg-amber" />High</span>;
  return <span className="tag"><i className="bg-muted" />{urgency}</span>;
}

export function UrgencyDot({ urgency, withLabel = false }: { urgency: Urgency; withLabel?: boolean }) {
  return withLabel ? <UrgencyTag urgency={urgency} /> : <span className={`inline-block h-1.5 w-1.5 rounded-full ${urgency === "critical" ? "bg-accent blink" : urgency === "high" ? "bg-amber" : "bg-muted"}`} />;
}

export function Avatar({ name, size = 22 }: { name?: string; size?: number }) {
  if (!name) return null;
  const initials = name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="mono inline-flex items-center justify-center bg-ink text-bg font-medium" style={{ width: size, height: size, fontSize: size * 0.42 }} title={name}>
      {initials}
    </span>
  );
}
