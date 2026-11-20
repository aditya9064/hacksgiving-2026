# Relay MKE — app

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Leaflet. Runs with **zero configuration** on synthetic data.

```bash
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit     # type check
```

Copy `.env.example` to `.env.local` to enable OpenAI, Supabase or Twilio. Every integration has a built-in fallback, so the demo never depends on a network key.

## Surfaces

| Route | Who | What |
| --- | --- | --- |
| `/board` | Coordinators | Relay Board: live request queue (kanban or sortable table), claim-to-own, notes, mark delivered, resident verification timeline |
| `/partners` | Coordinators | Partner Network: capacity, needs served, load, verified dates |
| `/impact` | Directors / funders | Impact Studio: KPIs, needs breakdown, pipeline, partner outcomes, one-click funder narrative, CSV export |
| `/pulse` | Community / city | Neighborhood Pulse: aggregated density map, ranked neighborhoods, emerging signals. Counts only, never people |
| `/guide` | Responders | Field Guide: ComForce playbooks + "Ask the Guide" Q&A grounded in them |
| `/m` | Responders (phone) | Phone view: claim and close requests, plus an SMS simulator for the demo |
| `/r` | Residents | Public intake: text/voice request, get a tracking code |

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/intake` | POST | Create request (redact → structure → route) |
| `/api/transcribe` | POST | Voice note → text |
| `/api/requests/[id]` | POST | `claim` · `note` · `delivered` · `resident_reply` |
| `/api/snapshot` | GET | Full state for the UI (polled every 2s) |
| `/api/report` | GET / POST | CSV export / AI funder narrative |
| `/api/playbooks` | GET | Playbook list |
| `/api/guide` | POST | Question → answer with sources |
| `/api/sms/inbound` | POST | Twilio webhook (TwiML) |
| `/api/sms/simulate` | POST | Same pipeline, JSON reply, for the demo |
| `/api/reset` | POST | Reseed synthetic data |

## Privacy by construction

`lib/ai/redact.ts` strips names, phones, addresses and emails **before** any text reaches an AI model. Contact info lives apart from case data. Pulse only ever receives aggregates.

## Layout

```
app/            routes + API handlers
components/     AppShell (sidebar/topbar), board/, ui/
lib/ai/         structuring, redaction, narrative, guide Q&A (OpenAI or rules)
lib/db/         store + synthetic seed (in-memory or Supabase)
lib/actions.ts  domain actions shared by web, SMS and phone views
```
