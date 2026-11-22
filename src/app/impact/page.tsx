"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { BarChart3, CalendarDays, CheckCircle2, ChevronRight, Clock, FileDown, FileText, FileType, Inbox, Info, LayoutDashboard, MapPin, RotateCcw, Sparkles, Users } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { Avatar } from "@/components/ui/Chip";
import { PartnerBadge } from "@/components/ui/PartnerProvenance";
import { ChartExplorer } from "@/components/impact/ChartExplorer";
import { ExportMenu } from "@/components/impact/ExportMenu";
import { FunderReport } from "@/components/impact/FunderReport";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { fmtMinutes } from "@/lib/stats";
import { MONTHS, availableYears, buildReport, type Period, type ReportRequest } from "@/lib/report";
import type { ExportFormat } from "@/lib/client/exporters";

const SECTIONS = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "charts", label: "Charts", Icon: BarChart3 },
  { id: "partners", label: "Partners", Icon: Users },
  { id: "neighborhoods", label: "Neighborhoods", Icon: MapPin },
  { id: "report", label: "Funder report", Icon: FileText },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

// The open section lives in the URL hash (/impact#charts), so it deep-links and survives reloads.
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash.slice(1);

export default function ImpactPage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const [history, setHistory] = useState<ReportRequest[]>([]);
  // Dates are read after mount (Next.js does not allow new Date() during a client render).
  const clock = useClock();
  const [picked, setPeriod] = useState<Period | null>(null);
  const today = useMemo(() => new Date(clock || 0), [clock]);
  const period = useMemo<Period>(() => picked ?? (clock ? { year: today.getFullYear(), month: today.getMonth() } : { year: null, month: null }), [picked, clock, today]);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const section: SectionId = SECTIONS.some((s) => s.id === hash) ? (hash as SectionId) : "overview";
  const [narratives, setNarratives] = useState<Record<string, string>>({});
  const [drafting, setDrafting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Past months: synthetic archive of closed cases, fetched once (the live record polls separately).
  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then((j) => setHistory(j.requests ?? [])).catch(() => {});
  }, []);

  const open = (id: SectionId) => {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

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
  const scope = report.period.label === "All time" ? "all time" : `in ${report.period.label}`;

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

  const topNeed = report.needs[0];
  const topPartner = report.partners[0];
  const topHood = report.neighborhoods[0];

  return (
    <AppShell
      title="Impact & Reporting"
      subtitle="Outcomes for the month you pick, computed from the Relay record."
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
        <ExportMenu onExport={doExport} busy={busy} periodLabel={report.period.label} />
      </>}
    >
      {error && <div className="mb-3 rounded-lg border border-[#f5c2c2] bg-red-soft px-3 py-2 text-[12.5px] text-red">{error}</div>}

      <SectionTabs active={section} onChange={open} />

      <div role="tabpanel" id={`panel-${section}`} aria-labelledby={`tab-${section}`} className="mt-4">
        {section === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3.5 hand:grid-cols-2 hand:gap-2.5">
              <StatCard icon={<Inbox size={14} />} label="Total requests" value={k.total} sub={`${scope}, all channels`} />
              <StatCard icon={<CheckCircle2 size={14} />} label="Help delivered" value={k.delivered} sub="delivered or verified" tint="blue" />
              <StatCard icon={<CheckCircle2 size={14} />} label="Resident-verified" value={`${k.verifiedPct}%`} bar={k.verifiedPct} tint="green" />
              <StatCard icon={<Clock size={14} />} label="Median response" value={k.medianMinutes ? fmtMinutes(k.medianMinutes) : "—"} sub="first text to delivered" />
            </div>

            <section className="card">
              <header className="border-b border-line px-4 py-3 text-[14px] font-semibold">At a glance</header>
              <ul className="divide-y divide-line">
                <GlanceRow icon={<BarChart3 size={15} />} title="Top need" value={topNeed ? `${topNeed.label} · ${topNeed.value} requests` : "No requests yet"} onClick={() => open("charts")} cta="See charts" />
                <GlanceRow icon={<Users size={15} />} title="Most active partner" value={topPartner ? `${topPartner.name} · ${topPartner.handled} handled, ${topPartner.rate}% verified` : "No partner activity"} onClick={() => open("partners")} cta={`All ${k.partnersActive} partners`} />
                <GlanceRow icon={<MapPin size={15} />} title="Busiest neighborhood" value={topHood ? `${topHood.neighborhood} · ${topHood.total} requests, ${topHood.open} open` : "No requests yet"} onClick={() => open("neighborhoods")} cta={`All ${k.neighborhoods} neighborhoods`} />
                <GlanceRow icon={<RotateCcw size={15} />} title="Needs follow-up" value={`${k.partlyHelped} partly helped · ${k.reopened} reopened`} href="/board?view=table" cta="Open board" tone={k.partlyHelped + k.reopened ? "warn" : undefined} />
                <GlanceRow icon={<FileText size={15} />} title="Funder report" value={narrative ? "Drafted, ready to download" : "Not drafted yet"} onClick={() => open("report")} cta={narrative ? "Open" : "Build it"} />
              </ul>
            </section>

            <p className="flex items-start gap-1.5 text-[11.5px] text-muted"><Info size={12} className="mt-[2px] shrink-0" aria-hidden /> Recent days come from the live board. Earlier months are a synthetic archive of closed cases, used to demonstrate monthly reporting.</p>
          </div>
        )}

        {section === "charts" && (
          <section className="card">
            <ChartExplorer report={report} />
          </section>
        )}

        {section === "partners" && (
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold">Partner outcomes · {report.period.label}</h2>
              <Btn className="!h-[30px] !px-2.5 !text-[12px]" href="/partners">Partner Network</Btn>
            </header>
            {report.partners.length ? (
              <table className="w-full text-[13px]">
                <thead className="bg-surface-2 text-[12px] text-ink-2">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Partner</th>
                    <th className="px-3 py-2 text-right font-medium">Handled</th>
                    <th className="px-3 py-2 text-right font-medium">Resident-verified</th>
                    <th className="w-[220px] px-4 py-2 text-left font-medium">Verified rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.partners.map((p) => {
                    const meta = partners.find((x) => x.name === p.name);
                    return (
                      <tr key={p.name}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={p.name} size={28} />
                            <div className="min-w-0">
                              <div className="font-medium">{p.name}</div>
                              {meta && <div className="mt-0.5"><PartnerBadge partner={meta} size="sm" /></div>}
                            </div>
                          </div>
                        </td>
                        <td className="num px-3 py-2.5 text-right font-medium">{p.handled}</td>
                        <td className="num px-3 py-2.5 text-right font-medium">{p.verified}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="bar !bg-surface-3 flex-1"><span style={{ width: `${p.rate}%` }} /></div>
                            <span className="num w-10 text-right text-[12px] font-medium">{p.rate}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-[13px] text-muted">No partner activity {scope}.</div>}
          </section>
        )}

        {section === "neighborhoods" && (
          <section className="card overflow-hidden">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[14px] font-semibold">Requests by neighborhood · {report.period.label}</h2>
              <Btn className="!h-[30px] !px-2.5 !text-[12px]" href="/pulse">Open Pulse map</Btn>
            </header>
            {report.neighborhoods.length ? (
              <table className="w-full text-[13px]">
                <thead className="bg-surface-2 text-[12px] text-ink-2">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Neighborhood</th>
                    <th className="w-[260px] px-4 py-2 text-left font-medium">Requests</th>
                    <th className="px-4 py-2 text-right font-medium">Still open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.neighborhoods.map((h) => (
                    <tr key={h.neighborhood}>
                      <td className="px-4 py-2.5 font-medium">{h.neighborhood}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="bar !bg-surface-3 flex-1"><span style={{ width: `${(h.total / report.neighborhoods[0].total) * 100}%` }} /></div>
                          <span className="num w-8 text-right text-[12px] font-medium">{h.total}</span>
                        </div>
                      </td>
                      <td className="num px-4 py-2.5 text-right">{h.open}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="p-8 text-center text-[13px] text-muted">No requests {scope}.</div>}
            <p className="border-t border-line px-4 py-2.5 text-[11.5px] text-muted">Areas, never people: counts are per neighborhood only.</p>
          </section>
        )}

        {section === "report" && (
          <section className="card p-5">
            {narrative ? (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[15px] font-semibold">Funder report · {report.period.label}</h2>
                  <div className="flex gap-2">
                    <Btn onClick={() => setReportOpen(true)}>Open full report</Btn>
                    <Btn variant="solid" onClick={() => doExport("pdf")} disabled={!!busy}><FileDown size={15} /> PDF</Btn>
                    <Btn onClick={() => doExport("docx")} disabled={!!busy}><FileType size={15} /> Word</Btn>
                  </div>
                </div>
                <p className="whitespace-pre-line text-[14.5px] leading-[1.7] text-ink">{narrative}</p>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-line bg-surface-2 p-8 text-center">
                <Sparkles size={22} className="mx-auto text-brand" />
                <div className="mt-2 text-[14px] font-medium">Build the {report.period.label} funder report</div>
                <p className="mx-auto mt-1 max-w-[460px] text-[12.5px] text-muted">A short narrative drafted from the numbers, plus the key figures, all nine charts and partner and neighborhood tables. Download it as PDF or Word.</p>
                <Btn variant="solid" className="mt-4" onClick={generate} disabled={drafting}><Sparkles size={15} /> {drafting ? "Drafting…" : "Generate funder report"}</Btn>
              </div>
            )}
          </section>
        )}
      </div>

      <FunderReport open={reportOpen} onClose={() => setReportOpen(false)} report={report} narrative={narrative} drafting={drafting} onExport={doExport} busy={busy} />
    </AppShell>
  );
}

/** Section switcher. Arrow keys move between sections (WAI-ARIA tabs pattern). */
function SectionTabs({ active, onChange }: { active: SectionId; onChange: (id: SectionId) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + SECTIONS.length) % SECTIONS.length;
    onChange(SECTIONS[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label="Impact sections" className="seg hand:!flex hand:overflow-x-auto hand:[scrollbar-width:none] hand:[&>*]:shrink-0 hand:[&>*]:whitespace-nowrap">
      {SECTIONS.map((s, i) => (
        <button
          key={s.id}
          ref={(el) => { refs.current[i] = el; }}
          role="tab"
          id={`tab-${s.id}`}
          aria-selected={active === s.id}
          aria-controls={`panel-${s.id}`}
          tabIndex={active === s.id ? 0 : -1}
          onClick={() => onChange(s.id)}
          onKeyDown={(e) => onKey(e, i)}
          className={`seg-item ${active === s.id ? "active-blue" : ""}`}
        >
          <s.Icon size={14} aria-hidden /> {s.label}
        </button>
      ))}
    </div>
  );
}

function GlanceRow({ icon, title, value, cta, onClick, href, tone }: { icon: ReactNode; title: string; value: string; cta: string; onClick?: () => void; href?: string; tone?: "warn" }) {
  const body = (
    <>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tone === "warn" ? "bg-orange-soft text-orange" : "bg-brand-soft text-brand"}`}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] text-muted">{title}</span>
        <span className="block truncate text-[13.5px] font-medium text-ink">{value}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-brand">{cta} <ChevronRight size={14} aria-hidden /></span>
    </>
  );
  const cls = "flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 focus-visible:bg-surface-2 outline-none";
  return <li>{href ? <a href={href} className={cls}>{body}</a> : <button onClick={onClick} className={cls}>{body}</button>}</li>;
}
