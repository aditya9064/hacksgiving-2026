# ★ Recommended Concept — **Relay MKE**

> *Every request. Every responder. Every outcome — verified.*
> *(Working name; alternatives: "CircleBack", "ComForce Loop".)*

## 1. The problem in one sentence

A resident's call for help reaches ComForce through Facebook, a phone call, a text, or a website form. It moves between volunteers and partner orgs in group chats. **Nobody can say afterwards who helped, whether help arrived, or what it added up to**, so the work is invisible to funders. Invisible work gets defunded. CAHOOTS saved Eugene about $2.2M a year and was still shut down in 2025.

## 2. The insight

All **8 ComForce divisions** (Rapid Response, Missing Persons, Disaster Relief, P.I., Youth, etc.) run **the same loop**:

```
 ┌──────────┐   ┌────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
 │  INTAKE  │ → │ COORDINATE │ → │ DELIVER  │ → │  VERIFY  │ → │  REPORT  │
 └──────────┘   └────────────┘   └──────────┘   └──────────┘   └──────────┘
  text/voice/     claimable       who did it,    resident       funder-ready
  web → AI        alerts to       when           confirms by    impact report
  structures it   partners                       text           + neighborhood map
```

Every platform we studied breaks at one stage:

| Stage | Who broke here | How |
| --- | --- | --- |
| Intake | Free e-referral platforms | Required a new portal, got about 8 referrals a month |
| Coordinate | Mutual-aid group chats, NCCARE360 | Duplicate assignment, buried messages |
| Deliver | Unite Us / NCCARE360 | Inconsistent definitions of "closed" |
| Verify | **Everyone** | Providers self-report, and nobody asks the resident |
| Report | CAHOOTS, 414LIFE | Value never packaged, so funding was lost or fragile |

**Relay is the first tool that closes all five stages, for $0–25 a month.**

## 3. The product (four modules, one engine)

### ① Smart Intake — "text it like you'd text a friend"

- Channels: **SMS**, a **mobile web form or chat** (QR code on flyers), and a **voice note**. Facebook Messenger and WhatsApp are stretch goals.
- An open-source LLM turns *"my auntie's house on 35th burned down last night, 3 kids, need clothes and somewhere to stay"* into a draft case: `category: fire/displacement · needs: [shelter, clothing] · household: 3 children · urgency: high · area: Metcalfe Park`.
- **PII is redacted before the model sees anything.** The location is coarsened to the neighborhood.
- **A human confirms or edits** before anything is dispatched.
- The resident immediately gets an auto-reply: *"ComForce got your message. Case #1042. Someone will reach out within X hours. If you're in danger, call 911."* (This fixes the Ushahidi failure.)

### ② Relay Board — coordination without chaos

- A Kanban-style board, one per division. All requests come in through one front door.
- **Claimable alerts** go to the right volunteers and partner orgs by SMS: *"New need: shelter for a family of 4, Metcalfe Park. Reply CLAIM 1042."*
- **Claim-to-own** prevents duplicates. Handoffs to a partner org (Sojourner, a pantry, 211) are logged as `referred_out → org`.
- Big-button mobile view for responders in the field.

### ③ Verified Closed Loop — our unique differentiator

- Fixed statuses: `new → claimed → in_progress → delivered | declined | unreachable | referred_out`, always with **who** and **when**.
- 48 hours after `delivered`, the **resident gets a text**: *"Did you get the help you needed? Reply 1 = Yes, 2 = Partly, 3 = No."* A "No" reopens the case automatically.
- This produces **resident-verified outcomes**. No platform we found does this, and it is the strongest kind of evidence a funder can get.

### ④ Impact Studio — make the invisible work visible

- A live dashboard: requests by type and neighborhood, median response time, % resident-verified, **contributions by partner org** ("who delivered" credit, the GRYD trust lesson).
- **One-click funder report**: the LLM drafts a grant-ready narrative *from aggregated numbers only*, cites every figure, and exports to PDF or Doc.
- Neighborhood needs map (block group). It shows **needs**, never crime or people.
- **One-click export** of all data to CSV/JSON. ComForce owns its data.

### Stretch modules (only if the core is solid)

| Stretch | Why |
| --- | --- |
| **Missing Persons template** | Flyer generator, structured family intake, tip line feeding the same board. Emotional demo moment. |
| **Field Guide** | AI Q&A over ComForce's own playbooks, plus a partner directory in HSDS format |
| **Spanish / Hmong** intake | Milwaukee language access; a 1-line LLM prompt change |
| **De-escalation practice bot** | Training track, high uniqueness |

## 4. Responsible technology (built in, not bolted on)

| Commitment | Implementation |
| --- | --- |
| No person-scoring or prediction | The model only *classifies a request* (need type, urgency). People are never scored. Stated in the README and on a slide. |
| Data minimization | Contact info is stored apart from case data. Partners see need, area, and status only. |
| Redact before AI | Names, phones, and addresses are regex- and NER-stripped before the LLM call. Self-hosted model option (Ollama). |
| Human in the loop | AI drafts and a human confirms. AI never dispatches or closes a case. |
| Consent | Purpose-scoped consent at intake ("OK to share your need with partner orgs?") |
| Retention | Resident contact auto-purged N days after closure (configurable) |
| No police feed | Nothing flows to law enforcement by default. That is ComForce's decision, not the tool's. |
| Synthetic data | The demo uses only synthetic residents and cases |

## 5. Cost (estimates to verify Friday)

| Item | Option | Monthly cost |
| --- | --- | --- |
| Hosting | Render / Fly / Cloudflare free tier, *or* their existing shared host | $0–7 |
| Database | Supabase free tier (Postgres + auth + row-level security) or SQLite | $0 |
| LLM | Open-source Llama via Groq free tier, or self-hosted Ollama | $0–5 |
| SMS | Twilio: about $1.15 per number plus about $0.008 per SMS segment (1,000 msgs ≈ $8). A2P 10DLC registration fees apply. | ~$10–15 |
| **Total** | | **≈ $10–25 / month** |
| Compare | findhelp | **$5,400–75,000 / year** |

## 6. The 4-minute pitch (draft)

| Time | Beat |
| --- | --- |
| 0:00–0:30 | **Story.** "Friday night, a house fire on 35th Street. The family's cousin messages ComForce on Facebook, a neighbor calls Vaun, a pantry posts in a group chat. Three people try to help. Two duplicate effort. A week later, nobody knows if the family got housed, and the funder report says '10K+ residents served' with nothing behind it." |
| 0:30–0:50 | **The loop** graphic, and the evidence that every platform breaks somewhere (CAHOOTS line). |
| 0:50–2:50 | **Live demo (2:00 max).** A judge scans a QR code and types a need → the AI structures and redacts it on screen → the coordinator confirms → a teammate's phone buzzes: *"Reply CLAIM"* → delivered → the judge's phone gets *"Did you get help?"* → they reply 1 → **the impact dashboard ticks up live** → one click produces the funder report. |
| 2:50–3:30 | **Responsible tech and cost** on one slide: redaction, human in the loop, no prediction, about $15/mo vs. findhelp's $5,400+. |
| 3:30–4:00 | **Close.** "Works for all 8 divisions. Your data, your phones, your community. Deployable Monday." |

*Backup:* a pre-recorded demo video in case Wi-Fi or SMS fails.

## 7. Why this wins with *these* judges

| Judge | What they see |
| --- | --- |
| **Vaun Mayes** | His own workflow made visible: works on volunteers' phones, nearly free, and **proof of impact for funders**, the "minimum funding" problem |
| **Brett Storoe** | Real applied AI with guardrails (redaction, structured extraction, grounded reporting), plus clean engineering |
| **Dr. Carriere** | Neighborhood-level, community-owned data. Partners get credit. Not surveillance, not tech-solutionism. |

## 8. Scope plan (about 40 build hours)

| Priority | Must ship | Owner (TBD) |
| --- | --- | --- |
| P0 | Data model and statuses, web intake + AI structuring + redaction, Relay Board, closed-loop SMS (or web fallback), impact dashboard | |
| P1 | Funder report generator, CSV export, seeded synthetic data (about 300 cases over 6 months), deployed URL | |
| P2 | Missing Persons template, Spanish intake, Field Guide | |
| P3 | De-escalation practice bot, Messenger/WhatsApp | |

## 9. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Twilio trial can only text **verified** numbers, and 10DLC registration takes days | Verify teammates' phones; judges use the **QR web flow**; also consider a Telegram bot (free, instant) |
| Scope creep | Freeze P0 by Friday night; P2+ only after a full demo run-through |
| Live demo failure | Recorded backup, seeded data, offline-capable local run |
| "It's just a CRM" perception | Lead with the *resident-verified loop* and the *CAHOOTS story*, not the features |
| Building the wrong thing | **Talk to ComForce** (comforcemke@gmail.com) Friday morning to validate the workflow |
