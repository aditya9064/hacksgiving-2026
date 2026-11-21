"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowUp, Battery, ChevronLeft, Info, Phone, PhoneOff, Signal, Trash2, Wifi } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { Conversation } from "@elevenlabs/client";
import { NEED_LABEL, type HelpRequest, type Partner } from "@/lib/types";

type Msg = { id: string; dir: "out" | "in"; number: string; body: string; at: string; mocked?: boolean };

const DEFAULT_NUMBER = "+1 (414) 555-0199";
const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
const FOLLOWUP_AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_FOLLOWUP_AGENT_ID;

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

  // Jordan's call-back after delivery: show the incoming call over the thread while it's live, then briefly after it ends.
  const fu = latestReq?.followUp;
  const [now, setNow] = useState(0);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const endedAgo = fu?.call?.endedAt && now ? now - new Date(fu.call.endedAt).getTime() : Infinity;
  const showCall = fu && (fu.status === "calling" || fu.status === "answered" || (fu.call?.endedAt && endedAgo < 6000));

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
          <AnimatePresence>
            {showCall && fu && latestReq && (
              fu.mode === "live" && FOLLOWUP_AGENT_ID
                ? <LiveCallback key="live" req={latestReq} partner={snapshot?.partners.find((p) => p.id === latestReq.dispatch?.partnerId)} />
                : <SimulatedCallback key="sim" fu={fu} />
            )}
          </AnimatePresence>
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
              {msgs.length === 0 && <Quick onClick={() => send("Hola, necesito ayuda. No tenemos comida hasta el viernes y tengo 3 niños. Estamos cerca de Cesar Chavez y National.")}>Enviar en español</Quick>}
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

function callTimer(lastT?: number) {
  const s = Math.round((lastT ?? 0) + 8);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

type FU = NonNullable<HelpRequest["followUp"]>;

function CallScreen({ title, sub, status, children, footer }: { title: string; sub: string; status: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute inset-0 z-10 flex flex-col bg-[#0f172a] text-white">
      <div className="flex flex-col items-center px-6 pt-10">
        <div className={`grid h-16 w-16 place-items-center rounded-full bg-brand ${status === "Incoming call…" ? "animate-pulse" : ""}`}><span className="text-[22px] font-bold">R</span></div>
        <div className="mt-3 text-[18px] font-bold">{title}</div>
        <div className="text-[12.5px] text-white/70">{sub}</div>
        <div className="mt-1 text-[12px] text-white/60">{status}</div>
      </div>
      <div className="mt-4 flex-1 space-y-2 overflow-y-auto px-3 pb-3 text-[13px] leading-snug">{children}</div>
      <div className="flex justify-center gap-10 pb-8">{footer}</div>
    </motion.div>
  );
}

const langSub = (lang: string) => `Jordan · ComForce${lang === "es" ? " · Español" : lang === "hmn" ? " · Hmoob interpreter" : ""}`;

/** Scripted fallback when no follow-up agent is configured. */
function SimulatedCallback({ fu }: { fu: FU }) {
  return (
    <CallScreen title="Relay MKE" sub={langSub(fu.language)} status={fu.status === "calling" ? "Incoming call…" : fu.call?.endedAt ? "Call ended" : callTimer(fu.call?.transcript.at(-1)?.t)}
      footer={<span className={`grid h-12 w-12 place-items-center rounded-full ${fu.call?.endedAt ? "bg-white/20" : "bg-red"}`}><PhoneOff size={20} /></span>}>
      {fu.status === "calling" && <p className="mt-10 text-center text-[12px] text-white/50">Picking up automatically — this is the simulated line</p>}
      <Transcript fu={fu} />
      {fu.status === "answered" && !fu.call?.endedAt && <div className="flex"><div className="rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5"><span className="dots"><i /><i /><i /></span></div></div>}
      {fu.call?.endedAt && <div className="mt-2 text-center text-[12px] text-green-300">✓ You told Jordan the help arrived</div>}
    </CallScreen>
  );
}

function Transcript({ fu }: { fu: FU }) {
  return <>{fu.call?.transcript.map((t, i) => (
    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${t.role === "caller" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-2xl px-3 py-2 ${t.role === "caller" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white/10 text-white"}`}>{t.text}</div>
    </motion.div>
  ))}</>;
}

/**
 * Jordan really calls this phone: the server marks the request "calling", the screen rings, and Answer opens a live
 * ElevenLabs conversation with the follow-up agent primed with this case. Turns are mirrored to the server so the
 * Board sees the transcript; the agent's `followup_result` tool closes the loop.
 */
function LiveCallback({ req, partner }: { req: HelpRequest; partner?: Partner }) {
  const fu = req.followUp!;
  const [mode, setMode] = useState<"speaking" | "listening" | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const convRef = useRef<Conversation | null>(null);
  const post = (body: Record<string, unknown>) => fetch("/api/followup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: req.id, ...body }) }).catch(() => {});

  useEffect(() => {
    if (fu.status !== "answered" || fu.call?.endedAt) return;
    const t = setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [fu.status, fu.call?.endedAt]);

  // Hang up the live session if the overlay unmounts (e.g. the resident texted "1" meanwhile).
  useEffect(() => () => { convRef.current?.endSession().catch(() => {}); }, []);

  const answer = async () => {
    if (connecting || convRef.current) return;
    setConnecting(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const need = NEED_LABEL[req.needs.find((n) => n !== "youth" && n !== "other") ?? req.needs[0] ?? "other"].toLowerCase();
      const lang = fu.language === "es" ? "es" : "en";
      const volunteer = req.ownerName ?? "A ComForce volunteer";
      // The agent's configured first message is spoken but not emitted through onMessage, so mirror it ourselves.
      const opening = lang === "es"
        ? `Hola, habla Jordan de ComForce Milwaukee. Le llamo por su solicitud ${req.shortCode}. ${volunteer} pasó a dejar ${need}. ¿Le llegó bien?`
        : `Hi, this is Jordan with ComForce Milwaukee — I'm calling about your request ${req.shortCode}. ${volunteer} came by with the ${need}. Did it get to you okay?`;
      const conv = await Conversation.startSession({
        agentId: FOLLOWUP_AGENT_ID!,
        connectionType: "websocket",
        overrides: { agent: { language: lang } },
        dynamicVariables: {
          request_id: req.id,
          request_code: req.shortCode,
          need_summary: need,
          volunteer,
          partner_name: partner?.name ?? "a partner organization",
          language_name: lang === "es" ? "Spanish" : fu.language === "hmn" ? "English (Hmong interpreter line)" : "English",
        },
        onConnect: () => setConnecting(false),
        onModeChange: ({ mode }) => setMode(mode),
        onMessage: ({ message, source }) => { post({ action: "turn", role: source === "ai" ? "agent" : "caller", text: message }); },
        onDisconnect: () => { convRef.current = null; setMode(null); post({ action: "end" }); },
        onError: (m) => setError(m),
      });
      convRef.current = conv;
      await post({ action: "answer", conversationId: conv.getId() });
      await post({ action: "turn", role: "agent", text: opening });
    } catch (e) {
      setConnecting(false);
      setError(e instanceof Error ? e.message : "Couldn't start the call");
    }
  };
  const hangUp = async () => { const c = convRef.current; convRef.current = null; if (c) await c.endSession().catch(() => {}); else await post({ action: "decline" }); };

  const ringing = fu.status === "calling";
  const ended = !!fu.call?.endedAt || (!ringing && fu.status !== "answered");
  const status = ringing ? (connecting ? "Connecting…" : "Incoming call…") : ended ? "Call ended" : `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}${mode === "speaking" ? " · Jordan is speaking" : mode === "listening" ? " · listening" : ""}`;
  const outcome = fu.status === "confirmed" ? "✓ You told Jordan the help arrived" : fu.status === "partial" ? "You told Jordan part of it arrived" : fu.status === "reopened" ? "You told Jordan it didn't arrive · case reopened" : fu.status === "no_answer" ? "Jordan will try again later" : null;

  return (
    <CallScreen title="Relay MKE" sub={langSub(fu.language)} status={status}
      footer={ended
        ? <span className="grid h-12 w-12 place-items-center rounded-full bg-white/20"><PhoneOff size={20} /></span>
        : <>
            <button onClick={hangUp} className="flex flex-col items-center gap-1.5 text-[11px] text-white/80"><span className="grid h-14 w-14 place-items-center rounded-full bg-red"><PhoneOff size={22} /></span>{ringing ? "Decline" : "Hang up"}</button>
            {ringing && <button onClick={answer} disabled={connecting} className="flex flex-col items-center gap-1.5 text-[11px] text-white/80 disabled:opacity-60"><span className="grid h-14 w-14 place-items-center rounded-full bg-green-500 animate-bounce"><Phone size={22} /></span>Answer</button>}
          </>}>
      {ringing && <p className="mt-10 text-center text-[12px] text-white/50">Jordan is calling about {req.shortCode}. Tap Answer — this is a live voice call.</p>}
      {error && <p className="rounded-lg bg-red/20 px-3 py-2 text-center text-[12px] text-red-200">{error}</p>}
      <Transcript fu={fu} />
      {mode === "speaking" && <div className="flex"><div className="rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5"><span className="dots"><i /><i /><i /></span></div></div>}
      {ended && outcome && <div className="mt-2 text-center text-[12px] text-green-300">{outcome}</div>}
    </CallScreen>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[360px] h-[720px] rounded-[40px] bg-[#111827] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,.35)]">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[32px] bg-bg">
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
