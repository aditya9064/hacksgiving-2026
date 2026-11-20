import { NextResponse } from "next/server";
import { createRequestFromCall, type CallToolInput } from "@/lib/voice";

/** Webhook tool for the ElevenLabs agent: creates the request mid-call and returns a code to read back. */
export async function POST(req: Request) {
  const secret = process.env.VOICE_TOOL_SECRET;
  if (secret && req.headers.get("x-relay-secret") !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as CallToolInput;
  if (!body.what_they_need) return NextResponse.json({ error: "what_they_need is required" }, { status: 400 });
  const { shortCode, request } = await createRequestFromCall(body);
  const spoken = shortCode.replace("R-", "").split("").join(" ");
  return NextResponse.json({
    ok: true,
    short_code: shortCode,
    spoken_code: spoken,
    neighborhood: request.neighborhood,
    message: `Logged. Tracking code ${shortCode}. Read it as: R, ${spoken}.`,
  });
}
