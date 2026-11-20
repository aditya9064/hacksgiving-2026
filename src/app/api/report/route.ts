import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeStats } from "@/lib/stats";
import { draftFunderNarrative } from "@/lib/ai";
import { NEED_LABEL } from "@/lib/types";


export async function POST() {
  const snap = await db.snapshot();
  const s = computeStats(snap.requests, snap.partners);
  const narrative = await draftFunderNarrative({
    total: s.total,
    verifiedPct: s.verifiedPct,
    medianMinutes: s.medianMinutes,
    neighborhoodCount: s.neighborhoodCount,
    partnerCount: s.partnerCount,
    topNeeds: s.topNeeds.slice(0, 3).map((n) => NEED_LABEL[n.need].toLowerCase()).join(", "),
    partners: s.byPartner.map((p) => `${p.name}: ${p.handled} handled, ${p.verified} verified`),
  });
  return NextResponse.json({ stats: s, narrative });
}

/** CSV export: the organization's own data, always portable. */
export async function GET() {
  const snap = await db.snapshot();
  const header = ["id", "short_code", "created_at", "status", "channel", "needs", "urgency", "neighborhood", "household_size", "owner_org", "delivered_at", "verified_at", "resident_feedback", "summary"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = snap.requests.map((r) => [r.id, r.shortCode, r.createdAt, r.status, r.channel, r.needs.join("|"), r.urgency, r.neighborhood, r.householdSize, r.ownerOrg, r.deliveredAt, r.verifiedAt, r.residentFeedback, r.summary].map(esc).join(","));
  return new Response([header.join(","), ...lines].join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="relay-mke-export.csv"' } });
}
