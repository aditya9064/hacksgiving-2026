"use client";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AlertTriangle, Building2, CalendarDays, Check, CheckCircle2, ChevronRight, Crosshair, ExternalLink, FileDown, FileText, Info, Landmark, ListChecks, MapPin, Sparkles, Users, X } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { StatCard } from "@/components/ui/StatCard";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { MONTHS, availableYears, buildReport, type Period, type ReportRequest } from "@/lib/report";
import { CLUSTERS, HOMICIDE_SHARE_IN_CLUSTERS, clusterStats } from "@/lib/clusters";
import { FUNDERS, REQUIREMENTS, buildLogicModel, buildUnitEconomics, pickStory, scoreFunders, templateDraft, type ApplicationDraft, type Funder, type RequirementId } from "@/lib/grants";
import { NEED_LABEL, type Need } from "@/lib/types";
import { fmtMinutes } from "@/lib/stats";

const SECTIONS = [
  { id: "clusters", label: "Cluster evidence", Icon: Crosshair },
  { id: "funders", label: "Funder fit", Icon: Landmark },
  { id: "application", label: "Application", Icon: FileText },
] as const;
type SectionId = (typeof SECTIONS)[number]["id"];

const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHash = () => window.location.hash.slice(1);

const HAVE_KEY = "relay.grants.have";
const KIND_LABEL: Record<Funder["kind"], string> = { city: "City", county: "County", state: "State", foundation: "Foundation", corporate: "Corporate" };

export default function GrantsPage() {
  const { data } = useSnapshot();
  const [me] = useMe();
  const [history, setHistory] = useState<ReportRequest[]>([]);
  const clock = useClock();
  const today = useMemo(() => new Date(clock || 0), [clock]);
  const [picked, setPeriod] = useState<Period | null>(null);
  const period = useMemo<Period>(() => picked ?? (clock ? { year: today.getFullYear(), month: null } : { year: null, month: null }), [picked, clock, today]);
  const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
  const section: SectionId = SECTIONS.some((s) => s.id === hash) ? (hash as SectionId) : "clusters";
  const [have, setHave] = useState<RequirementId[]>([]);
  const [funderId, setFunderId] = useState<string>(FUNDERS[0].id);
  const [drafts, setDrafts] = useState<Record<string, ApplicationDraft>>({});
  const [drafting, setDrafting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history").then((r) => r.json()).then((j) => setHistory(j.requests ?? [])).catch(() => {});
    // Read after hydration so server and first client render agree on the checklist.
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(HAVE_KEY);
        if (raw) setHave(JSON.parse(raw));
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const open = (id: SectionId) => {
    window.history.replaceState(null, "", `#${id}`);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };
  const toggleHave = (id: RequirementId) => {
    setHave((h) => {
      const next = h.includes(id) ? h.filter((x) => x !== id) : [...h, id];
      localStorage.setItem(HAVE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const partners = useMemo(() => data?.partners ?? [], [data]);
  const all = useMemo<ReportRequest[]>(() => [...history, ...(data?.requests ?? [])], [history, data]);
  const report = useMemo(() => buildReport(all, partners, period, today), [all, partners, period, today]);
  const clusters = useMemo(() => clusterStats(report.rows), [report]);
  const fits = useMemo(() => scoreFunders(report, clusters, { have }), [report, clusters, have]);
  const logic = useMemo(() => buildLogicModel(report, clusters), [report, clusters]);
  const econ = useMemo(() => buildUnitEconomics(report), [report]);
  const story = useMemo(() => pickStory(report), [report]);
  const years = useMemo(() => {
    const ys = availableYears(all);
    return !clock || ys.includes(today.getFullYear()) ? ys : [today.getFullYear(), ...ys];
  }, [all, clock, today]);
  const k = report.kpis;
  const unclaimed = (data?.requests ?? []).filter((r) => r.status === "new").length;
  const isFuture = (y: number, m: number) => !!clock && (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth()));

  const fit = fits.find((f) => f.funder.id === funderId) ?? fits[0];
  const draftKey = `${fit.funder.id}|${report.period.label}`;
  const draft = drafts[draftKey] ?? null;

  const generate = async () => {
    setDrafting(true);
    setError(null);
    try {
      const r = await fetch("/api/grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ funderId: fit.funder.id, year: period.year, month: period.month }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Draft failed");
      setDrafts((d) => ({ ...d, [draftKey]: j.draft }));
    } catch (e) {
      setDrafts((d) => ({ ...d, [draftKey]: templateDraft({ funder: fit.funder, report, clusters, logic, story }) }));
      setError(`Drafted offline from the numbers (${e instanceof Error ? e.message : "no AI"}).`);
    } finally {
      setDrafting(false);
    }
  };

  const exportWord = async () => {
    if (!draft) return;
    setExporting(true);
    try {
      const ex = await import("@/lib/client/grantExport");
      await ex.exportApplicationDocx({ funder: fit.funder, period: report.period.label, draft, logic, econ, story, clusters, readyIds: fit.ready.map((r) => r.id), gapIds: fit.gaps.map((r) => r.id) });
    } catch (e) {
      setError(`Export failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setExporting(false);
    }
  };

  const exportCalendar = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Cluster", "Intersection", "Requests", "Help delivered", "Resident-verified", "Still open", "Top needs", "Partners"];
    const lines = clusters.rows.map((r) => [r.cluster.n, r.cluster.name, r.total, r.delivered, r.verified, r.open, topNeeds(r.needs), r.partners.join("; ")].map(esc).join(","));
    const blob = new Blob([[head.map(esc).join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `relay-mke-countdown-clusters-${report.period.label.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <AppShell
      title="Grants & Evidence"
      subtitle="What ComForce's funders ask for, produced from the Relay record."
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
      </>}
    >
      {error && <div className="mb-3 flex items-center justify-between rounded-lg border border-[#f8dcae] bg-orange-soft px-3 py-2 text-[12.5px] text-[#b45309]">{error}<button onClick={() => setError(null)} aria-label="Dismiss"><X size={14} /></button></div>}

      <div role="tablist" aria-label="Grant sections" className="seg hand:!flex hand:overflow-x-auto hand:[scrollbar-width:none] hand:[&>*]:shrink-0 hand:[&>*]:whitespace-nowrap">
        {SECTIONS.map((s) => (
          <button key={s.id} role="tab" aria-selected={section === s.id} onClick={() => open(s.id)} className={`seg-item ${section === s.id ? "active-blue" : ""}`}><s.Icon size={14} aria-hidden /> {s.label}</button>
        ))}
      </div>

      <div className="mt-4">
        {section === "clusters" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#bfe0f3] bg-brand-soft px-4 py-3 text-[13px] leading-relaxed text-ink">
              <strong>Why clusters.</strong> In October 2026 the City&apos;s Dept. of Community Wellness &amp; Safety launched <em>This Is Our City: The Countdown</em> — 26 incident clusters holding <strong>{HOMICIDE_SHARE_IN_CLUSTERS}%</strong> of homicide victims. Partners are asked to commit resources to those clusters. DCWS is ComForce&apos;s main funder, and it is being asked by the Common Council to prove its programs work. This tab answers that question for them, in their geography.
            </div>
            <div className="grid grid-cols-4 gap-3.5 hand:grid-cols-2 hand:gap-2.5">
              <StatCard icon={<Crosshair size={14} />} label="Requests inside clusters" value={`${clusters.pctInClusters}%`} bar={clusters.pctInClusters} tint="blue" />
              <StatCard icon={<MapPin size={14} />} label="Clusters reached" value={`${clusters.clustersReached} / 26`} sub={`${clusters.inClusters} requests · ${clusters.outside} outside any cluster`} />
              <StatCard icon={<CheckCircle2 size={14} />} label="Verified inside clusters" value={clusters.verifiedInClusters} sub={`of ${clusters.deliveredInClusters} delivered`} tint="green" />
              <StatCard icon={<Users size={14} />} label="Median time to help" value={k.medianMinutes ? fmtMinutes(k.medianMinutes) : "—"} sub="first contact → delivered" />
            </div>

            <section className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-line px-4 py-3">
                <h2 className="text-[14px] font-semibold">Resources delivered by Countdown cluster · {report.period.label}</h2>
                <Btn onClick={exportCalendar} className="!h-[30px] !px-2.5 !text-[12px]" title="CSV shaped for the DCWS action calendar"><FileDown size={14} /> Action-calendar CSV</Btn>
              </header>
              {clusters.rows.length ? (
                <table className="w-full text-[13px]">
                  <thead className="bg-surface-2 text-[12px] text-ink-2">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Cluster</th>
                      <th className="w-[200px] px-3 py-2 text-left font-medium">Requests</th>
                      <th className="px-3 py-2 text-right font-medium">Delivered</th>
                      <th className="px-3 py-2 text-right font-medium">Resident-verified</th>
                      <th className="px-3 py-2 text-right font-medium">Open</th>
                      <th className="px-4 py-2 text-left font-medium">Top needs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {clusters.rows.map((r) => (
                      <tr key={r.cluster.n}>
                        <td className="px-4 py-2.5"><span className="num mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded bg-surface-3 px-1 text-[11px] font-bold text-ink-2">{r.cluster.n}</span><span className="font-medium">{r.cluster.name}</span><span className="ml-2 text-[11.5px] text-muted">{r.cluster.side} side</span></td>
                        <td className="px-3 py-2.5"><div className="flex items-center gap-2"><div className="bar !bg-surface-3 flex-1"><span style={{ width: `${(r.total / clusters.rows[0].total) * 100}%` }} /></div><span className="num w-6 text-right text-[12px] font-medium">{r.total}</span></div></td>
                        <td className="num px-3 py-2.5 text-right">{r.delivered}</td>
                        <td className="num px-3 py-2.5 text-right font-medium text-green">{r.verified}</td>
                        <td className="num px-3 py-2.5 text-right">{r.open || <span className="text-muted">0</span>}</td>
                        <td className="px-4 py-2.5 text-[12.5px] text-ink-2">{topNeeds(r.needs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div className="p-8 text-center text-[13px] text-muted">No requests inside a cluster in this period.</div>}
              <p className="flex items-start gap-1.5 border-t border-line px-4 py-2.5 text-[11.5px] text-muted"><Info size={12} className="mt-[2px] shrink-0" aria-hidden /> Cluster centroids are approximate intersections (±200 m, ~0.6 mi radius); DCWS has not published boundaries. Counts are per cluster only — no request is ever placed at an address. {CLUSTERS.length - clusters.clustersReached} clusters had no ComForce activity this period, which is itself useful to the City.</p>
            </section>

            <section className="card p-4">
              <h3 className="text-[13.5px] font-semibold">Same three numbers DCWS reports — plus the one it cannot</h3>
              <div className="mt-3 grid grid-cols-4 gap-3 text-[13px] hand:grid-cols-2">
                <Mirror label="Incidents responded to" ours={String(k.total)} theirs="311 (Critical Response Teams, 2024)" />
                <Mirror label="Required follow-up" ours={`${k.total ? Math.round(((k.reopened + k.partlyHelped + (report.status.find((s) => s.key === "in_progress")?.value ?? 0)) / k.total) * 100) : 0}%`} theirs="76%" />
                <Mirror label="Median time to help" ours={k.medianMinutes ? fmtMinutes(k.medianMinutes) : "—"} theirs="1,000+ hours of response (total)" />
                <Mirror label="Confirmed by the resident" ours={`${k.verifiedPct}%`} theirs="not measured" highlight />
              </div>
              <p className="mt-2 text-[11.5px] text-muted">DCWS figures from Milwaukee NNS, Apr 2025. Relay figures are for {report.period.label}.</p>
            </section>
          </div>
        )}

        {section === "funders" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
            <section className="card overflow-hidden">
              <header className="border-b border-line px-4 py-3">
                <h2 className="text-[14px] font-semibold">Funder fit · {report.period.label}</h2>
                <p className="mt-0.5 text-[12px] text-muted">Scored against ComForce&apos;s actual need mix, cluster reach and verified rate. Deadlines deliberately not shown — verify before applying.</p>
              </header>
              <ul className="divide-y divide-line">
                {fits.map((f) => (
                  <li key={f.funder.id}>
                    <button onClick={() => { setFunderId(f.funder.id); open("application"); }} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-2">
                      <div className="num mt-0.5 w-12 shrink-0 text-right text-[20px] font-bold leading-none text-brand">{f.score}<span className="text-[11px] font-medium text-muted">%</span></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-semibold">{f.funder.name}</span>
                          <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-ink-2">{KIND_LABEL[f.funder.kind]}</span>
                        </div>
                        <div className="text-[12.5px] text-ink-2">{f.funder.program}</div>
                        <ul className="mt-1.5 space-y-0.5 text-[12px] text-ink-2">{f.reasons.slice(0, 2).map((r) => <li key={r} className="flex gap-1.5"><Check size={12} className="mt-[3px] shrink-0 text-green" /> {r}</li>)}</ul>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {f.ready.map((r) => <Pill key={r.id} ok>{r.label}</Pill>)}
                          {f.gaps.map((r) => <Pill key={r.id}>{r.label}</Pill>)}
                        </div>
                      </div>
                      <ChevronRight size={16} className="mt-1 shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <aside className="space-y-4">
              <section className="card p-4">
                <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold"><ListChecks size={15} /> Readiness checklist</h3>
                <p className="mt-1 text-[12px] text-muted">Relay produces the first six automatically. Tick the rest as ComForce gathers them; it updates every funder&apos;s gaps.</p>
                <ul className="mt-3 space-y-2">
                  {REQUIREMENTS.map((r) => {
                    const ok = r.kind === "auto" || have.includes(r.id);
                    return (
                      <li key={r.id}>
                        <label className={`flex items-start gap-2.5 ${r.kind === "auto" ? "" : "cursor-pointer"}`}>
                          <input type="checkbox" checked={ok} disabled={r.kind === "auto"} onChange={() => toggleHave(r.id)} className="mt-0.5 accent-[var(--brand)]" />
                          <span className="min-w-0">
                            <span className={`block text-[12.5px] font-medium ${ok ? "text-ink" : "text-ink-2"}`}>{r.label} {r.kind === "auto" && <span className="ml-1 rounded bg-green-soft px-1 py-px text-[10px] font-bold uppercase text-green">Relay</span>}</span>
                            <span className="block text-[11.5px] leading-snug text-muted">{r.hint}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="card p-4">
                <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold"><AlertTriangle size={15} className="text-orange" /> The funding picture</h3>
                <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug text-ink-2">
                  <li>ComForce&apos;s recurring money is one City contract (DCWS Promise Keepers).</li>
                  <li>DCWS is ARPA-funded and that money winds down in 2026; the Council has asked it for proof of outcomes.</li>
                  <li>No IRS record found for Community Task Force MKE — a fiscal sponsor unlocks the foundation rows above.</li>
                  <li>The website&apos;s Donate button leads to a contact form; there is no donation path.</li>
                </ul>
                <p className="mt-2 text-[11px] text-muted">Public sources only; see docs/research/09-comforce-funding.md.</p>
              </section>
            </aside>
          </div>
        )}

        {section === "application" && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-4">
              <section className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block text-[11.5px] font-medium uppercase tracking-wide text-muted">Applying to</label>
                    <select value={fit.funder.id} onChange={(e) => setFunderId(e.target.value)} className="mt-0.5 max-w-[560px] bg-transparent text-[15px] font-semibold outline-none">
                      {fits.map((f) => <option key={f.funder.id} value={f.funder.id}>{f.funder.name} — {f.funder.program}</option>)}
                    </select>
                    <div className="mt-1 text-[12.5px] text-ink-2">{fit.funder.range} · fit {fit.score}% · <a href={fit.funder.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand hover:underline">source <ExternalLink size={11} /></a></div>
                  </div>
                  <div className="flex gap-2">
                    <Btn variant="solid" onClick={generate} disabled={drafting}><Sparkles size={15} /> {drafting ? "Drafting…" : draft ? "Redraft" : "Draft application"}</Btn>
                    <Btn onClick={exportWord} disabled={!draft || exporting}><FileDown size={15} /> {exporting ? "Exporting…" : "Word"}</Btn>
                  </div>
                </div>
                <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2"><strong className="text-ink">They fund:</strong> {fit.funder.priorities} <strong className="text-ink">They measure:</strong> {fit.funder.metricsLanguage}.</p>
              </section>

              {draft ? (
                <>
                  <Section title="1 · Statement of need" body={draft.need} />
                  <Section title="2 · Outcomes & evidence" body={draft.outcomes} />
                  <Section title="3 · Evaluation plan" body={draft.evaluation} />
                  <p className="text-[11.5px] text-muted">{draft.source === "llm" ? "Drafted by Relay from the period's numbers in this funder's language; every figure traces to a request. Edit before submitting." : "Drafted offline from the numbers (no AI key or the call failed). Every figure traces to a request."}</p>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-line bg-surface-2 p-8 text-center">
                  <Sparkles size={22} className="mx-auto text-brand" />
                  <div className="mt-2 text-[14px] font-medium">Draft the {fit.funder.name.split(" · ")[0]} application</div>
                  <p className="mx-auto mt-1 max-w-[480px] text-[12.5px] text-muted">Statement of need, outcomes &amp; evidence, and evaluation plan — in this funder&apos;s vocabulary, from {report.period.label}&apos;s record. Nothing is invented: if a number isn&apos;t in Relay, it isn&apos;t in the draft.</p>
                  <Btn variant="solid" className="mt-4" onClick={generate} disabled={drafting}><Sparkles size={15} /> {drafting ? "Drafting…" : "Draft application"}</Btn>
                </div>
              )}

              <section className="card overflow-hidden">
                <header className="border-b border-line px-4 py-3"><h3 className="text-[13.5px] font-semibold">Logic model · {report.period.label}</h3></header>
                <div className="grid grid-cols-4 divide-x divide-line text-[12.5px] hand:grid-cols-1 hand:divide-x-0 hand:divide-y">
                  {(["inputs", "activities", "outputs", "outcomes"] as const).map((col) => (
                    <div key={col} className="p-3">
                      <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted">{col}</div>
                      <ul className="space-y-1.5 leading-snug text-ink-2">{logic[col].map((x) => <li key={x}>{x}</li>)}</ul>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line bg-brand-soft px-4 py-2.5 text-[12.5px] leading-snug text-ink"><strong>Impact:</strong> {logic.impact}</div>
              </section>
            </div>

            <aside className="space-y-4">
              <section className="card p-4">
                <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold"><ListChecks size={15} /> For this funder</h3>
                <ul className="mt-2 space-y-1.5">
                  {fit.ready.map((r) => <li key={r.id} className="flex items-start gap-2 text-[12.5px]"><Check size={14} className="mt-[2px] shrink-0 text-green" /> <span>{r.label}</span></li>)}
                  {fit.gaps.map((r) => <li key={r.id} className="flex items-start gap-2 text-[12.5px] text-ink-2"><X size={14} className="mt-[2px] shrink-0 text-red" /> <span>{r.label} <span className="block text-[11.5px] text-muted">{r.hint}</span></span></li>)}
                </ul>
                {fit.gaps.length > 0 && <button onClick={() => open("funders")} className="mt-2 text-[12px] font-medium text-brand hover:underline">Update the checklist →</button>}
              </section>

              <section className="card p-4">
                <h3 className="flex items-center gap-1.5 text-[13.5px] font-semibold"><Building2 size={15} /> Platform cost · {report.period.label}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Num label="Total" v={`$${econ.periodCost.toFixed(0)}`} />
                  <Num label="Per request" v={`$${econ.perRequest.toFixed(2)}`} />
                  <Num label="Per verified" v={econ.perVerified ? `$${econ.perVerified.toFixed(2)}` : "—"} />
                </div>
                <ul className="mt-2 space-y-0.5 text-[11.5px] text-muted">{econ.assumptions.map((a) => <li key={a.item}>{a.item}: ${a.cost} {a.unit}</li>)}</ul>
                <p className="mt-1.5 text-[11.5px] text-muted">{econ.note}</p>
              </section>

              {story && (
                <section className="card p-4">
                  <h3 className="text-[13.5px] font-semibold">One case, de-identified</h3>
                  <div className="mt-1 text-[12.5px] font-medium text-ink">{story.title}</div>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{story.body}</p>
                  <p className="mt-1.5 text-[11px] text-muted">Built from the record of {story.requestId} by template — no AI, nothing invented.</p>
                </section>
              )}
            </aside>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function topNeeds(needs: Record<string, number>): string {
  return Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, c]) => `${NEED_LABEL[n as Need] ?? n} ${c}`).join(" · ");
}

function Pill({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium ${ok ? "bg-green-soft text-green" : "bg-red-soft text-red"}`}>{ok ? <Check size={10} /> : <X size={10} />}{children}</span>;
}

function Mirror({ label, ours, theirs, highlight }: { label: string; ours: string; theirs: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-[#bfe7cf] bg-green-soft" : "border-line bg-surface-2"}`}>
      <div className="text-[11.5px] text-muted">{label}</div>
      <div className={`num mt-1 text-[20px] font-bold leading-none ${highlight ? "text-green" : "text-ink"}`}>{ours}</div>
      <div className="mt-1.5 text-[11px] text-muted">DCWS: {theirs}</div>
    </div>
  );
}

function Num({ label, v }: { label: string; v: string }) {
  return <div className="rounded-md bg-surface-2 p-2 text-center"><div className="num text-[16px] font-bold">{v}</div><div className="text-[10.5px] text-muted">{label}</div></div>;
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <section className="card p-4">
      <h3 className="text-[13.5px] font-semibold">{title}</h3>
      <p className="mt-2 whitespace-pre-line text-[14px] leading-[1.7] text-ink">{body}</p>
    </section>
  );
}
