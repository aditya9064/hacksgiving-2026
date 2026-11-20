"use client";
import { useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock, Download, FileText, MapPin, Sparkles, Users, Inbox, RotateCcw, Copy, Check } from "lucide-react";
import { AppShell, Btn } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/ui/StatCard";
import { NeedChip, Avatar } from "@/components/ui/Chip";
import { NEED_COLOR } from "@/components/ui/Chip";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { computeStats, fmtMinutes } from "@/lib/stats";
import { NEED_LABEL, STATUS_LABEL, STATUSES } from "@/lib/types";

const STATUS_COLOR: Record<string, string> = { new: "#0b93d5", claimed: "#7c3aed", in_progress: "#f59e0b", delivered: "#16a34a", verified: "#15803d" };

export default function ImpactPage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const [narrative, setNarrative] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const requests = data?.requests ?? [];
  const partners = data?.partners ?? [];
  const s = useMemo(() => computeStats(requests as never, partners), [requests, partners]);
  const reopened = requests.filter((r) => r.residentFeedback === "no").length;
  const unclaimed = requests.filter((r) => r.status === "new").length;
  const maxNeed = Math.max(1, ...s.topNeeds.map((n) => n.count));
  const channels = useMemo(() => {
    const m: Record<string, number> = {};
    requests.forEach((r) => (m[r.channel] = (m[r.channel] ?? 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [requests]);

  const generate = async () => {
    setBusy(true);
    try {
      const r = await fetch("/api/report", { method: "POST" });
      const j = await r.json();
      setNarrative(j.narrative);
    } finally {
      setBusy(false);
    }
  };
  const copy = async () => {
    if (!narrative) return;
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <AppShell
      title={<>Impact &amp; Reporting <span className="chip chip-soft bg-green-soft text-green">Live data</span></>}
      subtitle="Every number below is computed from the live Relay record. Nothing is typed into a spreadsheet by hand."
      badge={unclaimed}
      me={me.name}
      actions={<><Btn variant="solid" onClick={generate} disabled={busy}><Sparkles size={15} /> {busy ? "Drafting…" : "Generate funder report"}</Btn><Btn href="/api/report"><Download size={15} /> Export CSV</Btn></>}
    >
      <div className="grid grid-cols-6 gap-3.5 mb-5">
        <StatCard icon={<Inbox size={14} />} label="Total Requests" value={s.total} sub="all time, all channels" />
        <StatCard icon={<CheckCircle2 size={14} />} label="Help Delivered" value={s.deliveredOrVerified} sub="delivered or verified" tint="blue" />
        <StatCard icon={<CheckCircle2 size={14} />} label="Resident-Verified" value={`${s.verifiedPct}%`} bar={s.verifiedPct} tint="green" />
        <StatCard icon={<Clock size={14} />} label="Median Response" value={s.medianMinutes ? fmtMinutes(s.medianMinutes) : "—"} sub="first text → delivered" />
        <StatCard icon={<RotateCcw size={14} />} label="Reopened" value={reopened} sub="resident said not helped" tint={reopened ? "red" : "none"} />
        <StatCard icon={<Users size={14} />} label="Partners Active" value={s.partnerCount} sub={`across ${s.neighborhoodCount} neighborhoods`} tint="purple" />
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-3.5">
        <SectionCard title="Needs Breakdown" action={<span className="text-[12px] text-muted">{s.total} requests</span>}>
          <div className="p-4 space-y-3">
            {s.topNeeds.map((n) => (
              <div key={n.need}>
                <div className="flex items-center justify-between text-[12.5px] mb-1"><NeedChip need={n.need} /><span className="num font-semibold">{n.count}</span></div>
                <div className="bar !bg-surface-3 !h-[5px]"><span style={{ width: `${(n.count / maxNeed) * 100}%`, background: NEED_COLOR[n.need] }} /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Pipeline by Status">
          <div className="p-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-3">
              {STATUSES.map((st) => (s.byStatus[st] ? <span key={st} style={{ width: `${(s.byStatus[st] / s.total) * 100}%`, background: STATUS_COLOR[st] }} /> : null))}
            </div>
            <ul className="mt-4 space-y-2.5">
              {STATUSES.map((st) => (
                <li key={st} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLOR[st] }} />{STATUS_LABEL[st]}</span>
                  <span className="num font-semibold">{s.byStatus[st] ?? 0}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-line pt-3">
              <div className="text-[12px] text-ink-2 mb-2">Intake channel</div>
              <div className="flex flex-wrap gap-1.5">{channels.map(([c, n]) => <span key={c} className="chip">{c.toUpperCase()} <b className="ml-1">{n}</b></span>)}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Partner Outcomes" action={<Btn className="!h-[28px] !px-2.5 !text-[12px]" href="/partners">All partners</Btn>}>
          <ul className="divide-y divide-line">
            {s.byPartner.map((p) => (
              <li key={p.partnerId} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={p.name} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{p.name}</div>
                  <div className="text-[11.5px] text-muted">{p.handled} handled · {p.verified} verified</div>
                </div>
                <span className={`chip chip-soft ${p.handled && p.verified / p.handled >= 0.5 ? "bg-green-soft text-green" : "bg-surface-2 text-ink-2"}`}>{p.handled ? Math.round((p.verified / p.handled) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <SectionCard title={<span className="flex items-center gap-2"><FileText size={15} className="text-brand" /> Funder Narrative</span>} className="col-span-2" action={narrative && <button onClick={copy} className="inline-flex items-center gap-1 text-[12px] text-brand">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}</button>}>
          <div className="p-5">
            {narrative ? (
              <p className="text-[14.5px] leading-[1.7] text-ink whitespace-pre-line">{narrative}</p>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-surface-2 p-8 text-center">
                <Sparkles size={22} className="mx-auto text-brand" />
                <div className="mt-2 text-[14px] font-medium">Draft a 150-word impact narrative from the live numbers</div>
                <p className="mt-1 text-[12.5px] text-muted max-w-[420px] mx-auto">Grounded in the record, no names of individuals, auditable request by request. Paste straight into a grant report.</p>
                <Btn variant="solid" className="mt-4" onClick={generate} disabled={busy}><Sparkles size={15} /> {busy ? "Drafting…" : "Generate funder report"}</Btn>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><MapPin size={15} className="text-brand" /> By Neighborhood</span>} action={<Btn className="!h-[28px] !px-2.5 !text-[12px]" href="/pulse">Open Pulse</Btn>}>
          <ul className="divide-y divide-line">
            {s.byNeighborhood.slice(0, 8).map((h) => (
              <li key={h.neighborhood} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <span className="font-medium">{h.neighborhood}</span>
                <span className="flex items-center gap-2 text-[12px] text-muted">{h.open} open <span className="count">{h.total}</span></span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </AppShell>
  );
}
