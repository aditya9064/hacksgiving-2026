"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, FileDown, FileType, Loader2, Sparkles, X } from "lucide-react";
import type { Report } from "@/lib/report";
import { kpiRows, type ExportFormat } from "@/lib/client/exporters";
import { CHARTS } from "./chartDefs";
import { ChartPanel, DataTable } from "./ChartExplorer";

/**
 * Full funder report for the selected period: narrative, key figures, every chart and the
 * partner / neighborhood tables. Downloads as PDF or Word with the same content.
 */
export function FunderReport({ open, onClose, report, narrative, drafting, onExport, busy }: {
  open: boolean;
  onClose: () => void;
  report: Report;
  narrative: string | null;
  drafting: boolean;
  onExport: (f: ExportFormat) => void;
  busy: ExportFormat | null;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const copy = async () => {
    if (!narrative) return;
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const partners = CHARTS.find((c) => c.id === "partners")!.table(report);
  const hoods = CHARTS.find((c) => c.id === "neighborhoods")!.table(report);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Funder report, ${report.period.label}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-x-0 top-[3vh] z-50 mx-auto flex h-[94vh] w-[min(980px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-line bg-bg shadow-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface px-5 py-3.5">
              <div>
                <div className="text-[11.5px] text-muted">Funder report · ready to download</div>
                <div className="text-[17px] font-bold">{report.period.label}</div>
              </div>
              <div className="flex items-center gap-2">
                <button disabled={!!busy || drafting} onClick={() => onExport("pdf")} className="inline-flex h-[36px] items-center gap-1.5 rounded-lg bg-brand px-3.5 text-[13px] font-medium text-white hover:bg-brand-2 disabled:opacity-50">
                  {busy === "pdf" ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} Download PDF
                </button>
                <button disabled={!!busy || drafting} onClick={() => onExport("docx")} className="inline-flex h-[36px] items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-[13px] font-medium hover:bg-surface-2 disabled:opacity-50">
                  {busy === "docx" ? <Loader2 size={15} className="animate-spin" /> : <FileType size={15} />} Word
                </button>
                <button onClick={onClose} aria-label="Close" className="p-1.5 text-muted hover:text-ink"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mx-auto max-w-[860px] space-y-6">
                <header>
                  <div className="text-[12px] font-medium uppercase tracking-wide text-brand">Impact report</div>
                  <h2 className="mt-1 text-[24px] font-bold leading-tight">ComForce MKE and partners · {report.period.label}</h2>
                  <p className="mt-1 text-[12.5px] text-muted">Every figure is computed from the Relay record, request by request. Demo data is synthetic; no personal identifiers are included.</p>
                </header>

                <section className="grid grid-cols-3 gap-3">
                  {kpiRows(report).slice(0, 6).map(([k, v]) => (
                    <div key={k} className="card p-3.5">
                      <div className="text-[12px] text-ink-2">{k}</div>
                      <div className="num mt-1 text-[22px] font-bold">{v}</div>
                    </div>
                  ))}
                </section>

                <section className="card p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[15px] font-semibold"><Sparkles size={15} className="text-brand" /> Summary for funders</h3>
                    {narrative && <button onClick={copy} className="inline-flex items-center gap-1 text-[12px] text-brand">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy text"}</button>}
                  </div>
                  {drafting ? (
                    <div className="flex items-center gap-2 text-[13.5px] text-muted"><Loader2 size={15} className="animate-spin" /> Drafting from the {report.period.label} numbers…</div>
                  ) : (
                    <p className="whitespace-pre-line text-[14.5px] leading-[1.7] text-ink">{narrative}</p>
                  )}
                </section>

                <section className="grid grid-cols-2 gap-4">
                  {CHARTS.map((c) => (
                    <div key={c.id} className={`card p-4 ${c.id === "timeline" || c.id === "partners" ? "col-span-2" : ""}`}>
                      <ChartPanel def={c} report={report} />
                    </div>
                  ))}
                </section>

                <section className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="mb-2 text-[14px] font-semibold">Partner outcomes</h3>
                    <DataTable {...partners} />
                  </div>
                  <div>
                    <h3 className="mb-2 text-[14px] font-semibold">Neighborhoods</h3>
                    <DataTable head={hoods.head} rows={hoods.rows.slice(0, 12)} />
                  </div>
                </section>
                <p className="pb-4 text-[11.5px] text-muted">The PDF and Word downloads contain this report plus full data tables and a de-identified appendix of every request in {report.period.label}.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
