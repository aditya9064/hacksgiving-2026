import { NextResponse } from "next/server";
import { emailLog, clearEmailLog } from "@/lib/email";

export async function GET(req: Request) {
  const to = new URL(req.url).searchParams.get("to") ?? undefined;
  return NextResponse.json({ messages: emailLog(to) });
}

export async function DELETE() {
  clearEmailLog();
  return NextResponse.json({ ok: true });
}
