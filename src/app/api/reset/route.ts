import { clearSmsLog } from "@/lib/sms";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** Resets to seed data. Used between demo runs. */
export async function POST() {
  await db.reset();
  clearSmsLog();
  return NextResponse.json({ ok: true });
}
