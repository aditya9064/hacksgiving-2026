// HARD BLOCK: a real organization (isReal) is never emailed or called, even with every live key set.
// Runs the real startDispatch against the in-memory store with fetch stubbed, contact details
// planted on the partner, and all Resend / ElevenLabs keys present.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";

register("./testing/ts-resolve.mjs", import.meta.url);

// Every key that would enable a real send or call, and fast simulated calls.
Object.assign(process.env, {
  RESEND_API_KEY: "re_test_key",
  ELEVENLABS_API_KEY: "xi_test_key",
  ELEVENLABS_DISPATCH_AGENT_ID: "agent_test",
  ELEVENLABS_PHONE_NUMBER_ID: "phone_test",
  DISPATCH_SIM_RING_MS: "1",
  DISPATCH_SIM_TURN_MS: "1",
});
delete process.env.SUPABASE_URL;
delete process.env.NEXT_PUBLIC_SUPABASE_URL;

const calls: string[] = [];
const realFetch = globalThis.fetch;
before(() => {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    calls.push(url);
    return new Response(JSON.stringify({ id: "em_1", conversation_id: "conv_1", success: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
});
after(() => {
  globalThis.fetch = realFetch;
});

const { startDispatch, liveContactAllowed } = await import("./dispatch.ts");
const { SEED_PARTNERS, REAL_PARTNERS } = await import("./db/seed.ts");
const { db } = await import("./db/index.ts");
const { emailLog } = await import("./email/index.ts");

const PLANTED_EMAIL = "planted-contact@example.org";
const PLANTED_PHONE = "+14145550100";
const touchedEmailOrVoice = () => calls.filter((u) => u.includes("resend.com") || u.includes("elevenlabs"));

async function openRequestId() {
  const snap = await db.snapshot();
  const r = snap.requests.find((x) => x.status === "new" && !x.dispatch);
  assert.ok(r, "seed has an unclaimed request");
  return r.id;
}

test("the two real organizations are marked isReal and carry no contact details", () => {
  assert.deepEqual(REAL_PARTNERS.map((p) => p.id), ["dcws", "mke-promise-keepers"]);
  for (const p of REAL_PARTNERS) {
    assert.equal(p.isReal, true);
    assert.equal(p.capacitySimulated, true);
    assert.equal(p.relationshipTier, "confirmed_collaborator");
    assert.equal(p.phone ?? p.email ?? p.address ?? p.contactName, undefined, `${p.id} has contact details`);
    assert.ok((p.evidence ?? []).length > 0 && p.evidence!.every((e) => /^https:\/\//.test(e.url)));
    assert.equal(liveContactAllowed(p), false);
  }
  assert.ok(SEED_PARTNERS.filter((p) => !p.isReal).every((p) => liveContactAllowed(p)), "fictional partners unchanged");
});

for (const id of ["dcws", "mke-promise-keepers"]) {
  test(`startDispatch to real partner "${id}" never reaches the email or voice path, even with contacts planted and keys set`, async () => {
    const partner = SEED_PARTNERS.find((p) => p.id === id)!;
    partner.email = PLANTED_EMAIL;
    partner.phone = PLANTED_PHONE;
    try {
      calls.length = 0;
      const before = emailLog(PLANTED_EMAIL).length;
      const result = await startDispatch(await openRequestId(), id, { name: "Test Coordinator", org: "ComForce MKE" });
      assert.ok(result?.dispatch, "handoff was recorded");
      assert.equal(result!.dispatch!.mode, "simulated");
      assert.equal(result!.dispatch!.emailSentAt, undefined, "no email step");
      assert.deepEqual(touchedEmailOrVoice(), [], "no request to Resend or ElevenLabs");
      assert.equal(emailLog(PLANTED_EMAIL).length, before, "nothing addressed to the partner");
      // Let the simulated call play out: no invented staff name or pickup location at a real org.
      await new Promise((r) => setTimeout(r, 300));
      const texts = (await db.listActivity(result!.id)).map((a) => a.text).join("\n");
      assert.match(texts, /Simulated contact/);
      assert.doesNotMatch(texts, /\b(Maya|Denise|Luis|Tasha|Rob|Keisha|Andre|Pat)\b picked up/);
      assert.deepEqual(touchedEmailOrVoice(), [], "still nothing sent after the call");
    } finally {
      delete partner.email;
      delete partner.phone;
    }
  });
}

test("control: the same setup DOES go live for a fictional partner, so the block above is what stops it", async () => {
  const partner = SEED_PARTNERS.find((p) => !p.isReal)!;
  const saved = { email: partner.email, phone: partner.phone };
  partner.email = PLANTED_EMAIL;
  partner.phone = PLANTED_PHONE;
  try {
    calls.length = 0;
    const result = await startDispatch(await openRequestId(), partner.id, { name: "Test Coordinator", org: "ComForce MKE" });
    assert.ok(touchedEmailOrVoice().some((u) => u.includes("resend.com")), "real email path reached");
    assert.ok(touchedEmailOrVoice().some((u) => u.includes("elevenlabs")), "real voice path reached");
    assert.equal(result!.dispatch!.mode, "live");
  } finally {
    partner.email = saved.email;
    partner.phone = saved.phone;
  }
});
