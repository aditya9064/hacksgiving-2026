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
| `/api/sms/inbound` | POST | Twilio webhook (TwiML): new request · `R-XXXX` → status update · `1/2/3` → verification |
| `/api/sms/simulate` | POST | Same pipeline, JSON reply, for the demo |
| `/api/reset` | POST | Reseed synthetic data |
| `/api/voice/twiml` | POST | Twilio voice webhook: robotic "may be recorded" notice, then hands the call to the ElevenLabs agent |
| `/api/voice/tool` | POST | Mid-call tool: creates the request, texts the tracking code to the caller, tells the agent whether to spell it out |
| `/api/voice/elevenlabs` | POST | Post-call webhook (HMAC-verified): transcript → redact → second LLM summarizes → attached to the request |

## Phone line (AI agent)

A resident calls one number. Twilio plays a short, deliberately robotic notice ("…may be recorded"), then the call is handed to an ElevenLabs agent — "Jordan", a warm neighbor persona (prompt in [`tools/voice/prompt.md`](../tools/voice/prompt.md)). While talking, the agent calls `create_request`; the card appears on the Relay Board **live, marked "Live"**, and the agent reads the tracking code back. When the call ends, the transcript is redacted and a second model (OpenAI) rewrites it into the one-line summary on the card.

Setup (≈15 min):

1. `src/.env.local`: `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `VOICE_TOOL_SECRET=<any random string>`.
2. Expose the dev server: `cloudflared tunnel --url http://localhost:3077` → copy the `https://….trycloudflare.com` URL into `PUBLIC_BASE_URL`.
3. `node tools/voice/create-agent.mjs` → prints the agent id; put it in `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`. The `/r` page now shows a **Call Relay** web widget — enough for a demo without a phone number.
4. In [Agents → Settings → Post-call webhooks](https://elevenlabs.io/app/agents/settings) add `${PUBLIC_BASE_URL}/api/voice/elevenlabs`; copy its secret to `ELEVENLABS_WEBHOOK_SECRET`.
5. Real phone number (optional): import the Twilio number in [Agents → Phone numbers](https://elevenlabs.io/app/agents/phone-numbers) and assign the agent. Then in the Twilio console open the number → **Voice → A call comes in**: copy the URL ElevenLabs set there into `ELEVENLABS_TWILIO_INBOUND_URL`, and replace it with `${PUBLIC_BASE_URL}/api/voice/twiml` (POST). Set `NEXT_PUBLIC_RELAY_PHONE` so `/r` shows the number. Skip this step to let ElevenLabs own the number directly (no robotic notice).

Simulate without any account:

```bash
curl -X POST localhost:3077/api/voice/tool -H 'content-type: application/json' \
  -d '{"conversation_id":"c1","what_they_need":"out of food until Friday, three kids","area":"35th and Burleigh","urgency":"high"}'
curl -X POST localhost:3077/api/voice/elevenlabs -H 'content-type: application/json' \
  -d '{"type":"post_call_transcription","data":{"conversation_id":"c1","metadata":{"call_duration_secs":90},"transcript":[{"role":"agent","message":"Hey, this is Jordan. What is going on?"},{"role":"user","message":"We are out of food until Friday and I have three kids, near 35th and Burleigh."}]}}'
```

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
