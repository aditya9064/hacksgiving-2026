// Unit tests for the nudge cooldown (within 30 min rejected, after 30 min allowed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { lastNudge, nudgeCooldownRemainingMs, NUDGE_COOLDOWN_MS } from "./nudge.ts";
import type { ActivityEvent, ActivityType } from "./types";

const MIN = 60_000;
const NOW = Date.UTC(2026, 10, 22, 12, 0, 0);
const agoMin = (m: number) => new Date(NOW - m * MIN).toISOString();

let seq = 0;
function ev(type: ActivityType, at: string): ActivityEvent {
  return { id: `e${seq++}`, requestId: "r", at, actor: "coordinator", type, text: "" };
}

test("no prior nudge means it may be nudged now", () => {
  assert.equal(nudgeCooldownRemainingMs([], NOW), 0);
  assert.equal(nudgeCooldownRemainingMs([ev("note", agoMin(1)), ev("claimed", agoMin(90))], NOW), 0);
});

test("a nudge within the 30 min cooldown leaves time remaining", () => {
  const remaining = nudgeCooldownRemainingMs([ev("nudge", agoMin(10))], NOW);
  assert.ok(remaining > 0, "should still be on cooldown 10 min after a nudge");
  assert.ok(remaining <= NUDGE_COOLDOWN_MS, "remaining never exceeds the full window");
  assert.equal(Math.round(remaining / MIN), 20); // ~20 min left of a 30 min window
});

test("after 30 min the cooldown has fully elapsed", () => {
  assert.equal(nudgeCooldownRemainingMs([ev("nudge", agoMin(30))], NOW), 0);
  assert.equal(nudgeCooldownRemainingMs([ev("nudge", agoMin(31))], NOW), 0);
});

test("the MOST RECENT nudge governs the cooldown", () => {
  const events = [ev("nudge", agoMin(120)), ev("nudge", agoMin(5))];
  assert.equal(lastNudge(events)?.at, agoMin(5));
  assert.ok(nudgeCooldownRemainingMs(events, NOW) > 0);
});
