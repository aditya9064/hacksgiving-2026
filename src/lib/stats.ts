import type { HelpRequest, Need, Partner } from "./types";

export interface Stats {
  total: number;
  open: number;
  deliveredOrVerified: number;
  verified: number;
  verifiedPct: number;
  medianMinutes: number;
  topNeeds: { need: Need; count: number }[];
  byNeighborhood: { neighborhood: string; open: number; total: number; needs: Need[] }[];
  byPartner: { partnerId: string; name: string; handled: number; verified: number }[];
  byStatus: Record<string, number>;
  neighborhoodCount: number;
  partnerCount: number;
}

export function computeStats(requests: HelpRequest[], partners: Partner[]): Stats {
  const open = requests.filter((r) => r.status !== "verified" && r.status !== "delivered").length;
  const done = requests.filter((r) => r.status === "delivered" || r.status === "verified");
  const verified = requests.filter((r) => r.status === "verified");
  const times = done.filter((r) => r.deliveredAt).map((r) => (new Date(r.deliveredAt!).getTime() - new Date(r.createdAt).getTime()) / 60_000).sort((a, b) => a - b);
  const medianMinutes = times.length ? Math.round(times[Math.floor(times.length / 2)]) : 0;

  const needCount = new Map<Need, number>();
  for (const r of requests) for (const n of r.needs) needCount.set(n, (needCount.get(n) ?? 0) + 1);
  const topNeeds = [...needCount.entries()].map(([need, count]) => ({ need, count })).sort((a, b) => b.count - a.count);

  const hoods = new Map<string, { open: number; total: number; needs: Set<Need> }>();
  for (const r of requests) {
    const h = hoods.get(r.neighborhood) ?? { open: 0, total: 0, needs: new Set() };
    h.total++;
    if (r.status !== "verified") h.open++;
    r.needs.forEach((n) => h.needs.add(n));
    hoods.set(r.neighborhood, h);
  }
  const byNeighborhood = [...hoods.entries()].map(([neighborhood, v]) => ({ neighborhood, open: v.open, total: v.total, needs: [...v.needs] })).sort((a, b) => b.open - a.open || b.total - a.total);

  const byPartner = partners
    .map((p) => {
      const mine = requests.filter((r) => r.partnerId === p.id);
      return { partnerId: p.id, name: p.name, handled: mine.length, verified: mine.filter((r) => r.status === "verified").length };
    })
    .filter((p) => p.handled > 0)
    .sort((a, b) => b.handled - a.handled);

  const byStatus: Record<string, number> = {};
  for (const r of requests) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;

  return {
    total: requests.length,
    open,
    deliveredOrVerified: done.length,
    verified: verified.length,
    verifiedPct: done.length ? Math.round((verified.length / done.length) * 100) : 0,
    medianMinutes,
    topNeeds,
    byNeighborhood,
    byPartner,
    byStatus,
    neighborhoodCount: hoods.size,
    partnerCount: byPartner.length,
  };
}

export function timeAgo(iso: string, now = Date.now()): string {
  if (!now) return "";
  const m = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function fmtMinutes(m: number): string {
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
