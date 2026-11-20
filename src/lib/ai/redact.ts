import type { StructuredIntake } from "../types";

/**
 * Deterministic, local PII redaction. Runs before any text reaches a model.
 * Conservative on purpose: better to over-redact a name than leak one.
 */
const NOT_NAMES = new Set(["at", "on", "back", "later", "now", "when", "if", "so", "and", "the", "a", "an", "in", "from", "about", "tomorrow", "today", "tonight", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "urgent", "please", "asap", "scared", "out", "behind", "not", "going", "worried", "sorry", "just", "really", "also", "still", "very"]);

export function redactPII(text: string): Pick<StructuredIntake, "redactedText" | "redactions"> {
  const redactions: StructuredIntake["redactions"] = [];
  let out = text;

  const rules: { kind: StructuredIntake["redactions"][number]["kind"]; re: RegExp; ph: string }[] = [
    { kind: "phone", re: /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, ph: "[phone]" },
    { kind: "email", re: /[\w.+-]+@[\w-]+\.[\w.]+/g, ph: "[email]" },
    // "1234 N 35th St", "3500 W Burleigh Street", "2211 North Ave"
    { kind: "address", re: /\b\d{2,5}\s+(?:[NSEW]\.?\s+|(?:North|South|East|West)\s+)?(?:[A-Za-z0-9]+\s+){1,3}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Pl|Place|Way)\b\.?/gi, ph: "[address]" },
    // "my name is Jamal Washington", "this is Keisha", "I'm Marcus T."
    { kind: "name", re: /\b(?:[Mm]y name is|[Tt]his is|[Ii] am|[Ii]'m|[Ii]m|[Cc]all me|[Ii]t'?s)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?)?)/g, ph: "[name]" },
    // "Mr. Johnson", "Ms Davis", "Mrs. Lee"
    { kind: "name", re: /\b(?:Mr|Ms|Mrs|Dr|Pastor|Coach)\.?\s+[A-Z][a-z]+/g, ph: "[name]" },
  ];

  for (const r of rules) {
    out = out.replace(r.re, (m, g1) => {
      if (r.kind === "name" && g1 && NOT_NAMES.has(g1.split(/\s+/)[0].toLowerCase())) return m;
      redactions.push({ kind: r.kind, placeholder: r.ph });
      if (r.kind === "name" && g1 && m.length > g1.length) return m.slice(0, m.length - g1.length) + r.ph;
      return r.ph;
    });
  }
  return { redactedText: out, redactions };
}
