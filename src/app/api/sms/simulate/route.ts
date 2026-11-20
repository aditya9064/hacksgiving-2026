import { NextResponse } from "next/server";
import { handleInboundSms } from "@/lib/actions";

/** Demo-only: runs the same handler as the Twilio webhook, but speaks JSON instead of TwiML. */
export async function POST(req: Request) {
  const { from, body } = await req.json();
  const reply = await handleInboundSms(String(from ?? "+14145550100"), String(body ?? ""));
  return NextResponse.json({ reply });
}
