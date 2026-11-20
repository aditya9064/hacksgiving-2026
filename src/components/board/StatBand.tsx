"use client";
import { motion } from "motion/react";
import { fmtMinutes } from "@/lib/stats";

function Stat({ label, value, hint, delay = 0 }: { label: string; value: string | number; hint?: string; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }} className="pl-6 first:pl-0 border-l first:border-0 border-line min-w-[160px]">
      <div className="label">{label}</div>
      <div className="font-display num mt-1 text-[64px] leading-[0.9] text-ink">{value}</div>
      {hint && <div className="mono mt-2 text-[10.5px] text-muted">{hint}</div>}
    </motion.div>
  );
}

export function StatBand({ open, median, verifiedPct, total }: { open: number; median: number; verifiedPct: number; total: number }) {
  return (
    <div className="flex gap-6">
      <Stat label="Open requests" value={open} hint={`${total} total · this month`} />
      <Stat label="Median time to help" value={median ? fmtMinutes(median) : "—"} hint="first contact → delivered" delay={0.05} />
      <Stat label="Resident-verified" value={`${verifiedPct}%`} hint="confirmed by the person helped" delay={0.1} />
    </div>
  );
}
