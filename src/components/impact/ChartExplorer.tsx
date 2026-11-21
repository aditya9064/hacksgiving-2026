"use client";
import { useEffect, useRef, useState } from "react";
import { Table2 } from "lucide-react";
import type { Report } from "@/lib/report";
import { CHARTS, type ChartDef } from "./chartDefs";
import { ChartFrame } from "./charts";

/** Tracks an element's content width so SVG charts render at real pixel size. */
export function useWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-[12.5px]">
        <thead className="bg-surface-2 text-ink-2">
          <tr>{head.map((h, i) => <th key={h} className={`px-3 py-2 font-medium ${i ? "text-right" : "text-left"}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j} className={`px-3 py-1.5 ${j ? "num text-right font-medium" : "text-ink"}`}>{v}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}

/** One chart with title, subtitle, hover tooltips and an optional data table. */
export function ChartPanel({ def, report, showTable }: { def: ChartDef; report: Report; showTable?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  return (
    <div>
      <div className="text-[14px] font-semibold">{def.title}</div>
      <div className="mt-0.5 text-[12px] text-muted">{def.subtitle(report)}</div>
      <div ref={ref} className="mt-3">
        <ChartFrame>{def.render(report, w)}</ChartFrame>
      </div>
      {showTable && <div className="mt-3"><DataTable {...def.table(report)} /></div>}
    </div>
  );
}

export function ChartExplorer({ report }: { report: Report }) {
  const [active, setActive] = useState(CHARTS[0].id);
  const [table, setTable] = useState(false);
  const def = CHARTS.find((c) => c.id === active) ?? CHARTS[0];
  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="Choose a chart">
        {CHARTS.map((c) => {
          const on = c.id === active;
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(c.id)}
              className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${on ? "border-brand bg-brand-soft" : "border-line bg-surface hover:bg-surface-2"}`}
            >
              <c.Icon size={16} className={on ? "text-brand" : "text-ink-2"} />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-medium text-ink">{c.title}</span>
                <span className="block text-[11px] text-muted">{c.kind}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-lg border border-line p-4">
        <div className="flex justify-end">
          <button onClick={() => setTable((v) => !v)} className="inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:underline"><Table2 size={13} /> {table ? "Hide" : "Show"} data table</button>
        </div>
        <ChartPanel def={def} report={report} showTable={table} />
      </div>
    </div>
  );
}
