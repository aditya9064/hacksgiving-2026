import { NextResponse } from "next/server";
import { z } from "zod";
import { addNote, claim, markDelivered, residentReply, nudgeOwner, reassign } from "@/lib/actions";
import { canReassign, reassignReasonError } from "@/lib/coordination";
import { db } from "@/lib/db";


const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim"), ownerName: z.string().min(1), ownerOrg: z.string().min(1), partnerId: z.string().optional() }),
  z.object({ action: z.literal("note"), actor: z.string().min(1), text: z.string().min(1).max(1000) }),
  z.object({ action: z.literal("delivered"), actor: z.string().min(1) }),
  z.object({ action: z.literal("resident_reply"), reply: z.enum(["1", "2", "3"]) }),
  z.object({ action: z.literal("nudge"), actor: z.string().min(1) }),
  z.object({
    action: z.literal("reassign"),
    actorName: z.string().min(1),
    actorOrg: z.string().min(1),
    newOwnerName: z.string().optional(),
    newOwnerOrg: z.string().optional(),
    newPartnerId: z.string().optional(),
    // Length/blank is enforced by reassignReasonError() so the rule has one source of truth
    // and stays unit-testable; keep a generous cap here just to bound the payload.
    reason: z.string().max(2000),
    confirmUnownedUrgent: z.boolean().optional(),
  }),
]);

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const req = await db.getRequest(id);
  if (!req) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { contactRef, ...safe } = req;
  const activity = await db.listActivity(id);
  return NextResponse.json({ request: { ...safe, hasContact: Boolean(contactRef) }, activity });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = Action.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const a = parsed.data;

  // Reassign/release is coordinator-only and is checked here on the SERVER, not just hidden in the
  // UI. This is demo-level authorization (the identity comes from the browser); see canReassign().
  if (a.action === "reassign") {
    const reasonErr = reassignReasonError(a.reason);
    if (reasonErr) return NextResponse.json({ error: reasonErr }, { status: 400 });
    const current = await db.getRequest(id);
    if (!current) return NextResponse.json({ error: "not found" }, { status: 404 });
    const check = canReassign({ actorOrg: a.actorOrg, urgency: current.urgency, newOwnerName: a.newOwnerName, confirmUnownedUrgent: a.confirmUnownedUrgent });
    if (!check.ok) return NextResponse.json({ error: check.message, code: check.code }, { status: check.code === "not_coordinator" ? 403 : 409 });
    const reassigned = await reassign(id, { actorName: a.actorName, newOwnerName: a.newOwnerName, newOwnerOrg: a.newOwnerOrg, newPartnerId: a.newPartnerId, reason: a.reason.trim() });
    if (!reassigned) return NextResponse.json({ error: "not found" }, { status: 404 });
    const { contactRef, ...safe } = reassigned;
    return NextResponse.json({ request: { ...safe, hasContact: Boolean(contactRef) } });
  }

  // Nudge: enforce the 30 minute cooldown on the server (not just a disabled button).
  if (a.action === "nudge") {
    const n = await nudgeOwner(id, a.actor);
    if (!n) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (!n.ok) {
      if (n.code === "no_owner") return NextResponse.json({ error: "There is no owner to nudge yet.", code: n.code }, { status: 409 });
      const mins = Math.ceil(n.retryAfterSec / 60);
      return NextResponse.json({ error: `This request was nudged recently. Try again in ${mins} min.`, code: n.code, retryAfterSec: n.retryAfterSec }, { status: 429 });
    }
    const { contactRef, ...safe } = n.request;
    return NextResponse.json({ request: { ...safe, hasContact: Boolean(contactRef) } });
  }

  const result =
    a.action === "claim" ? await claim(id, a.ownerName, a.ownerOrg, a.partnerId)
    : a.action === "note" ? await addNote(id, a.actor, a.text)
    : a.action === "delivered" ? await markDelivered(id, a.actor)
    : await residentReply(id, a.reply);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { contactRef, ...safe } = result;
  return NextResponse.json({ request: { ...safe, hasContact: Boolean(contactRef) } });
}
