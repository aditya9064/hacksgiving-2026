// Pure authorization + guard logic for reassign/release. No runtime imports (type-only,
// relative paths) so it is unit-testable directly with `node --test` type stripping.
import type { Urgency } from "./types";

// -----------------------------------------------------------------------------
// DEMO-LEVEL AUTHORIZATION ONLY - NOT REAL SECURITY.
// "Coordinator" here means the current identity's org is ComForce MKE. That identity
// comes from the browser (see lib/client/me.ts) and is trivially spoofable, so this check
// is a demo stand-in. Real deployments replace it with server-side auth (Supabase Auth /
// real roles). It is enforced on the server anyway (not just hidden in the UI) so the shape
// of the real check is already in place.
// -----------------------------------------------------------------------------
export const COORDINATOR_ORG = "ComForce MKE";

/** A reassign/release must carry a real reason for the audit trail. 1-500 chars after trimming. */
export const REASSIGN_REASON_MAX = 500;

/**
 * Validate the free-text reason for a reassign/release. Returns an error message to show the
 * user, or null when the reason is acceptable. Trimmed so a whitespace-only reason is rejected.
 * Single source of truth: the API route calls this, so the test and the server agree.
 */
export function reassignReasonError(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 1) return "A reason is required to reassign or release a request.";
  if (trimmed.length > REASSIGN_REASON_MAX) return `Reason is too long (${REASSIGN_REASON_MAX} characters max).`;
  return null;
}

export interface ReassignIntent {
  /** Org of the acting user, as sent from the browser. Demo-only trust. */
  actorOrg: string;
  urgency: Urgency;
  /** The new owner's name, or undefined/empty when releasing back to the unclaimed queue. */
  newOwnerName?: string;
  /** Must be true to release an urgent request to no owner. */
  confirmUnownedUrgent?: boolean;
}

export type ReassignCheck =
  | { ok: true }
  | { ok: false; code: "not_coordinator" | "confirm_unowned_urgent"; message: string };

/**
 * Decide whether a reassign/release may proceed.
 * - Only a ComForce MKE coordinator may act (demo-level, see note above).
 * - Releasing a critical/high request to no owner requires explicit confirmation.
 */
export function canReassign(intent: ReassignIntent): ReassignCheck {
  if (intent.actorOrg !== COORDINATOR_ORG)
    return {
      ok: false,
      code: "not_coordinator",
      message: "Only a ComForce MKE coordinator can reassign or release a request.",
    };

  const releasingToUnowned = !intent.newOwnerName;
  const urgent = intent.urgency === "critical" || intent.urgency === "high";
  if (releasingToUnowned && urgent && !intent.confirmUnownedUrgent)
    return {
      ok: false,
      code: "confirm_unowned_urgent",
      message: "This is an urgent request. Confirm you want to leave it with no owner before releasing it.",
    };

  return { ok: true };
}
