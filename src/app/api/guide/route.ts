import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { answerFromPlaybooks } from "@/lib/ai";

export async function POST(req: Request) {
  const { question } = await req.json();
  if (!question || typeof question !== "string") return NextResponse.json({ error: "question required" }, { status: 400 });
  const playbooks = await db.listPlaybooks();
  return NextResponse.json(await answerFromPlaybooks(question, playbooks));
}
