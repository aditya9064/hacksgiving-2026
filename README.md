# Relay MKE — Hacksgiving 2026 × ComForce MKE

> **Every request. Every responder. Every outcome — verified.**
> A near-free, privacy-first system that helps [ComForce MKE](https://comforcemilwaukee.com/) and its partners turn scattered requests for help into coordinated action and **resident-verified, funder-ready impact**.

**Event:** [Hacksgiving 2026: AI for Good](https://msoe-maic.com/library/?nav=Competitions&article=HacksGiving-ComForce-MKE-2026) · MSOE AI Club × ComForce MKE · Nov 19–22, 2026
**Status:** 🧠 Brainstorm complete, concept proposed, build not started

---

## The challenge

> *How can technology help ComForce MKE and its partners turn fragmented information into coordinated action and measurable community impact?*

Full brief: [docs/challenge/original-brief.md](docs/challenge/original-brief.md) · Judging decoded: [docs/challenge/judging-criteria.md](docs/challenge/judging-criteria.md)

## Our approach (proposed)

Every one of ComForce's eight divisions runs the same loop. Every platform we studied breaks at one of its stages.

```
INTAKE  →  COORDINATE  →  DELIVER  →  VERIFY  →  REPORT
```

| Module | What it does |
| --- | --- |
| **Smart Intake** | SMS, web, or voice. AI structures the request (after PII redaction). A human confirms it. |
| **Relay Board** | One front door. Claimable alerts to volunteers and partners, so no duplicated effort. |
| **Verified Loop** | Logs who delivered and when. The *resident* confirms by text whether help arrived. |
| **Impact Studio** | Live dashboard, neighborhood needs map, one-click funder report, full data export |

Read the full concept → [docs/brainstorm/recommended-concept.md](docs/brainstorm/recommended-concept.md)

## Research behind it

We studied about 20 programs and platforms (Cure Violence, Advance Peace, READI Chicago, Oakland Ceasefire, Glasgow VRU, the Cardiff Model, Unite Us, findhelp, CAHOOTS, Denver STAR, Ushahidi, Crisis Cleanup, and others). The analysis covers what they got right and where they failed.

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
│   ├── research/                 ← prior-art analysis (7 topics + lessons learned)
│   ├── brainstorm/               ← idea longlist, scoring matrix, recommended concept
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
