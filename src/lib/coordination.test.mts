// Unit tests for the coordinator reassign/release guards and the reason rule.
import { test } from "node:test";
import assert from "node:assert/strict";
import { canReassign, reassignReasonError, COORDINATOR_ORG } from "./coordination.ts";

test("non-coordinator cannot reassign or release", () => {
  const c = canReassign({ actorOrg: "Some Partner Org", urgency: "high", newOwnerName: "Sam" });
  assert.equal(c.ok, false);
  assert.equal(c.ok === false && c.code, "not_coordinator");
});

test("a coordinator may reassign to a new owner", () => {
  const c = canReassign({ actorOrg: COORDINATOR_ORG, urgency: "critical", newOwnerName: "Sam B." });
  assert.equal(c.ok, true);
});

test("releasing an URGENT request to no owner requires explicit confirmation", () => {
  const without = canReassign({ actorOrg: COORDINATOR_ORG, urgency: "critical" });
  assert.equal(without.ok, false);
  assert.equal(without.ok === false && without.code, "confirm_unowned_urgent");

  const withConfirm = canReassign({ actorOrg: COORDINATOR_ORG, urgency: "critical", confirmUnownedUrgent: true });
  assert.equal(withConfirm.ok, true);
});

test("releasing a non-urgent request to no owner needs no confirmation", () => {
  assert.equal(canReassign({ actorOrg: COORDINATOR_ORG, urgency: "normal" }).ok, true);
  assert.equal(canReassign({ actorOrg: COORDINATOR_ORG, urgency: "low" }).ok, true);
});

test("high urgency also counts as urgent for the release guard", () => {
  const c = canReassign({ actorOrg: COORDINATOR_ORG, urgency: "high" });
  assert.equal(c.ok === false && c.code, "confirm_unowned_urgent");
});

test("an empty or whitespace-only reason is rejected", () => {
  assert.ok(reassignReasonError("") !== null);
  assert.ok(reassignReasonError("   ") !== null, "whitespace-only must be rejected");
  assert.ok(reassignReasonError("\t\n ") !== null);
});

test("a real reason is accepted; an over-long one is rejected", () => {
  assert.equal(reassignReasonError("Owner is out sick this week"), null);
  assert.ok(reassignReasonError("x".repeat(501)) !== null);
});
