# Relay MKE — Hacksgiving 2026 × ComForce MKE

> **Every request. Every responder. Every outcome — verified.**
> A near-free, privacy-first system that helps [ComForce MKE](https://comforcemilwaukee.com/) and its partners turn scattered requests for help into coordinated action and **resident-verified, funder-ready impact**.

**Event:** [Hacksgiving 2026: AI for Good](https://msoe-maic.com/library/?nav=Competitions&article=HacksGiving-ComForce-MKE-2026) · MSOE AI Club × ComForce MKE · Nov 19–22, 2026
**Status:** 📐 Concept and spec finalized, build starting

---

## The challenge

> *How can technology help ComForce MKE and its partners turn fragmented information into coordinated action and measurable community impact?*

Full brief: [docs/challenge/original-brief.md](docs/challenge/original-brief.md) · Judging decoded: [docs/challenge/judging-criteria.md](docs/challenge/judging-criteria.md)

## Our approach: one spine, five tracks

Every one of ComForce's eight divisions runs the same loop: **intake → coordinate → deliver → verify → report**. Relay MKE is one shared record of that work, with a module for each hackathon track:

| Hackathon track | Relay module |
| --- | --- |
| Information Sharing & Coordination | **Partner Network**: shared directory, live capacity, consent-scoped handoffs |
| Community Requests & Referrals | **Smart Intake → Relay Board → Verified Loop**: SMS/web/voice intake, claim-to-own, *resident confirms help arrived* |
| Data Collection & Impact Measurement | **Field Log + Impact Studio**: voice-note activity logs, live dashboard, one-click funder report, full export |
| Community Awareness & Decision Support | **Neighborhood Pulse**: map of needs and unmet needs, never people |
| Training & Knowledge Sharing | **Rapid Response Rooms + Field Guide**: per-case responder chat, direct service requests, AI over ComForce playbooks |

📄 Product spec → [docs/product/spec.md](docs/product/spec.md) · 🗓 Build schedule → [docs/product/build-schedule.md](docs/product/build-schedule.md) · 🧠 Why this concept → [docs/brainstorm/recommended-concept.md](docs/brainstorm/recommended-concept.md)

## Research behind it

We studied about 20 programs and platforms (Cure Violence, Advance Peace, READI Chicago, Oakland Ceasefire, Glasgow VRU, the Cardiff Model, Unite Us, findhelp, CAHOOTS, Denver STAR, Ushahidi, Crisis Cleanup, and others), as well as police systems: NYPD CompStat, CAD/RMS, ShotSpotter, and Chicago's discontinued "heat list." The analysis covers what they got right and where they failed.

→ [docs/research/](docs/research/README.md) · **[Consolidated lessons](docs/research/lessons-learned.md)**

## Responsible technology

- 🚫 Never identifies, scores, or predicts individuals
- 🔒 PII redacted before AI. Contact data is separated from case data.
- 🧑‍⚖️ AI drafts, humans decide
- 📦 ComForce owns and can export all of its data
- 🧪 Synthetic data only

## Repository structure

```
.
├── README.md                     ← you are here
├── docs/
│   ├── challenge/                ← official brief, ComForce profile, judging criteria
│   ├── research/                 ← prior-art analysis (8 topics + lessons learned)
│   ├── brainstorm/               ← idea longlist, scoring matrix, recommended concept
│   ├── product/                  ← product spec & build schedule
│   └── decisions/                ← architecture decision records (ADRs)
├── src/                          ← application code (build phase)
├── data/
│   └── synthetic/                ← synthetic demo data only
└── presentation/                 ← pitch, slides, demo assets
```

## Team

| Name | Role |
| --- | --- |
| _TBD_ | |

## License

To be decided. An OSI-approved open-source license is planned so ComForce MKE and partners can adopt it freely.
