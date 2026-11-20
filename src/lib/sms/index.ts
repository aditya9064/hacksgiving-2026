export interface SmsResult { ok: boolean; sid?: string; mocked: boolean; error?: string }

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

export const smsConfigured = Boolean(sid && token && from);

/** Sends via Twilio when configured; otherwise logs and reports `mocked: true` so the UI can say so. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!smsConfigured) {
    console.log(`[sms:mock] -> ${to}: ${body}`);
    return { ok: true, mocked: true };
  }
  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(sid, token);
    const msg = await client.messages.create({ to, from, body });
    return { ok: true, sid: msg.sid, mocked: false };
  } catch (err) {
    return { ok: false, mocked: false, error: (err as Error).message };
  }
}

export const VERIFY_PROMPT = (code: string) =>
  `Relay MKE: Did the help for request ${code} arrive? Reply 1 = yes, 2 = partly, 3 = no. Reply STOP to opt out.`;
