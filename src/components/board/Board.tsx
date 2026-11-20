"use client";
import { AnimatePresence, motion } from "motion/react";
import { MapPin, MessageSquareText, Mic, Globe, CheckCircle2, RotateCcw, Users } from "lucide-react";
import type { SafeRequest } from "@/lib/client/useSnapshot";
import { STATUSES, STATUS_LABEL, type Status } from "@/lib/types";
import { timeAgo } from "@/lib/stats";
import { Avatar, NeedChip, UrgencyDot } from "../ui/Chip";

const COL_TINT: Record<Status, string> = {
  new: "bg-surface-2",
  claimed: "bg-blue-50 dark:bg-blue-950/30",
  in_progress: "bg-amber-50 dark:bg-amber-950/30",
  delivered: "bg-emerald-50 dark:bg-emerald-950/30",
  verified: "bg-brand-soft",
};

const ChannelIcon = ({ c }: { c: SafeRequest["channel"] }) =>
  c === "sms" ? <MessageSquareText size={12} /> : c === "voice" ? <Mic size={12} /> : c === "web" ? <Globe size={12} /> : <Users size={12} />;

export function RequestCard({ r, fresh, onClick, now }: { r: SafeRequest; fresh: boolean; onClick: () => void; now: number }) {
  const reopened = r.residentFeedback === "no" && r.status !== "verified";
  return (
    <motion.button
      layout
      layoutId={r.id}
      initial={{ opacity: 0, y: -14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 420, damping: 32 }}
      onClick={onClick}
      className={`card relative w-full text-left p-3.5 hover:-translate-y-0.5 hover:shadow-lg transition-all cursor-pointer ${fresh ? "ring-2 ring-brand ring-offset-2 ring-offset-bg" : ""}`}
    >
      {fresh && <span className="absolute -top-2 right-3 chip bg-brand text-white">NEW</span>}
      <div className="flex flex-wrap gap-1 mb-2">
        {r.needs.map((n) => (
          <NeedChip key={n} need={n} />
        ))}
      </div>
      <div className="text-[13.5px] font-semibold leading-snug text-ink">{r.summary}</div>
      <div className="mt-1.5 flex items-center gap-1 text-[11.5px] text-ink-2">
        <MapPin size={11} /> {r.neighborhood}
        {r.householdSize ? <span className="text-muted">· household of {r.householdSize}</span> : null}
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-ink-2 line-clamp-2">{r.redactedText}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <UrgencyDot urgency={r.urgency} />
          <span className="inline-flex items-center gap-1"><ChannelIcon c={r.channel} /> {timeAgo(r.createdAt, now)}</span>
        </div>
        <Avatar name={r.ownerName} />
      </div>
      {r.status === "verified" && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-brand-soft px-2 py-1 text-[11px] font-semibold text-brand">
          <CheckCircle2 size={12} /> {r.residentFeedback === "partial" ? "Resident: partly helped" : "Verified by resident"}
        </div>
      )}
      {reopened && (
        <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-accent-soft px-2 py-1 text-[11px] font-semibold text-accent">
          <RotateCcw size={12} /> Reopened by resident
        </div>
      )}
    </motion.button>
  );
}

export function Board({ requests, fresh, onOpen, now }: { requests: SafeRequest[]; fresh: Set<string>; onOpen: (id: string) => void; now: number }) {
  return (
    <div className="grid grid-cols-5 gap-3 min-w-[1040px]">
      {STATUSES.map((s) => {
        const items = requests.filter((r) => r.status === s);
        return (
          <section key={s} className={`rounded-2xl ${COL_TINT[s]} p-2.5 flex flex-col min-h-[60vh]`}>
            <header className="flex items-center justify-between px-1.5 py-1.5 mb-1">
              <h3 className="text-[12px] font-bold uppercase tracking-wider text-ink-2">{STATUS_LABEL[s]}</h3>
              <span className="num rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-2 border border-line">{items.length}</span>
            </header>
            <div className="flex flex-col gap-2.5">
              <AnimatePresence initial={false}>
                {items.map((r) => (
                  <RequestCard key={r.id} r={r} fresh={fresh.has(r.id)} onClick={() => onOpen(r.id)} now={now} />
                ))}
              </AnimatePresence>
            </div>
          </section>
        );
      })}
    </div>
  );
}
