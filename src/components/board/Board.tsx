"use client";
import { AnimatePresence, motion } from "motion/react";
import { MessageSquareText, Mic, Globe, Users, Check, RotateCcw } from "lucide-react";
import type { SafeRequest } from "@/lib/client/useSnapshot";
import type { ActivityEvent } from "@/lib/types";
import { STATUSES, STATUS_LABEL } from "@/lib/types";
import { timeAgo } from "@/lib/stats";
import { Avatar, NeedChip, NEED_COLOR } from "../ui/Chip";

const ChannelIcon = ({ c }: { c: SafeRequest["channel"] }) =>
  c === "sms" ? <MessageSquareText size={11} /> : c === "voice" ? <Mic size={11} /> : c === "web" ? <Globe size={11} /> : <Users size={11} />;

export function RequestCard({ r, fresh, onClick, now }: { r: SafeRequest; fresh: boolean; onClick: () => void; now: number }) {
  const reopened = r.residentFeedback === "no" && r.status !== "verified";
  const edge = r.urgency === "critical" ? "border-l-accent" : r.urgency === "high" ? "border-l-amber" : "border-l-transparent";
  return (
    <motion.button
      layout
      layoutId={r.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      onClick={onClick}
      className={`group relative w-full border border-l-[3px] bg-surface text-left transition-colors hover:border-ink hover:border-l-ink ${edge} ${fresh ? "border-brand border-l-brand" : "border-line"}`}
    >
      <div className="p-3">
        <div className="mono flex items-center justify-between text-[10.5px] text-muted">
          <span>{r.shortCode}</span>
          <span className="inline-flex items-center gap-1.5">
            {fresh && <span className="bg-brand px-1 text-bg">NEW</span>}
            {r.urgency === "critical" && <span className="text-accent">CRITICAL</span>}
            {r.urgency === "high" && <span className="text-amber">HIGH</span>}
            <ChannelIcon c={r.channel} /> {timeAgo(r.createdAt, now)}
          </span>
        </div>
        <div className="mt-2 text-[14px] font-semibold leading-[1.25] text-ink">{r.summary}</div>
        <p className="mt-1.5 text-[12.5px] leading-[1.4] text-ink-2 line-clamp-2">{r.redactedText}</p>
        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-ink truncate">{r.neighborhood}{r.householdSize ? <span className="text-muted font-normal"> · household {r.householdSize}</span> : null}</div>
            <div className="mt-1.5 flex flex-wrap gap-1">{r.needs.slice(0, 3).map((n) => <NeedChip key={n} need={n} />)}</div>
          </div>
          <Avatar name={r.ownerName} />
        </div>
      </div>
      {r.status === "verified" && (
        <div className="mono flex items-center gap-1.5 border-t border-line bg-brand-soft px-3 py-1.5 text-[10.5px] uppercase tracking-wider text-brand"><Check size={11} /> {r.residentFeedback === "partial" ? "Resident: partly helped" : "Verified by resident"}</div>
      )}
      {reopened && (
        <div className="mono flex items-center gap-1.5 border-t border-line bg-accent-soft px-3 py-1.5 text-[10.5px] uppercase tracking-wider text-accent"><RotateCcw size={11} /> Reopened by resident</div>
      )}
    </motion.button>
  );
}

export function Board({ requests, fresh, onOpen, now }: { requests: SafeRequest[]; fresh: Set<string>; onOpen: (id: string) => void; now: number }) {
  return (
    <div className="grid grid-cols-5 min-w-[1100px] divide-x divide-line">
      {STATUSES.map((s, i) => {
        const items = requests.filter((r) => r.status === s);
        return (
          <section key={s} className="flex flex-col min-h-[70vh] px-3 first:pl-0 last:pr-0">
            <header className="flex items-baseline justify-between py-3 border-b border-line mb-3">
              <h3 className="inline-flex items-baseline gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink"><span className="mono text-[10px] text-muted">0{i + 1}</span>{STATUS_LABEL[s]}</h3>
              <span className="font-display num text-[22px] leading-none text-ink">{items.length}</span>
            </header>
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {items.map((r) => <RequestCard key={r.id} r={r} fresh={fresh.has(r.id)} onClick={() => onOpen(r.id)} now={now} />)}
              </AnimatePresence>
              {items.length === 0 && <div className="mono py-8 text-center text-[10.5px] uppercase tracking-wider text-muted">— empty —</div>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function SignalRail({ byNeighborhood, activity, requests, now }: { byNeighborhood: { neighborhood: string; open: number; total: number }[]; activity: ActivityEvent[]; requests: SafeRequest[]; now: number }) {
  const max = Math.max(1, ...byNeighborhood.map((n) => n.total));
  const recent = [...activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 9);
  const needTotals = requests.flatMap((r) => r.needs).reduce<Record<string, number>>((acc, n) => ((acc[n] = (acc[n] ?? 0) + 1), acc), {});
  const needSum = Object.values(needTotals).reduce((a, b) => a + b, 0) || 1;
  return (
    <aside className="w-[300px] shrink-0 border-l border-line pl-6 space-y-8">
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2 mb-3"><span className="label">Need mix</span><span className="mono text-[10.5px] text-muted">{needSum} tags</span></div>
        <div className="flex h-2 w-full overflow-hidden">
          {Object.entries(needTotals).sort((a, b) => b[1] - a[1]).map(([n, c]) => <span key={n} style={{ width: `${(c / needSum) * 100}%`, background: NEED_COLOR[n as keyof typeof NEED_COLOR] }} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(needTotals).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([n, c]) => (
            <span key={n} className="mono inline-flex items-center gap-1.5 text-[10.5px] text-ink-2"><i className="inline-block h-1.5 w-1.5" style={{ background: NEED_COLOR[n as keyof typeof NEED_COLOR] }} />{n} {c}</span>
          ))}
        </div>
      </section>
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2 mb-3"><span className="label">Neighborhoods by open need</span></div>
        <ul className="space-y-2">
          {byNeighborhood.slice(0, 7).map((n) => (
            <li key={n.neighborhood}>
              <div className="flex items-baseline justify-between text-[12px]"><span className="text-ink">{n.neighborhood}</span><span className="mono num text-[10.5px] text-muted">{n.open}/{n.total}</span></div>
              <div className="mt-1 h-[3px] w-full bg-surface-2"><div className="h-full bg-ink" style={{ width: `${(n.total / max) * 100}%` }} /><div className="-mt-[3px] h-[3px] bg-brand" style={{ width: `${(n.open / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="flex items-baseline justify-between border-b border-line pb-2 mb-3"><span className="label">Activity</span><span className="mono inline-flex items-center gap-1.5 text-[10.5px] text-muted"><span className="h-1 w-1 rounded-full bg-accent blink" />live</span></div>
        <ul className="space-y-2.5">
          {recent.map((a) => (
            <li key={a.id} className="grid grid-cols-[44px_1fr] gap-2 text-[11.5px] leading-snug">
              <span className="mono text-[10px] text-muted pt-0.5">{timeAgo(a.at, now)}</span>
              <span className={a.type === "verified" ? "text-brand" : a.type === "reopened" ? "text-accent" : "text-ink-2"}><span className="font-medium text-ink">{a.actor}</span> · {a.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
