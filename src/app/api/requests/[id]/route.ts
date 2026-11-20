import { NextResponse } from "next/server";
import { z } from "zod";
import { addNote, claim, markDelivered, residentReply } from "@/lib/actions";
import { db } from "@/lib/db";


const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("claim"), ownerName: z.string().min(1), ownerOrg: z.string().min(1), partnerId: z.string().optional() }),
  z.object({ action: z.literal("note"), actor: z.string().min(1), text: z.string().min(1).max(1000) }),
  z.object({ action: z.literal("delivered"), actor: z.string().min(1) }),
  z.object({ action: z.literal("resident_reply"), reply: z.enum(["1", "2", "3"]) }),
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
  const result =
    a.action === "claim" ? await claim(id, a.ownerName, a.ownerOrg, a.partnerId)
    : a.action === "note" ? await addNote(id, a.actor, a.text)
    : a.action === "delivered" ? await markDelivered(id, a.actor)
    : await residentReply(id, a.reply);
  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { contactRef, ...safe } = result;
  return NextResponse.json({ request: { ...safe, hasContact: Boolean(contactRef) } });
}
