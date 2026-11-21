// Pure decision logic for a resident's verification reply ("1" yes, "2" partly, "3" no).
// Kept free of runtime imports (type-only, relative paths) so it can be unit tested
// directly with `node --test` type stripping, and reused by every code path that
// handles a reply (the request action route AND the inbound-SMS webhook).
import type { ActivityType, Status } from "./types";

export type ReplyCode = "1" | "2" | "3";

export interface ReplyOutcome {
  /** Status the request moves to. */
  status: Status;
  residentFeedback: "yes" | "no" | "partial";
  /** Stamp verifiedAt with "now". Only a clean "yes" verifies. */
  setVerifiedAt: boolean;
  /** Clear deliveredAt. Partial and "no" are no longer a completed delivery. */
  clearDeliveredAt: boolean;
  event: { type: ActivityType; text: string };
}

/**
 * Only a "1" (help fully arrived) counts as verified success.
 * - "2" (partly): keep the case OPEN with the same owner for follow-up. Not a success.
 * - "3" (no): reopen and return to the owner, same as before.
 */
export function classifyResidentReply(reply: ReplyCode): ReplyOutcome {
  switch (reply) {
    case "1":
      return {
        status: "verified",
        residentFeedback: "yes",
        setVerifiedAt: true,
        clearDeliveredAt: false,
        event: { type: "verified", text: "Resident confirmed the help arrived." },
      };
    case "2":
      return {
        status: "in_progress",
        residentFeedback: "partial",
        setVerifiedAt: false,
        clearDeliveredAt: true,
        event: {
          type: "partial",
          text: "Resident said the help only partly arrived. Case kept open with the same owner for follow-up.",
        },
      };
    case "3":
      return {
        status: "claimed",
        residentFeedback: "no",
        setVerifiedAt: false,
        clearDeliveredAt: true,
        event: { type: "reopened", text: "Resident said help did NOT arrive. Case reopened and returned to owner." },
      };
  }
}
