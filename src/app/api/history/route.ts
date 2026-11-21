import { NextResponse } from "next/server";
import { buildHistory } from "@/lib/db/history";

/** Synthetic archive of closed cases for past months (see lib/db/history.ts). Not part of the live board. */
export async function GET() {
  return NextResponse.json({ requests: buildHistory(), synthetic: true });
}
