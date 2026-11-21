// Guards the demo seed: timestamps must be relative to server start (never in the future),
// and the four guaranteed demo cases (req-021..024) must flag the same way whenever the app
// loads. buildSeed and evaluateAttention are both pure, so this runs under node --test.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSeed } from "./db/seed.ts";
import { evaluateAttention } from "./attention.ts";
import type { AttentionLevel } from "./attention.ts";
import type { ActivityEvent } from "./types";

function levels(anchor: Date) {
  const nowMs = anchor.getTime();
  const { requests, activity } = buildSeed(anchor);

  // Nothing may be stamped in the future relative to when the app loaded.
  for (const e of activity) assert.ok(new Date(e.at).getTime() <= nowMs, `event ${e.id} (${e.type}) is in the future`);
  for (const r of requests) assert.ok(new Date(r.updatedAt).getTime() <= nowMs, `${r.id} updatedAt is in the future`);

  const byReq = new Map<string, ActivityEvent[]>();
  for (const e of activity) {
    const list = byReq.get(e.requestId) ?? [];
    list.push(e);
    byReq.set(e.requestId, list);
  }
  return (id: string): AttentionLevel => {
    const r = requests.find((x) => x.id === id);
    assert.ok(r, `missing ${id}`);
    return evaluateAttention(r, byReq.get(id) ?? [], nowMs).level;
  };
}

// Two very different load times prove the cases depend on elapsed time, not fixed dates.
for (const anchor of [new Date("2026-11-22T09:00:00Z"), new Date("2026-11-24T20:30:00Z")]) {
  test(`demo cases flag correctly when loaded at ${anchor.toISOString()}`, () => {
    const level = levels(anchor);
    assert.equal(level("req-021"), "needs_attention", "D1: critical claimed ~3h, untouched");
    assert.equal(level("req-022"), "follow_up", "D2: resident said only partly arrived");
    assert.equal(level("req-023"), "needs_attention", "D3: high urgency, unclaimed ~14h");
    assert.equal(level("req-024"), "none", "D4: critical but actively worked minutes ago");
  });
}
