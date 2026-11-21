import { NextResponse } from "next/server";
import { answerFollowUp, appendFollowUpTurn, declineFollowUp, endFollowUpCall } from "@/lib/followup";

type Body = { id?: string; action?: "answer" | "decline" | "turn" | "end"; conversationId?: string; role?: "agent" | "caller"; text?: string };

/** Driven by the resident's phone (/phone) during Jordan's live call-back. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.id || !b.action) return NextResponse.json({ error: "id and action are required" }, { status: 400 });
  const request =
    b.action === "answer" ? await answerFollowUp(b.id, b.conversationId ?? `live-fu-${b.id}-${Date.now().toString(36)}`)
    : b.action === "decline" ? await declineFollowUp(b.id)
    : b.action === "turn" ? await appendFollowUpTurn(b.id, b.role ?? "caller", b.text ?? "")
    : await endFollowUpCall(b.id);
  if (!request) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, followUp: request.followUp ?? null });
}
