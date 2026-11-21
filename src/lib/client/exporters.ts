"use client";
import type { Report } from "../report";
import { ROW_HEADERS, rowValues } from "../report";
import { fmtMinutes } from "../stats";
import { CHARTS } from "@/components/impact/chartDefs";

/*
 * Client-side exports of a period's report. Heavy libraries load only when an export runs.
 * Everything exported is de-identified: no contact tier, no resident free text beyond the
 * one-line summary, and the request rows carry neighborhoods, never addresses.
 */

export type ExportFormat = "pdf" | "docx" | "xlsx" | "csv" | "json";

export interface ChartImage {
  id: string;
  title: string;
  subtitle: string;
  dataUrl: string;
  /** Same chart as JPEG; keeps the PDF small (jsPDF stores PNGs uncompressed). */
  jpegUrl: string;
  width: number;
  height: number;
}

const ORG = "ComForce MKE and partners";
const SYNTHETIC_NOTE = "Demo data: residents and cases are synthetic. Neighborhood names are real Milwaukee areas. No personal identifiers are included.";

export function fileStem(r: Report) {
  return `relay-mke-impact-${r.period.label.toLowerCase().replace(/\s+/g, "-")}`;
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function kpiRows(r: Report): [string, string][] {
  const k = r.kpis;
  return [
    ["Total requests", String(k.total)],
    ["Help delivered", String(k.delivered)],
    ["Resident-verified", `${k.verifiedPct}%`],
    ["Partly helped (open for follow-up)", String(k.partlyHelped)],
    ["Median response", k.medianMinutes ? fmtMinutes(k.medianMinutes) : "n/a"],
    ["Reopened (resident said not helped)", String(k.reopened)],
    ["Still open", String(k.open)],
    ["Households reached", String(k.households)],
    ["Partners active", String(k.partnersActive)],
    ["Neighborhoods", String(k.neighborhoods)],
  ];
}

/** Renders every chart to a PNG (2x) from the same SVG components the page uses. */
export async function chartImages(r: Report, width = 760): Promise<ChartImage[]> {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const out: ChartImage[] = [];
  for (const c of CHARTS) {
    const svg = renderToStaticMarkup(c.render(r, width));
    const w = Number(svg.match(/width="(\d+(?:\.\d+)?)"/)?.[1] ?? width);
    const h = Number(svg.match(/height="(\d+(?:\.\d+)?)"/)?.[1] ?? 240);
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error(`could not render ${c.id}`));
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    out.push({ id: c.id, title: c.title, subtitle: c.subtitle(r), dataUrl: canvas.toDataURL("image/png"), jpegUrl: canvas.toDataURL("image/jpeg", 0.9), width: w, height: h });
  }
  return out;
}

// ---- CSV / JSON ---------------------------------------------------------------
export function exportCSV(r: Report) {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [ROW_HEADERS.map(esc).join(","), ...r.rows.map((row) => rowValues(row).map(esc).join(","))].join("\r\n");
  download(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }), `${fileStem(r)}.csv`);
}

export function exportJSON(r: Report, narrative: string | null) {
  const { rows, ...summary } = r;
  const data = { ...summary, narrative, note: SYNTHETIC_NOTE, charts: CHARTS.map((c) => ({ id: c.id, title: c.title, ...c.table(r) })), requests: rows };
  download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), `${fileStem(r)}.json`);
}

// ---- Excel ----------------------------------------------------------------------
export async function exportExcel(r: Report, narrative: string | null, images: ChartImage[]) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  wb.creator = "Relay MKE";
  wb.created = new Date();
  const header = (row: import("exceljs").Row) => {
    row.font = { bold: true, color: { argb: "FF111827" } };
    row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE7F4FB" } };
  };

  const sum = wb.addWorksheet("Summary");
  sum.columns = [{ width: 38 }, { width: 70 }];
  sum.addRow(["Relay MKE · Impact report"]).font = { bold: true, size: 16 };
  sum.addRow(["Reporting period", r.period.label]);
  sum.addRow(["Organization", ORG]);
  sum.addRow(["Generated", new Date(r.generatedAt).toLocaleString()]);
  sum.addRow([]);
  header(sum.addRow(["Key figure", "Value"]));
  for (const k of kpiRows(r)) sum.addRow(k);
  sum.addRow([]);
  header(sum.addRow(["Funder narrative", ""]));
  const nr = sum.addRow([narrative ?? "Generate the funder report on the Impact page to include the narrative.", ""]);
  sum.mergeCells(`A${nr.number}:B${nr.number}`);
  nr.alignment = { wrapText: true, vertical: "top" };
  nr.height = 150;
  sum.addRow([]);
  sum.addRow([SYNTHETIC_NOTE]).font = { italic: true, color: { argb: "FF6B7280" } };

  const charts = wb.addWorksheet("Charts");
  charts.getColumn(1).width = 110;
  let row = 1;
  for (const img of images) {
    charts.getCell(row, 1).value = img.title;
    charts.getCell(row, 1).font = { bold: true, size: 13 };
    charts.getCell(row + 1, 1).value = img.subtitle;
    charts.getCell(row + 1, 1).font = { color: { argb: "FF6B7280" } };
    const id = wb.addImage({ base64: img.dataUrl, extension: "png" });
    const w = 640;
    const h = Math.round((img.height / img.width) * w);
    charts.addImage(id, { tl: { col: 0, row: row + 1.2 }, ext: { width: w, height: h } });
    row += 3 + Math.ceil(h / 20);
  }

  for (const c of CHARTS) {
    const t = c.table(r);
    const ws = wb.addWorksheet(c.title.slice(0, 31));
    header(ws.addRow(t.head));
    t.rows.forEach((x) => ws.addRow(x));
    ws.columns.forEach((col, i) => (col.width = i === 0 ? 34 : 16));
  }

  const req = wb.addWorksheet("Requests");
  header(req.addRow(ROW_HEADERS));
  r.rows.forEach((x) => req.addRow(rowValues(x)));
  req.columns.forEach((col, i) => (col.width = i === ROW_HEADERS.length - 1 ? 60 : i === 4 ? 28 : 16));
  req.views = [{ state: "frozen", ySplit: 1 }];

  const buf = await wb.xlsx.writeBuffer();
  download(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${fileStem(r)}.xlsx`);
}

// ---- PDF ------------------------------------------------------------------------
/** Standard PDF fonts only cover WinAnsi; swap the few characters they lack. */
const pdfSafe = (s: string) => s.replace(/→/g, "to").replace(/[≥]/g, ">=").replace(/[≤]/g, "<=").replace(/[^\x00-\xFF‘’“”–—•…·]/g, "");

export async function exportPDF(r: Report, narrative: string | null, images: ChartImage[]) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = M;
  const ensure = (h: number) => {
    if (y + h > H - M) {
      doc.addPage();
      y = M;
    }
  };

  doc.setFillColor(11, 147, 213);
  doc.rect(0, 0, W, 6, "F");
  doc.setFont("helvetica", "bold").setFontSize(22).setTextColor(17, 24, 39);
  doc.text("Impact report", M, y + 16);
  doc.setFont("helvetica", "normal").setFontSize(11).setTextColor(75, 85, 99);
  doc.text(pdfSafe(`${ORG} · Relay MKE · ${r.period.label}`), M, y + 36);
  doc.text(`Generated ${new Date(r.generatedAt).toLocaleDateString("en-US", { dateStyle: "long" })}`, M, y + 52);
  y += 76;

  const kpis = kpiRows(r).slice(0, 6);
  const boxW = (W - 2 * M - 2 * 10) / 3;
  kpis.forEach(([label, value], i) => {
    const x = M + (i % 3) * (boxW + 10);
    const by = y + Math.floor(i / 3) * 62;
    doc.setDrawColor(228, 231, 235).setFillColor(248, 249, 250).roundedRect(x, by, boxW, 52, 6, 6, "FD");
    doc.setFontSize(9).setTextColor(107, 114, 128).text(pdfSafe(label), x + 10, by + 17);
    doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(17, 24, 39).text(value, x + 10, by + 40);
    doc.setFont("helvetica", "normal");
  });
  y += 132;

  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(17, 24, 39).text("Summary for funders", M, y);
  y += 16;
  doc.setFont("helvetica", "normal").setFontSize(10.5).setTextColor(31, 41, 55);
  for (const line of doc.splitTextToSize(pdfSafe(narrative ?? "Narrative not generated."), W - 2 * M)) {
    ensure(14);
    doc.text(line, M, y);
    y += 14;
  }
  y += 10;

  for (const img of images) {
    const w = W - 2 * M;
    const h = (img.height / img.width) * w;
    ensure(h + 40);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(17, 24, 39).text(pdfSafe(img.title), M, y);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(107, 114, 128).text(pdfSafe(img.subtitle), M, y + 13);
    doc.addImage(img.jpegUrl, "JPEG", M, y + 20, w, h);
    y += h + 38;
  }

  for (const c of CHARTS) {
    const t = c.table(r);
    ensure(60);
    doc.setFont("helvetica", "bold").setFontSize(11).setTextColor(17, 24, 39).text(pdfSafe(`${c.title} · data`), M, y);
    autoTable(doc, { startY: y + 6, head: [t.head.map(pdfSafe)], body: t.rows.map((x) => x.map((v) => pdfSafe(String(v)))), margin: { left: M, right: M }, styles: { fontSize: 9 }, headStyles: { fillColor: [42, 120, 214] } });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
  }

  doc.addPage();
  doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(17, 24, 39).text(pdfSafe(`Appendix · ${r.rows.length} requests, ${r.period.label}`), M, M);
  const cols = [0, 1, 2, 4, 6, 8, 11];
  autoTable(doc, {
    startY: M + 10,
    head: [cols.map((i) => ROW_HEADERS[i])],
    body: r.rows.map((x) => cols.map((i) => pdfSafe(String(rowValues(x)[i])))),
    margin: { left: M, right: M },
    styles: { fontSize: 7.5, cellPadding: 3 },
    headStyles: { fillColor: [42, 120, 214] },
  });

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(107, 114, 128);
    doc.text(pdfSafe(SYNTHETIC_NOTE), M, H - 24, { maxWidth: W - 2 * M - 60 });
    doc.text(`${p} / ${pages}`, W - M, H - 24, { align: "right" });
  }
  doc.save(`${fileStem(r)}.pdf`);
}

// ---- Word -----------------------------------------------------------------------
export async function exportWord(r: Report, narrative: string | null, images: ChartImage[]) {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, ShadingType } = d;
  const cell = (text: string, bold = false, fill?: string) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold, size: 18 })] })], shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined });
  const table = (head: string[], rows: (string | number)[][]) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ tableHeader: true, children: head.map((h) => cell(h, true, "E7F4FB")) }), ...rows.map((x) => new TableRow({ children: x.map((v) => cell(String(v))) }))],
    });
  const bytes = (dataUrl: string) => Uint8Array.from(atob(dataUrl.split(",")[1]), (c) => c.charCodeAt(0));

  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun("Impact report")] }),
    new Paragraph({ children: [new TextRun({ text: `${ORG} · Relay MKE · ${r.period.label}`, color: "4B5563" })] }),
    new Paragraph({ children: [new TextRun({ text: `Generated ${new Date(r.generatedAt).toLocaleDateString("en-US", { dateStyle: "long" })}`, color: "6B7280", size: 18 })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Key figures")] }),
    table(["Key figure", "Value"], kpiRows(r)),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Summary for funders")] }),
    ...(narrative ?? "Narrative not generated.").split(/\n+/).map((p) => new Paragraph({ spacing: { after: 160 }, children: [new TextRun(p)] })),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Charts")] }),
  ];
  for (const img of images) {
    const w = 600;
    children.push(
      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(img.title)] }),
      new Paragraph({ children: [new TextRun({ text: img.subtitle, color: "6B7280", size: 18 })] }),
      new Paragraph({ children: [new ImageRun({ type: "png", data: bytes(img.dataUrl), transformation: { width: w, height: Math.round((img.height / img.width) * w) } })] }),
    );
  }
  children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Data tables")] }));
  for (const c of CHARTS) {
    const t = c.table(r);
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(c.title)] }), table(t.head, t.rows), new Paragraph(""));
  }
  const cols = [0, 1, 2, 4, 6, 8, 11];
  children.push(
    new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, children: [new TextRun(`Appendix · ${r.rows.length} requests`)] }),
    table(cols.map((i) => ROW_HEADERS[i]), r.rows.map((x) => cols.map((i) => rowValues(x)[i]))),
    new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: SYNTHETIC_NOTE, italics: true, color: "6B7280", size: 16 })] }),
  );

  const doc = new Document({ creator: "Relay MKE", title: `Impact report · ${r.period.label}`, sections: [{ children }] });
  download(await Packer.toBlob(doc), `${fileStem(r)}.docx`);
}
