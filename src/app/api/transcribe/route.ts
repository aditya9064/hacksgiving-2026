import { NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai";

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio");
  if (!(file instanceof File)) return NextResponse.json({ error: "audio file required" }, { status: 400 });
  try {
    const text = await transcribeAudio(file);
    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
