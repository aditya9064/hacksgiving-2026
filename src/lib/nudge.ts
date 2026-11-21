// Pure nudge cooldown logic. No runtime imports (type-only, relative) so it is unit-testable
// directly with `node --test` type stripping.
import type { ActivityEvent } from "./types";

// Demo value. ComForce can tune this. Prevents nudge spam on the same request.
export const NUDGE_COOLDOWN_MS = 30 * 60 * 1000;

/** The most recent nudge event for a request, or null. */
export function lastNudge(events: ActivityEvent[]): ActivityEvent | null {
  let latest: ActivityEvent | null = null;
  for (const e of events) {
    if (e.type === "nudge" && (latest === null || e.at > latest.at)) latest = e;
  }
  return latest;
}

/** Milliseconds remaining before this request may be nudged again. 0 means allowed now. */
export function nudgeCooldownRemainingMs(events: ActivityEvent[], now: number, cooldownMs = NUDGE_COOLDOWN_MS): number {
  const last = lastNudge(events);
  if (!last) return 0;
  const remaining = cooldownMs - (now - new Date(last.at).getTime());
  return remaining > 0 ? remaining : 0;
}
