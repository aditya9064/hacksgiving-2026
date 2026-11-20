export interface SmsResult { ok: boolean; sid?: string; mocked: boolean; error?: string }

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const from = process.env.TWILIO_FROM_NUMBER;

export const smsConfigured = Boolean(sid && token && from);

export interface SmsLogEntry { id: string; dir: "out" | "in"; number: string; body: string; at: string; mocked?: boolean }
const g = globalThis as unknown as { __relaySmsLog?: SmsLogEntry[] };
const log = (g.__relaySmsLog ??= []);

/** Every text in either direction, newest last. Powers the /phone simulator and survives dev HMR. */
export function smsLog(number?: string): SmsLogEntry[] {
  const want = number?.replace(/\D/g, "").slice(-10);
  return want ? log.filter((e) => e.number.replace(/\D/g, "").slice(-10) === want) : log;
}
export function recordSms(entry: Omit<SmsLogEntry, "id" | "at">): SmsLogEntry {
  const e = { ...entry, id: `sms-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString() };
  log.push(e);
  if (log.length > 500) log.shift();
  return e;
}
export function clearSmsLog() { log.length = 0; }

/** Sends via Twilio when configured; otherwise logs and reports `mocked: true` so the UI can say so. */
export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!smsConfigured) {
    console.log(`[sms:mock] -> ${to}: ${body}`);
    recordSms({ dir: "out", number: to, body, mocked: true });
    return { ok: true, mocked: true };
  }
  recordSms({ dir: "out", number: to, body });
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

export const CODE_TEXT = (code: string) =>
  `Relay MKE: your request is logged as ${code}. Text ${code} to this number any time for an update. We'll text you when help is on the way. Reply STOP to opt out.`;
