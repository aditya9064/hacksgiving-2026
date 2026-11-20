import { NextResponse } from "next/server";
import { db, storeKind } from "@/lib/db";


export async function GET() {
  const snap = await db.snapshot();
  // Strip the ComForce-only tier before anything leaves the server.
  const requests = snap.requests.map(({ contactRef, ...r }) => ({ ...r, hasContact: Boolean(contactRef) }));
  return NextResponse.json({ ...snap, requests, storeKind });
}
