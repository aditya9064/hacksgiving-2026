"use client";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { HOOD_COORDS } from "@/lib/geo";

export interface PulseRow { neighborhood: string; open: number; total: number; critical?: number }

export default function PulseMap({ rows, zoom = 12.2, center = [43.055, -87.965] as [number, number], className = "", selected, onSelect }: { rows: PulseRow[]; zoom?: number; center?: [number, number]; className?: string; selected?: string | null; onSelect?: (h: string) => void }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <MapContainer center={center} zoom={zoom} zoomControl={false} zoomSnap={0.1} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} attributionControl={false} className={`h-full w-full ${className}`}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {rows.map((r) => {
        const c = HOOD_COORDS[r.neighborhood];
        if (!c) return null;
        const t = r.total / max;
        const hot = (r.critical ?? 0) > 0;
        const color = hot ? "#dc2626" : "#0b93d5";
        const isSel = selected === r.neighborhood;
        return [1.8, 1.25, 0.8].map((k, i) => (
          <CircleMarker
            key={`${r.neighborhood}-${i}`}
            center={c}
            radius={7 + t * 24 * k}
            pathOptions={{ color: i === 2 && isSel ? "#111827" : "transparent", weight: 2, fillColor: color, fillOpacity: (i === 2 ? 0.55 : 0.12) + (i === 2 ? 0 : t * 0.08) }}
            interactive={i === 2}
            eventHandlers={i === 2 && onSelect ? { click: () => onSelect(r.neighborhood) } : undefined}
          >
            {i === 2 && <Tooltip direction="top" opacity={1} className="!bg-surface !text-ink !border-line !rounded-md !shadow-sm !text-[12px]">{r.neighborhood}: {r.open} open / {r.total} total</Tooltip>}
          </CircleMarker>
        ));
      })}
    </MapContainer>
  );
}
