"use client";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Activity, AlertTriangle, MapPin, TrendingUp, Flame, Download, Radio, Clock } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/ui/StatCard";
import { NeedChip } from "@/components/ui/Chip";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { timeAgo } from "@/lib/stats";
import { NEED_LABEL, type Need } from "@/lib/types";

const PulseMap = dynamic(() => import("@/components/board/PulseMap"), { ssr: false, loading: () => <div className="h-full w-full bg-surface-2 rounded-[10px]" /> });

export default function PulsePage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const now = useClock();
  const [selected, setSelected] = useState<string | null>(null);
  const requests = data?.requests ?? [];
  const unclaimed = requests.filter((r) => r.status === "new").length;

  const rows = useMemo(() => {
    const m = new Map<string, { open: number; total: number; critical: number; needs: Map<Need, number>; last: string }>();
    for (const r of requests) {
      if (r.neighborhood === "Unknown") continue;
      const h = m.get(r.neighborhood) ?? { open: 0, total: 0, critical: 0, needs: new Map(), last: r.createdAt };
      h.total++;
      if (r.status !== "verified") h.open++;
      if (r.urgency === "critical") h.critical++;
      r.needs.forEach((n) => h.needs.set(n, (h.needs.get(n) ?? 0) + 1));
      if (r.createdAt > h.last) h.last = r.createdAt;
      m.set(r.neighborhood, h);
    }
    return [...m.entries()]
      .map(([neighborhood, v]) => ({ neighborhood, ...v, topNeeds: [...v.needs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n]) => n) }))
      .sort((a, b) => b.open - a.open || b.total - a.total);
  }, [requests]);

  const topNeed = useMemo(() => {
    const m = new Map<Need, number>();
    requests.forEach((r) => r.needs.forEach((n) => m.set(n, (m.get(n) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [requests]);
  const last24 = requests.filter((r) => now && now - new Date(r.createdAt).getTime() < 86_400_000).length;
  const hotspots = rows.filter((r) => r.critical > 0).length;
  const sel = rows.find((r) => r.neighborhood === selected) ?? rows[0];
  const selReqs = sel ? requests.filter((r) => r.neighborhood === sel.neighborhood).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];

  const signals = useMemo(() => {
    const out: { icon: React.ReactNode; text: string; tone: string }[] = [];
    const utilities = requests.filter((r) => r.needs.includes("utilities")).length;
    if (utilities >= 2) out.push({ icon: <TrendingUp size={14} />, text: `${utilities} utility shutoff requests this week. Winter moratorium reminder worth sending to all partners.`, tone: "bg-orange-soft text-[#b45309]" });
    const med = rows.filter((r) => r.needs.has("mediation"));
    if (med.length) out.push({ icon: <Flame size={14} />, text: `Mediation requests in ${med.map((r) => r.neighborhood).slice(0, 3).join(", ")}. Pair a ComForce responder with Harambee Youth Hub for school-adjacent cases.`, tone: "bg-purple-soft text-purple" });
    const hot = rows.filter((r) => r.critical > 0);
    if (hot.length) out.push({ icon: <AlertTriangle size={14} />, text: `${hot.length} neighborhood${hot.length > 1 ? "s" : ""} with critical requests: ${hot.map((r) => r.neighborhood).join(", ")}.`, tone: "bg-red-soft text-red" });
    const food = requests.filter((r) => r.needs.includes("food") && r.status === "new").length;
    if (food) out.push({ icon: <Radio size={14} />, text: `${food} unclaimed food request${food > 1 ? "s" : ""}. Northside Community Pantry has capacity.`, tone: "bg-brand-soft text-brand" });
    return out;
  }, [requests, rows]);

  return (
    <AppShell
      title={<>Neighborhood Pulse <span className="chip chip-soft bg-brand-soft text-brand">Aggregated · no individuals</span></>}
      subtitle="Where help is being asked for, by neighborhood and need. Counts only, never names, never addresses."
      badge={unclaimed}
      me={me.name}
      actions={<><Btn variant="solid"><Download size={15} /> Weekly brief (PDF)</Btn><Btn href="/impact">Full report</Btn></>}
    >
      <div className="grid grid-cols-5 gap-3.5 mb-5">
        <StatCard icon={<MapPin size={14} />} label="Neighborhoods Active" value={rows.length} sub="with at least one request" />
        <StatCard icon={<Activity size={14} />} label="Open Requests" value={rows.reduce((s, r) => s + r.open, 0)} sub="not yet resident-verified" tint="blue" />
        <StatCard icon={<Clock size={14} />} label="New in 24h" value={last24} sub="all channels" />
        <StatCard icon={<AlertTriangle size={14} />} label="Hotspots" value={hotspots} sub="neighborhoods with critical needs" tint={hotspots ? "red" : "none"} />
        <StatCard icon={<TrendingUp size={14} />} label="Top Need Citywide" value={topNeed ? NEED_LABEL[topNeed] : "—"} sub="by request count" tint="purple" valueClass="!text-[22px]" />
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-3.5">
        <SectionCard title="Request Density" className="col-span-2" action={<span className="flex items-center gap-3 text-[11.5px] text-muted"><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Requests</span><span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red" /> Critical present</span></span>}>
          <div className="h-[420px] p-2"><PulseMap rows={rows} selected={sel?.neighborhood ?? null} onSelect={setSelected} /></div>
        </SectionCard>

        <SectionCard title="Ranked by Open Requests">
          <ul className="divide-y divide-line max-h-[436px] overflow-auto">
            {rows.map((r, i) => (
              <li key={r.neighborhood}>
                <button onClick={() => setSelected(r.neighborhood)} className={`w-full text-left px-4 py-2.5 hover:bg-surface-2 ${sel?.neighborhood === r.neighborhood ? "bg-brand-soft/60" : ""}`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-medium"><span className="num w-4 text-[11.5px] text-muted">{i + 1}</span>{r.neighborhood}{r.critical > 0 && <AlertTriangle size={12} className="text-red" />}</span>
                    <span className="count">{r.open}</span>
                  </div>
                  <div className="mt-1 ml-6 flex gap-1">{r.topNeeds.map((n) => <NeedChip key={n} need={n} />)}</div>
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <SectionCard title={<span className="flex items-center gap-2"><Radio size={15} className="text-brand" /> Emerging Signals</span>} action={<span className="text-[12px] text-muted">auto-detected</span>}>
          <ul className="p-4 space-y-2.5">
            {signals.map((s, i) => (
              <li key={i} className={`flex gap-2.5 rounded-lg px-3 py-2.5 text-[13px] leading-snug ${s.tone}`}><span className="mt-0.5 shrink-0">{s.icon}</span>{s.text}</li>
            ))}
            {!signals.length && <li className="text-[13px] text-muted">Nothing unusual this week.</li>}
          </ul>
        </SectionCard>

        <SectionCard title={sel ? `${sel.neighborhood} · recent requests` : "Select a neighborhood"} className="col-span-2" action={sel && <span className="text-[12px] text-muted">{sel.open} open · {sel.total} total</span>}>
          <ul className="divide-y divide-line">
            {selReqs.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className={`h-2 w-2 rounded-full shrink-0 ${r.urgency === "critical" ? "bg-red" : r.urgency === "high" ? "bg-orange" : "bg-brand"}`} />
                <div className="flex-1 min-w-0 text-[13px] truncate">{r.summary}</div>
                <div className="flex gap-1">{r.needs.slice(0, 2).map((n) => <NeedChip key={n} need={n} />)}</div>
                <span className="text-[11.5px] text-muted w-16 text-right">{timeAgo(r.createdAt, now)}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
