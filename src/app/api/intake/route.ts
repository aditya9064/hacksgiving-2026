import { NextResponse } from "next/server";
import { z } from "zod";
import { intake } from "@/lib/actions";

const Body = z.object({
  text: z.string().min(3).max(2000),
  channel: z.enum(["sms", "web", "voice", "partner"]).default("web"),
  consentToShare: z.boolean().optional(),
  contactRef: z.string().max(60).optional(),
  neighborhoodHint: z.string().max(60).optional(),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { request, structured } = await intake(parsed.data);
  const { contactRef: _omit, ...safe } = request;
  void _omit;
  return NextResponse.json({ request: safe, structured });
}
