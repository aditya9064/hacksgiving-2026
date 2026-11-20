// Pure "does this request need attention, and why" logic.
//
// No runtime imports (type-only, relative paths) so it can be unit tested directly with
// `node --test` type stripping, and so it stays a pure function of its inputs: given a
// request, its activity events, and the current time, it returns a verdict. It is computed
// on the server inside the snapshot so every screen agrees.
import type { ActivityEvent, ActivityType, HelpRequest, Urgency } from "./types";

// -----------------------------------------------------------------------------
// SETTINGS - ComForce MKE must set the real escalation windows here.
// These are DEMO VALUES ONLY, chosen so the hackathon seed data shows the feature.
// They are the only place the time limits live; everything else reads from here.
// -----------------------------------------------------------------------------
export interface AttentionLimits {
  critical: number;
  high: number;
  normal: number;
  low: number;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const ATTENTION_LIMITS: AttentionLimits = {
  critical: 2 * HOUR, // demo: real value likely minutes
  high: 12 * HOUR,
  normal: 2 * DAY,
  low: 3 * DAY,
};

// Event types that count as real forward progress and therefore reset the "stalled" clock.
// Deliberately EXCLUDES note, structured, verify_sent, sms_out, nudge, sms_in and call:
// a plain note must not let someone hide a stall by typing "checking", and a resident
// texting or calling to chase an update is a sign of a stall, not progress.
export const MEANINGFUL_EVENT_TYPES: ReadonlySet<ActivityType> = new Set<ActivityType>([
  "created",
  "claimed",
  "status",
  "delivered",
  "verified",
  "reopened",
  "partial",
  "reassigned",
]);

export type AttentionLevel = "none" | "needs_attention" | "follow_up";

export interface Attention {
  /** none = fine, needs_attention = overdue (red), follow_up = resident flagged it (amber). */
  level: AttentionLevel;
  /** Plain-English explanation. No em dashes. Empty when level is "none". */
  reason: string;
  /** Current owner's display name, or null when unclaimed. */
  owner: string | null;
  /** ISO time of the last MEANINGFUL update, used for display and sorting. */
  lastMeaningfulAt: string;
}

/** Minimal shape evaluateAttention needs. HelpRequest satisfies it (contactRef is optional). */
export type AttentionRequest = Pick<
  HelpRequest,
  "status" | "urgency" | "ownerName" | "deliveredAt" | "residentFeedback" | "createdAt" | "updatedAt"
>;

/**
 * True once the owner has delivered AGAIN after the resident's partial/no feedback. At that point
 * the follow-up is resolved and the delivered-waiting / overdue rules take over, so the amber badge
 * does not get stuck on a case the owner has already re-actioned.
 */
function reDeliveredAfterFeedback(events: ActivityEvent[], feedback: "no" | "partial"): boolean {
  const feedbackType: ActivityType = feedback === "no" ? "reopened" : "partial";
  let lastFeedback: string | null = null;
  let lastDelivered: string | null = null;
  for (const e of events) {
    if (e.type === feedbackType && (lastFeedback === null || e.at > lastFeedback)) lastFeedback = e.at;
    if (e.type === "delivered" && (lastDelivered === null || e.at > lastDelivered)) lastDelivered = e.at;
  }
  return lastFeedback !== null && lastDelivered !== null && lastDelivered > lastFeedback;
}

/** ISO-8601 UTC strings (what the app stores) compare correctly as plain strings. */
function lastMeaningfulAt(events: ActivityEvent[], req: AttentionRequest): string {
  let latest: string | null = null;
  for (const e of events) {
    if (MEANINGFUL_EVENT_TYPES.has(e.type) && (latest === null || e.at > latest)) latest = e.at;
  }
  // Fall back to last-updated, then created, when there are no meaningful events at all.
  return latest ?? req.updatedAt ?? req.createdAt;
}

/** Short, human durations: "43 min", "4 h", "2 d". Never raw minutes past an hour. */
function dur(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

/**
 * Decide whether a request needs attention and why.
 * @param req     the request (full HelpRequest or the contact-stripped snapshot shape)
 * @param events  that request's activity events (any order)
 * @param now     current time in epoch ms
 * @param limits  escalation windows; defaults to ATTENTION_LIMITS
 */
export function evaluateAttention(
  req: AttentionRequest,
  events: ActivityEvent[],
  now: number,
  limits: AttentionLimits = ATTENTION_LIMITS,
): Attention {
  const owner = req.ownerName ?? null;
  const lastAt = lastMeaningfulAt(events, req);

  // Verified requests are closed; they never need attention.
  if (req.status === "verified") return { level: "none", reason: "", owner, lastMeaningfulAt: lastAt };

  // Resident explicitly said it did not fully work. Flag follow-up immediately, no matter how
  // recent the activity is. ("partial" resets the clock as a meaningful event, but the resident's
  // signal still takes priority over any overdue check.)
  // A "partial" or "no" reply flags follow-up immediately, no matter how recent the activity is,
  // UNLESS the owner has since delivered again (reDeliveredAfterFeedback) - then it is resolved and
  // the delivered-waiting / overdue rules below take over, so the flag does not get stuck amber.
  const feedback = req.residentFeedback;
  if ((feedback === "no" || feedback === "partial") && !reDeliveredAfterFeedback(events, feedback)) {
    const nextStep = owner ? `${owner} owns the next step.` : "No owner assigned.";
    const said = feedback === "no" ? "Resident said help did not arrive." : "Resident said help only partly arrived.";
    return { level: "follow_up", reason: `${said} ${nextStep}`, owner, lastMeaningfulAt: lastAt };
  }

  // Delivered and waiting on the resident: only overdue if no reply within the NORMAL window,
  // regardless of the request's own urgency, so we do not nag residents too quickly.
  if (req.status === "delivered") {
    const since = req.deliveredAt ?? lastAt;
    const elapsed = now - new Date(since).getTime();
    if (elapsed > limits.normal)
      return {
        level: "needs_attention",
        reason: `Delivered ${dur(elapsed)} ago, no resident confirmation yet (limit ${dur(limits.normal)})`,
        owner,
        lastMeaningfulAt: lastAt,
      };
    return { level: "none", reason: "", owner, lastMeaningfulAt: lastAt };
  }

  // Everything else (new, claimed, in_progress): overdue when too long since meaningful activity.
  // Say "progress", not "updated": plain notes may sit in the timeline and must not read as a
  // contradiction with "hasn't updated".
  const limit = limits[req.urgency as Urgency];
  const elapsed = now - new Date(lastAt).getTime();
  if (elapsed > limit) {
    const reason = owner
      ? `No progress from ${owner} in ${dur(elapsed)} (limit ${dur(limit)})`
      : `Unclaimed for ${dur(elapsed)} (limit ${dur(limit)})`;
    return { level: "needs_attention", reason, owner, lastMeaningfulAt: lastAt };
  }

  return { level: "none", reason: "", owner, lastMeaningfulAt: lastAt };
}

const LEVEL_RANK: Record<AttentionLevel, number> = { needs_attention: 0, follow_up: 1, none: 2 };
const URGENCY_RANK: Record<Urgency, number> = { critical: 0, high: 1, normal: 2, low: 3 };

export interface AttentionSortable {
  urgency: Urgency;
  attention: Attention;
}

/**
 * Board sort order: needs_attention before follow_up; within each, by urgency
 * (critical > high > normal > low); then longest idle first. Returns 0 for two
 * non-flagged requests so a secondary comparator (the table's column sort) can decide.
 */
export function compareAttention(a: AttentionSortable, b: AttentionSortable, now: number): number {
  const la = LEVEL_RANK[a.attention.level];
  const lb = LEVEL_RANK[b.attention.level];
  if (la !== lb) return la - lb;
  if (a.attention.level === "none") return 0;
  const ua = URGENCY_RANK[a.urgency];
  const ub = URGENCY_RANK[b.urgency];
  if (ua !== ub) return ua - ub;
  const idleA = now - new Date(a.attention.lastMeaningfulAt).getTime();
  const idleB = now - new Date(b.attention.lastMeaningfulAt).getTime();
  return idleB - idleA; // longest idle first
}
