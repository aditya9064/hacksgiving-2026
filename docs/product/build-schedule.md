# Build Schedule (Thu 19 → Sun 22 Nov)

| When | Goal | Exit criteria |
| --- | --- | --- |
| **Thu night** | Stack decided, repo scaffolded, Supabase + Groq + Twilio accounts, data model, synthetic-data generator | `npm run dev` shows an empty board on everyone's machine |
| **Fri AM** | Email/call ComForce (comforcemke@gmail.com) to validate the workflow, divisions, and what they use today | 3–5 real pain points written into `docs/challenge/` |
| **Fri** | ② Intake (web + SMS) → AI structuring + redaction → Board → claim → statuses → resident verify text | A request goes end to end on a phone |
| **Sat AM** | ③ Impact Studio + funder report + export · ⑤ Rapid Response Rooms | The dashboard updates live when a case closes |
| **Sat PM** | ③ Field Log voice · ④ Neighborhood Pulse map · ① Partner directory and share · ⑤ Field Guide | All 5 tracks visible in the demo story |
| **Sat night** | **Feature freeze.** Deploy, seed 300 synthetic cases, record the backup video, write the slides, rehearse 5× with a timer | The 4:00 pitch runs clean twice in a row |
| **Sun AM** | Final README polish, submit the GitHub link, arrive by 11:00 | Submitted, demo devices charged, QR printed |

## Suggested roles (adjust to team size)

| Role | Owns |
| --- | --- |
| Backend / data | Supabase schema, RLS policies, SMS webhooks, synthetic data |
| AI | Redaction, intake structuring, voice → log, funder report, Field Guide |
| Frontend | Board, mobile volunteer view, dashboard, map, rooms |
| Product / pitch | ComForce contact, story, slides, README, rehearsal, timing |
