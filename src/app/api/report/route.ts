import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildHistory } from "@/lib/db/history";
import { draftFunderNarrative } from "@/lib/ai";
import { buildReport, ROW_HEADERS, rowValues, type Period } from "@/lib/report";
import { fmtMinutes } from "@/lib/stats";

/** Live record + synthetic archive of past months, without the contact tier. */
async function allRequests() {
  const snap = await db.snapshot();
  const live = snap.requests.map((r) => ({ ...r, contactRef: undefined }));
  return { requests: [...buildHistory(), ...live], partners: snap.partners };
}

function parsePeriod(year: unknown, month: unknown): Period {
  const y = year === null || year === undefined || year === "" || year === "all" ? null : Number(year);
  const m = y === null || month === null || month === undefined || month === "" || month === "all" ? null : Number(month);
  return { year: Number.isFinite(y) ? y : null, month: Number.isFinite(m) ? m : null };
}

/** Funder narrative for a period, drafted from the same report the page and exports use. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { year?: unknown; month?: unknown };
  const { requests, partners } = await allRequests();
  const report = buildReport(requests, partners, parsePeriod(body.year, body.month));
  const k = report.kpis;
  const narrative = await draftFunderNarrative({
    reportingPeriod: report.period.label,
    total: k.total,
    delivered: k.delivered,
    verifiedPct: k.verifiedPct,
    medianMinutes: k.medianMinutes,
    medianResponse: k.medianMinutes ? fmtMinutes(k.medianMinutes) : "n/a",
    reopened: k.reopened,
    householdsReached: k.households,
    neighborhoodCount: k.neighborhoods,
    partnerCount: k.partnersActive,
    topNeeds: report.needs.slice(0, 3).map((n) => n.label.toLowerCase()).join(", "),
    topNeighborhoods: report.neighborhoods.slice(0, 3).map((h) => h.neighborhood).join(", "),
    partners: report.partners.map((p) => `${p.name}: ${p.handled} handled, ${p.verified} verified`),
  });
  return NextResponse.json({ report, narrative });
}

/** CSV export of a period (default: everything). The organization's own data, always portable. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const { requests, partners } = await allRequests();
  const report = buildReport(requests, partners, parsePeriod(sp.get("year"), sp.get("month")));
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = report.rows.map((r) => rowValues(r).map(esc).join(","));
  const name = `relay-mke-${report.period.label.toLowerCase().replace(/\s+/g, "-")}.csv`;
  return new Response([ROW_HEADERS.map(esc).join(","), ...lines].join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}"` } });
}
