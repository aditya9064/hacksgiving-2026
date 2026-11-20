"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, ShieldCheck, Send, CheckCheck, HandHelping, MessageSquareReply, Bot, User, Cpu, RotateCcw } from "lucide-react";
import type { ActivityEvent, Partner } from "@/lib/types";
import { act, type SafeRequest } from "@/lib/client/useSnapshot";
import { STATUS_LABEL } from "@/lib/types";
import { Avatar, NeedChip, UrgencyDot } from "../ui/Chip";

const ACTOR_ICON = (actor: string) => (actor === "ai" ? <Cpu size={12} /> : actor === "system" ? <Bot size={12} /> : actor === "resident" ? <MessageSquareReply size={12} /> : <User size={12} />);

export function RequestDrawer({ request, partners, onClose, me }: { request: SafeRequest | null; partners: Partner[]; onClose: () => void; me: { name: string; org: string; partnerId?: string } }) {
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!request) return;
    let alive = true;
    const load = () => fetch(`/api/requests/${request.id}`).then((r) => r.json()).then((j) => alive && setActivity(j.activity ?? []));
    load();
    const t = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [request]);

  const run = async (body: Record<string, unknown>) => {
    if (!request) return;
    setBusy(true);
    try {
      await act(request.id, body);
    } finally {
      setBusy(false);
    }
  };

  const suggested = request ? partners.filter((p) => p.needs.some((n) => request.needs.includes(n)) && p.capacity > 0).slice(0, 3) : [];

  return (
    <AnimatePresence>
      {request && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
          <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className="fixed right-0 top-0 z-50 h-full w-full max-w-[500px] bg-surface border-l border-line-strong flex flex-col">
            <div className="flex items-start justify-between p-5 border-b border-line">
              <div>
                <div className="mono flex items-center gap-2 text-[10.5px] uppercase tracking-wider text-muted">
                  <span>{request.shortCode}</span>·<span className="uppercase">{STATUS_LABEL[request.status]}</span>·<UrgencyDot urgency={request.urgency} withLabel />
                </div>
                <h2 className="font-display text-[30px] leading-[1.05] mt-2">{request.summary}</h2>
                <div className="mt-2 flex flex-wrap gap-1">{request.needs.map((n) => <NeedChip key={n} need={n} />)}</div>
              </div>
              <button onClick={onClose} className="p-1.5 text-muted hover:text-ink"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <section className="border-l-2 border-ink pl-4 py-1">
                <div className="label mb-2">Resident's words · redacted</div>
                <p className="font-display text-[19px] leading-[1.35] text-ink">{highlight(request.redactedText)}</p>
                <div className="mono mt-3 flex items-center gap-1.5 text-[10.5px] text-brand"><ShieldCheck size={13} /> Identifiers removed before AI. Contact details {request.hasContact ? "held in the ComForce-only tier" : "not provided"}.</div>
              </section>

              <section className="grid grid-cols-2 gap-3 text-[13px]">
                <Field k="Neighborhood" v={request.neighborhood} />
                <Field k="Household" v={request.householdSize ? `${request.householdSize} people` : "—"} />
                <Field k="Channel" v={request.channel.toUpperCase()} />
                <Field k="Language" v={request.language === "es" ? "Spanish" : request.language === "hmn" ? "Hmong" : "English"} />
                <Field k="Owner" v={request.ownerName ? `${request.ownerName} · ${request.ownerOrg}` : "Unclaimed"} />
                <Field k="Consent to share" v={request.consentToShare ? "Yes, with partners" : "ComForce only"} />
              </section>

              {request.status === "new" && suggested.length > 0 && (
                <section>
                  <div className="label mb-2 border-b border-line pb-2">Partners with capacity</div>
                  <div className="space-y-2">
                    {suggested.map((p) => (
                      <div key={p.id} className="flex items-center justify-between border border-line p-3">
                        <div>
                          <div className="text-[13.5px] font-semibold">{p.name}</div>
                          <div className="mono text-[10.5px] text-muted">{p.hours} · {p.capacity} open slots</div>
                        </div>
                        <button disabled={busy} onClick={() => run({ action: "claim", ownerName: me.name, ownerOrg: p.name, partnerId: p.id })} className="border border-ink bg-ink px-3 py-1.5 text-[12px] font-medium text-bg hover:bg-brand hover:border-brand disabled:opacity-50">Route here</button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <div className="label mb-3 border-b border-line pb-2">Timeline</div>
                <ol className="relative border-l border-line ml-2 space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="ml-4">
                      <span className={`absolute -left-[9px] mt-0.5 flex h-[18px] w-[18px] items-center justify-center border ${a.type === "verified" ? "bg-brand border-brand text-white" : a.type === "reopened" ? "bg-accent border-accent text-white" : "bg-surface border-line text-muted"}`}>{ACTOR_ICON(a.actor)}</span>
                      <div className="text-[12.5px] leading-snug">{a.text}</div>
                      <div className="mono text-[10px] text-muted">{a.actor} · {new Date(a.at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                    </li>
                  ))}
                </ol>
              </section>
            </div>

            <div className="border-t border-line-strong p-4 space-y-2.5 bg-surface">
              {request.status === "new" && (
                <button disabled={busy} onClick={() => run({ action: "claim", ownerName: me.name, ownerOrg: me.org, partnerId: me.partnerId })} className="w-full inline-flex items-center justify-center gap-2 bg-ink py-3 text-[13.5px] font-medium text-bg hover:bg-brand disabled:opacity-50"><HandHelping size={16} /> Claim as {me.name}</button>
              )}
              {(request.status === "claimed" || request.status === "in_progress") && (
                <>
                  <div className="flex gap-2">
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an update…" className="flex-1 border border-line bg-surface px-3 py-2.5 text-[13.5px] outline-none focus:border-ink" />
                    <button disabled={busy || !note} onClick={() => { run({ action: "note", actor: me.name, text: note }); setNote(""); }} className="border border-line px-3 hover:border-ink disabled:opacity-50"><Send size={16} /></button>
                  </div>
                  <button disabled={busy} onClick={() => run({ action: "delivered", actor: me.name })} className="w-full inline-flex items-center justify-center gap-2 bg-ink py-3 text-[13.5px] font-medium text-bg hover:bg-brand disabled:opacity-50"><CheckCheck size={16} /> Mark delivered &amp; ask resident to confirm</button>
                </>
              )}
              {request.status === "delivered" && (
                <div className="border border-line p-3">
                  <div className="label mb-2">Awaiting resident reply · simulate</div>
                  <div className="grid grid-cols-3 gap-2">
                    <button disabled={busy} onClick={() => run({ action: "resident_reply", reply: "1" })} className="border border-brand text-brand py-2 text-[12px] font-medium hover:bg-brand hover:text-white">1 · Yes</button>
                    <button disabled={busy} onClick={() => run({ action: "resident_reply", reply: "2" })} className="border border-amber text-amber py-2 text-[12px] font-medium hover:bg-amber hover:text-white">2 · Partly</button>
                    <button disabled={busy} onClick={() => run({ action: "resident_reply", reply: "3" })} className="border border-accent text-accent py-2 text-[12px] font-medium inline-flex items-center justify-center gap-1 hover:bg-accent hover:text-white"><RotateCcw size={12} /> 3 · No</button>
                  </div>
                </div>
              )}
              {request.status === "verified" && (
                <div className="flex items-center gap-2 border border-brand bg-brand-soft p-3 text-[13px] font-medium text-brand"><ShieldCheck size={16} /> Loop closed. Confirmed by the resident, credited to {request.ownerOrg}.</div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="label">{k}</div>
      <div className="mt-0.5 text-[13px] font-medium">{v}</div>
    </div>
  );
}

/** Renders [name]/[phone]/[address] placeholders as visible redaction tokens. */
export function highlight(text: string) {
  const parts = text.split(/(\[(?:name|phone|address|email)\])/g);
  return parts.map((p, i) =>
    /^\[(name|phone|address|email)\]$/.test(p) ? (
      <span key={i} className="mono inline-block bg-ink text-bg px-1.5 text-[11px] align-middle mx-0.5 not-italic">{p}</span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

export { Avatar };
