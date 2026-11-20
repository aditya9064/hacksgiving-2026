import { handleInboundSms } from "@/lib/actions";

/** Twilio messaging webhook. Point "A message comes in" at POST {origin}/api/sms/inbound. */
export async function POST(req: Request) {
  const form = await req.formData();
  const from = String(form.get("From") ?? "");
  const body = String(form.get("Body") ?? "");
  const reply = await handleInboundSms(from, body);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${reply.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Message></Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}
