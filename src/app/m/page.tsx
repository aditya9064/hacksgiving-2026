"use client";
import { useMemo, useState } from "react";
import { HandHelping, CheckCheck, Send, MapPin, Users, Smartphone, MessageSquareText, Wifi, Battery, Signal, ChevronLeft, ShieldCheck } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { SectionCard } from "@/components/ui/StatCard";
import { NeedChip, UrgencyChip, AttentionBadge } from "@/components/ui/Chip";
import { useSnapshot, act, type SafeRequest } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { timeAgo } from "@/lib/stats";
import { STATUS_LABEL } from "@/lib/types";

type Tab = "nearby" | "mine";

export default function MobilePage() {
  const { data, reload } = useSnapshot();
  const [me] = useMe();
  const now = useClock();
  const [tab, setTab] = useState<Tab>("nearby");
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const requests = data?.requests ?? [];
  const nearby = requests.filter((r) => r.status === "new").sort((a, b) => (a.urgency === "critical" ? -1 : 1) - (b.urgency === "critical" ? -1 : 1));
  const mine = requests.filter((r) => r.ownerName === me.name && r.status !== "verified");
  const list = tab === "nearby" ? nearby : mine;
  const open = requests.find((r) => r.id === openId);
  const unclaimed = nearby.length;

  const run = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    try { await act(id, body); await reload(); } finally { setBusy(false); }
  };

  return (
    <AppShell
      title={<>Volunteer Phone <span className="chip chip-soft bg-brand-soft text-brand">Responsive web · no app store</span></>}
      subtitle="What a responder sees in the field. Three big buttons: Claim, Update, Done. Everything syncs to the Board in under two seconds."
      badge={unclaimed}
      me={me.name}
      actions={<><Btn href="/board">Open Board</Btn><Btn variant="solid" href="/r"><MessageSquareText size={15} /> Resident intake</Btn></>}
    >
      <div className="grid grid-cols-3 gap-3.5">
        <div className="col-span-1 flex justify-center">
          <Phone>
            {!open ? (
              <div className="flex flex-col h-full">
                <div className="px-4 pt-2 pb-3">
                  <div className="text-[18px] font-bold">Hi, {me.name.split(" ")[0]} 👋</div>
                  <div className="text-[12px] text-muted">{me.org}</div>
                  <div className="seg mt-3 w-full">
                    <button onClick={() => setTab("nearby")} className={`seg-item flex-1 justify-center ${tab === "nearby" ? "active-blue" : ""}`}>Needs a hand <span className="count">{nearby.length}</span></button>
                    <button onClick={() => setTab("mine")} className={`seg-item flex-1 justify-center ${tab === "mine" ? "active-blue" : ""}`}>Mine <span className="count">{mine.length}</span></button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto px-3 pb-3 space-y-2">
                  {list.map((r) => (
                    <button key={r.id} onClick={() => setOpenId(r.id)} className={`card w-full text-left p-3 ${r.urgency === "critical" ? "!border-red/40" : ""}`}>
                      <div className="flex items-center gap-1.5 flex-wrap">{r.needs.slice(0, 2).map((n) => <NeedChip key={n} need={n} />)}<UrgencyChip urgency={r.urgency} /></div>
                      <div className="mt-1.5 text-[13.5px] font-semibold leading-snug">{r.summary}</div>
                      {r.ownerName === me.name && r.attention.level !== "none" && (
                        <div className="mt-1.5">
                          <AttentionBadge level={r.attention.level} />
                          <div className="mt-1 text-[11.5px] text-ink-2 leading-snug">{r.attention.reason}</div>
                        </div>
                      )}
                      <div className="mt-1 flex items-center justify-between text-[11.5px] text-muted"><span className="flex items-center gap-1"><MapPin size={11} />{r.neighborhood}</span><span>{timeAgo(r.createdAt, now)}</span></div>
                    </button>
                  ))}
                  {!list.length && <div className="text-center text-[13px] text-muted py-10">Nothing here right now.</div>}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="px-3 pt-1 pb-2 flex items-center gap-2">
                  <button onClick={() => setOpenId(null)} className="p-1 -ml-1 text-brand"><ChevronLeft size={20} /></button>
                  <span className="text-[12px] text-muted">{open.shortCode} · {STATUS_LABEL[open.status]}</span>
                </div>
                <div className="flex-1 overflow-auto px-4 space-y-3">
                  <div className="flex items-center gap-1.5 flex-wrap">{open.needs.map((n) => <NeedChip key={n} need={n} />)}<UrgencyChip urgency={open.urgency} /></div>
                  <h3 className="text-[17px] font-bold leading-snug">{open.summary}</h3>
                  <div className="card p-3 text-[13px] leading-relaxed text-ink-2">"{open.redactedText}"</div>
                  <div className="rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] space-y-1">
                    <div className="flex justify-between"><span className="text-ink-2">Neighborhood</span><span className="font-medium">{open.neighborhood}</span></div>
                    {open.householdSize && <div className="flex justify-between"><span className="text-ink-2">Household</span><span className="font-medium">{open.householdSize} people</span></div>}
                    <div className="flex justify-between"><span className="text-ink-2">Owner</span><span className="font-medium">{open.ownerName ?? "Unassigned"}</span></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-brand"><ShieldCheck size={12} /> Contact details stay with ComForce staff.</div>
                </div>
                <div className="p-3 space-y-2 border-t border-line bg-surface">
                  {open.status === "new" && <button disabled={busy} onClick={() => run(open.id, { action: "claim", ownerName: me.name, ownerOrg: me.org, partnerId: me.partnerId })} className="w-full h-12 rounded-xl bg-brand text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"><HandHelping size={18} /> I'll take this</button>}
                  {(open.status === "claimed" || open.status === "in_progress") && (
                    <>
                      <div className="flex gap-2">
                        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Quick update…" className="input !pl-3 !h-11" />
                        <button disabled={busy || !note} onClick={() => { run(open.id, { action: "note", actor: me.name, text: note }); setNote(""); }} className="h-11 w-11 shrink-0 rounded-xl border border-line inline-flex items-center justify-center disabled:opacity-40"><Send size={16} /></button>
                      </div>
                      <button disabled={busy} onClick={() => run(open.id, { action: "delivered", actor: me.name })} className="w-full h-12 rounded-xl bg-green text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-50"><CheckCheck size={18} /> Done, ask resident to confirm</button>
                    </>
                  )}
                  {open.status === "delivered" && <div className="rounded-xl bg-brand-soft text-brand px-3 py-3 text-[13px] font-medium text-center">Waiting for the resident's reply…</div>}
                </div>
              </div>
            )}
          </Phone>
        </div>

        <div className="col-span-2 space-y-3.5">
          <SmsSimulator onDone={reload} requests={requests} />
          <SectionCard title={<span className="flex items-center gap-2"><Users size={15} className="text-brand" /> Why a phone view</span>}>
            <div className="p-4 grid grid-cols-3 gap-3 text-[13px]">
              {[
                ["No app store", "A link in a text message. Works on any phone a volunteer already has, including prepaid."],
                ["Three buttons", "Claim, Update, Done. A responder on a porch at 9pm should never need a dropdown."],
                ["Syncs in 2s", "Every tap shows up on the Board and in the partner's view before the volunteer puts the phone away."],
              ].map(([t, d]) => <div key={t} className="rounded-lg bg-surface-2 p-3"><div className="font-semibold mb-1">{t}</div><div className="text-ink-2 leading-snug">{d}</div></div>)}
            </div>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[360px] h-[720px] rounded-[40px] bg-[#111827] p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,.35)]">
      <div className="h-full w-full rounded-[32px] bg-bg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold"><span>9:41</span><span className="flex items-center gap-1 text-ink-2"><Signal size={12} /><Wifi size={12} /><Battery size={14} /></span></div>
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}

function SmsSimulator({ onDone, requests }: { onDone: () => void; requests: SafeRequest[] }) {
  const [from] = useState("+1 (414) 555-0142");
  const [body, setBody] = useState("");
  const [log, setLog] = useState<{ dir: "in" | "out"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const delivered = useMemo(() => requests.filter((r) => r.status === "delivered"), [requests]);

  const send = async (text = body) => {
    if (!text.trim()) return;
    setLog((l) => [...l, { dir: "in", text }]);
    setBody("");
    setBusy(true);
    try {
      const r = await fetch("/api/sms/simulate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ from, body: text }) });
      const j = await r.json();
      setLog((l) => [...l, { dir: "out", text: j.reply }]);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <SectionCard title={<span className="flex items-center gap-2"><Smartphone size={15} className="text-brand" /> Resident SMS · live simulator</span>} action={<span className="chip chip-soft bg-green-soft text-green">same handler as the Twilio webhook</span>}>
      <div className="grid grid-cols-5">
        <div className="col-span-3 border-r border-line flex flex-col h-[330px]">
          <div className="flex-1 overflow-auto p-4 space-y-2">
            {!log.length && <div className="text-[12.5px] text-muted">Text as a resident from {from}. A new message opens a request; replying <b>1</b>, <b>2</b> or <b>3</b> to a code closes the loop.</div>}
            {log.map((m, i) => <div key={i} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${m.dir === "in" ? "ml-auto bg-brand text-white rounded-br-md" : "bg-surface-3 text-ink rounded-bl-md"}`}>{m.text}</div>)}
            {busy && <div className="w-fit rounded-2xl bg-surface-3 px-3.5 py-2 text-[13px] text-muted"><span className="blink">…</span></div>}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-line p-3 flex gap-2">
            <input value={body} onChange={(e) => setBody(e.target.value)} className="input !pl-3" placeholder="Type a text message…" />
            <button disabled={busy || !body.trim()} className="rounded-lg bg-brand px-3.5 text-white disabled:opacity-40"><Send size={15} /></button>
          </form>
        </div>
        <div className="col-span-2 p-4 space-y-2 overflow-auto h-[330px]">
          <div className="text-[12px] font-semibold text-ink-2">Quick scripts</div>
          {[
            "Hi this is Denise, my lights are getting shut off Monday, I'm $180 behind. I'm on 27th and Center.",
            "Hola necesito ayuda, no tenemos comida para mis hijos hasta el viernes. Vivimos cerca de Mitchell St.",
            "My neighbor keeps threatening me over the fence, I'm scared it's gonna pop off. Harambee.",
          ].map((s) => <button key={s} onClick={() => send(s)} className="block w-full text-left rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] leading-snug hover:border-brand hover:bg-brand-soft/40">{s}</button>)}
          {delivered.length > 0 && (
            <>
              <div className="pt-2 text-[12px] font-semibold text-ink-2">Close the loop</div>
              {delivered.slice(0, 2).map((r) => (
                <div key={r.id} className="rounded-lg border border-line bg-surface p-2.5">
                  <div className="text-[12px] text-muted mb-1.5 truncate">{r.shortCode} · {r.summary}</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={() => send(`${r.shortCode} 1`)} className="rounded-md border border-green text-green text-[12px] py-1 font-medium hover:bg-green hover:text-white">1 Yes</button>
                    <button onClick={() => send(`${r.shortCode} 2`)} className="rounded-md border border-orange text-[#b45309] text-[12px] py-1 font-medium hover:bg-orange hover:text-white">2 Partly</button>
                    <button onClick={() => send(`${r.shortCode} 3`)} className="rounded-md border border-red text-red text-[12px] py-1 font-medium hover:bg-red hover:text-white">3 No</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
