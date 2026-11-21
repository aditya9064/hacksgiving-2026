import { db } from "./db";
import { structureIntake } from "./ai";
import { makeShortCode } from "./db/seed";
import { sendSms, VERIFY_PROMPT, THANKS_TEXT } from "./sms";
import { detectSafety, resourcesFor, resourcesSms, SAFETY_RESOURCES } from "./safety";
import { scheduleFollowUpCall, cancelFollowUp } from "./followup";
import type { Channel, HelpRequest, StructuredIntake } from "./types";

export interface IntakeInput {
  text: string;
  channel: Channel;
  consentToShare?: boolean;
  /** Phone or other contact handle. Stored in the ComForce-only tier, never shown on the board. */
  contactRef?: string;
  neighborhoodHint?: string;
}

export async function intake(input: IntakeInput): Promise<{ request: HelpRequest; structured: StructuredIntake }> {
  const structured = await structureIntake(input.text);
  const now = new Date().toISOString();
  const request: HelpRequest = {
    id: `req-${Date.now().toString(36)}`,
    shortCode: makeShortCode(),
    createdAt: now,
    updatedAt: now,
    status: "new",
    channel: input.channel,
    redactedText: structured.redactedText,
    summary: structured.summary,
    needs: structured.needs,
    urgency: structured.urgency,
    neighborhood: input.neighborhoodHint || structured.neighborhood,
    householdSize: structured.householdSize,
    language: structured.language,
    consentToShare: input.consentToShare ?? true,
    contactRef: input.contactRef,
  };
  const redactedNote = structured.redactions.length
    ? `Redacted ${structured.redactions.length} identifier(s): ${[...new Set(structured.redactions.map((r) => r.placeholder))].join(", ")}`
    : "No personal identifiers found";
  await db.createRequest(request, [
    { at: now, actor: "resident", type: "created", text: `Request received via ${input.channel}` },
    { at: now, actor: "ai", type: "structured", text: `${redactedNote}. Needs: ${structured.needs.join(", ")} · ${structured.urgency} · ${request.neighborhood}` },
  ]);
  const level = structured.safety ?? detectSafety(structured.redactedText);
  if (level) {
    const flagged = await flagSafety(request.id, level, structured.redactedText);
    if (flagged) return { request: flagged, structured };
  }
  return { request, structured };
}

/**
 * Mark a request as a safety situation: bumps urgency, records which crisis lines were shared,
 * and pages the ComForce on-call lead (mock page in the demo; a real pager/SMS hook goes here).
 */
export async function flagSafety(id: string, level: "concern" | "crisis", text: string, note?: string, shared?: string[]) {
  const cur = await db.getRequest(id);
  if (!cur || cur.safety) return cur;
  const now = new Date().toISOString();
  const keys = shared?.length ? shared : resourcesFor(level, text);
  const names = keys.map((k) => SAFETY_RESOURCES.find((r) => r.key === k)?.name ?? k);
  const needs = cur.needs.includes("safety") ? cur.needs : (["safety", ...cur.needs].slice(0, 3) as HelpRequest["needs"]);
  const first = await db.updateRequest(id, {
    urgency: "critical",
    needs,
    safety: { level, note, resourcesShared: names, at: now, leadPagedAt: now },
  }, { actor: "ai", type: "safety", text: `${level === "crisis" ? "Crisis" : "Safety concern"} flagged · Jordan shared ${names.join(", ")}` });
  await db.updateRequest(id, {}, { actor: "system", type: "safety", text: "ComForce on-call lead paged (mock) · partner tier sees the need, not the details" });
  return first;
}

export async function claim(id: string, ownerName: string, ownerOrg: string, partnerId?: string) {
  return db.updateRequest(id, { status: "claimed", ownerName, ownerOrg, partnerId }, { actor: ownerName, type: "claimed", text: `${ownerName} (${ownerOrg}) claimed this request` });
}

export async function addNote(id: string, actor: string, text: string) {
  const cur = await db.getRequest(id);
  const patch = cur?.status === "claimed" ? { status: "in_progress" as const } : {};
  return db.updateRequest(id, patch, { actor, type: "note", text });
}

export async function markDelivered(id: string, actor: string) {
  const now = new Date().toISOString();
  const req = await db.updateRequest(id, { status: "delivered", deliveredAt: now }, { actor, type: "delivered", text: "Marked delivered" });
  if (!req) return undefined;
  const prompt = VERIFY_PROMPT(req.shortCode, req.language);
  const result = req.contactRef ? await sendSms(req.contactRef, prompt) : { ok: true, mocked: true };
  await db.updateRequest(id, { followUp: { status: "waiting_sms", language: req.language ?? "en", startedAt: now } }, { actor: "system", type: "verify_sent", text: result.mocked ? `Verification text sent (mock SMS): "${prompt}"` : `Sent resident: "${prompt}"` });
  scheduleFollowUpCall(id);
  return req;
}

/** Resident reply: "1" yes, "2" partly, "3" no. A "no" reopens the case. */
export async function residentReply(id: string, reply: "1" | "2" | "3", via: "sms" | "call" = "sms") {
  const now = new Date().toISOString();
  cancelFollowUp(id);
  const cur = await db.getRequest(id);
  const how = via === "call" ? " on Jordan's call-back" : " by text";
  const fu = (status: "confirmed" | "partial" | "reopened") => (cur?.followUp ? { followUp: { ...cur.followUp, status } } : {});
  if (reply === "3") {
    return db.updateRequest(id, { status: "claimed", residentFeedback: "no", deliveredAt: undefined, ...fu("reopened") }, { actor: "resident", type: "reopened", text: `Resident said${how} that help did NOT arrive. Case reopened and returned to owner.` });
  }
  const fb = reply === "1" ? "yes" : "partial";
  return db.updateRequest(id, { status: "verified", verifiedAt: now, residentFeedback: fb, ...fu(fb === "yes" ? "confirmed" : "partial") }, { actor: "resident", type: "verified", text: fb === "yes" ? `Resident confirmed${how} that the help arrived.` : `Resident says${how} the help partly arrived.` });
}

/** Parses an inbound SMS body such as "R-4F2K 1" or just "1" (when only one open verification exists for that number). */
export async function handleInboundSms(fromNumber: string, body: string): Promise<string> {
  const text = body.trim().toUpperCase();
  const codeMatch = text.match(/R-[A-Z0-9]{4}/);
  const replyMatch = text.match(/\b([123])\b/);
  if (codeMatch && replyMatch) {
    const req = await db.findByShortCode(codeMatch[0]);
    if (!req) return `Relay MKE: we couldn't find request ${codeMatch[0]}.`;
    await residentReply(req.id, replyMatch[1] as "1" | "2" | "3");
    return THANKS_TEXT(req.language, replyMatch[1] === "3");
  }
  if (replyMatch && !codeMatch) {
    const snap = await db.snapshot();
    const pending = snap.requests.filter((r) => r.status === "delivered" && r.contactRef && r.contactRef.replace(/\D/g, "").endsWith(fromNumber.replace(/\D/g, "").slice(-10)));
    if (pending.length === 1) {
      await residentReply(pending[0].id, replyMatch[1] as "1" | "2" | "3");
      return THANKS_TEXT(pending[0].language, replyMatch[1] === "3");
    }
  }
  if (codeMatch) {
    const req = await db.findByShortCode(codeMatch[0]);
    if (!req) return `Relay MKE: we couldn't find request ${codeMatch[0]}. Double-check the code or text us what you need.`;
    return `Relay MKE ${req.shortCode}: ${STATUS_TEXT[req.status](req)}`;
  }
  // Anything else is a new request for help.
  const { request } = await intake({ text: body, channel: "sms", contactRef: fromNumber, consentToShare: true });
  const base = `Relay MKE: got it. Your request number is ${request.shortCode}. A community responder will reach out${request.safety ? " right away" : ""}.`;
  return request.safety ? `${base} ${resourcesSms(request.safety.resourcesShared)}` : `${base} Reply STOP to opt out.`;
}

const STATUS_TEXT: Record<HelpRequest["status"], (r: HelpRequest) => string> = {
  new: () => "we have it and are finding the right partner. You'll hear from someone soon.",
  claimed: (r) => `${r.ownerName ?? "a community responder"} has picked this up and will reach out.`,
  in_progress: (r) => `${r.ownerName ?? "a responder"} is working on it right now.`,
  delivered: () => "we marked this delivered. Reply 1 = yes it arrived, 2 = partly, 3 = no.",
  verified: () => "this one is closed — you told us help arrived. Text us anytime you need something.",
};
