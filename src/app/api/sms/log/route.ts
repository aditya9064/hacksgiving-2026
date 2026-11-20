import { NextResponse } from "next/server";
import { smsLog, clearSmsLog } from "@/lib/sms";

export async function GET(req: Request) {
  const number = new URL(req.url).searchParams.get("number") ?? undefined;
  return NextResponse.json({ messages: smsLog(number) });
}
export async function DELETE() {
  clearSmsLog();
  return NextResponse.json({ ok: true });
}
