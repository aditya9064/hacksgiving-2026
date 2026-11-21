// Unit tests for the Phase 1 fix: only "1" verifies; "2" (partly) keeps the case open.
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyResidentReply } from "./replyClassifier.ts";

test('"1" is the only reply that verifies', () => {
  const o = classifyResidentReply("1");
  assert.equal(o.status, "verified");
  assert.equal(o.residentFeedback, "yes");
  assert.equal(o.setVerifiedAt, true);
  assert.equal(o.clearDeliveredAt, false);
  assert.equal(o.event.type, "verified");
});

test('"2" (partly) keeps the case open, does NOT verify, clears delivered', () => {
  const o = classifyResidentReply("2");
  assert.equal(o.status, "in_progress");
  assert.equal(o.residentFeedback, "partial");
  assert.equal(o.setVerifiedAt, false, "partial must not count as a verified success");
  assert.equal(o.clearDeliveredAt, true);
  assert.equal(o.event.type, "partial");
});

test('"3" (no) reopens and returns to the owner', () => {
  const o = classifyResidentReply("3");
  assert.equal(o.status, "claimed");
  assert.equal(o.residentFeedback, "no");
  assert.equal(o.setVerifiedAt, false);
  assert.equal(o.clearDeliveredAt, true);
  assert.equal(o.event.type, "reopened");
});
