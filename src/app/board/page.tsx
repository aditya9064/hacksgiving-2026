"use client";
import { useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { AppShell, Btn, useClock } from "@/components/AppShell";
import { Board, SignalRail } from "@/components/board/Board";
import { RequestDrawer } from "@/components/board/RequestDrawer";
import { StatBand } from "@/components/board/StatBand";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { computeStats, timeAgo } from "@/lib/stats";

export default function BoardPage() {
  const { data, fresh, reload } = useSnapshot();
  const [me] = useMe();
  const [openId, setOpenId] = useState<string | null>(null);
  const now = useClock();

  const stats = useMemo(() => (data ? computeStats(data.requests, data.partners) : null), [data]);
  const open = data?.requests.find((r) => r.id === openId) ?? null;
  const date = now ? new Date(now).toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) : "";
  const ticker = useMemo(() => (data ? [...data.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12).map((a) => `${timeAgo(a.at, now || Date.now())} · ${a.actor} · ${a.text}`) : []), [data, now]);

  return (
    <AppShell
      kicker={`${date} · Milwaukee · ${data?.storeKind === "supabase" ? "shared database" : "demo data"}`}
      title="Live"
      titleAccent="Ops"
      subtitle="Every request for help, from first text to resident-confirmed. One record shared by every partner, so nobody falls through the handoff."
      actions={<Btn onClick={async () => { await fetch("/api/reset", { method: "POST" }); reload(); }} title="Reset demo data"><RefreshCcw size={13} /> Reset demo</Btn>}
      aside={stats && <StatBand open={stats.open} median={stats.medianMinutes} verifiedPct={stats.verifiedPct} total={stats.total} />}
      ticker={ticker}
    >
      <div className="flex gap-6 px-6 py-6">
        <div className="flex-1 min-w-0 overflow-x-auto">{data && <Board requests={data.requests} fresh={fresh} onOpen={setOpenId} now={now} />}</div>
        {data && stats && <SignalRail byNeighborhood={stats.byNeighborhood} activity={data.activity} requests={data.requests} now={now} />}
      </div>
      <RequestDrawer request={open} partners={data?.partners ?? []} onClose={() => setOpenId(null)} me={me} />
    </AppShell>
  );
}
