"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck, Send, CheckCircle2, Mic, Square, MessageSquareText, ArrowLeft, ArrowRight, Phone } from "lucide-react";
import Script from "next/script";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { NeedChip, UrgencyDot } from "@/components/ui/Chip";
import { highlight } from "@/components/board/RequestDrawer";
import type { StructuredIntake } from "@/lib/types";

type Phase = "write" | "processing" | "done";

const RELAY_PHONE = process.env.NEXT_PUBLIC_RELAY_PHONE;
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

function CallRelay() {
  if (!RELAY_PHONE && !AGENT_ID) return null;
  return (
    <div className="mt-4 rounded-lg border border-brand/30 bg-brand-soft/40 p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white"><Phone size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[14.5px] font-semibold">Rather talk than type?</div>
          <p className="mt-0.5 text-[13px] text-ink-2">Call the Relay line any time. Someone picks up right away, in English or Spanish, and gives you a tracking code before you hang up.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {RELAY_PHONE && <a href={`tel:${RELAY_PHONE.replace(/[^+\d]/g, "")}`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-[14px] font-semibold text-white hover:bg-brand-2"><Phone size={14} /> Call {RELAY_PHONE}</a>}
            {AGENT_ID && <span className="text-[12px] text-muted">or use the “Call Relay” button in the corner to talk from this page.</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResidentIntake() {
  const [text, setText] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(true);
  const [phase, setPhase] = useState<Phase>("write");
  const [result, setResult] = useState<{ shortCode: string; structured: StructuredIntake } | null>(null);
  const [step, setStep] = useState(0);
  const [rec, setRec] = useState<MediaRecorder | null>(null);
  const [recErr, setRecErr] = useState<string | null>(null);

  const submit = async () => {
    setPhase("processing");
    setStep(0);
    const tick = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 650);
    try {
      const r = await fetch("/api/intake", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, channel: rec !== null ? "voice" : "web", consentToShare: consent, contactRef: phone || undefined }) });
      const j = await r.json();
      await new Promise((res) => setTimeout(res, 2100));
      clearInterval(tick);
      setResult({ shortCode: j.request.shortCode, structured: j.structured });
      setPhase("done");
    } catch {
      clearInterval(tick);
      setPhase("write");
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" });
        const fd = new FormData();
        fd.append("audio", new File([blob], "note.webm", { type: blob.type }));
        const r = await fetch("/api/transcribe", { method: "POST", body: fd });
        const j = await r.json();
        if (j.text) setText((t) => (t ? t + " " : "") + j.text);
        else setRecErr(j.error ?? "Transcription unavailable");
        setRec(null);
      };
      mr.start();
      setRec(mr);
      setRecErr(null);
    } catch (e) {
      setRecErr((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center px-4 py-8">
      {AGENT_ID && (
        <>
          <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />
          {/* Web-call fallback: same agent as the phone line, useful for demos without a Twilio number. */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {(() => { const W = "elevenlabs-convai" as any; return <W agent-id={AGENT_ID} action-text="Call Relay" start-call-text="Start call" end-call-text="Hang up" listening-text="Listening…" speaking-text="Relay is speaking" />; })()}
        </>
      )}
      <div className="w-full max-w-[520px]">
        <div className="flex items-center justify-between mb-6">
          <Link href="/board" className="flex items-center gap-2.5" title="Back to Relay Board"><Logo /><div><div className="text-[14px] font-bold leading-tight">Relay MKE</div><div className="text-[11.5px] text-muted">by ComForce MKE</div></div></Link>
          <div className="flex items-center gap-2">
            <span className="chip chip-soft bg-brand-soft text-brand">Free · Confidential</span>
            <Link href="/board" className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2" title="Staff: back to the Relay Board"><ArrowLeft size={13} /> Board</Link>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {phase === "write" && (
            <motion.div key="write" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6">
              <h1 className="text-[24px] leading-tight font-bold">What do you need help with?</h1>
              <p className="mt-2 text-[14px] text-ink-2">Tell us in your own words, like you'd text a friend. A real person from the community will follow up.</p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="Example: Hi this is Keisha. We're out of food until Friday and I have 3 kids. We're near 35th and Burleigh."
                className="mt-4 w-full rounded-lg border border-line bg-surface p-4 text-[16px] leading-relaxed outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-soft"
              />
              <div className="mt-2 flex items-center gap-2">
                {!rec ? (
                  <button onClick={startRec} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[13px] font-medium hover:bg-surface-2"><Mic size={14} /> Record a voice note instead</button>
                ) : (
                  <button onClick={() => rec.stop()} className="inline-flex items-center gap-1.5 rounded-lg bg-red px-3 py-1.5 text-[13px] font-medium text-white"><Square size={12} /> Stop &amp; transcribe</button>
                )}
                {recErr && <span className="text-[12px] text-red">{recErr}</span>}
              </div>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number (optional, so we can text you back)" inputMode="tel" className="mt-4 w-full rounded-lg border border-line bg-surface px-4 py-3 text-[15px] outline-none focus:border-brand focus:ring-[3px] focus:ring-brand-soft" />
              <label className="mt-4 flex items-start gap-3 text-[13.5px] leading-snug text-ink-2">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
                <span>ComForce MKE may share what I need (not my name or number) with a trusted partner organization so I can get help faster.</span>
              </label>
              <button disabled={text.trim().length < 3} onClick={submit} className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3.5 text-[16px] font-semibold text-white hover:bg-brand-2 disabled:opacity-40"><Send size={16} /> Send request</button>
              <CallRelay />
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-muted"><MessageSquareText size={12} /> Or text your request to the Relay number. Standard rates apply.</div>
            </motion.div>
          )}

          {phase === "processing" && (
            <motion.div key="proc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-6">
              <h2 className="text-[20px] font-bold">Protecting your privacy…</h2>
              <ol className="mt-5 space-y-3">
                {["Removing names, phone numbers and addresses", "Understanding what you need", "Finding partners with capacity nearby", "Creating your request"].map((label, i) => (
                  <li key={label} className="flex items-center gap-3 text-[15px]">
                    <motion.span animate={{ scale: step > i ? 1 : 0.9, opacity: step >= i ? 1 : 0.35 }} className={`flex h-6 w-6 items-center justify-center rounded-full ${step > i ? "bg-brand text-white" : "border border-line"}`}>{step > i ? <CheckCircle2 size={14} /> : <span className={`h-2 w-2 rounded-full ${step === i ? "bg-brand blink" : "bg-line"}`} />}</motion.span>
                    <span className={step >= i ? "text-ink" : "text-muted"}>{label}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          )}

          {phase === "done" && result && (
            <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="card p-6 !bg-green-soft !border-[#bfe7cf]">
                <div className="flex items-center gap-2 text-green font-semibold"><CheckCircle2 size={20} /> Request received</div>
                <h2 className="text-[24px] font-bold mt-1">Your number is <span className="text-brand">{result.shortCode}</span></h2>
                <p className="mt-2 text-[14px] text-ink-2">A community responder will reach out. {phone ? "After help arrives, we'll text you once to ask if it actually came. One tap closes the loop." : "Save this number in case you need to follow up."}</p>
              </div>
              <div className="card p-5">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted mb-2"><ShieldCheck size={13} className="text-brand" /> What the team will see</div>
                <p className="text-[14.5px] leading-relaxed">{highlight(result.structured.redactedText)}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
                  <div><div className="text-[11px] text-muted">Needs</div><div className="flex flex-wrap gap-1 mt-0.5">{result.structured.needs.map((n) => <NeedChip key={n} need={n} />)}</div></div>
                  <div><div className="text-[11px] text-muted">Urgency</div><div className="mt-1"><UrgencyDot urgency={result.structured.urgency} withLabel /></div></div>
                  <div><div className="text-[11px] text-muted">Neighborhood</div><div className="font-medium">{result.structured.neighborhood}</div></div>
                  <div><div className="text-[11px] text-muted">Household</div><div className="font-medium">{result.structured.householdSize ?? "—"}</div></div>
                </div>
                <div className="mt-4 text-[12px] text-muted">{result.structured.redactions.length} identifier{result.structured.redactions.length === 1 ? "" : "s"} removed before any AI saw your message. Your phone number is only visible to ComForce staff.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setText(""); setPhone(""); setResult(null); setPhase("write"); }} className="rounded-lg border border-line bg-surface py-3 text-[14px] font-medium hover:bg-surface-2">Send another request</button>
                <Link href="/board" className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-2">See it on the board <ArrowRight size={15} /></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="mt-8 text-center text-[11.5px] text-muted">If someone is in immediate danger, call 911. For mental health crisis, call or text 988.</p>
      </div>
    </div>
  );
}
