"use client";
import { createContext, useContext, useRef, useState, type ReactNode } from "react";

/*
 * Plain-SVG charts. The same components render on the page (with a hover tooltip) and,
 * via renderToStaticMarkup, become PNGs for the PDF / Word / Excel exports.
 * Colors are explicit hex so a standalone SVG renders identically outside the page.
 *
 * Categorical palette: validated with the dataviz skill's validator (light surface):
 * adjacent CVD ΔE ≥ 9.1, normal-vision ΔE ≥ 19.6. Aqua, yellow and magenta sit below 3:1
 * contrast, so every chart carries visible values/legend text and a table view (relief rule).
 */
export const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300"];
export const OTHER = "#9ca3af";
const PRIMARY = SERIES[0];
const INK = "#111827";
const INK2 = "#4b5563";
const MUTED = "#6b7280";
const GRID = "#e9ecef";
const SURFACE = "#ffffff";
export const CHART_FONT = "Inter, 'Segoe UI', Arial, sans-serif";

// ---- hover tooltip ----------------------------------------------------------
const TipCtx = createContext<{ show: (t: string) => void; hide: () => void }>({ show: () => {}, hide: () => {} });
const useTip = () => useContext(TipCtx);

/** Wraps a chart with a pointer-following tooltip. Marks call show()/hide() on hover. */
export function ChartFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null);
  const pos = useRef({ x: 0, y: 0 });
  return (
    <TipCtx.Provider value={{ show: (text) => setTip({ text, ...pos.current }), hide: () => setTip(null) }}>
      <div
        ref={ref}
        className="relative"
        onMouseMove={(e) => {
          const b = ref.current!.getBoundingClientRect();
          pos.current = { x: e.clientX - b.left, y: e.clientY - b.top };
          setTip((t) => (t ? { ...t, ...pos.current } : t));
        }}
        onMouseLeave={() => setTip(null)}
      >
        {children}
        {tip && (
          <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-[12px] font-medium text-ink shadow-md" style={{ left: tip.x + 12, top: tip.y - 34 }}>
            {tip.text}
          </div>
        )}
      </div>
    </TipCtx.Provider>
  );
}

function Mark({ tip, children }: { tip: string; children: ReactNode }) {
  const t = useTip();
  return (
    <g onMouseEnter={() => t.show(tip)} onMouseLeave={t.hide} style={{ cursor: "default" }}>
      {children}
    </g>
  );
}

function Svg({ width, height, label, children }: { width: number; height: number; label: string; children: ReactNode }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} fontFamily={CHART_FONT} style={{ display: "block", maxWidth: "100%", height: "auto" }}>
      <rect width={width} height={height} fill={SURFACE} />
      {children}
    </svg>
  );
}

function Empty({ width, height = 160, label }: { width: number; height?: number; label: string }) {
  return (
    <Svg width={width} height={height} label={label}>
      <text x={width / 2} y={height / 2} textAnchor="middle" fontSize={13} fill={MUTED}>No requests in this period</text>
    </Svg>
  );
}

/** Bar with 4px rounded data end, square at the baseline. */
function hbar(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}
function vbar(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w / 2, h / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
/** Evenly spaced integer ticks (at most 6) covering 0..v. */
function niceTicks(v: number): number[] {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const step = steps.find((s) => Math.ceil(v / s) <= 5) ?? Math.ceil(v / 5);
  const max = Math.max(step, Math.ceil(v / step) * step);
  return Array.from({ length: max / step + 1 }, (_, i) => i * step);
}

// ---- horizontal ranked bars --------------------------------------------------
export interface BarItem {
  label: string;
  value: number;
  note?: string;
}

export function HBarChart({ items, width, color = PRIMARY, label, unit = "requests" }: { items: BarItem[]; width: number; color?: string; label: string; unit?: string }) {
  if (!items.some((i) => i.value)) return <Empty width={width} label={label} />;
  const rowH = 28;
  const labelW = Math.min(170, Math.round(width * 0.34));
  const valueW = 44;
  const plotW = width - labelW - valueW - 12;
  const max = Math.max(...items.map((i) => i.value), 1);
  const height = items.length * rowH + 10;
  return (
    <Svg width={width} height={height} label={label}>
      {items.map((it, i) => {
        const y = 6 + i * rowH;
        const w = Math.max(it.value ? 3 : 0, (it.value / max) * plotW);
        return (
          <Mark key={it.label} tip={`${it.label}: ${it.value} ${unit}${it.note ? ` · ${it.note}` : ""}`}>
            <rect x={0} y={y} width={width} height={rowH - 2} fill="transparent" />
            <text x={labelW - 8} y={y + rowH / 2} dy="0.35em" textAnchor="end" fontSize={12} fill={INK2}>{truncate(it.label, Math.floor(labelW / 7))}</text>
            <rect x={labelW} y={y + 7} width={plotW} height={rowH - 16} fill={GRID} rx={2} opacity={0.55} />
            {w > 0 && <path d={hbar(labelW, y + 7, w, rowH - 16)} fill={color} />}
            <text x={labelW + w + 6} y={y + rowH / 2} dy="0.35em" fontSize={12} fontWeight={600} fill={INK}>{it.value}</text>
          </Mark>
        );
      })}
    </Svg>
  );
}

// ---- vertical columns (timeline, histogram) ----------------------------------
export function ColumnChart({ items, width, height = 240, color = PRIMARY, label, histogram = false, unit = "requests" }: { items: BarItem[]; width: number; height?: number; color?: string; label: string; histogram?: boolean; unit?: string }) {
  if (!items.some((i) => i.value)) return <Empty width={width} height={height} label={label} />;
  const m = { l: 34, r: 8, t: 18, b: 30 };
  const plotW = width - m.l - m.r;
  const plotH = height - m.t - m.b;
  const ticks = niceTicks(Math.max(...items.map((i) => i.value)));
  const max = ticks[ticks.length - 1];
  const band = plotW / items.length;
  const gap = histogram ? 2 : Math.max(2, band * 0.28);
  const barW = Math.max(1, band - gap);
  const every = Math.max(1, Math.ceil(items.length / Math.max(1, Math.floor(plotW / 54))));
  const peak = items.reduce((a, b, i) => (b.value > items[a].value ? i : a), 0);
  return (
    <Svg width={width} height={height} label={label}>
      {ticks.map((t) => {
        const y = m.t + plotH - (t / max) * plotH;
        return (
          <g key={t}>
            <line x1={m.l} x2={width - m.r} y1={y} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={m.l - 6} y={y} dy="0.35em" textAnchor="end" fontSize={11} fill={MUTED}>{t}</text>
          </g>
        );
      })}
      {items.map((it, i) => {
        const h = (it.value / max) * plotH;
        const x = m.l + i * band + gap / 2;
        const y = m.t + plotH - h;
        return (
          <Mark key={it.label + i} tip={`${it.label}: ${it.value} ${unit}`}>
            <rect x={m.l + i * band} y={m.t} width={band} height={plotH} fill="transparent" />
            {h > 0 && <path d={vbar(x, y, barW, h)} fill={color} />}
            {i === peak && it.value > 0 && <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={11} fontWeight={600} fill={INK}>{it.value}</text>}
            {i % every === 0 && <text x={x + barW / 2} y={height - m.b + 16} textAnchor="middle" fontSize={11} fill={MUTED}>{it.label}</text>}
          </Mark>
        );
      })}
      <line x1={m.l} x2={width - m.r} y1={m.t + plotH} y2={m.t + plotH} stroke="#cbd2d9" strokeWidth={1} />
    </Svg>
  );
}

// ---- pie (part-to-whole, ≤ 6 slices incl. "Other") ---------------------------
export function PieChart({ items, width: available, label, unit = "requests", maxSlices = 6 }: { items: BarItem[]; width: number; label: string; unit?: string; maxSlices?: number }) {
  // Keep the legend's values next to their names on wide screens.
  const width = Math.min(available, 560);
  const nonzero = items.filter((i) => i.value > 0);
  const total = nonzero.reduce((n, i) => n + i.value, 0);
  if (!total) return <Empty width={width} label={label} />;
  const head = nonzero.length > maxSlices ? nonzero.slice(0, maxSlices - 1) : nonzero;
  const rest = nonzero.length > maxSlices ? nonzero.slice(maxSlices - 1).reduce((n, i) => n + i.value, 0) : 0;
  const slices = [...head.map((s, i) => ({ ...s, color: SERIES[i] })), ...(rest ? [{ label: head.some((s) => s.label === "Other") ? "All other needs" : "Other", value: rest, color: OTHER }] : [])];
  const height = Math.max(200, slices.length * 26 + 30);
  const r = Math.min(height / 2 - 12, width * 0.2);
  const cx = r + 14;
  const cy = height / 2;
  let a0 = -Math.PI / 2;
  const legendX = cx + r + 32;
  return (
    <Svg width={width} height={height} label={label}>
      {slices.map((s) => {
        const a1 = a0 + (s.value / total) * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        const d = slices.length === 1
          ? `M${cx - r},${cy}A${r},${r} 0 1 1 ${cx + r},${cy}A${r},${r} 0 1 1 ${cx - r},${cy}Z`
          : `M${cx},${cy}L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)}A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)}Z`;
        a0 = a1;
        return (
          <Mark key={`${s.label}-${s.color}`} tip={`${s.label}: ${s.value} ${unit} (${Math.round((s.value / total) * 100)}%)`}>
            <path d={d} fill={s.color} stroke={SURFACE} strokeWidth={2} strokeLinejoin="round" />
          </Mark>
        );
      })}
      {slices.map((s, i) => {
        const y = cy - (slices.length * 26) / 2 + i * 26 + 13;
        return (
          <g key={`${s.label}-${s.color}-l`}>
            <rect x={legendX} y={y - 6} width={12} height={12} rx={3} fill={s.color} />
            <text x={legendX + 20} y={y} dy="0.35em" fontSize={12.5} fill={INK2}>{truncate(s.label, 26)}</text>
            <text x={width - 8} y={y} dy="0.35em" textAnchor="end" fontSize={12.5} fontWeight={600} fill={INK}>{s.value} · {Math.round((s.value / total) * 100)}%</text>
          </g>
        );
      })}
    </Svg>
  );
}

// ---- grouped horizontal bars (two series) ------------------------------------
export function GroupedBarChart({ items, series, width, label }: { items: { label: string; a: number; b: number }[]; series: [string, string]; width: number; label: string }) {
  if (!items.some((i) => i.a || i.b)) return <Empty width={width} label={label} />;
  const rowH = 36;
  const labelW = Math.min(190, Math.round(width * 0.36));
  const valueW = 36;
  const plotW = width - labelW - valueW - 12;
  const max = Math.max(...items.map((i) => Math.max(i.a, i.b)), 1);
  const height = 30 + items.length * rowH;
  const colors = [SERIES[0], SERIES[1]];
  return (
    <Svg width={width} height={height} label={label}>
      {series.map((s, i) => (
        <g key={s}>
          <rect x={labelW + i * 110} y={6} width={12} height={12} rx={3} fill={colors[i]} />
          <text x={labelW + i * 110 + 18} y={12} dy="0.35em" fontSize={12} fill={INK2}>{s}</text>
        </g>
      ))}
      {items.map((it, i) => {
        const y = 30 + i * rowH;
        const wa = (it.a / max) * plotW;
        const wb = (it.b / max) * plotW;
        return (
          <Mark key={it.label} tip={`${it.label}: ${it.a} ${series[0].toLowerCase()}, ${it.b} ${series[1].toLowerCase()}`}>
            <rect x={0} y={y} width={width} height={rowH - 2} fill="transparent" />
            <text x={labelW - 8} y={y + rowH / 2 - 2} dy="0.35em" textAnchor="end" fontSize={12} fill={INK2}>{truncate(it.label, Math.floor(labelW / 7))}</text>
            {wa > 0 && <path d={hbar(labelW, y + 5, Math.max(3, wa), 11)} fill={colors[0]} />}
            <text x={labelW + Math.max(3, wa) + 5} y={y + 10.5} dy="0.35em" fontSize={11} fontWeight={600} fill={INK}>{it.a}</text>
            {wb > 0 && <path d={hbar(labelW, y + 18, Math.max(3, wb), 11)} fill={colors[1]} />}
            <text x={labelW + Math.max(wb > 0 ? 3 : 0, wb) + 5} y={y + 23.5} dy="0.35em" fontSize={11} fontWeight={600} fill={INK}>{it.b}</text>
          </Mark>
        );
      })}
    </Svg>
  );
}
