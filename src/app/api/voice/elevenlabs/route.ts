import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { finalizeCall, fromElevenLabs } from "@/lib/voice";
import { finalizeDispatchCall } from "@/lib/dispatch";

/** HMAC check per ElevenLabs docs: header "ElevenLabs-Signature: t=<ts>,v0=<hex>" over `${t}.${rawBody}`. */
function verify(raw: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts.t, v0 = parts.v0;
  if (!t || !v0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 30 * 60) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${raw}`).digest("hex");
  return expected.length === v0.length && timingSafeEqual(Buffer.from(expected), Buffer.from(v0));
}

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;
  if (secret && !verify(raw, req.headers.get("elevenlabs-signature"), secret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { type: string; data: Record<string, unknown> };
  if (event.type !== "post_call_transcription") return NextResponse.json({ ignored: event.type });
  const payload = fromElevenLabs(event.data);
  const dyn = ((event.data.conversation_initiation_client_data as Record<string, unknown> | undefined)?.dynamic_variables ?? {}) as Record<string, unknown>;
  const dispatchAgent = process.env.ELEVENLABS_DISPATCH_AGENT_ID ?? process.env.NEXT_PUBLIC_ELEVENLABS_DISPATCH_AGENT_ID;
  const isDispatch = (dispatchAgent && event.data.agent_id === dispatchAgent) || typeof dyn.request_id === "string";
  const request = isDispatch
    ? await finalizeDispatchCall({ ...payload, request_id: typeof dyn.request_id === "string" ? dyn.request_id : undefined })
    : await finalizeCall(payload);
  return NextResponse.json({ received: true, requestId: request?.id ?? null, shortCode: request?.shortCode ?? null });
}
