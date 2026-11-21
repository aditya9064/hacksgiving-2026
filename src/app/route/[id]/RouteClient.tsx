"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, CheckCheck, Clock, Crosshair, ExternalLink, LocateFixed, MapPin, Navigation, PackageCheck, ShieldCheck, Smartphone, Store } from "lucide-react";
import { act, type SafeRequest } from "@/lib/client/useSnapshot";
import { COMFORCE_BASE, residentApprox } from "@/lib/geo";
import type { Partner } from "@/lib/types";
import type { Stop } from "@/components/route/RouteMap";

const RouteMap = dynamic(() => import("@/components/route/RouteMap"), { ssr: false, loading: () => <div className="h-full w-full bg-surface-2" /> });

interface Leg { distanceM: number; durationS: number; steps: { text: string; distanceM: number }[] }
interface Plan { line: [number, number][]; legs: Leg[]; source: "osrm" | "straight" }

const ME = { name: "Aisha", org: "ComForce MKE" };

/**
 * Volunteer's run sheet: you → partner pickup → resident. Works on a phone (map + bottom sheet) and
 * on a laptop (side panel + big map). Road routing from the public OSRM server; straight lines if it's down.
 */
export default function RouteClient({ id }: { id: string }) {
  const [req, setReq] = useState<SafeRequest | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [me, setMe] = useState<[number, number] | null>(COMFORCE_BASE.coords);
  const [geoState, setGeoState] = useState<"asking" | "ok" | "denied" | "base">("asking");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(process.env.NEXT_PUBLIC_BASE_URL || window.location.origin); }, []);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetch(`/api/requests/${id}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/snapshot", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setReq(r.request ?? null);
    setPartners(s.partners ?? []);
  }, [id]);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) { setGeoState("base"); setMe(COMFORCE_BASE.coords); return; }
    setGeoState("asking");
    navigator.geolocation.getCurrentPosition(
      (p) => { setMe([p.coords.latitude, p.coords.longitude]); setGeoState("ok"); },
      () => { setMe(COMFORCE_BASE.coords); setGeoState("denied"); },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 60000 },
    );
  }, []);
  useEffect(() => { locate(); }, [locate]);

  const partner = partners.find((p) => p.id === req?.dispatch?.partnerId) ?? partners.find((p) => p.id === req?.partnerId);
  const stops: Stop[] = useMemo(() => {
    if (!req || !me) return [];
    const list: Stop[] = [{ name: geoState === "ok" ? "You" : COMFORCE_BASE.name, coords: me, kind: "you" }];
    if (partner?.coords) list.push({ name: partner.name, sub: partner.address, coords: partner.coords, kind: "pickup" });
    list.push({ name: `Resident · ${req.neighborhood}`, sub: "Approximate — exact address in the ComForce-only tier", coords: residentApprox(req.neighborhood, req.id), kind: "drop" });
    return list;
  }, [req, me, partner, geoState]);

  useEffect(() => {
    if (stops.length < 2) return;
    let alive = true;
    const coords = stops.map((s) => `${s.coords[1]},${s.coords[0]}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`)
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const route = j.routes?.[0];
        if (!route) throw new Error("no route");
        setPlan({
          source: "osrm",
          line: route.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
          legs: route.legs.map((l: { distance: number; duration: number; steps: { name: string; distance: number; maneuver: { type: string; modifier?: string } }[] }) => ({
            distanceM: l.distance,
            durationS: l.duration,
            steps: l.steps.map((s) => ({ text: describe(s.maneuver.type, s.maneuver.modifier, s.name), distanceM: s.distance })),
          })),
        });
      })
      .catch(() => {
        if (!alive) return;
        const legs: Leg[] = [];
        for (let i = 1; i < stops.length; i++) {
          const d = haversine(stops[i - 1].coords, stops[i].coords);
          legs.push({ distanceM: d, durationS: d / 8.5, steps: [{ text: `Head to ${stops[i].name}`, distanceM: d }] });
        }
        setPlan({ source: "straight", line: stops.map((s) => s.coords), legs });
      });
    return () => { alive = false; };
  }, [stops]);

  const total = plan ? plan.legs.reduce((a, l) => ({ d: a.d + l.distanceM, t: a.t + l.durationS }), { d: 0, t: 0 }) : null;
  const d = req?.dispatch;
  const run = async (body: Record<string, unknown>) => { setBusy(true); try { await act(id, body); await load(); } finally { setBusy(false); } };

  const gmaps = stops.length >= 2
    ? `https://www.google.com/maps/dir/?api=1&origin=${stops[0].coords.join(",")}&destination=${stops[stops.length - 1].coords.join(",")}${stops.length === 3 ? `&waypoints=${stops[1].coords.join(",")}` : ""}&travelmode=driving`
    : "#";

  return (
    <div className="flex h-screen flex-col bg-bg lg:flex-row">
      <div className="relative h-[46vh] shrink-0 lg:h-full lg:flex-1 lg:order-2">
        {stops.length > 0 && <RouteMap stops={stops} line={plan?.line ?? []} />}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[400] flex items-start justify-between p-3">
          <Link href="/board" className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[12.5px] font-medium shadow-sm backdrop-blur hover:bg-surface-2"><ArrowLeft size={14} /> Board</Link>
          <button onClick={locate} className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface/95 px-2.5 py-1.5 text-[12.5px] font-medium shadow-sm backdrop-blur hover:bg-surface-2"><LocateFixed size={14} /> {geoState === "ok" ? "Located" : geoState === "asking" ? "Locating…" : "Use my location"}</button>
        </div>
        {total && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] rounded-xl border border-line bg-surface/95 px-3.5 py-2.5 shadow-md backdrop-blur">
            <div className="text-[22px] font-extrabold leading-none">{mins(total.t)} <span className="text-[13px] font-semibold text-ink-2">min</span></div>
            <div className="mt-1 text-[12px] text-muted">{miles(total.d)} mi · {stops.length - 1} stops{plan?.source === "straight" ? " · estimate" : ""}</div>
          </div>
        )}
      </div>

      <aside className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-line bg-surface lg:w-[400px] lg:flex-none lg:border-r lg:border-t-0 lg:order-1">
        {!req ? (
          <div className="p-6 text-[13.5px] text-muted">Loading…</div>
        ) : (
          <>
            <div className="border-b border-line p-5">
              <div className="flex items-center gap-2 text-[11.5px] text-muted"><Navigation size={12} className="text-brand" /> Run sheet · {req.shortCode}</div>
              <h1 className="mt-1 text-[18px] font-bold leading-snug">{req.summary}</h1>
              <div className="mt-1.5 text-[12.5px] text-ink-2">{req.householdSize ? `${req.householdSize} people · ` : ""}{req.neighborhood} · <span className="capitalize">{req.urgency}</span></div>
              {geoState === "denied" && <div className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-800">Location blocked — starting from {COMFORCE_BASE.name}.</div>}
            </div>

            <ol className="p-5 space-y-0">
              {stops.map((s, i) => (
                <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < stops.length - 1 && <span className="absolute left-[14px] top-8 bottom-0 w-px bg-line" />}
                  <span className={`z-10 mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white ${s.kind === "you" ? "bg-ink" : s.kind === "pickup" ? "bg-brand" : "bg-green"}`}>{s.kind === "you" ? <Crosshair size={14} /> : i}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[14px] font-semibold">{s.kind === "pickup" ? <span className="inline-flex items-center gap-1.5"><Store size={14} className="text-brand" />{s.name}</span> : s.kind === "drop" ? <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-green" />{s.name}</span> : s.name}</div>
                      {i > 0 && plan?.legs[i - 1] && <span className="shrink-0 text-[12px] font-medium text-ink-2">{mins(plan.legs[i - 1].durationS)} min · {miles(plan.legs[i - 1].distanceM)} mi</span>}
                    </div>
                    {s.sub && <div className="text-[12px] text-muted">{s.sub}</div>}
                    {s.kind === "pickup" && d?.outcome?.accepted && (
                      <div className="mt-1.5 rounded-lg bg-green-soft px-2.5 py-1.5 text-[12.5px] text-green"><Clock size={12} className="mr-1 inline" />Ready {d.outcome.readyBy ?? "soon"}{d.outcome.contactName ? ` · ask for ${d.outcome.contactName}` : ""}{d.outcome.notes ? ` · ${d.outcome.notes}` : ""}</div>
                    )}
                    {i > 0 && plan?.legs[i - 1] && plan.source === "osrm" && (
                      <details className="mt-1.5 text-[12.5px]">
                        <summary className="cursor-pointer text-brand hover:underline">Turn-by-turn · {plan.legs[i - 1].steps.length} steps</summary>
                        <ol className="mt-1.5 space-y-1 border-l border-line pl-3 text-ink-2">
                          {plan.legs[i - 1].steps.map((st, k) => <li key={k} className="flex justify-between gap-2"><span>{st.text}</span><span className="shrink-0 text-muted">{st.distanceM >= 160 ? `${miles(st.distanceM)} mi` : `${Math.round(st.distanceM * 3.28)} ft`}</span></li>)}
                        </ol>
                      </details>
                    )}
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-auto space-y-2.5 border-t border-line p-5">
              {d && (d.status === "accepted" || d.status === "ready") && (
                <button disabled={busy} onClick={() => run({ action: "picked_up", actor: req.ownerName ?? ME.name })} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand py-3 text-[14px] font-semibold text-white hover:bg-brand-2 disabled:opacity-50"><PackageCheck size={17} /> Picked up at {partner?.name ?? "partner"}</button>
              )}
              {(d?.status === "picked_up" || (!d && (req.status === "claimed" || req.status === "in_progress"))) && req.status !== "delivered" && req.status !== "verified" && (
                <button disabled={busy} onClick={() => run({ action: "delivered", actor: req.ownerName ?? ME.name })} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green py-3 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-50"><CheckCheck size={17} /> Delivered · ask resident to confirm</button>
              )}
              {req.status === "delivered" && <div className="rounded-lg bg-surface-2 p-3 text-[13px] text-ink-2">Delivered. The resident was texted to confirm — watch the Board for the green check.</div>}
              {req.status === "verified" && <div className="flex items-center gap-2 rounded-lg bg-green-soft p-3 text-[13px] font-medium text-green"><ShieldCheck size={16} /> Confirmed by the resident. Loop closed.</div>}
              <a href={gmaps} target="_blank" rel="noreferrer" className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-surface py-2.5 text-[13px] font-medium hover:bg-surface-2"><ExternalLink size={14} /> Open in Google Maps</a>
              <div className="hidden items-center gap-3 rounded-lg border border-dashed border-line p-3 lg:flex">
                <div className="rounded bg-white p-1">{origin && <QRCodeSVG value={`${origin}/route/${id}`} size={64} />}</div>
                <div className="text-[12px] text-ink-2"><div className="flex items-center gap-1 font-semibold text-ink"><Smartphone size={13} /> Take it with you</div>Scan to open this run sheet on your phone. Same live state, same buttons.</div>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function describe(type: string, modifier: string | undefined, name: string): string {
  const road = name ? ` onto ${name}` : "";
  const dir = modifier ? modifier.replace("slight ", "slightly ").replace("sharp ", "sharply ") : "";
  switch (type) {
    case "depart": return `Head out${name ? ` on ${name}` : ""}`;
    case "arrive": return "Arrive";
    case "turn": return `Turn ${dir}${road}`;
    case "new name": return `Continue${road}`;
    case "continue": return `Continue ${dir}${road}`.replace(/\s+/g, " ");
    case "merge": return `Merge${road}`;
    case "on ramp": return `Take the ramp${road}`;
    case "off ramp": return `Take the exit${road}`;
    case "fork": return `Keep ${dir}${road}`;
    case "roundabout": case "rotary": return `Take the roundabout${road}`;
    case "end of road": return `At the end of the road, turn ${dir}${road}`;
    default: return `${type}${road}`;
  }
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000, toR = (x: number) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * 1.3;
}
const mins = (s: number) => Math.max(1, Math.round(s / 60));
const miles = (m: number) => (m / 1609.34).toFixed(1);
