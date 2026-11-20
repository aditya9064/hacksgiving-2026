import { NextResponse } from "next/server";
import { handleInboundSms } from "@/lib/actions";
import { recordSms } from "@/lib/sms";

/** Demo-only: runs the same handler as the Twilio webhook, but speaks JSON instead of TwiML. */
export async function POST(req: Request) {
  const { from, body } = await req.json();
  const number = String(from ?? "+14145550100");
  recordSms({ dir: "in", number, body: String(body ?? "") });
  const reply = await handleInboundSms(number, String(body ?? ""));
  recordSms({ dir: "out", number, body: reply, mocked: true });
  return NextResponse.json({ reply });
}
