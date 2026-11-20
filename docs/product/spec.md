# Relay MKE — Product Spec (v1)

> **One system that closes the loop on people, not incidents.**
> Five hackathon tracks, one shared data spine, one story.

## 1. Design principle: one spine, five surfaces

Five separate apps would mean five half-built demos. Instead, everything reads and writes **one shared record of the work**. Each track is a *view* on that spine.

```
                         ┌──────────────────────────────┐
   Resident / partner ─▶ │        THE SPINE (one DB)    │ ◀─ Volunteer (phone)
   (SMS, QR web, voice)  │  Requests · Orgs · Activity  │
                         │  Messages · Consent · Docs   │
                         └──────────────┬───────────────┘
        ┌────────────┬──────────────┬───┴─────────┬───────────────┐
        ▼            ▼              ▼             ▼               ▼
   ① Partner    ② Relay Board   ③ Field Log   ④ Neighborhood  ⑤ Rapid Response
     Network     + Verified       + Impact      Pulse            Rooms + Field
   (sharing)      Loop            Studio       (decisions)       Guide (training)
```

## 2. Track coverage

| Hackathon track | Relay module | What it does | Research lesson it applies |
| --- | --- | --- | --- |
| **1. Information Sharing & Coordination** | **① Partner Network** | Directory of partner orgs (HSDS format) with **live capacity** ("3 shelter beds tonight", "pantry open until 6"). **Three-tier sharing:** public / partners / ComForce-only. Case handoffs send a **consent-scoped share packet** (need + area, never the full record). | Cardiff: location-level is enough. GRYD: shared views build trust. HSDS interoperates with 211. |
| **2. Requests & Referrals** | **② Smart Intake → Relay Board → Verified Loop** | SMS, QR web, or voice intake. AI structures the request after PII redaction, and a human confirms. One board for all 8 divisions. **Claim-to-own** alerts. Fixed statuses with **who delivered**. **The resident confirms by text** that help arrived. | Unite Us duplicates, the referral black hole, Ushahidi's no-reply failure, the free platform's adoption failure |
| **3. Data Collection & Impact** | **③ Field Log + Impact Studio** | A volunteer records a **30-second voice note** after a mediation or delivery. AI turns it into a structured, name-free activity entry. Live impact dashboard, **one-click funder report** (AI narrative grounded only in aggregate numbers, every figure cited), **full CSV/JSON export**. | CAHOOTS defunded. 414LIFE null results. Delaware: field entry reduces burden. Data ownership. |
| **4. Awareness & Decision Support** | **④ Neighborhood Pulse** | A map of **needs and unmet needs** by neighborhood from Relay's own data, layered with aggregated open data (311, Census ACS). A weekly AI brief: *"Shelter requests up 40% in Metcalfe Park; nearest partner capacity is 0. Consider outreach or a new partner."* **Shows resource gaps, never people or crime suspects.** | Chicago heat list (what *not* to do). Cardiff. 414LIFE reach mapping. |
| **5. Training & Knowledge Sharing** | **⑤ Rapid Response Rooms + Field Guide** | Claiming a case **auto-opens a private chat room** with only the responders on it. **Direct "request service" messages** to an org or team ("@FoodPantry: need groceries for a family of 4, Metcalfe Park"). Field Guide: AI Q&A **over ComForce's own playbooks** with sources cited ("First 24h of a missing-person case?"). *Stretch:* de-escalation practice scenarios. | Mutual-aid group-chat chaos. Preserving organizational knowledge. |

## 3. The demo story (one case flows through all five tracks)

| # | Beat (≤2 min live) | Track |
| --- | --- | --- |
| 1 | A judge scans the QR code: *"House fire on 35th last night, 3 kids, need clothes and a place to stay."* The resident gets "Case #1042 received." | 2 |
| 2 | AI draft appears with names redacted: `fire · shelter+clothing · high · Metcalfe Park`. The coordinator confirms. | 2 |
| 3 | Partner Network shows *"Sojourner: 2 beds tonight."* The coordinator sends a consent-scoped share. | 1 |
| 4 | A teammate's phone buzzes: *"Reply CLAIM 1042."* A **Rapid Response Room** opens. The pantry is messaged directly. | 5 |
| 5 | The volunteer leaves a voice note: *"Dropped off clothes, family placed at shelter."* It becomes a structured log. | 3 |
| 6 | The **judge's phone** gets *"Did you get the help you needed? 1/2/3."* They reply **1**, and the case closes as *resident-verified*. | 2 |
| 7 | Neighborhood Pulse highlights a shelter-need cluster with no partner capacity nearby. | 4 |
| 8 | One click produces the **funder report**: 312 requests, 81% resident-verified, median response 3.2 h, credit to 9 partner orgs. | 3 |

## 4. Responsible technology (non-negotiables)

- **No person is ever scored or predicted.** AI classifies *requests* only.
- **PII is redacted before every LLM call.** Contact details live in a separate table that partners can't read (row-level security).
- **AI drafts, humans decide.** Nothing is dispatched or closed by AI.
- **Purpose-scoped consent** at intake. **Retention purge** after closure.
- **No law-enforcement data feed** by default.
- **Synthetic data only** in the demo and repo.

## 5. Proposed architecture (all free or open source)

| Layer | Choice | Why |
| --- | --- | --- |
| Web app | **Next.js** (TypeScript), mobile-first | One codebase for the coordinator dashboard and volunteer phone views |
| Database, auth, realtime | **Supabase** (Postgres + row-level security + Realtime) | RLS gives the privacy tiers. Realtime powers the Rapid Response Rooms and the live dashboard. Free tier. |
| LLM | **Llama (open source)** via Groq free tier; Ollama for self-hosting | Meets the "open-source LLM" rule. Low or zero cost. |
| Speech-to-text | **Whisper** (open source) via Groq | Field Log voice notes |
| SMS | **Twilio** (verified demo numbers) with a web fallback | Residents and volunteers need no app |
| Map | **Leaflet + OpenStreetMap** | Free, no API key |
| Directory format | **Open Referral HSDS** | Can import IMPACT 211 data later |
| Hosting | Vercel / Render free tier | $0 for the demo |

**Estimated run cost: about $10–25/month**, almost all of it SMS. findhelp costs $5,400–$75,000/year, and police CAD/RMS costs $750K–$9M.

## 6. Depth tiers (so "all five" doesn't become "five half-done")

| Tier | Must be real & demoable | Can be thinner |
| --- | --- | --- |
| **Deep** | ② Intake, Board, Verified Loop · ③ Impact Studio and funder report | — |
| **Solid** | ⑤ Rapid Response Rooms · ③ Field Log voice note · ④ needs map | AI weekly brief can run on seeded data |
| **Light** | ① Partner directory + capacity + share packet · ⑤ Field Guide over 3–5 sample playbooks | Practice scenarios are stretch only |
