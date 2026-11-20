"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { HOOD_COORDS, MKE_CENTER } from "@/lib/geo";

export default function PulseMap({ rows, dark, urgent = [], zoom = 11.6, className = "" }: { rows: { neighborhood: string; open: number; total: number }[]; dark: boolean; urgent?: string[]; zoom?: number; className?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const tiles = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  return (
    <MapContainer center={MKE_CENTER} zoom={zoom} zoomControl={false} zoomSnap={0.1} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} attributionControl={false} className={`h-full w-full ${className}`}>
      <TileLayer url={tiles} />
      {rows.map((r) => {
        const c = HOOD_COORDS[r.neighborhood];
        if (!c) return null;
        const t = r.total / max;
        const color = dark ? "#22e06a" : "#1f7a45";
        return [1.9, 1.3, 0.8].map((k, i) => (
          <CircleMarker key={`${r.neighborhood}-${i}`} center={c} radius={8 + t * 26 * k} pathOptions={{ color: "transparent", fillColor: color, fillOpacity: (dark ? 0.16 : 0.12) + t * 0.12 }} interactive={i === 2}>
            {i === 2 && <Tooltip direction="top" opacity={1} className="!bg-surface !text-ink !border-line !rounded-md !shadow-sm">{r.neighborhood}: {r.open} open / {r.total} total</Tooltip>}
          </CircleMarker>
        ));
      })}
      {dark && urgent.map((h, i) => HOOD_COORDS[h] && (
        <CircleMarker key={`u-${i}`} center={[HOOD_COORDS[h][0] + (i % 3 - 1) * 0.006, HOOD_COORDS[h][1] + ((i * 7) % 3 - 1) * 0.008]} radius={4} pathOptions={{ color: "#ff3b3b", fillColor: "#ff3b3b", fillOpacity: 1, weight: 1 }} />
      ))}
    </MapContainer>
  );
}
