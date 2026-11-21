"use client";
import { useEffect, useRef, useState } from "react";
import { Braces, ChevronDown, Download, FileDown, FileSpreadsheet, FileText, FileType, Loader2 } from "lucide-react";
import type { ExportFormat } from "@/lib/client/exporters";

const OPTIONS: { id: ExportFormat; label: string; hint: string; Icon: typeof FileText }[] = [
  { id: "pdf", label: "PDF report", hint: "Narrative, figures, all charts, tables", Icon: FileDown },
  { id: "docx", label: "Word document", hint: ".docx, editable for grant applications", Icon: FileType },
  { id: "xlsx", label: "Excel workbook", hint: ".xlsx, a sheet per table plus charts", Icon: FileSpreadsheet },
  { id: "csv", label: "CSV", hint: "One row per request, de-identified", Icon: FileText },
  { id: "json", label: "JSON", hint: "Raw report data for other systems", Icon: Braces },
];

export function ExportMenu({ onExport, busy, periodLabel }: { onExport: (f: ExportFormat) => void; busy: ExportFormat | null; periodLabel: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open} className="inline-flex h-[38px] items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-[13px] font-medium text-ink hover:bg-surface-2">
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {busy ? `Exporting ${busy.toUpperCase()}…` : "Export report"} <ChevronDown size={14} className="text-muted" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-1.5 w-[290px] overflow-hidden rounded-xl border border-line bg-surface shadow-lg">
          <div className="border-b border-line px-3 py-2 text-[11.5px] text-muted">Export {periodLabel}</div>
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              role="menuitem"
              disabled={!!busy}
              onClick={() => {
                setOpen(false);
                onExport(o.id);
              }}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-surface-2 disabled:opacity-50"
            >
              <o.Icon size={16} className="mt-0.5 text-brand" />
              <span>
                <span className="block text-[13px] font-medium text-ink">{o.label}</span>
                <span className="block text-[11.5px] text-muted">{o.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
