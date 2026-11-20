# ComForce MKE — Organization Profile

Sources: [comforcemilwaukee.com](https://comforcemilwaukee.com/), [/initiatives](https://comforcemilwaukee.com/initiatives), [/programs](https://comforcemilwaukee.com/programs), [/about](https://comforcemilwaukee.com/about), division pages. Retrieved 2026-11-19.

## Snapshot

| Item | Detail |
| --- | --- |
| Legal name | Community Task Force MKE (ComForce MKE) |
| Founded | 2014, resident-led |
| Founder | Vaun Mayes (also a **judge**) |
| Claimed reach | 10K+ residents served · 75+ initiatives · 300+ volunteers & partners · 24/7 response mindset |
| Main public channels | Website `/contact` form, Facebook ("Community Task Force MKE @ Facebook") |
| Website stack | PHP + MySQL, managed via **phpMyAdmin** (programs live in a `comforce_programs` table) → cheap shared hosting, minimal IT capacity |

## Divisions (8)

| Division | What it does (their words, condensed) |
| --- | --- |
| P.I. Division | Intake & documentation of community concerns, follow-up, next-step planning |
| Investigations / Research Team | Research support for sensitive matters |
| Youth Issues / Outreach | Youth & family programs |
| Missing Persons Network | Family intake, info organization, responsible community awareness, coordination with public resources |
| Legal Policy Division | Advocacy / policy |
| Disaster Relief Division | Crisis intake, supplies, volunteers, donations, shelter/food/transport referrals after fires, displacement, weather |
| Tactical Extraction Team | (Extraction / safety support) |
| Rapid / Incident Response Team | Incident intake, de-escalation, community presence, referrals |

## Services

Emergency shelter · Meal programs / pantry · Missing persons · Violence prevention / interruption · Transportation · Incident de-escalation · Burial assistance · Bridge to employment.

## Initiatives

MKE2TX, MKE2MS, MKE2NO (out-of-state disaster relief / mutual aid deployments) · Cycle Breakers (youth) · Activist & Advocacy Podcast · MKE Parents Club · Missing Persons MKE · Moody Park / Tay Project (neighborhood restoration).

## Observations that shape our design

1. **Every division's workflow is the same shape:** *intake → organize info → coordinate/refer → follow up.* One shared engine can serve all eight.
2. **Single front door today:** all programs say "Request Support → /contact". Routing is manual.
3. **Volunteer-heavy, multi-org:** 300+ volunteers & partners means coordination across people who are not staff and not always at a desk → mobile / SMS-first.
4. **Low IT budget:** existing site is PHP/MySQL on shared hosting. Anything we build must be near-$0 to run and maintainable by a volunteer.
5. **Scope is wider than CVI:** missing persons, fires, disasters, burial, transport. The brief explicitly says these intersect with CVI work.
6. **Impact claims are aggregate and unverifiable today** ("10K+ residents served") → a funder-ready, auditable impact report is a direct win.
