import { db } from "./db";
import { sendEmail } from "./email";
import { redactPII } from "./ai/redact";
import { summarizeCall } from "./ai";
import { NEED_LABEL, type CallTurn, type Dispatch, type HelpRequest, type Partner } from "./types";
import type { PostCallPayload } from "./voice";

/** Everything the dispatch agent needs to brief the partner. Name-free by construction. */
export function dispatchVariables(req: HelpRequest, partner: Partner) {
  return {
    request_id: req.id,
    request_code: req.shortCode,
    partner_name: partner.name,
    contact_name: partner.contactName ?? "the front desk",
    need_summary: req.summary,
    needs: req.needs.map((n) => NEED_LABEL[n]).join(", "),
    household: req.householdSize ? `${req.householdSize} people` : "not stated",
    neighborhood: req.neighborhood,
    urgency: req.urgency,
    details: redactPII(req.redactedText).redactedText.slice(0, 400),
    volunteer: req.ownerName ?? "a ComForce volunteer",
  };
}

export function partnerEmail(req: HelpRequest, partner: Partner, base: string) {
  const v = dispatchVariables(req, partner);
  const subject = `Relay MKE · ${req.shortCode} · ${v.needs} for a household in ${req.neighborhood}`;
  const text = `Hi ${v.contact_name},

ComForce MKE has a resident who needs help and we'd like to route it to ${partner.name}.

  What they need: ${req.summary}
  Needs: ${v.needs}
  Household: ${v.household}
  Area: ${req.neighborhood}
  Urgency: ${req.urgency}
  Tracking code: ${req.shortCode}

In their words (identifiers removed):
  "${v.details}"

Jordan, our assistant, is calling your line right now to confirm you can take this. If you can, ${v.volunteer} will pick up from you and deliver to the resident today.

Reply to this email or tell Jordan on the call. Full record: ${base}/board?open=${req.id}

— Relay MKE · ComForce Milwaukee
(Resident names, phone numbers and addresses are never included in these messages.)`;
  return { subject, text };
}

function publicBase() {
  return (process.env.PUBLIC_BASE_URL ?? process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3077").replace(/\/$/, "");
}

/** Start a handoff: claim if needed, email the partner, and have Jordan call them. */
export async function startDispatch(requestId: string, partnerId: string, actor: { name: string; org: string }) {
  const req = await db.getRequest(requestId);
  const partner = (await db.listPartners()).find((p) => p.id === partnerId);
  if (!req || !partner) return undefined;

  const now = new Date().toISOString();
  const claimPatch: Partial<HelpRequest> = req.status === "new" ? { status: "claimed", ownerName: actor.name, ownerOrg: actor.org } : {};
  const dispatch: Dispatch = { partnerId, status: "calling", startedAt: now, mode: "simulated" };

  let cur = (await db.updateRequest(requestId, { ...claimPatch, partnerId, dispatch }, { actor: actor.name, type: "dispatch", text: `${actor.name} connected this request to ${partner.name}` })) ?? req;

  if (partner.email) {
    const mail = partnerEmail(cur, partner, publicBase());
    const r = await sendEmail({ to: partner.email, requestId, ...mail });
    dispatch.emailSentAt = new Date().toISOString();
    dispatch.emailMocked = r.mocked;
    cur = (await db.updateRequest(requestId, { dispatch: { ...dispatch } }, { actor: "system", type: "email_out", text: r.ok ? `Brief emailed to ${partner.name} (${partner.email})${r.mocked ? " · delivered to partner inbox view" : ""}` : `Email to ${partner.name} failed: ${r.error}` })) ?? cur;
  }

  const live = await placeOutboundCall(cur, partner);
  if (live) {
    dispatch.mode = "live";
    dispatch.conversationId = live.conversationId;
    cur = (await db.updateRequest(requestId, { dispatch: { ...dispatch } }, { actor: "ai", type: "call", text: `Jordan is calling ${partner.contactName ?? partner.name} at ${partner.phone}` })) ?? cur;
  } else {
    cur = (await db.updateRequest(requestId, { dispatch: { ...dispatch } }, { actor: "ai", type: "call", text: `Jordan is ringing ${partner.name}'s line (partner answers on /partner-line)` })) ?? cur;
  }
  return cur;
}

/** Real phone call via ElevenLabs + an imported Twilio number. Returns null when not configured. */
async function placeOutboundCall(req: HelpRequest, partner: Partner): Promise<{ conversationId: string } | null> {
  const key = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_DISPATCH_AGENT_ID ?? process.env.NEXT_PUBLIC_ELEVENLABS_DISPATCH_AGENT_ID;
  const phoneId = process.env.ELEVENLABS_PHONE_NUMBER_ID;
  if (!key || !agentId || !phoneId || !partner.phone) return null;
  try {
    const r = await fetch(`${process.env.ELEVENLABS_API_BASE ?? "https://api.elevenlabs.io"}/v1/convai/twilio/outbound-call`, {
      method: "POST",
      headers: { "xi-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, agent_phone_number_id: phoneId, to_number: partner.phone, conversation_initiation_client_data: { dynamic_variables: dispatchVariables(req, partner) } }),
    });
    const j = (await r.json()) as { conversation_id?: string; success?: boolean };
    if (!r.ok || !j.conversation_id) return null;
    return { conversationId: j.conversation_id };
  } catch {
    return null;
  }
}

export interface PartnerResponseInput {
  request_id?: string;
  request_code?: string;
  conversation_id?: string;
  accepted: boolean | string;
  ready_by?: string;
  notes?: string;
  contact_name?: string;
}

const yes = (v: unknown) => v === true || /^(true|yes|y|1)$/i.test(String(v ?? ""));

/** Webhook tool for the dispatch agent: records what the partner said while the call is still going. */
export async function recordPartnerResponse(input: PartnerResponseInput) {
  let req = input.request_id ? await db.getRequest(input.request_id) : undefined;
  if (!req && input.request_code) req = await db.findByShortCode(input.request_code);
  if (!req?.dispatch) return undefined;
  const partner = (await db.listPartners()).find((p) => p.id === req!.dispatch!.partnerId);
  const accepted = yes(input.accepted);
  const dispatch: Dispatch = {
    ...req.dispatch,
    status: accepted ? "accepted" : "declined",
    conversationId: req.dispatch.conversationId ?? input.conversation_id,
    outcome: { accepted, readyBy: input.ready_by?.trim() || undefined, notes: input.notes?.trim() || undefined, contactName: input.contact_name?.trim() || undefined, at: new Date().toISOString() },
  };
  const who = partner?.name ?? "Partner";
  const text = accepted
    ? `${who} accepted${dispatch.outcome?.readyBy ? ` · ready ${dispatch.outcome.readyBy}` : ""}${dispatch.outcome?.notes ? ` · "${dispatch.outcome.notes}"` : ""}`
    : `${who} can't take this right now${dispatch.outcome?.notes ? ` · "${dispatch.outcome.notes}"` : ""}`;
  return db.updateRequest(req.id, { dispatch }, { actor: "ai", type: "dispatch", text });
}

/** Post-call: attach the redacted partner-call transcript and a summary to the dispatch. */
export async function finalizeDispatchCall(p: PostCallPayload & { request_id?: string }): Promise<HelpRequest | undefined> {
  const snap = await db.snapshot();
  const req = snap.requests.find((r) => r.dispatch && (r.dispatch.conversationId === p.conversation_id || (p.request_id && r.id === p.request_id)));
  if (!req?.dispatch) return undefined;
  const transcript: CallTurn[] = p.turns.map((t) => ({ role: t.role, t: t.t, text: redactPII(t.text).redactedText }));
  const summary = await summarizeCall(transcript, p.provider_summary, "partner");
  const dispatch: Dispatch = {
    ...req.dispatch,
    conversationId: p.conversation_id,
    status: req.dispatch.status === "calling" ? "no_answer" : req.dispatch.status,
    call: { conversationId: p.conversation_id, transcript, summary, durationSec: p.duration_sec, endedAt: new Date().toISOString() },
  };
  const mins = p.duration_sec ? `${Math.floor(p.duration_sec / 60)}m ${p.duration_sec % 60}s` : undefined;
  return db.updateRequest(req.id, { dispatch }, { actor: "ai", type: "call", text: `Partner call ended${mins ? ` · ${mins}` : ""} · ${summary}` });
}

/** Volunteer is leaving to pick up: lock in the plan and move the case to in_progress. */
export async function markReady(requestId: string, actor: string) {
  const req = await db.getRequest(requestId);
  if (!req?.dispatch) return undefined;
  const partner = (await db.listPartners()).find((p) => p.id === req.dispatch!.partnerId);
  const dispatch: Dispatch = { ...req.dispatch, status: "ready", readyAt: new Date().toISOString() };
  return db.updateRequest(requestId, { dispatch, status: req.status === "claimed" || req.status === "new" ? "in_progress" : req.status }, { actor, type: "status", text: `${actor} is on the way to ${partner?.name ?? "the partner"} for pickup` });
}

export async function markPickedUp(requestId: string, actor: string) {
  const req = await db.getRequest(requestId);
  if (!req?.dispatch) return undefined;
  const partner = (await db.listPartners()).find((p) => p.id === req.dispatch!.partnerId);
  const dispatch: Dispatch = { ...req.dispatch, status: "picked_up", pickedUpAt: new Date().toISOString() };
  return db.updateRequest(requestId, { dispatch }, { actor, type: "status", text: `Picked up from ${partner?.name ?? "partner"} · heading to the resident` });
}
