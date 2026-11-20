"use client";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search, Sparkles, Send, Plus, Clock, Users, Shield } from "lucide-react";
import { AppShell, Btn } from "@/components/AppShell";
import { StatCard, SectionCard } from "@/components/ui/StatCard";
import { NeedChip } from "@/components/ui/Chip";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { NEED_LABEL, type Need, type Playbook } from "@/lib/types";

const SUGGESTED = ["What do I do if a neighbor dispute mentions a weapon?", "Can We Energies shut off heat in November?", "A tenant got a 5-day notice, what's the first step?", "Family displaced by fire tonight, who do I call first?"];

export default function GuidePage() {
  const { data } = useSnapshot(5000);
  const [me] = useMe();
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<Need | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [thread, setThread] = useState<{ role: "you" | "guide"; text: string; sources?: string[] }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/playbooks").then((r) => r.json()).then((j) => { setPlaybooks(j.playbooks); setOpenId(j.playbooks[0]?.id ?? null); });
  }, []);

  const tags = useMemo(() => [...new Set(playbooks.flatMap((p) => p.tags))], [playbooks]);
  const list = playbooks.filter((p) => tag === "all" || p.tags.includes(tag)).filter((p) => !q || (p.title + p.body).toLowerCase().includes(q.toLowerCase()));
  const open = playbooks.find((p) => p.id === openId) ?? list[0];
  const unclaimed = (data?.requests ?? []).filter((r) => r.status === "new").length;

  const ask = async (text = question) => {
    if (!text.trim()) return;
    setThread((t) => [...t, { role: "you", text }]);
    setQuestion("");
    setBusy(true);
    try {
      const r = await fetch("/api/guide", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text }) });
      const j = await r.json();
      setThread((t) => [...t, { role: "guide", text: j.answer, sources: j.sources }]);
      if (j.sources?.[0]) setOpenId(j.sources[0]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell
      title={<>Volunteer Guide <span className="chip chip-soft bg-purple-soft text-purple">Institutional memory</span></>}
      subtitle="How ComForce actually does the work, written down once so it survives staff turnover. Ask in plain English."
      badge={unclaimed}
      me={me.name}
      actions={<><Btn variant="solid"><Plus size={15} /> New playbook</Btn><Btn>Suggest an edit</Btn></>}
    >
      <div className="grid grid-cols-4 gap-3.5 mb-5">
        <StatCard icon={<BookOpen size={14} />} label="Playbooks" value={playbooks.length} sub="field-tested procedures" />
        <StatCard icon={<Clock size={14} />} label="Last Updated" value={playbooks.length ? new Date(Math.max(...playbooks.map((p) => +new Date(p.updatedAt)))).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"} sub="kept current by the team" tint="blue" valueClass="!text-[22px]" />
        <StatCard icon={<Users size={14} />} label="Needs Covered" value={tags.length} sub={`of ${Object.keys(NEED_LABEL).length} need types`} tint="purple" />
        <StatCard icon={<Shield size={14} />} label="Safety Rule" value="Pairs" sub="never respond alone" tint="orange" valueClass="!text-[22px]" />
      </div>

      <div className="grid grid-cols-3 gap-3.5">
        <div className="space-y-3.5">
          <div className="card p-3 space-y-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search playbooks..." />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setTag("all")} className={`chip ${tag === "all" ? "!bg-brand !text-white !border-brand" : ""}`}>All</button>
              {tags.map((t) => <button key={t} onClick={() => setTag(t)} className={`chip ${tag === t ? "!bg-brand !text-white !border-brand" : ""}`}>{NEED_LABEL[t]}</button>)}
            </div>
          </div>
          <SectionCard title="Playbooks" action={<span className="count">{list.length}</span>}>
            <ul className="divide-y divide-line">
              {list.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setOpenId(p.id)} className={`w-full text-left px-4 py-3 hover:bg-surface-2 ${open?.id === p.id ? "bg-brand-soft/60 border-l-2 border-brand" : "border-l-2 border-transparent"}`}>
                    <div className="text-[13.5px] font-medium">{p.title}</div>
                    <div className="mt-1.5 flex items-center justify-between"><div className="flex gap-1">{p.tags.slice(0, 2).map((t) => <NeedChip key={t} need={t} />)}</div><span className="text-[11px] text-muted">{p.updatedAt}</span></div>
                  </button>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>

        <SectionCard title={open?.title ?? "Select a playbook"} action={open && <span className="text-[11.5px] text-muted">Updated {open.updatedAt}</span>}>
          {open && (
            <div className="p-5">
              <div className="flex gap-1 mb-4">{open.tags.map((t) => <NeedChip key={t} need={t} />)}</div>
              <ol className="space-y-3">
                {open.body.split("\n").map((line, i) => {
                  const m = line.match(/^(\d+)\.\s*(.*)$/);
                  return (
                    <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed">
                      <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11.5px] font-semibold text-brand">{m ? m[1] : i + 1}</span>
                      <span>{m ? m[2] : line}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 rounded-lg bg-surface-2 px-3 py-2.5 text-[12px] text-ink-2 flex items-center gap-2"><Shield size={13} className="text-brand" /> If weapons are present or someone is in immediate danger, leave and call 911. Then notify the on-call lead.</div>
            </div>
          )}
        </SectionCard>

        <SectionCard title={<span className="flex items-center gap-2"><Sparkles size={15} className="text-brand" /> Ask the Guide</span>} action={<span className="chip chip-soft bg-brand-soft text-brand">answers only from playbooks</span>}>
          <div className="flex flex-col h-[560px]">
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {!thread.length && (
                <div className="space-y-2">
                  <div className="text-[12.5px] text-muted">Try one of these:</div>
                  {SUGGESTED.map((s) => <button key={s} onClick={() => ask(s)} className="block w-full text-left rounded-lg border border-line bg-surface px-3 py-2 text-[13px] hover:border-brand hover:bg-brand-soft/40">{s}</button>)}
                </div>
              )}
              {thread.map((m, i) => (
                <div key={i} className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line ${m.role === "you" ? "ml-auto bg-brand text-white" : "bg-surface-2 text-ink"}`}>
                  {m.text}
                  {m.sources && m.sources.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{m.sources.map((s) => { const p = playbooks.find((x) => x.id === s); return p ? <button key={s} onClick={() => setOpenId(s)} className="chip !text-[10.5px] hover:border-brand">{p.title}</button> : null; })}</div>}
                </div>
              ))}
              {busy && <div className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-[13px] text-muted w-fit"><span className="blink">Reading playbooks…</span></div>}
            </div>
            <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="border-t border-line p-3 flex gap-2">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} className="input !pl-3" placeholder="Ask how we handle something…" />
              <button disabled={busy || !question.trim()} className="rounded-lg bg-brand px-3.5 text-white disabled:opacity-40"><Send size={15} /></button>
            </form>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
