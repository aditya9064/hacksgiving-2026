"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, FileText, Inbox, MapPin, RotateCcw, Sparkles, Users, BarChart3 } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Chip";
import { ChartExplorer } from "@/components/impact/ChartExplorer";
import { ExportMenu } from "@/components/impact/ExportMenu";
import { FunderReport } from "@/components/impact/FunderReport";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { fmtMinutes } from "@/lib/stats";
import { MONTHS, availableYears, buildReport, type Period, type ReportRequest } from "@/lib/report";
import type { ExportFormat } from "@/lib/client/exporters";

export default function ImpactPage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const [history, setHistory] = useState<ReportRequest[]>([]);
  // Dates are read after mount (Next.js does not allow new Date() during a client render).
  const clock = useClock();
  const [picked, setPeriod] = useState<Period | null>(null);
  const today = useMemo(() => new Date(clock || 0), [clock]);
  const period = useMemo<Period>(() => picked ?? (clock ? { year: today.getFullYear(), month: today.getMonth() } : { year: null, month: null }), [picked, clock, today]);
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Past months: synthetic archive of closed cases, fetched once (the live record polls separately).
  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then((j) => setHistory(j.requests ?? [])).catch(() => {});
  }, []);

  const partners = useMemo(() => data?.partners ?? [], [data]);
  const all = useMemo<ReportRequest[]>(() => [...history, ...(data?.requests ?? [])], [history, data]);
  const report = useMemo(() => buildReport(all, partners, period, today), [all, partners, period, today]);
  const years = useMemo(() => {
    const ys = availableYears(all);
    return !clock || ys.includes(today.getFullYear()) ? ys : [today.getFullYear(), ...ys];
  }, [all, clock, today]);
  const narrative = narratives[report.period.label] ?? null;
  const k = report.kpis;
  const unclaimed = (data?.requests ?? []).filter((r) => r.status === "new").length;
  const isFuture = (y: number, m: number) => !!clock && (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth()));

  const draft = useCallback(async (): Promise<string | null> => {
    const label = report.period.label;
    if (narratives[label]) return narratives[label];
    setDrafting(true);
    try {
      const r = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year: period.year, month: period.month }) });
      const j = await r.json();
      setNarratives((n) => ({ ...n, [label]: j.narrative }));
      return j.narrative as string;
    } catch {
      setError("Could not draft the narrative. Exports will still include every figure and chart.");
      return null;
    } finally {
      setDrafting(false);
    }
  }, [narratives, period, report.period.label]);

  const generate = () => {
    setReportOpen(true);
    void draft();
  };

  const doExport = async (f: ExportFormat) => {
    setBusy(f);
    setError(null);
    try {
      const ex = await import("@/lib/client/exporters");
      if (f === "csv") return ex.exportCSV(report);
      const text = await draft();
      if (f === "json") return ex.exportJSON(report, text);
      const images = await ex.chartImages(report);
      if (f === "xlsx") await ex.exportExcel(report, text, images);
      if (f === "pdf") await ex.exportPDF(report, text, images);
      if (f === "docx") await ex.exportWord(report, text, images);
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(null);
    }
  };

  const scope = report.period.label === "All time" ? "all time" : `in ${report.period.label}`;

  return (
    <AppShell
      title={<>Impact &amp; Reporting <span className="chip chip-soft bg-green-soft text-green">Live data</span></>}
      subtitle="Every number below is computed from the Relay record. Nothing is typed into a spreadsheet by hand."
      badge={unclaimed}
      me={me.name}
      actions={<>
        <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface pl-2.5 pr-1 h-[38px]" title="Reporting period">
          <CalendarDays size={15} className="text-muted" />
          <select aria-label="Month" value={period.month ?? "all"} disabled={period.year === null} onChange={(e) => setPeriod({ ...period, month: e.target.value === "all" ? null : Number(e.target.value) })} className="bg-transparent text-[13px] font-medium outline-none disabled:opacity-40">
            <option value="all">All months</option>
            {MONTHS.map((m, i) => <option key={m} value={i} disabled={period.year !== null && isFuture(period.year, i)}>{m}</option>)}
          </select>
          <select aria-label="Year" value={period.year ?? "all"} onChange={(e) => {
            const y = e.target.value === "all" ? null : Number(e.target.value);
            setPeriod({ year: y, month: y === null || (period.month !== null && isFuture(y, period.month)) ? null : period.month });
          }} className="bg-transparent text-[13px] font-medium outline-none">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
            <option value="all">All time</option>
          </select>
        </div>
        <Btn variant="solid" onClick={generate} disabled={drafting}><Sparkles size={15} /> {drafting ? "Drafting…" : "Generate funder report"}</Btn>
        <ExportMenu onExport={doExport} busy={busy} periodLabel={report.period.label} />
      </>}
    >
      {error && <div className="mb-3 rounded-lg border border-[#f5c2c2] bg-red-soft px-3 py-2 text-[12.5px] text-red">{error}</div>}

      <div className="grid grid-cols-6 gap-3.5 mb-2">
        <StatCard icon={<Inbox size={14} />} label="Total Requests" value={k.total} sub={`${scope}, all channels`} />
        <StatCard icon={<CheckCircle2 size={14} />} label="Help Delivered" value={k.delivered} sub="delivered or verified" tint="blue" />
        <StatCard icon={<CheckCircle2 size={14} />} label="Resident-Verified" value={`${k.verifiedPct}%`} bar={k.verifiedPct} tint="green" />
        <StatCard icon={<Clock size={14} />} label="Median Response" value={k.medianMinutes ? fmtMinutes(k.medianMinutes) : "—"} sub="first text → delivered" />
        <StatCard icon={<RotateCcw size={14} />} label="Reopened" value={k.reopened} sub="resident said not helped" tint={k.reopened ? "red" : "none"} />
        <StatCard icon={<Users size={14} />} label="Partners Active" value={k.partnersActive} sub={`across ${k.neighborhoods} neighborhoods`} tint="purple" />
      </div>
      <p className="mb-4 text-[11.5px] text-muted">Showing {report.period.label}. This week comes from the live record; earlier months come from a synthetic archive of closed cases so month-by-month reporting can be demonstrated.</p>

      <div className="grid grid-cols-3 gap-3.5 mb-3.5">
        <SectionCard className="col-span-2" title={<span className="flex items-center gap-2"><BarChart3 size={15} className="text-brand" /> Charts · {report.period.label}</span>} action={<span className="text-[12px] text-muted">{k.total} requests · pick a chart</span>}>
          <ChartExplorer report={report} />
        </SectionCard>

        <SectionCard title="Partner Outcomes" action={<Btn className="!h-[28px] !px-2.5 !text-[12px]" href="/partners">All partners</Btn>}>
          {report.partners.length ? (
            <ul className="divide-y divide-line">
              {report.partners.map((p) => (
                <li key={p.name} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar name={p.name} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{p.name}</div>
                    <div className="text-[11.5px] text-muted">{p.handled} handled · {p.verified} verified</div>
                  </div>
                  <span className={`chip chip-soft ${p.rate >= 50 ? "bg-green-soft text-green" : "bg-surface-2 text-ink-2"}`}>{p.rate}%</span>
                </li>
              ))}
            </ul>
          ) : <div className="p-6 text-center text-[13px] text-muted">No partner activity {scope}.</div>}
        </SectionCard>
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <SectionCard title={<span className="flex items-center gap-2"><FileText size={15} className="text-brand" /> Funder Report</span>} className="col-span-2" action={narrative && <button onClick={() => setReportOpen(true)} className="text-[12px] font-medium text-brand hover:underline">Open full report</button>}>
          <div className="p-5">
            {narrative ? (
              <p className="text-[14.5px] leading-[1.7] text-ink whitespace-pre-line">{narrative}</p>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-surface-2 p-8 text-center">
                <Sparkles size={22} className="mx-auto text-brand" />
                <div className="mt-2 text-[14px] font-medium">Build the {report.period.label} funder report</div>
                <p className="mt-1 text-[12.5px] text-muted max-w-[460px] mx-auto">A 150-word narrative drafted from the numbers, plus the key figures, all nine charts and partner and neighborhood tables. Download it as PDF or Word.</p>
                <Btn variant="solid" className="mt-4" onClick={generate} disabled={drafting}><Sparkles size={15} /> {drafting ? "Drafting…" : "Generate funder report"}</Btn>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><MapPin size={15} className="text-brand" /> By Neighborhood</span>} action={<Btn className="!h-[28px] !px-2.5 !text-[12px]" href="/pulse">Open Pulse</Btn>}>
          <ul className="divide-y divide-line">
            {report.neighborhoods.slice(0, 8).map((h) => (
              <li key={h.neighborhood} className="flex items-center justify-between px-4 py-2.5 text-[13px]">
                <span className="font-medium">{h.neighborhood}</span>
                <span className="flex items-center gap-2 text-[12px] text-muted">{h.open} open <span className="count">{h.total}</span></span>
              </li>
            ))}
            {!report.neighborhoods.length && <li className="p-6 text-center text-[13px] text-muted">No requests {scope}.</li>}
          </ul>
        </SectionCard>
      </div>

      <FunderReport open={reportOpen} onClose={() => setReportOpen(false)} report={report} narrative={narrative} drafting={drafting} onExport={doExport} busy={busy} />
    </AppShell>
  );
}
