import { NextResponse } from "next/server";
import { recordPartnerResponse, type PartnerResponseInput } from "@/lib/dispatch";

/** Webhook tool for the dispatch agent: records the partner's answer while Jordan is still on the line. */
export async function POST(req: Request) {
  const secret = process.env.VOICE_TOOL_SECRET;
  if (secret && req.headers.get("x-relay-secret") !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as PartnerResponseInput;
  if (body.accepted === undefined) return NextResponse.json({ error: "accepted is required" }, { status: 400 });
  const request = await recordPartnerResponse(body);
  if (!request) return NextResponse.json({ ok: false, message: "No open handoff matched this call. Thank them and end the call." }, { status: 404 });
  const d = request.dispatch!;
  return NextResponse.json({
    ok: true,
    status: d.status,
    message: d.status === "accepted"
      ? `Recorded. ${request.ownerName ?? "A ComForce volunteer"} will come pick up${d.outcome?.readyBy ? ` ${d.outcome.readyBy}` : " shortly"}. Thank them warmly and end the call.`
      : "Recorded as declined. Thank them for their time and end the call; ComForce will try another partner.",
  });
}
