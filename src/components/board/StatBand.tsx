"use client";
import { motion } from "motion/react";
import { fmtMinutes } from "@/lib/stats";

export function StatCard({ label, value, hint, delay = 0 }: { label: string; value: string | number; hint?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} className="card px-5 py-4 min-w-[150px]">
      <div className="font-display num text-[36px] leading-none font-semibold text-brand">{value}</div>
      <div className="mt-1.5 text-[12.5px] font-medium text-ink-2">{label}</div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </motion.div>
  );
}

export function StatBand({ open, median, verifiedPct, total }: { open: number; median: number; verifiedPct: number; total: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      <StatCard label="open requests" value={open} hint={`${total} total this month`} />
      <StatCard label="median time to help" value={median ? fmtMinutes(median) : "—"} hint="first contact → delivered" delay={0.05} />
      <StatCard label="resident-verified" value={`${verifiedPct}%`} hint="confirmed by the person helped" delay={0.1} />
    </div>
  );
}
