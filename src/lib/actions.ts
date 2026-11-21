import { db } from "./db";
import { structureIntake } from "./ai";
import { makeShortCode } from "./db/seed";
import { sendSms, VERIFY_PROMPT } from "./sms";
import { classifyResidentReply } from "./replyClassifier";
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
  return { request, structured };
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
  const result = req.contactRef ? await sendSms(req.contactRef, VERIFY_PROMPT(req.shortCode)) : { ok: true, mocked: true };
  await db.updateRequest(id, {}, { actor: "system", type: "verify_sent", text: result.mocked ? `Verification prompt queued (SMS not configured): "${VERIFY_PROMPT(req.shortCode)}"` : `Sent resident: "${VERIFY_PROMPT(req.shortCode)}"` });
  return req;
}

/**
 * Resident reply: "1" yes, "2" partly, "3" no.
 * Only "1" verifies. "2" (partly) keeps the case open with the same owner; "3" reopens it.
 * The decision lives in the pure classifyResidentReply() so it is covered by tests and
 * behaves identically on the board route and the inbound-SMS path.
 */
export async function residentReply(id: string, reply: "1" | "2" | "3") {
  const now = new Date().toISOString();
  const outcome = classifyResidentReply(reply);
  const patch: Partial<HelpRequest> = { status: outcome.status, residentFeedback: outcome.residentFeedback };
  if (outcome.setVerifiedAt) patch.verifiedAt = now;
  if (outcome.clearDeliveredAt) patch.deliveredAt = undefined;
  return db.updateRequest(id, patch, { actor: "resident", type: outcome.event.type, text: outcome.event.text });
}

/**
 * Nudge the current owner to follow up. Records an auditable timeline event and uses the existing
 * SMS helper (which mocks when Twilio is not configured). NEVER sends automatically and never puts a
 * phone number in the timeline. Owners have no phone on the request, so we fall back to the partner's
 * phone if present, otherwise log a mocked nudge. A nudge is NOT a meaningful event, so it does not
 * reset the attention clock (see lib/attention.ts).
 */
export async function nudgeOwner(id: string, actor: string) {
  const req = await db.getRequest(id);
  if (!req || !req.ownerName) return undefined;
  const partner = (await db.listPartners()).find((p) => p.id === req.partnerId);
  const message = `Relay MKE: a coordinator flagged request ${req.shortCode} for follow-up. Please update the case when you can.`;
  const result = partner?.phone ? await sendSms(partner.phone, message) : { ok: true, mocked: true };
  const how = result.mocked ? " (SMS not configured, logged only)" : "";
  return db.updateRequest(id, {}, { actor, type: "nudge", text: `${actor} nudged ${req.ownerName} to follow up${how}` });
}

export interface ReassignInput {
  actorName: string;
  newOwnerName?: string;
  newOwnerOrg?: string;
  newPartnerId?: string;
  reason: string;
}

/**
 * Reassign a request to a new owner, or release it back to the unclaimed queue. Records the previous
 * owner, the new owner (if any), the reason, and who authorized it, using the dedicated "reassigned"
 * event type (not "reopened"). Authorization is enforced in the route via canReassign(); this mutator
 * assumes the caller already passed that check.
 */
export async function reassign(id: string, input: ReassignInput) {
  const req = await db.getRequest(id);
  if (!req) return undefined;
  const prevOwner = req.ownerName ? `${req.ownerName}${req.ownerOrg ? ` (${req.ownerOrg})` : ""}` : "no owner";
  const toNewOwner = Boolean(input.newOwnerName);
  const patch: Partial<HelpRequest> = toNewOwner
    ? { status: "claimed", ownerName: input.newOwnerName, ownerOrg: input.newOwnerOrg, partnerId: input.newPartnerId }
    : { status: "new", ownerName: undefined, ownerOrg: undefined, partnerId: undefined };
  const text = toNewOwner
    ? `Reassigned from ${prevOwner} to ${input.newOwnerName}${input.newOwnerOrg ? ` (${input.newOwnerOrg})` : ""} by ${input.actorName}. Reason: ${input.reason}`
    : `Released from ${prevOwner} to the unclaimed queue by ${input.actorName}. Reason: ${input.reason}`;
  return db.updateRequest(id, patch, { actor: input.actorName, type: "reassigned", text });
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
    return replyMatch[1] === "3" ? "Thank you. We've reopened your request and the team has been notified." : "Thank you for letting us know.";
  }
  if (replyMatch && !codeMatch) {
    const snap = await db.snapshot();
    const pending = snap.requests.filter((r) => r.status === "delivered" && r.contactRef && r.contactRef.replace(/\D/g, "").endsWith(fromNumber.replace(/\D/g, "").slice(-10)));
    if (pending.length === 1) {
      await residentReply(pending[0].id, replyMatch[1] as "1" | "2" | "3");
      return replyMatch[1] === "3" ? "Thank you. We've reopened your request and the team has been notified." : "Thank you for letting us know.";
    }
  }
  if (codeMatch) {
    const req = await db.findByShortCode(codeMatch[0]);
    if (!req) return `Relay MKE: we couldn't find request ${codeMatch[0]}. Double-check the code or text us what you need.`;
    return `Relay MKE ${req.shortCode}: ${STATUS_TEXT[req.status](req)}`;
  }
  // Anything else is a new request for help.
  const { request } = await intake({ text: body, channel: "sms", contactRef: fromNumber, consentToShare: true });
  return `Relay MKE: got it. Your request number is ${request.shortCode}. A community responder will reach out. Reply STOP to opt out.`;
}

const STATUS_TEXT: Record<HelpRequest["status"], (r: HelpRequest) => string> = {
  new: () => "we have it and are finding the right partner. You'll hear from someone soon.",
  claimed: (r) => `${r.ownerName ?? "a community responder"} has picked this up and will reach out.`,
  in_progress: (r) => `${r.ownerName ?? "a responder"} is working on it right now.`,
  delivered: () => "we marked this delivered. Reply 1 = yes it arrived, 2 = partly, 3 = no.",
  verified: () => "this one is closed — you told us help arrived. Text us anytime you need something.",
};
