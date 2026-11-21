// Phase 1 reporting fix: a partial delivery must never be counted as a verified success,
// and it must surface under partlyHelped. computeStats is pure (type-only imports).
import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats } from "./stats.ts";
import type { HelpRequest } from "./types";

function r(over: Partial<HelpRequest>): HelpRequest {
  return {
    id: "x",
    shortCode: "R-TEST",
    createdAt: "2026-11-20T00:00:00Z",
    updatedAt: "2026-11-20T00:00:00Z",
    status: "new",
    channel: "sms",
    redactedText: "",
    summary: "",
    needs: ["food"],
    urgency: "normal",
    neighborhood: "Amani",
    consentToShare: true,
    ...over,
  };
}

test("a partial delivery is not counted as verified and is counted as partly helped", () => {
  const reqs = [
    r({ status: "verified", residentFeedback: "yes" }),
    r({ status: "verified", residentFeedback: "partial" }), // legacy-looking row: must NOT inflate verified
    r({ status: "in_progress", residentFeedback: "partial" }),
  ];
  const s = computeStats(reqs, []);
  assert.equal(s.verified, 1, "only the clean yes counts as verified");
  assert.equal(s.partlyHelped, 2, "both partial-feedback rows count as partly helped");
});
