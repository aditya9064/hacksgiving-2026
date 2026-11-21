import type { SafetyLevel } from "./types";

/** Real Milwaukee / Wisconsin crisis resources Jordan can read out. Kept short so they survive a phone call. */
export const SAFETY_RESOURCES = [
  { key: "988", name: "988 Suicide & Crisis Lifeline", how: "call or text 988", when: "thoughts of self-harm, overwhelming crisis" },
  { key: "county", name: "Milwaukee County Crisis Line", how: "414-257-7222 · 24/7", when: "mental-health crisis, mobile team" },
  { key: "sojourner", name: "Sojourner Family Peace Center", how: "414-933-2722 · 24/7", when: "domestic violence, feeling unsafe at home" },
  { key: "211", name: "IMPACT 2-1-1", how: "dial 211", when: "shelter tonight, any other urgent referral" },
] as const;
export type SafetyResourceKey = (typeof SAFETY_RESOURCES)[number]["key"];

const CRISIS = /\b(kill (my|him|her)self|suicid\w*|end (it|my life)|don'?t want to (be here|live)|hurt(ing)? myself|overdos\w*|he'?s? (going to|gonna) kill|she'?s? (going to|gonna) kill|has a gun|pointed a gun|holding a knife|strangl\w*|choked me)\b/i;
const CONCERN = /\b(hit(s|ting)? me|hits? the kids|beat(s|ing)? me|abus\w*|threaten\w*|scared (of|for)|unsafe at home|afraid (he|she|they)|won'?t let me leave|stalk\w*|restraining order|he'?s? drunk and|weapon|gun|shot|stab)\b/i;

/** Keyword screen used when the LLM is unavailable and as a floor under it: never downgrade an obvious crisis. */
export function detectSafety(text: string): SafetyLevel | undefined {
  if (CRISIS.test(text)) return "crisis";
  if (CONCERN.test(text)) return "concern";
  return undefined;
}

const DV = /\b(hit|beat|abus|partner|husband|wife|boyfriend|girlfriend|ex\b|strangl|choke|won'?t let me leave|unsafe at home|afraid (he|she|they)|stalk)/i;
const SELF = /\b(suicid\w*|kill myself|end (it|my life)|don'?t want to (be here|live)|hurt(ing)? myself|overdos\w*|mental|depress\w*|anxi\w*|hopeless)\b/i;

/** Which resources Jordan should mention for a given level and text. */
export function resourcesFor(level: SafetyLevel, text: string): SafetyResourceKey[] {
  const out: SafetyResourceKey[] = [];
  const dv = DV.test(text);
  if (SELF.test(text) || (level === "crisis" && !dv)) out.push("988", "county");
  if (dv) out.push("sojourner");
  out.push("211");
  return Array.from(new Set(out));
}

/** One SMS-sized line of the same resources, for text-channel requests. */
export function resourcesSms(keys: string[]): string {
  const lines = SAFETY_RESOURCES.filter((r) => keys.includes(r.name) || keys.includes(r.key)).map((r) => `${r.name.replace(" Suicide & Crisis Lifeline", "").replace("Milwaukee County ", "County ").replace(" Family Peace Center", "")}: ${r.how.replace(" · 24/7", "")}`);
  return `If you're in danger right now, call 911. ${lines.join(" · ")}.`;
}
