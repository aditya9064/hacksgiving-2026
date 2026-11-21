"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Battery, Check, Clock, Inbox, Mail, Phone, PhoneIncoming, PhoneOff, Signal, Wifi, XCircle } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { NEED_LABEL, type Partner } from "@/lib/types";

type Email = { id: string; at: string; to: string; subject: string; text: string; mocked: boolean; requestId?: string };

/**
 * Partner line — the pantry's front-desk phone + inbox.
 * When a volunteer connects a request to a partner, Jordan "rings" here (web call with the request's
 * dynamic variables) and the brief lands in the inbox. A teammate answers as the partner.
 * With an imported Twilio number (ELEVENLABS_PHONE_NUMBER_ID) the same agent dials the partner's real phone instead.
 */
export default function PartnerLine() {
  const { data } = useSnapshot(1500);
  const [emails, setEmails] = useState<Email[]>([]);
  const [openMail, setOpenMail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const r = await fetch("/api/email/log", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (alive && r?.messages) setEmails(r.messages);
    };
    pull();
    const t = setInterval(pull, 2000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const dispatched = useMemo(() => (data?.requests ?? []).filter((r) => r.dispatch).sort((a, b) => b.dispatch!.startedAt.localeCompare(a.dispatch!.startedAt)), [data]);
  const current = dispatched[0];
  const partner: Partner | undefined = data?.partners.find((p) => p.id === (current?.dispatch?.partnerId ?? "p-pantry")) ?? data?.partners.find((p) => p.id === "p-pantry");
  const inbox = emails.filter((e) => !partner?.email || e.to.toLowerCase() === partner.email.toLowerCase()).slice().reverse();
  const inCall = !!current?.dispatch?.answeredAt && !current.dispatch.call?.endedAt;
  const ringing = (current?.dispatch?.status === "calling" && !current.dispatch.answeredAt) || inCall;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5">
        <Link href="/board" className="flex items-center gap-2.5" title="Back to Relay Board"><Logo /><div><div className="text-[14px] font-bold leading-tight">Relay MKE</div><div className="text-[11.5px] text-muted">Partner line · {partner?.name ?? "partner"}</div></div></Link>
        <div className="flex items-center gap-2">
          <Link href="/phone" className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2"><Phone size={13} /> Resident's phone</Link>
          <Link href="/board" className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12.5px] font-medium text-ink-2 hover:bg-surface-2"><ArrowLeft size={13} /> Board</Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 px-6 pb-16 lg:grid-cols-[380px_1fr]">
        <Frame>
          <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
            <AnimatePresence mode="wait">
              {ringing && current ? (
                <motion.div key="ring" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                  <div className="relative mb-6">
                    <span className="absolute inset-0 rounded-full bg-brand/20 ring-pulse" />
                    <span className="absolute inset-0 rounded-full bg-brand/10 ring-pulse [animation-delay:.5s]" />
                    <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand text-white"><Logo size={44} /></div>
                  </div>
                  <div className="text-[22px] font-bold">ComForce MKE</div>
                  <div className="mt-1 text-[13.5px] text-ink-2">Jordan · Relay dispatch</div>
                  {!inCall && <div className="mt-6 inline-flex items-center gap-2 text-[13px] text-muted"><PhoneIncoming size={14} className="text-brand" /> Incoming call…</div>}
                  {inCall ? (
                    <div className="mt-6 w-full text-left">
                      <div className="mb-2 flex items-center justify-between text-[11.5px] text-muted"><span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red blink" /> On the line</span><span>{current.dispatch?.call?.transcript.at(-1) ? `${Math.floor((30 + current.dispatch.call.transcript.at(-1)!.t) / 60)}:${String(Math.floor((30 + current.dispatch.call.transcript.at(-1)!.t) % 60)).padStart(2, "0")}` : "0:30"}</span></div>
                      <div className="max-h-[300px] space-y-2 overflow-y-auto pr-1 text-[12.5px] leading-snug">
                        {current.dispatch?.call?.transcript.map((t, i) => (
                          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${t.role === "agent" ? "justify-start" : "justify-end"}`}>
                            <div className={`max-w-[88%] rounded-2xl px-3 py-2 ${t.role === "agent" ? "rounded-bl-md bg-surface-2 text-ink" : "rounded-br-md bg-brand text-white"}`}>{t.text}</div>
                          </motion.div>
                        ))}
                        <div className="text-[11px] text-muted blink">…</div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-10 text-[12px] text-muted">Front desk is picking up…</div>
                  )}
                </motion.div>
              ) : current?.dispatch?.outcome ? (
                <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${current.dispatch.outcome.accepted ? "bg-green text-white" : "bg-red text-white"}`}>{current.dispatch.outcome.accepted ? <Check size={28} /> : <XCircle size={28} />}</div>
                  <div className="mt-4 text-[17px] font-bold">Call ended</div>
                  <div className="mt-1 text-[13px] text-ink-2">{current.dispatch.outcome.accepted ? "You accepted" : "You declined"} {current.shortCode}{current.dispatch.outcome.readyBy ? ` · ready ${current.dispatch.outcome.readyBy}` : ""}</div>
                  {current.dispatch.status === "ready" || current.dispatch.status === "picked_up" ? <div className="mt-4 rounded-xl bg-surface-2 p-3 text-left text-[12.5px] text-ink-2"><b className="text-ink">{current.ownerName ?? "A volunteer"}</b> is {current.dispatch.status === "picked_up" ? "on the way to the resident" : "on the way to you"}.</div> : null}
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-muted">
                  <PhoneOff size={28} className="mx-auto mb-3 opacity-50" />
                  <div className="text-[13px]">No incoming calls</div>
                  <div className="mt-1 text-[12px]">Connect a request to <b className="text-ink-2">{partner?.name}</b> on the Board.</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="border-t border-line bg-surface px-4 py-3">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold"><Inbox size={14} className="text-brand" /> Inbox · {inbox.length}</div>
            <div className="mt-2 max-h-[150px] space-y-1.5 overflow-y-auto">
              {inbox.length === 0 && <div className="text-[12px] text-muted">No mail yet</div>}
              {inbox.map((e) => (
                <button key={e.id} onClick={() => setOpenMail(openMail === e.id ? null : e.id)} className="w-full rounded-lg bg-bg p-2 text-left hover:bg-surface-2">
                  <div className="flex items-center justify-between text-[11px] text-muted"><span>Relay MKE</span><span>{new Date(e.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span></div>
                  <div className="truncate text-[12.5px] font-medium">{e.subject}</div>
                </button>
              ))}
            </div>
          </div>
        </Frame>

        <div className="space-y-6">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight">The partner's side of the handoff</h1>
            <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink-2">When a volunteer clicks <b>Connect</b>, two things happen at once: Jordan rings this line and briefs the front desk, and a written brief lands in the inbox. Whatever the partner says — yes, when it'll be ready, which door — is recorded mid-call and shows up on the Board. Nothing about the resident's identity is ever shared.</p>
          </div>

          {current && partner && (
            <div className="card p-4">
              <div className="label mb-2">What Jordan is calling about</div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold">{current.summary}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-ink-2"><span>{current.needs.map((n) => NEED_LABEL[n]).join(", ")}</span><span>· {current.householdSize ? `${current.householdSize} people` : "household not stated"}</span><span>· {current.neighborhood}</span><span className="capitalize">· {current.urgency}</span></div>
                </div>
                <span className="chip chip-soft !bg-brand-soft text-brand">{current.shortCode}</span>
              </div>
              <div className="mt-3 text-[12.5px] text-muted">Pickup from <b className="text-ink-2">{partner.address}</b> · volunteer: {current.ownerName ?? "unassigned"}</div>
            </div>
          )}

          <AnimatePresence>
            {openMail && inbox.find((e) => e.id === openMail) && (() => {
              const e = inbox.find((x) => x.id === openMail)!;
              return (
                <motion.div key={e.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card p-5">
                  <div className="flex items-center gap-2 text-[12px] text-muted"><Mail size={13} /> From Relay MKE · to {e.to}{e.mocked ? " · delivered to this inbox view (no SMTP configured)" : ""}</div>
                  <div className="mt-1 text-[16px] font-semibold">{e.subject}</div>
                  <pre className="mt-3 whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed text-ink">{e.text}</pre>
                </motion.div>
              );
            })()}
          </AnimatePresence>

          <div className="card p-4">
            <div className="label mb-1.5">How this becomes a real phone call</div>
            <p className="text-[13.5px] leading-relaxed text-ink-2">The dispatch agent is a separate ElevenLabs agent with its own prompt and a <code className="rounded bg-surface-2 px-1">partner_response</code> tool. Set <code className="rounded bg-surface-2 px-1">ELEVENLABS_PHONE_NUMBER_ID</code> (an imported Twilio number) and the same click places an outbound call to the partner's real phone — this page then just mirrors the status. Email is sent for real when <code className="rounded bg-surface-2 px-1">RESEND_API_KEY</code> is set.</p>
          </div>

          <div className="card p-4 text-[13px] text-ink-2">
            <div className="label mb-1.5 flex items-center gap-1.5"><Clock size={12} /> Script for whoever answers</div>
            "Northside Pantry, this is Maya." → listen → "Yeah, we can do a family box. Give us about twenty minutes — come to the side door on Lisbon and ask for me."
          </div>
        </div>
      </div>

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
