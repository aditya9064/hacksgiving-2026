import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildHistory } from "@/lib/db/history";
import { draftApplication } from "@/lib/ai";
import { buildReport, type Period } from "@/lib/report";
import { clusterStats } from "@/lib/clusters";
import { FUNDERS, buildLogicModel, pickStory } from "@/lib/grants";

function parsePeriod(year: unknown, month: unknown): Period {
  const y = year === null || year === undefined || year === "" || year === "all" ? null : Number(year);
  const m = y === null || month === null || month === undefined || month === "" || month === "all" ? null : Number(month);
  return { year: Number.isFinite(y) ? y : null, month: Number.isFinite(m) ? m : null };
}

/** Drafts Statement of Need / Outcomes / Evaluation for one funder from the same report the Impact page uses. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { funderId?: string; year?: unknown; month?: unknown };
  const funder = FUNDERS.find((f) => f.id === body.funderId);
  if (!funder) return NextResponse.json({ error: "Unknown funder" }, { status: 400 });
  const snap = await db.snapshot();
  const requests = [...buildHistory(), ...snap.requests.map((r) => ({ ...r, contactRef: undefined }))];
  const report = buildReport(requests, snap.partners, parsePeriod(body.year, body.month));
  const clusters = clusterStats(report.rows);
  const logic = buildLogicModel(report, clusters);
  const story = pickStory(report);
  const draft = await draftApplication({ funder, report, clusters, logic, story });
  return NextResponse.json({ draft, funderId: funder.id, period: report.period.label });
}
