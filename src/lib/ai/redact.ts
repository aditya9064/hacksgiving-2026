import type { StructuredIntake } from "../types";

/**
 * Deterministic, local PII redaction. Runs before any text reaches a model.
 * Conservative on purpose: better to over-redact a name than leak one.
 */
export function redactPII(text: string): Pick<StructuredIntake, "redactedText" | "redactions"> {
  const redactions: StructuredIntake["redactions"] = [];
  let out = text;

  const rules: { kind: StructuredIntake["redactions"][number]["kind"]; re: RegExp; ph: string }[] = [
    { kind: "phone", re: /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, ph: "[phone]" },
    { kind: "email", re: /[\w.+-]+@[\w-]+\.[\w.]+/g, ph: "[email]" },
    // "1234 N 35th St", "3500 W Burleigh Street", "2211 North Ave"
    { kind: "address", re: /\b\d{2,5}\s+(?:[NSEW]\.?\s+)?(?:[A-Z][a-z]+\s+){1,3}(?:St|Street|Ave|Avenue|Blvd|Boulevard|Rd|Road|Dr|Drive|Ln|Lane|Ct|Court|Pl|Place|Way)\b\.?/g, ph: "[address]" },
    // "my name is Jamal Washington", "this is Keisha", "I'm Marcus T."
    { kind: "name", re: /\b(?:my name is|this is|i am|i'm|im|call me|it's|its)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]*\.?)?)/gi, ph: "[name]" },
    // "Mr. Johnson", "Ms Davis", "Mrs. Lee"
    { kind: "name", re: /\b(?:Mr|Ms|Mrs|Dr|Pastor|Coach)\.?\s+[A-Z][a-z]+/g, ph: "[name]" },
  ];

  for (const r of rules) {
    out = out.replace(r.re, (m, g1) => {
      redactions.push({ kind: r.kind, placeholder: r.ph });
      if (r.kind === "name" && g1 && m.length > g1.length) return m.slice(0, m.length - g1.length) + r.ph;
      return r.ph;
    });
  }
  return { redactedText: out, redactions };
}
