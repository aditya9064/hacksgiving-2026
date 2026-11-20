"use client";
import { useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Search, LayoutGrid, Table2 } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { Board } from "@/components/board/Board";
import { RequestDrawer } from "@/components/board/RequestDrawer";
import { StatBand } from "@/components/board/StatBand";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { computeStats } from "@/lib/stats";
import { NEED_LABEL, NEIGHBORHOODS, type Need } from "@/lib/types";

export default function BoardPage() {
  const { data, fresh, reload } = useSnapshot();
  const [me] = useMe();
  const [openId, setOpenId] = useState<string | null>(null);
  const [need, setNeed] = useState<Need | "all">("all");
  const [q, setQ] = useState("");
  const [hood, setHood] = useState("all");
  const [urg, setUrg] = useState("all");
  const [status, setStatus] = useState("all");
  const now = useClock();

  // Deep links from the top bar: /board?q=…&status=new
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("q")) setQ(sp.get("q")!);
    if (sp.get("status")) setStatus(sp.get("status")!);
  }, []);

  const stats = useMemo(() => (data ? computeStats(data.requests, data.partners) : null), [data]);
  const all = data?.requests ?? [];
  const needCounts = useMemo(() => all.reduce<Record<string, number>>((a, r) => { r.needs.forEach((n) => (a[n] = (a[n] ?? 0) + 1)); return a; }, {}), [all]);
  const topNeeds = Object.entries(needCounts).sort((a, b) => b[1] - a[1]).slice(0, 4) as [Need, number][];

  const filtered = all.filter((r) =>
    (need === "all" || r.needs.includes(need)) &&
    (hood === "all" || r.neighborhood === hood) &&
    (urg === "all" || r.urgency === urg) &&
    (status === "all" || r.status === status) &&
    (!q || `${r.summary} ${r.redactedText} ${r.neighborhood} ${r.shortCode}`.toLowerCase().includes(q.toLowerCase()))
  );
  const open = all.find((r) => r.id === openId) ?? null;
  const unclaimed = all.filter((r) => r.status === "new").length;
  const reopened = all.filter((r) => r.residentFeedback === "no" && r.status !== "verified").length;
  const critical = all.filter((r) => (r.urgency === "critical" || r.urgency === "high") && r.status !== "verified").length;

  return (
    <AppShell
      title={<>Live Ops <span className="chip chip-soft bg-brand-soft text-brand !text-[11px]">AI-Powered</span></>}
      subtitle="Every request for help, from first text to resident-confirmed · Milwaukee"
      badge={unclaimed}
      me={me.name}
      actions={<>
        <Btn href="/r" variant="solid"><Plus size={15} /> New Request</Btn>
        <span className="seg">
          <span className="seg-item active-blue"><LayoutGrid size={13} /> Board</span>
          <span className="seg-item"><Table2 size={13} /> Table <span className="text-[10px] text-brand">Soon</span></span>
        </span>
        <Btn onClick={async () => { await fetch("/api/reset", { method: "POST" }); reload(); }} title="Reset demo data"><RefreshCcw size={14} /> Reset demo</Btn>
      </>}
    >
      {stats && <StatBand open={stats.open} unclaimed={unclaimed} median={stats.medianMinutes} verifiedPct={stats.verifiedPct} reopened={reopened} critical={critical} />}

      <div className="mt-4 seg">
        <button onClick={() => setNeed("all")} className={`seg-item ${need === "all" ? "active-blue" : ""}`}>All Needs <span className="count">{all.length}</span></button>
        {topNeeds.map(([n, c]) => <button key={n} onClick={() => setNeed(n)} className={`seg-item ${need === n ? "active-blue" : ""}`}>{NEED_LABEL[n]} <span className="count">{c}</span></button>)}
      </div>

      <div className="mt-3 card flex items-center gap-2.5 p-2.5">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} className="input" placeholder="Search requests, neighborhoods, codes..." /></div>
        <select value={hood} onChange={(e) => setHood(e.target.value)} className="select"><option value="all">All Neighborhoods</option>{NEIGHBORHOODS.map((h) => <option key={h}>{h}</option>)}</select>
        <select value={urg} onChange={(e) => setUrg(e.target.value)} className="select"><option value="all">All Urgencies</option><option value="critical">Critical</option><option value="high">Urgent</option><option value="normal">Normal</option><option value="low">Low</option></select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select"><option value="all">All Statuses</option><option value="new">Unclaimed</option><option value="claimed">Claimed</option><option value="in_progress">In progress</option><option value="delivered">Delivered</option><option value="verified">Verified</option></select>
      </div>

      <div className="mt-4 overflow-x-auto pb-2">{data && <Board requests={filtered} fresh={fresh} onOpen={setOpenId} now={now} />}</div>
      <RequestDrawer request={open} partners={data?.partners ?? []} onClose={() => setOpenId(null)} me={me} />
    </AppShell>
  );
}
