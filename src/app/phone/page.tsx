"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUp, Battery, ChevronLeft, Info, Phone, Signal, Trash2, Wifi } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useSnapshot } from "@/lib/client/useSnapshot";

type Msg = { id: string; dir: "out" | "in"; number: string; body: string; at: string; mocked?: boolean };

const DEFAULT_NUMBER = "+1 (414) 555-0199";
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

/**
 * Resident's phone — a live simulator over the real SMS pipeline.
 * Outbound texts (tracking codes, verification prompts) appear the moment the server sends them;
 * replies typed here run through the same handler as the Twilio webhook.
 */
export default function ResidentPhone() {
  const [number, setNumber] = useState(DEFAULT_NUMBER);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const { data: snapshot } = useSnapshot(2000);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const r = await fetch("/api/sms/log", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (alive && r?.messages) setMsgs(r.messages);
    };
    pull();
    const t = setInterval(pull, 1500);
    return () => { alive = false; clearInterval(t); };
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, typing]);

  const send = async (text = draft) => {
    if (!text.trim() || busy) return;
    setBusy(true);
    setDraft("");
    const optimistic: Msg = { id: `tmp-${Date.now()}`, dir: "in", number, body: text, at: new Date().toISOString() };
    setMsgs((m) => [...m, optimistic]);
    setTyping(true);
    try {
      await fetch("/api/sms/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from: number, body: text }) });
      const r = await fetch("/api/sms/log", { cache: "no-store" }).then((r) => r.json());
      setMsgs(r.messages);
    } finally {
      setTyping(false);
      setBusy(false);
    }
  };

  const codes = useMemo(() => {
    const seen = new Set<string>();
    for (const m of msgs) for (const c of m.body.match(/R-[A-Z0-9]{4}/g) ?? []) seen.add(c);
    return Array.from(seen).slice(-3);
  }, [msgs]);
  const latest = codes[codes.length - 1];
  const latestReq = snapshot?.requests.find((r) => r.shortCode === latest);

  const groups = useMemo(() => groupByDay(msgs), [msgs]);

  return (
    <div className="min-h-screen bg-bg">
      {AGENT_ID && <Script src="https://unpkg.com/@elevenlabs/convai-widget-embed" strategy="afterInteractive" />}
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5">
        <Link href="/board" className="flex items-center gap-2.5" title="Back to Relay Board"><Logo /><div><div className="text-[14px] font-bold leading-tight">Relay MKE</div><div className="text-[11.5px] text-muted">Resident's phone · simulator</div></div></Link>
        <div className="flex items-center gap-2">
          <Link href="/board" className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2"><ArrowLeft size={13} /> Board</Link>
          <button onClick={async () => { await fetch("/api/sms/log", { method: "DELETE" }); setMsgs([]); }} className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2" title="Clear this thread"><Trash2 size={13} /> Clear</button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 pb-16 lg:grid-cols-[380px_1fr]">
        <Frame>
          <div className="flex items-center gap-2 border-b border-line bg-surface/90 px-3 pb-2 pt-1 backdrop-blur">
            <ChevronLeft size={20} className="text-brand" />
            <div className="flex flex-1 flex-col items-center">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-bold text-white">R</div>
              <div className="mt-0.5 text-[11px] font-medium">Relay MKE</div>
            </div>
            <Info size={18} className="text-brand" />
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3 text-[14px] leading-snug">
            {msgs.length === 0 && (
              <div className="mx-6 mt-16 text-center text-[12.5px] text-muted">
                <p>No messages yet.</p>
                <p className="mt-2">Call Relay{AGENT_ID ? " (button below)" : ""} and give this number, or send a text to start a request.</p>
              </div>
            )}
            {groups.map(([day, list]) => (
              <div key={day}>
                <div className="my-2 text-center text-[10.5px] font-medium text-muted">{day}</div>
                <AnimatePresence initial={false}>
                  {list.map((m) => <Bubble key={m.id} m={m} />)}
                </AnimatePresence>
              </div>
            ))}
            {typing && <div className="flex"><div className="rounded-2xl rounded-bl-md bg-surface-2 px-3.5 py-2.5"><span className="dots"><i /><i /><i /></span></div></div>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line bg-surface px-2.5 pb-4 pt-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {codes.map((c) => <Quick key={c} onClick={() => send(c)}>Check {c}</Quick>)}
              {latestReq?.status === "delivered" && <>
                <Quick onClick={() => send("1")}>1 · yes it arrived</Quick>
                <Quick onClick={() => send("3")}>3 · no, it didn't</Quick>
              </>}
              {msgs.length === 0 && <Quick onClick={() => send("Hi, we're out of food until Friday and I have 3 kids. We're near 35th and Burleigh.")}>Text a request</Quick>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Text Message · SMS" className="h-9 flex-1 rounded-full border border-line bg-bg px-3.5 text-[14px] outline-none focus:border-brand" />
              <button disabled={!draft.trim() || busy} className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white disabled:opacity-30"><ArrowUp size={16} strokeWidth={2.5} /></button>
            </form>
          </div>
        </Frame>

        <div className="space-y-5 pt-2">
          <div>
            <h1 className="text-[26px] font-bold leading-tight">The resident's side of the loop</h1>
            <p className="mt-2 max-w-[560px] text-[14.5px] leading-relaxed text-ink-2">
              Everything in this phone is driven by the live system: the tracking code Jordan texts during the call, the status reply when the resident texts the code back, and the “did help arrive?” check after delivery. Replies typed here run through the exact handler the Twilio webhook uses.
            </p>
          </div>

          <div className="card p-4">
            <div className="label mb-2">This phone's number</div>
            <input value={number} onChange={(e) => setNumber(e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[15px] font-medium tabular-nums outline-none focus:border-brand" />
            <p className="mt-2 text-[12px] text-muted">Tell Jordan this number when asked “what's a good number to text you at?” — the code will land here.</p>
          </div>

          {AGENT_ID && (
            <div className="card flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white"><Phone size={16} /></span>
              <div>
                <div className="text-[14.5px] font-semibold">Call Relay from here</div>
                <p className="mt-0.5 text-[13px] text-ink-2">Use the <b>Call Relay</b> button in the corner. Jordan answers; the request appears on the <Link href="/board" className="text-brand underline">Board</Link> while you're still talking.</p>
              </div>
            </div>
          )}

          <div className="card p-4">
            <div className="label mb-2">Why a simulator</div>
            <p className="text-[13px] leading-relaxed text-ink-2">
              US carriers require A2P 10DLC registration before a business number can send custom texts — typically a week of review. The pipeline is production-ready (Twilio adapter in <code className="rounded bg-surface-2 px-1">lib/sms</code>); this panel just replaces the carrier hop so the loop can be shown end to end today.
            </p>
          </div>

          {latestReq && (
            <div className="card p-4">
              <div className="label mb-2">Latest request from this phone</div>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="font-semibold">{latestReq.shortCode}</span>
                <span className="chip chip-soft bg-brand-soft text-brand capitalize">{latestReq.status.replace("_", " ")}</span>
              </div>
              <p className="mt-1 text-[13px] text-ink-2">{latestReq.summary}</p>
              <Link href={`/board?q=${latestReq.shortCode}`} className="mt-2 inline-block text-[12.5px] font-medium text-brand hover:underline">Open on the board →</Link>
            </div>
          )}
        </div>
      </div>

      {AGENT_ID && (() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const W = "elevenlabs-convai" as any;
        return <W agent-id={AGENT_ID} />;
      })()}

    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[360px] h-[720px] rounded-[40px] bg-[#111827] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,.35)]">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-bg">
        <div className="flex items-center justify-between bg-surface/90 px-6 pt-3 pb-1 text-[11px] font-semibold"><span>9:41</span><span className="flex items-center gap-1 text-ink-2"><Signal size={12} /><Wifi size={12} /><Battery size={14} /></span></div>
        {children}
      </div>
    </div>
  );
}

function Bubble({ m }: { m: Msg }) {
  const mine = m.dir === "in";
  return (
    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${mine ? "justify-end" : "justify-start"} mb-1`}>
      <div className={`max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 ${mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-surface-2 text-ink"}`}>
        {m.body}
        <div className={`mt-0.5 text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>{new Date(m.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
      </div>
    </motion.div>
  );
}

function Quick({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-2 hover:bg-surface-2">{children}</button>;
}

function groupByDay(msgs: Msg[]): [string, Msg[]][] {
  const out = new Map<string, Msg[]>();
  for (const m of msgs) {
    const d = new Date(m.at);
    const key = d.toDateString() === new Date().toDateString() ? "Today" : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    out.set(key, [...(out.get(key) ?? []), m]);
  }
  return Array.from(out.entries());
}
