"use client";
import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, useMap } from "react-leaflet";

export interface Stop { name: string; sub?: string; coords: [number, number]; kind: "you" | "pickup" | "drop" }

function icon(kind: Stop["kind"], n: number) {
  const bg = kind === "you" ? "#111827" : kind === "pickup" ? "#0b93d5" : "#16a34a";
  const label = kind === "you" ? "●" : String(n);
  return L.divIcon({
    className: "",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    html: `<div style="width:30px;height:30px;border-radius:999px;background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font:700 13px/1 Inter,system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);border:2px solid #fff">${label}</div>`,
  });
}

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
  }, [map, points]);
  return null;
}

export default function RouteMap({ stops, line, className = "" }: { stops: Stop[]; line: [number, number][]; className?: string }) {
  const pts = line.length ? line : stops.map((s) => s.coords);
  return (
    <MapContainer center={stops[0]?.coords ?? [43.04, -87.935]} zoom={13} zoomControl={false} attributionControl={false} className={`h-full w-full ${className}`}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Fit points={pts} />
      {line.length > 1 && (
        <>
          <Polyline positions={line} pathOptions={{ color: "#ffffff", weight: 9, opacity: 0.9 }} />
          <Polyline positions={line} pathOptions={{ color: "#0b93d5", weight: 5, opacity: 0.95 }} />
        </>
      )}
      {stops.map((s, i) => (
        <Marker key={i} position={s.coords} icon={icon(s.kind, i)}>
          <Tooltip direction="top" offset={[0, -14]} opacity={1} permanent className="!bg-surface !text-ink !border-line !rounded-md !shadow-sm !text-[12px] !font-medium">{s.name}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
