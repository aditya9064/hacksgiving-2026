import { db } from "./db";
import { intake } from "./actions";
import { redactPII } from "./ai/redact";
import { summarizeCall, structureIntake } from "./ai";
import type { CallTurn, HelpRequest } from "./types";

/** Fields the voice agent collects mid-call and posts via its webhook tool. */
export interface CallToolInput {
  conversation_id?: string;
  caller_id?: string;
  what_they_need: string;
  area?: string;
  household_size?: number | string;
  urgency?: "low" | "normal" | "high" | "critical" | string;
  callback_ok?: boolean | string;
  language?: string;
}

const yes = (v: unknown) => v === true || /^(true|yes|y|1)$/i.test(String(v ?? ""));

/** Called by the ElevenLabs agent while the resident is still on the line. Returns a tracking code it can read back. */
export async function createRequestFromCall(input: CallToolInput): Promise<{ request: HelpRequest; shortCode: string }> {
  const parts = [input.what_they_need];
  if (input.area) parts.push(`We're near ${input.area}.`);
  const hh = Number(input.household_size);
  if (hh > 0) parts.push(`There are ${hh} of us in the household.`);
  const text = parts.join(" ");

  const { request } = await intake({
    text,
    channel: "voice",
    consentToShare: true,
    contactRef: yes(input.callback_ok) && input.caller_id ? input.caller_id : undefined,
    neighborhoodHint: undefined,
  });

  const urg = String(input.urgency ?? "").toLowerCase();
  const patch: Partial<HelpRequest> = {
    call: { conversationId: input.conversation_id ?? `local-${Date.now()}`, transcript: [] },
  };
  if (["low", "normal", "high", "critical"].includes(urg)) patch.urgency = urg as HelpRequest["urgency"];
  if (input.language) patch.language = input.language;
  if (hh > 0) patch.householdSize = hh;

  const updated = (await db.updateRequest(request.id, patch, { actor: "ai", type: "call", text: "Phone intake in progress — created live during the call" })) ?? request;
  return { request: updated, shortCode: updated.shortCode };
}

export interface PostCallPayload {
  conversation_id: string;
  caller_id?: string;
  duration_sec?: number;
  turns: { role: "agent" | "caller"; text: string; t: number }[];
  /** ElevenLabs' own one-paragraph summary, if provided */
  provider_summary?: string;
}

/** After the call ends: redact the transcript, run the second LLM, attach to the request (or create it if the tool never fired). */
export async function finalizeCall(p: PostCallPayload): Promise<HelpRequest | undefined> {
  const transcript: CallTurn[] = p.turns.map((t) => ({ role: t.role, t: t.t, text: redactPII(t.text).redactedText }));
  const summary = await summarizeCall(transcript);

  const snap = await db.snapshot();
  let req = snap.requests.find((r) => r.call?.conversationId === p.conversation_id);

  if (!req) {
    const callerText = p.turns.filter((t) => t.role === "caller").map((t) => t.text).join(" ");
    if (!callerText.trim()) return undefined;
    const created = await intake({ text: callerText, channel: "voice", consentToShare: true, contactRef: p.caller_id });
    req = created.request;
  }

  // Re-derive the card from everything the resident actually said, not just the mid-call tool fields.
  const callerText = p.turns.filter((t) => t.role === "caller").map((t) => t.text).join(" ");
  const patch: Partial<HelpRequest> = {};
  if (callerText.trim().length > 20) {
    const st = await structureIntake(callerText);
    patch.redactedText = st.redactedText;
    patch.summary = st.summary;
    patch.needs = Array.from(new Set([...st.needs, ...req.needs])).slice(0, 3);
    if (!req.householdSize && st.householdSize) patch.householdSize = st.householdSize;
    if (st.language && st.language !== "en") patch.language = st.language;
  }

  const mins = p.duration_sec ? `${Math.floor(p.duration_sec / 60)}m ${p.duration_sec % 60}s` : undefined;
  const call = { ...(req.call ?? { conversationId: p.conversation_id, transcript: [] }), transcript, summary, durationSec: p.duration_sec, endedAt: new Date().toISOString() };
  return db.updateRequest(req.id, { ...patch, call }, {
    actor: "ai",
    type: "call",
    text: `Call ended${mins ? ` · ${mins}` : ""} · transcript redacted and summarized: ${summary}`,
  });
}

/** Map an ElevenLabs post_call_transcription payload to our shape. Tolerant of missing fields. */
export function fromElevenLabs(data: Record<string, unknown>): PostCallPayload {
  const transcript = (Array.isArray(data.transcript) ? data.transcript : []) as Record<string, unknown>[];
  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const phone = (meta.phone_call ?? {}) as Record<string, unknown>;
  const analysis = (data.analysis ?? {}) as Record<string, unknown>;
  return {
    conversation_id: String(data.conversation_id ?? ""),
    caller_id: typeof phone.external_number === "string" ? phone.external_number : undefined,
    duration_sec: typeof meta.call_duration_secs === "number" ? meta.call_duration_secs : undefined,
    turns: transcript
      .filter((t) => typeof t.message === "string" && (t.message as string).trim())
      .map((t) => ({ role: t.role === "agent" ? "agent" : "caller", text: String(t.message), t: Number(t.time_in_call_secs ?? 0) })),
    provider_summary: typeof analysis.transcript_summary === "string" ? analysis.transcript_summary : undefined,
  };
}
