// Unit tests for the pure attention logic. Run with `npm test` (node --test, type stripping).
// Everything imported here is pure (type-only imports of ./types), so no app runtime loads.
import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateAttention, compareAttention, ATTENTION_LIMITS } from "./attention.ts";
import type { AttentionRequest } from "./attention.ts";
import type { ActivityEvent, ActivityType } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const NOW = Date.UTC(2026, 10, 22, 12, 0, 0); // fixed "now" so tests are deterministic
const agoMin = (m: number) => new Date(NOW - m * MIN).toISOString();

let seq = 0;
function ev(type: ActivityType, at: string): ActivityEvent {
  return { id: `e${seq++}`, requestId: "r", at, actor: "x", type, text: "" };
}
function req(over: Partial<AttentionRequest> = {}): AttentionRequest {
  return { status: "claimed", urgency: "high", ownerName: "Owner", createdAt: agoMin(600), updatedAt: agoMin(600), ...over };
}

test("just UNDER the limit is not flagged", () => {
  const r = req({ urgency: "critical", status: "claimed" });
  const events = [ev("created", agoMin(130)), ev("claimed", agoMin(119))]; // 119 min < 2 h
  assert.equal(evaluateAttention(r, events, NOW).level, "none");
});

test("just OVER the limit needs attention", () => {
  const r = req({ urgency: "critical", status: "claimed" });
  const events = [ev("created", agoMin(130)), ev("claimed", agoMin(121))]; // 121 min > 2 h
  const a = evaluateAttention(r, events, NOW);
  assert.equal(a.level, "needs_attention");
  assert.match(a.reason, /No progress from Owner/);
});

test("unclaimed over the limit reads as Unclaimed, not owner progress", () => {
  const r = req({ urgency: "high", status: "new", ownerName: undefined });
  const events = [ev("created", agoMin(13 * 60))]; // 13 h > 12 h
  const a = evaluateAttention(r, events, NOW);
  assert.equal(a.level, "needs_attention");
  assert.match(a.reason, /^Unclaimed for/);
});

test("resident said PARTLY arrived -> follow_up immediately", () => {
  const r = req({ status: "in_progress", residentFeedback: "partial" });
  const events = [ev("delivered", agoMin(60)), ev("partial", agoMin(30))];
  const a = evaluateAttention(r, events, NOW);
  assert.equal(a.level, "follow_up");
  assert.match(a.reason, /only partly arrived/);
  assert.match(a.reason, /Owner owns the next step/);
});

test("resident said it did NOT arrive -> follow_up", () => {
  const r = req({ status: "claimed", residentFeedback: "no" });
  const events = [ev("delivered", agoMin(60)), ev("reopened", agoMin(30))];
  const a = evaluateAttention(r, events, NOW);
  assert.equal(a.level, "follow_up");
  assert.match(a.reason, /did not arrive/);
});

test("verified requests are never flagged", () => {
  const r = req({ status: "verified", urgency: "critical", residentFeedback: "yes" });
  const events = [ev("created", agoMin(9999)), ev("verified", agoMin(9000))];
  assert.equal(evaluateAttention(r, events, NOW).level, "none");
});

test("a plain NOTE does not reset the stall clock", () => {
  const r = req({ urgency: "critical", status: "claimed" });
  const events = [ev("claimed", agoMin(200)), ev("note", agoMin(5))];
  assert.equal(evaluateAttention(r, events, NOW).level, "needs_attention");
});

test("sms_in (resident chasing an update) does not reset the clock", () => {
  const r = req({ urgency: "critical", status: "claimed" });
  const events = [ev("claimed", agoMin(200)), ev("sms_in", agoMin(5))];
  assert.equal(evaluateAttention(r, events, NOW).level, "needs_attention");
});

test("a nudge does not reset the clock", () => {
  const r = req({ urgency: "critical", status: "claimed" });
  const events = [ev("claimed", agoMin(200)), ev("nudge", agoMin(5))];
  assert.equal(evaluateAttention(r, events, NOW).level, "needs_attention");
});

test("missing event timestamps: falls back to updatedAt then createdAt, no throw", () => {
  const r = req({ urgency: "critical", status: "claimed", updatedAt: agoMin(200), createdAt: agoMin(400) });
  assert.equal(evaluateAttention(r, [], NOW).level, "needs_attention"); // uses updatedAt 200 min
  const fresh = req({ urgency: "critical", status: "claimed", updatedAt: agoMin(10), createdAt: agoMin(10) });
  assert.equal(evaluateAttention(fresh, [], NOW).level, "none");
});

test("delivered and waiting on resident: fine until the NORMAL window, then flagged", () => {
  const recent = req({ status: "delivered", urgency: "critical", deliveredAt: agoMin(30) });
  assert.equal(evaluateAttention(recent, [ev("delivered", agoMin(30))], NOW).level, "none");
  const old = req({ status: "delivered", urgency: "critical", deliveredAt: new Date(NOW - 3 * 24 * HOUR).toISOString() });
  const a = evaluateAttention(old, [ev("delivered", new Date(NOW - 3 * 24 * HOUR).toISOString())], NOW);
  assert.equal(a.level, "needs_attention");
  assert.match(a.reason, /no resident confirmation yet/);
});

// The item-2 sequence: delivered -> resident "2" (partly) -> owner delivers AGAIN -> resident "1".
// The amber follow-up must clear once the owner re-delivers, and stay gone after verify.
test("follow-up clears after re-delivery and verification (item-2 sequence)", () => {
  const base = [ev("created", agoMin(500)), ev("claimed", agoMin(480)), ev("delivered", agoMin(300))];

  // Stage 1: resident replied "2" -> partial, still in_progress.
  const afterPartial = [...base, ev("partial", agoMin(250))];
  assert.equal(
    evaluateAttention(req({ status: "in_progress", residentFeedback: "partial" }), afterPartial, NOW).level,
    "follow_up",
  );

  // Stage 2: owner marked delivered AGAIN (after the partial). Flag must no longer be amber.
  const afterRedeliver = [...afterPartial, ev("delivered", agoMin(20))];
  assert.notEqual(
    evaluateAttention(req({ status: "delivered", residentFeedback: "partial", deliveredAt: agoMin(20) }), afterRedeliver, NOW).level,
    "follow_up",
  );

  // Stage 3: resident replied "1" -> verified -> never flagged.
  const afterVerify = [...afterRedeliver, ev("verified", agoMin(5))];
  assert.equal(
    evaluateAttention(req({ status: "verified", residentFeedback: "yes" }), afterVerify, NOW).level,
    "none",
  );
});

test("compareAttention: needs_attention before follow_up, critical before high, longest idle first", () => {
  const na = (urgency: AttentionRequest["urgency"], idleMin: number) => ({
    urgency,
    attention: { level: "needs_attention" as const, reason: "", owner: null, lastMeaningfulAt: agoMin(idleMin) },
  });
  const fu = { urgency: "critical" as const, attention: { level: "follow_up" as const, reason: "", owner: null, lastMeaningfulAt: agoMin(999) } };

  assert.ok(compareAttention(na("high", 10), fu, NOW) < 0, "needs_attention sorts before follow_up");
  assert.ok(compareAttention(na("critical", 10), na("high", 999), NOW) < 0, "critical before high");
  assert.ok(compareAttention(na("high", 300), na("high", 50), NOW) < 0, "longest idle first");
});

test("ATTENTION_LIMITS keeps the documented demo windows", () => {
  assert.equal(ATTENTION_LIMITS.critical, 2 * HOUR);
  assert.equal(ATTENTION_LIMITS.high, 12 * HOUR);
});
