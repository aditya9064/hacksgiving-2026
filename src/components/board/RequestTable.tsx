"use client";
import { useMemo, useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, MessageSquareText, Mic, Globe, Users, RotateCcw } from "lucide-react";
import type { SafeRequest } from "@/lib/client/useSnapshot";
import { STATUS_LABEL, URGENCIES, STATUSES } from "@/lib/types";
import { timeAgo } from "@/lib/stats";
import { NeedChip, UrgencyDot, Avatar } from "../ui/Chip";

const CHANNEL = { sms: ["SMS", MessageSquareText], voice: ["Voice", Mic], web: ["Web", Globe], partner: ["Partner", Users] } as const;
const STATUS_STYLE: Record<string, string> = {
  new: "!bg-brand-soft !text-brand",
  claimed: "!bg-purple-soft !text-purple",
  in_progress: "!bg-orange-soft !text-orange",
  delivered: "!bg-green-soft !text-green",
  verified: "!bg-green-soft !text-green",
};

type SortKey = "code" | "summary" | "urgency" | "status" | "neighborhood" | "owner" | "age" | "updated";
const COLS: { key: SortKey; label: string; className?: string }[] = [
  { key: "code", label: "Request", className: "w-[96px]" },
  { key: "summary", label: "Summary" },
  { key: "urgency", label: "Urgency", className: "w-[104px]" },
  { key: "status", label: "Status", className: "w-[112px]" },
  { key: "neighborhood", label: "Neighborhood", className: "w-[140px]" },
  { key: "owner", label: "Owner", className: "w-[190px]" },
  { key: "age", label: "Opened", className: "w-[86px]" },
  { key: "updated", label: "Updated", className: "w-[86px]" },
];

function sortValue(r: SafeRequest, k: SortKey): string | number {
  switch (k) {
    case "code": return r.shortCode;
    case "summary": return r.summary.toLowerCase();
    case "urgency": return -URGENCIES.indexOf(r.urgency);
    case "status": return STATUSES.indexOf(r.status);
    case "neighborhood": return r.neighborhood;
    case "owner": return r.ownerName ?? "zzz";
    case "age": return r.createdAt;
    case "updated": return -new Date(r.updatedAt).getTime();
  }
}

export function RequestTable({ requests, onOpen, now }: { requests: SafeRequest[]; onOpen: (id: string) => void; now: number }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "updated", dir: 1 });
  const rows = useMemo(() => [...requests].sort((a, b) => {
    const va = sortValue(a, sort.key), vb = sortValue(b, sort.key);
    return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
  }), [requests, sort]);
  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: 1 }));

  return (
    <div className="card overflow-hidden">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">
            {COLS.map((c) => {
              const active = sort.key === c.key;
              const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
              return (
                <th key={c.key} className={`px-3 py-2.5 font-semibold ${c.className ?? ""}`}>
                  <button onClick={() => toggle(c.key)} className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""}`}>{c.label} <Icon size={11} className={active ? "text-brand" : "opacity-50"} /></button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const [chLabel, ChIcon] = CHANNEL[r.channel];
            const reopened = r.residentFeedback === "no" && r.status !== "verified";
            return (
              <tr key={r.id} onClick={() => onOpen(r.id)} className="cursor-pointer border-t border-line hover:bg-surface-2/60">
                <td className="px-3 py-2.5 align-top">
                  <div className="font-mono text-[12px] font-semibold text-ink">{r.shortCode}</div>
                  <div className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted"><ChIcon size={10} /> {chLabel}</div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{r.summary}</span>
                    {reopened && <span className="inline-flex items-center gap-1 rounded-full bg-red-soft px-1.5 py-0.5 text-[10px] font-semibold text-red"><RotateCcw size={9} /> Reopened</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">{r.needs.map((n) => <NeedChip key={n} need={n} />)}</div>
                </td>
                <td className="px-3 py-2.5 align-top"><UrgencyDot urgency={r.urgency} withLabel /></td>
                <td className="px-3 py-2.5 align-top"><span className={`chip chip-soft ${STATUS_STYLE[r.status]}`}>{r.status === "new" ? "Unclaimed" : STATUS_LABEL[r.status]}</span></td>
                <td className="px-3 py-2.5 align-top text-ink-2">{r.neighborhood}</td>
                <td className="px-3 py-2.5 align-top">
                  {r.ownerName ? (
                    <div className="flex items-center gap-2"><Avatar name={r.ownerName} size={22} /><div className="leading-tight"><div className="font-medium text-ink">{r.ownerName}</div><div className="text-[11px] text-muted">{r.ownerOrg}</div></div></div>
                  ) : <span className="text-[12px] font-medium text-red">Unassigned</span>}
                </td>
                <td className="px-3 py-2.5 align-top text-ink-2 whitespace-nowrap">{timeAgo(r.createdAt, now)}</td>
                <td className="px-3 py-2.5 align-top text-ink-2 whitespace-nowrap">{timeAgo(r.updatedAt, now)}</td>
              </tr>
            );
          })}
          {rows.length === 0 && <tr><td colSpan={COLS.length} className="px-3 py-10 text-center text-[13px] text-muted">No requests match these filters.</td></tr>}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-line bg-surface-2 px-3 py-2 text-[11.5px] text-muted">
        <span>{rows.length} request{rows.length === 1 ? "" : "s"} · click a row to open</span>
        <span>Sorted by {COLS.find((c) => c.key === sort.key)?.label.toLowerCase()}</span>
      </div>
    </div>
  );
}
