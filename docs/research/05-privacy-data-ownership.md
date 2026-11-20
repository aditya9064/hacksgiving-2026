# 05 — Privacy, Responsible AI & Community Data Ownership

"Responsible Technology" is one of the four judging criteria. The brief also sets a **hard rule**:

> Projects should avoid identifying or predicting individuals as potential perpetrators of violence and should use only appropriately authorized, de-identified, or synthetic data.

## Frameworks worth borrowing

| Framework | Origin | Idea we borrow |
| --- | --- | --- |
| **CARE Principles** (Collective benefit, Authority to control, Responsibility, Ethics) | Global Indigenous Data Alliance | Communities control how they are represented in data. Consent covers future use. Avoid deficit framing. Record purpose and provenance with the data. *Used as inspiration only; the principles are Indigenous-specific.* |
| **Cardiff Model** | Wales | Anonymized, **location-level** sharing is enough for coordination |
| **Data minimization** | GDPR and general privacy practice | Collect only what the response needs. Coarsen locations. Set retention limits. |
| **HIPAA / 42 CFR Part 2** | US health law | A grassroots nonprofit is usually *not* a HIPAA covered entity, but its health partners are. Keep health details out of shared views. *(Confirm with counsel; we have no source for this.)* |

## Anti-patterns to avoid

- READI-style ML targeting on arrest records, which also breaks the hackathon rule.
- Feeding community data to police by default. That erodes the trust ComForce runs on.
- Vendor lock-in where the nonprofit can't export its own records. The brief explicitly mentions orgs "retain access to their own data".
- Sending resident PII to a third-party LLM without redaction.

## Design commitments (proposed)

1. **Consent at intake**, scoped by purpose ("share with partner orgs to get you help: yes/no").
2. **PII kept separate** from case data. Shared and partner views see only *needs, area, and status*.
3. **Locations coarsened** to block group or neighborhood on every map and report.
4. **Redact before AI**: names and phones are stripped before any LLM call, with an open-source or local model option.
5. **Human in the loop**: AI suggests a category and urgency, and a person confirms. AI never decides who gets help.
6. **One-click full export** (CSV/JSON). ComForce owns its data.
7. **Retention policy**: resident contact info auto-purged N days after closure.

## Sources

- CARE Principles: https://www.gida-global.org/careprinciples
- Imperial College, CARE explainer: https://www.imperial.ac.uk/research-and-innovation/support-for-staff/scholarly-communication/research-data-management/care-data-principles/
- Cardiff Model: https://orca.cardiff.ac.uk/id/eprint/15855/
