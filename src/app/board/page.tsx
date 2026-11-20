"use client";
import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Radio } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Board } from "@/components/board/Board";
import { RequestDrawer } from "@/components/board/RequestDrawer";
import { StatBand } from "@/components/board/StatBand";
import { useSnapshot } from "@/lib/client/useSnapshot";
import { useMe } from "@/lib/client/me";
import { computeStats } from "@/lib/stats";

export default function BoardPage() {
  const { data, fresh, reload } = useSnapshot();
  const [me] = useMe();
  const [openId, setOpenId] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const stats = useMemo(() => (data ? computeStats(data.requests, data.partners) : null), [data]);
  const open = data?.requests.find((r) => r.id === openId) ?? null;
  const time = now ? new Date(now).toLocaleString([], { weekday: "long", hour: "numeric", minute: "2-digit" }) : "";

  return (
    <AppShell
      title={time ? `Live Ops — ${time}` : "Live Ops"}
      subtitle="Every request for help, from first text to resident-confirmed. One record shared by every partner."
      actions={
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[11.5px] font-medium text-ink-2"><Radio size={12} className="text-brand" /> live · {data?.storeKind ?? "…"}</span>
          <button onClick={async () => { await fetch("/api/reset", { method: "POST" }); reload(); }} title="Reset demo data" className="rounded-full border border-line bg-surface p-1.5 text-ink-2 hover:bg-surface-2"><RefreshCcw size={14} /></button>
        </>
      }
    >
      {stats && <div className="mb-5"><StatBand open={stats.open} median={stats.medianMinutes} verifiedPct={stats.verifiedPct} total={stats.total} /></div>}
      <div className="overflow-x-auto pb-2">{data && <Board requests={data.requests} fresh={fresh} onOpen={setOpenId} now={now} />}</div>
      <RequestDrawer request={open} partners={data?.partners ?? []} onClose={() => setOpenId(null)} me={me} />
    </AppShell>
  );
}
