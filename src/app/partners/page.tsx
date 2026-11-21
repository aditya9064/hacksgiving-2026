"use client";
import { useMemo, useState } from "react";
import { Users, Search, Clock, MapPin, CheckCircle2, Plus, Gauge, Phone } from "lucide-react";
import { AppShell, Btn } from "@/components/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { NeedChip, Avatar } from "@/components/ui/Chip";
import { PartnerBadge, PartnerSources } from "@/components/ui/PartnerProvenance";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { computeStats } from "@/lib/stats";
import { NEED_LABEL, type Need } from "@/lib/types";

export default function PartnersPage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const [q, setQ] = useState("");
  const [need, setNeed] = useState<Need | "all">("all");

  const requests = data?.requests ?? [];
  const partners = data?.partners ?? [];
  const stats = useMemo(() => computeStats(requests as never, partners), [requests, partners]);

  const needOptions = useMemo(() => {
    const set = new Set<Need>();
    partners.forEach((p) => p.needs.forEach((n) => set.add(n)));
    return [...set];
  }, [partners]);

  const rows = partners
    .filter((p) => need === "all" || p.needs.includes(need))
    .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.neighborhoods.join(" ").toLowerCase().includes(q.toLowerCase()))
    .map((p) => {
      const mine = requests.filter((r) => r.partnerId === p.id);
      const active = mine.filter((r) => r.status === "claimed" || r.status === "in_progress").length;
      const verified = mine.filter((r) => r.status === "verified").length;
      const load = Math.min(100, Math.round((active / Math.max(1, active + p.capacity)) * 100));
      return { p, active, verified, handled: mine.length, load };
    })
    .sort((a, b) => Number(!!b.p.isReal) - Number(!!a.p.isReal) || b.p.capacity - a.p.capacity);

  const totalCapacity = partners.reduce((s, p) => s + p.capacity, 0);
  const activeAll = requests.filter((r) => r.status === "claimed" || r.status === "in_progress").length;
  const unclaimed = requests.filter((r) => r.status === "new").length;
  const realCount = partners.filter((p) => p.isReal).length;

  return (
    <AppShell
      title={<>Partner Network <span className="chip chip-soft bg-brand-soft text-brand">{partners.length} orgs</span></>}
      subtitle={`Who can take what, right now. ${realCount} real organizations from public sources; the rest are fictional demo partners. All capacity figures are simulated.`}
      badge={unclaimed}
      me={me.name}
      actions={<><Btn variant="solid" href="mailto:?subject=Join%20Relay%20MKE%20as%20a%20partner&body=ComForce%20MKE%20invites%20your%20organization%20to%20the%20Relay%20MKE%20partner%20network."><Plus size={15} /> Invite partner</Btn><Btn href="/impact">View outcomes</Btn></>}
    >
      <div className="grid grid-cols-5 gap-3.5 mb-5">
        <StatCard icon={<Users size={14} />} label="Partners" value={partners.length} sub={`${realCount} real · ${partners.length - realCount} fictional demo`} />
        <StatCard icon={<Gauge size={14} />} label="Open Capacity" value={totalCapacity} sub="simulated slots this week" tint="green" />
        <StatCard icon={<Clock size={14} />} label="Active Assignments" value={activeAll} sub="claimed or in progress" tint="blue" />
        <StatCard icon={<CheckCircle2 size={14} />} label="Resident-Verified" value={`${stats.verifiedPct}%`} bar={stats.verifiedPct} />
        <StatCard icon={<MapPin size={14} />} label="Neighborhoods Covered" value={stats.neighborhoodCount} sub="of 15 focus areas" tint="purple" />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="seg">
          <button onClick={() => setNeed("all")} className={`seg-item ${need === "all" ? "active-blue" : ""}`}>All Services <span className="count">{partners.length}</span></button>
          {needOptions.slice(0, 7).map((n) => (
            <button key={n} onClick={() => setNeed(n)} className={`seg-item ${need === n ? "active-blue" : ""}`}>{NEED_LABEL[n]} <span className="count">{partners.filter((p) => p.needs.includes(n)).length}</span></button>
          ))}
        </div>
      </div>

      <div className="card p-3 mb-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search partners or neighborhoods..." />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        {rows.map(({ p, active, verified, handled, load }) => (
          <div key={p.id} className="card p-4 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Avatar name={p.name} />
                <div>
                  <div className="text-[14px] font-semibold leading-tight">{p.name}</div>
                  <div className="mt-1"><PartnerBadge partner={p} size="sm" /></div>
                </div>
              </div>
              <span className={`chip chip-soft shrink-0 ${p.capacity <= 2 ? "bg-red-soft text-red" : p.capacity <= 5 ? "bg-orange-soft text-orange" : "bg-green-soft text-green"}`} title={p.capacitySimulated ? "Simulated for the demo" : undefined}>{p.capacity} open{p.capacitySimulated ? " · simulated" : ""}</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">{p.needs.map((n) => <NeedChip key={n} need={n} />)}</div>
            {p.isReal && <div className="mt-3"><PartnerSources partner={p} /></div>}

            <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] space-y-1">
              <div className="flex justify-between gap-3"><span className="flex items-center gap-1.5 text-ink-2"><MapPin size={12} /> Serves</span><span className="font-medium text-right truncate">{p.neighborhoods.length ? p.neighborhoods.join(", ") : <span className="text-muted font-normal">Not listed in sources</span>}</span></div>
              <div className="flex justify-between gap-3"><span className="flex items-center gap-1.5 text-ink-2"><Clock size={12} /> Hours</span><span className="font-medium">{p.hours ?? <span className="text-muted font-normal">Not listed</span>}</span></div>
              <div className="flex justify-between gap-3"><span className="flex items-center gap-1.5 text-ink-2"><CheckCircle2 size={12} /> Handled</span><span className="font-medium">{handled} <span className="text-muted">· {verified} verified</span></span></div>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-[11.5px] text-ink-2 mb-1"><span>Current load</span><span className="font-medium text-ink">{active} active · {load}%</span></div>
              <div className="bar !bg-surface-3"><span style={{ width: `${load}%`, background: load > 75 ? "var(--red)" : load > 45 ? "var(--orange)" : "var(--brand)" }} /></div>
            </div>

            <div className="mt-3 flex gap-2">
              <Btn className="flex-1 !h-[34px]" href="/board">View requests</Btn>
              {p.phone && <Btn className="!h-[34px] !px-3" title={`Call ${p.phone}`} href={`tel:${p.phone}`}><Phone size={14} /></Btn>}
            </div>
          </div>
        ))}
        {!rows.length && <div className="col-span-3 card p-10 text-center text-[13px] text-muted">No partners match.</div>}
      </div>
    </AppShell>
  );
}
