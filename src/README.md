# Relay MKE — app

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Leaflet. Runs with **zero configuration** on synthetic data.

```bash
npm install
npm run dev          # http://localhost:3000
npx tsc --noEmit     # type check
```

Copy `.env.example` to `.env.local` to enable an LLM (Anthropic or OpenAI), Supabase or Twilio. Every integration has a built-in fallback, so the demo never depends on a network key.

## Surfaces

| Route | Who | What |
| --- | --- | --- |
| `/board` | Coordinators | Relay Board: live request queue (kanban or sortable table), claim-to-own, notes, mark delivered, resident verification timeline |
| `/partners` | Coordinators | Partner Network: capacity, needs served, load, verified dates |
| `/impact` | Directors / funders | Impact Studio: KPIs, needs breakdown, pipeline, partner outcomes, one-click funder narrative, CSV export |
| `/grants` | Directors / funders | Grants & Evidence: resources delivered per DCWS *Countdown* cluster (26 clusters, action-calendar CSV), funder-fit scoring against 8 real Milwaukee funders with a readiness checklist, and Claude-drafted application sections + logic model + platform unit cost, exported to Word. Every figure traces to a request |
| `/pulse` | Community / city | Neighborhood Pulse: aggregated density map, ranked neighborhoods, emerging signals. Counts only, never people |
| `/guide` | Responders | Field Guide: ComForce playbooks + "Ask the Guide" Q&A grounded in them |
| `/m` | Responders (phone) | Phone view: claim and close requests, plus an SMS simulator for the demo |
| `/r` | Residents | Public intake: text/voice request, call Relay, get a tracking code |
| `/phone` | Demo | Resident's phone simulator: every SMS the system sends appears live; replies go through the real inbound handler |
| `/partner-line` | Demo / partner | The pantry's side of a handoff: Jordan's incoming call plays out live on the phone mock-up (ring → pickup → conversation → accepted), the emailed brief in an inbox, and what the call is about |
| `/route/[id]` | Volunteer (phone) | Run sheet after a partner accepts: live GPS map you → pickup → resident, turn-by-turn, Picked up / Delivered, Google Maps handoff |

**On a phone.** The staff screens lay themselves out for a handheld (a narrow window or a touch device; the `hand:` variant in `app/globals.css`). The side rail becomes a tab bar along the bottom. The board shows one status column at a time and you swipe between them. A request opens as a full-screen sheet with its main action (Claim, Mark delivered) pinned at the bottom and the coordinator tools scrolling with the rest. The other pages stack into one column. Nothing changes on a desktop.

## API

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/intake` | POST | Create request (redact → structure → route) |
| `/api/transcribe` | POST | Voice note → text |
| `/api/requests/[id]` | POST | `claim` · `note` · `delivered` · `resident_reply` · `dispatch {partnerId}` · `ready` · `picked_up` |
| `/api/snapshot` | GET | Full state for the UI (polled every 2s) |
| `/api/report` | GET / POST | CSV export / AI funder narrative |
| `/api/playbooks` | GET | Playbook list |
| `/api/guide` | POST | Question → answer with sources |
| `/api/sms/inbound` | POST | Twilio webhook (TwiML): new request · `R-XXXX` → status update · `1/2/3` → verification |
| `/api/sms/simulate` | POST | Same pipeline, JSON reply, for the demo |
| `/api/sms/log` | GET / DELETE | Message log behind `/phone` (both directions, in-memory) |
| `/api/reset` | POST | Reseed synthetic data |
| `/api/voice/twiml` | POST | Twilio voice webhook: robotic "may be recorded" notice, then hands the call to the ElevenLabs agent |
| `/api/voice/tool` | POST | Mid-call tool: creates the request, texts the tracking code to the caller, tells the agent whether to spell it out |
| `/api/voice/elevenlabs` | POST | Post-call webhook (HMAC-verified): transcript → redact → second LLM summarizes → attached to the request (resident calls and partner calls) |
| `/api/voice/partner-tool` | POST | Mid-call tool for the dispatch agent: records the partner's answer (accepted, ready-by, notes, contact) on the request |
| `/api/email/log` | GET / DELETE | Outbound email log behind `/partner-line` (`?to=` filter) |

## Phone line (AI agent)

A resident calls one number. Twilio plays a short, deliberately robotic notice ("…may be recorded"), then the call is handed to an ElevenLabs agent — "Jordan", a warm neighbor persona (prompt in [`tools/voice/prompt.md`](../tools/voice/prompt.md)). While talking, the agent calls `create_request`; the card appears on the Relay Board **live, marked "Live"**, and the agent reads the tracking code back. When the call ends, the transcript is redacted and a second model (Claude or OpenAI, via `lib/ai/llm.ts`) rewrites it into the one-line summary on the card.

Setup (≈15 min):

1. `src/.env.local`: `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`), `ELEVENLABS_API_KEY`, `VOICE_TOOL_SECRET=<any random string>`.
2. Expose the dev server: `cloudflared tunnel --url http://localhost:3077` → copy the `https://….trycloudflare.com` URL into `PUBLIC_BASE_URL`.
3. `node tools/voice/create-agent.mjs` → prints the agent id; put it in `NEXT_PUBLIC_ELEVENLABS_AGENT_ID`. The `/r` page now shows a **Call Relay** web widget — enough for a demo without a phone number.
4. In [Agents → Settings → Post-call webhooks](https://elevenlabs.io/app/agents/settings) add `${PUBLIC_BASE_URL}/api/voice/elevenlabs`; copy its secret to `ELEVENLABS_WEBHOOK_SECRET`.
5. Real phone number (optional): import the Twilio number in [Agents → Phone numbers](https://elevenlabs.io/app/agents/phone-numbers) and assign the agent. Then in the Twilio console open the number → **Voice → A call comes in**: copy the URL ElevenLabs set there into `ELEVENLABS_TWILIO_INBOUND_URL`, and replace it with `${PUBLIC_BASE_URL}/api/voice/twiml` (POST). Set `NEXT_PUBLIC_RELAY_PHONE` so `/r` shows the number. Skip this step to let ElevenLabs own the number directly (no robotic notice).

### Partner dispatch (Jordan calls the pantry)

On the Board a volunteer opens a request → **Connect** → picks a partner → confirms. Three things happen at once:

1. The request is claimed by the volunteer and a **name-free brief** is emailed to the partner (`lib/email` — Resend if `RESEND_API_KEY` is set, otherwise logged and shown in the `/partner-line` inbox).
2. A **second ElevenLabs agent** (prompt in [`tools/voice/dispatch-prompt.md`](../tools/voice/dispatch-prompt.md)) calls the partner: it introduces itself, explains the need, asks when it'll be ready, and calls `partner_response` mid-call. The Board flips to **Accepted · ready in 20 min · side door** while the call is still going. With `ELEVENLABS_PHONE_NUMBER_ID` + a partner phone it's a real outbound call. Otherwise the call is **simulated end-to-end with no human in the loop**: it rings for ~2.5 s, the pantry picks up, a scripted 7-turn conversation streams to the Board drawer and `/partner-line` at ~1.7 s per turn, the partner accepts mid-call, and the call ends with a summary (≈16 s total; tune with `DISPATCH_SIM_RING_MS` / `DISPATCH_SIM_TURN_MS`).
3. When the call ends, the webhook attaches the partner transcript + a summary to the request.

Then **Ready to go** opens `/route/[id]`: a live map from the volunteer's location to the pickup and on to the resident's (approximate) location, with OSRM turn-by-turn, a QR to open it on a phone, and Picked up / Delivered buttons that advance the same request.

**Why SMS is simulated for the demo.** US carriers require A2P 10DLC registration before a business number can send custom texts (≈5 business days; trial accounts can't register). Voice has no such gate: an upgraded Twilio account + purchased number works immediately. So the phone line can be real while texts are shown on `/phone`; the moment `TWILIO_*` is set, `sendSms` delivers for real and `/phone` keeps mirroring the log.

Simulate without any account:

```bash
curl -X POST localhost:3077/api/voice/tool -H 'content-type: application/json' \
  -d '{"conversation_id":"c1","what_they_need":"out of food until Friday, three kids","area":"35th and Burleigh","urgency":"high"}'
curl -X POST localhost:3077/api/voice/elevenlabs -H 'content-type: application/json' \
  -d '{"type":"post_call_transcription","data":{"conversation_id":"c1","metadata":{"call_duration_secs":90},"transcript":[{"role":"agent","message":"Hey, this is Jordan. What is going on?"},{"role":"user","message":"We are out of food until Friday and I have three kids, near 35th and Burleigh."}]}}'
```

### Languages (Spanish live, Hmong routed)

Jordan speaks English and Spanish on the same number — the whole call, including the code read-back, switches to Spanish and every text (tracking code, "did it arrive?", thanks) is sent in Spanish. Milwaukee's Hmong community is handled honestly: Jordan doesn't pretend to speak Hmong, says a short greeting, gets a number, logs the need with `language: "hmn"` and promises a Hmong-speaking call-back; the texts carry a Hmong line plus English. On the Board, non-English requests get a language chip and the **Connect to a partner** list ranks partners with that language first (`Partner.languages`, e.g. the Hmong and South Side centers in the seed).

### Safety escalation

If a caller describes abuse, a weapon, threats or thoughts of self-harm, Jordan slows down, offers the right line by name and number — **988**, **Milwaukee County Crisis Line 414-257-7222**, **Sojourner Family Peace Center 414-933-2722**, **2-1-1** — and still logs the request with `safety_concern`/`safety_level`/`safety_note`/`resources_shared`. Server side (`lib/safety.ts`, `flagSafety` in `lib/actions.ts`) a keyword screen acts as a floor under the LLM's `safety` field for text/SMS channels too. The request is bumped to critical, gets a red **Crisis / Safety** banner on the card, a ComForce-only box in the drawer with the resources shared, and a "ComForce on-call lead paged" timeline event (mock page). SMS intakes get the same resources texted back. Partners never see the note.

### Closing the loop by voice

**Mark delivered** (drawer or the volunteer's route page) texts the resident "did it arrive? 1/2/3" in their language. If nobody replies within `FOLLOWUP_SMS_WAIT_MS` (default 15 s for the demo), Jordan **calls the resident back in their language** (`lib/followup.ts`): the call rings, streams turn by turn to the Board drawer and the `/phone` mock-up, and the confirmation closes the request as **Verified · by phone**. A text reply cancels the call.

With `NEXT_PUBLIC_ELEVENLABS_FOLLOWUP_AGENT_ID` set (the third agent from `tools/voice/create-agent.mjs`, prompt in `tools/voice/followup-prompt.md`) this is a **live call**: `/phone` rings with Answer / Decline, and Answer opens a real ElevenLabs conversation in the browser — the same engine as the Call Relay button — with Jordan primed with the case (code, need, volunteer, partner, language; Spanish is a full language switch). Jordan records the outcome through the `followup_result` webhook tool (`/api/voice/followup-tool` → yes / partial / no, mapped onto the same `residentReply` path as an SMS "1/2/3"), and the browser mirrors each spoken turn to `/api/followup` so the Board transcript updates live. Unanswered after `FOLLOWUP_RING_TIMEOUT_MS` → "Call-back unanswered". Without the agent id the call-back falls back to a scripted simulation. Carrying the same session over the PSTN is one config change (`ELEVENLABS_PHONE_NUMBER_ID` + a Twilio number) — the browser ring exists because we have no registered number before Sunday.

## Privacy by construction

`lib/ai/redact.ts` strips names, phones, addresses and emails **before** any text reaches an AI model. Contact info lives apart from case data. Pulse only ever receives aggregates.

## Layout

```
app/            routes + API handlers
components/     AppShell (sidebar/topbar), board/, ui/
lib/ai/         structuring, redaction, narrative, guide Q&A, grant drafting (Claude/OpenAI via llm.ts, or rules)
lib/clusters.ts DCWS "This Is Our City: The Countdown" 26 clusters (approx. centroids) + per-cluster stats
lib/grants.ts   funders, readiness requirements, fit scoring, logic model, unit economics, de-identified story
lib/db/         store + synthetic seed (in-memory or Supabase)
lib/actions.ts  domain actions shared by web, SMS and phone views
```
