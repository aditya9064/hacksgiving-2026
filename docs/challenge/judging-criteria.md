# Judging Criteria — Decoded

Source: [original-brief.md](original-brief.md)

## Format constraints

- **4 minutes, hard stop.** The live demo can take **at most 2 minutes**.
- Placement is based **only on what we share in the presentation.** The repo matters for the "Integration" bonus, but the pitch wins.
- The page states that **explaining to non-technical audiences** helps.
- Presentation order = submission order. **Submit early** (the link can be updated later and keeps its slot) so we present while judges are fresh.

## Core criteria and how we hit them

| Criterion | What the judges are really asking | Our answer must show |
| --- | --- | --- |
| Community Impact | Does it help Milwaukee residents get help faster and more reliably? | A resident's request handled end to end, with a measured outcome |
| Practical Implementation | Can a volunteer-run nonprofit adopt and maintain it? | Free tier, a single deploy, works with phones they already have, docs |
| Accessibility & Usability | Can frontline workers use it under stress? | Text-message flows, big-button mobile UI, plain language, Spanish/Hmong-ready |
| Responsible Technology | Privacy, and human judgment in consequential decisions | PII separation, consent, redaction before AI, human confirms, no person-scoring |

## Bonus points

| Bonus | Our answer |
| --- | --- |
| **Cost** (a "heavy consideration") | A monthly cost table on one slide, compared with findhelp's $5,400–$75,000/yr |
| **Integration** (documented, low tech debt, scalable) | Clean repo, ADRs, setup in under 10 minutes, open standards (HSDS), CSV export |
| **Uniqueness** | Resident-verified closed loop; one engine for all 8 divisions; text-to-case AI |

## Hard rule

> Avoid identifying or predicting individuals as potential perpetrators of violence; only authorized, de-identified, or synthetic data.

→ We use **synthetic data only** for the demo, and the product never scores or predicts people.
