/**
 * Email adapter. Real delivery via Resend when RESEND_API_KEY is set; otherwise messages are logged
 * so the demo can show the partner's inbox. Either way every message is recorded for /partner-line.
 */

export interface EmailLogEntry {
  id: string;
  at: string;
  to: string;
  subject: string;
  text: string;
  mocked: boolean;
  requestId?: string;
}

const g = globalThis as unknown as { __relayEmailLog?: EmailLogEntry[] };
const log = () => (g.__relayEmailLog ??= []);

export function emailLog(to?: string): EmailLogEntry[] {
  const all = log();
  return to ? all.filter((e) => e.to.toLowerCase() === to.toLowerCase()) : all;
}
export function clearEmailLog() {
  g.__relayEmailLog = [];
}

export async function sendEmail(msg: { to: string; subject: string; text: string; requestId?: string }): Promise<{ ok: boolean; mocked: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Relay MKE <relay@comforce.example>";
  let result: { ok: boolean; mocked: boolean; error?: string } = { ok: true, mocked: true };
  if (key) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({ from, to: [msg.to], subject: msg.subject, text: msg.text }),
      });
      result = r.ok ? { ok: true, mocked: false } : { ok: false, mocked: false, error: `${r.status} ${await r.text()}` };
    } catch (e) {
      result = { ok: false, mocked: false, error: (e as Error).message };
    }
  }
  log().push({ id: `em-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), to: msg.to, subject: msg.subject, text: msg.text, mocked: result.mocked, requestId: msg.requestId });
  if (log().length > 200) log().splice(0, log().length - 200);
  return result;
}
