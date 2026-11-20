/**
 * Twilio "A call comes in" webhook. Plays a short recording notice in Twilio's synthetic voice,
 * then hands the call to the ElevenLabs agent (which answers in the human persona).
 */
const NOTICE = process.env.VOICE_NOTICE ?? "This call is answered by ComForce Milwaukee's Relay line and may be recorded. Please hold.";
const HANDOFF = process.env.ELEVENLABS_TWILIO_INBOUND_URL ?? "https://api.us.elevenlabs.io/twilio/inbound_call";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="man" language="en-US">${esc(NOTICE)}</Say>
  <Pause length="1"/>
  <Redirect method="POST">${esc(HANDOFF)}</Redirect>
</Response>`;
  return new Response(xml, { headers: { "Content-Type": "text/xml" } });
}
export const GET = POST;
