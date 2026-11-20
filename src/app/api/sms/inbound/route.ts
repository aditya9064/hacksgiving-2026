import { handleInboundSms } from "@/lib/actions";
import { recordSms } from "@/lib/sms";

/** Twilio messaging webhook. Point "A message comes in" at POST {origin}/api/sms/inbound. */
export async function POST(req: Request) {
  const form = await req.formData();
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "");
  recordSms({ dir: "in", number: from, body });
  const reply = await handleInboundSms(from, body);
  recordSms({ dir: "out", number: from, body: reply });
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}
