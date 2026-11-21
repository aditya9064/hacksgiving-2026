"use client";
import type { ReactElement } from "react";
import { ChartPie, BarChartHorizontal, ChartColumn, Clock, Workflow, Users, MapPin, ShieldCheck, Radio } from "lucide-react";
import type { Report } from "@/lib/report";
import { ColumnChart, GroupedBarChart, HBarChart, PieChart } from "./charts";

export interface ChartDef {
  id: string;
  title: string;
  kind: string;
  Icon: typeof ChartPie;
  subtitle: (r: Report) => string;
  render: (r: Report, width: number) => ReactElement;
  table: (r: Report) => { head: string[]; rows: (string | number)[][] };
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "0%");

/** Every chart on the page, in the funder report and in the exports comes from this list. */
export const CHARTS: ChartDef[] = [
  {
    id: "needs-mix",
    title: "Needs mix",
    kind: "Pie chart",
    Icon: ChartPie,
    subtitle: (r) => `Share of all needs logged in ${r.period.label} (a request can carry more than one need)`,
    render: (r, w) => <PieChart items={r.needs.map((n) => ({ label: n.label, value: n.value }))} width={w} label="Needs mix" unit="mentions" />,
    table: (r) => {
      const t = r.needs.reduce((n, x) => n + x.value, 0);
      return { head: ["Need", "Mentions", "Share"], rows: r.needs.map((n) => [n.label, n.value, pct(n.value, t)]) };
    },
  },
  {
    id: "needs",
    title: "Requests by need",
    kind: "Bar chart",
    Icon: BarChartHorizontal,
    subtitle: (r) => `How many requests named each need, ${r.period.label}`,
    render: (r, w) => <HBarChart items={r.needs.map((n) => ({ label: n.label, value: n.value }))} width={w} label="Requests by need" />,
    table: (r) => ({ head: ["Need", "Requests"], rows: r.needs.map((n) => [n.label, n.value]) }),
  },
  {
    id: "response",
    title: "Response time",
    kind: "Histogram",
    Icon: Clock,
    subtitle: (r) => `Time from first contact to delivered help, ${r.kpis.delivered} completed requests`,
    render: (r, w) => <ColumnChart items={r.responseTime.map((b) => ({ label: b.label, value: b.value }))} width={w} label="Response time histogram" histogram unit="requests" />,
    table: (r) => ({ head: ["Time to help", "Requests"], rows: r.responseTime.map((b) => [b.label, b.value]) }),
  },
  {
    id: "timeline",
    title: "Requests over time",
    kind: "Column chart",
    Icon: ChartColumn,
    subtitle: (r) => `New requests per ${r.timeline.unit}, ${r.period.label}`,
    render: (r, w) => <ColumnChart items={r.timeline.points.map((p) => ({ label: p.label, value: p.value }))} width={w} label="Requests over time" />,
    table: (r) => ({ head: [r.timeline.unit === "day" ? "Day" : "Month", "Requests"], rows: r.timeline.points.map((p) => [p.label, p.value]) }),
  },
  {
    id: "status",
    title: "Pipeline by status",
    kind: "Bar chart",
    Icon: Workflow,
    subtitle: (r) => `Where the ${r.kpis.total} requests stand today`,
    render: (r, w) => <HBarChart items={r.status.map((s) => ({ label: s.label, value: s.value }))} width={w} label="Pipeline by status" />,
    table: (r) => ({ head: ["Status", "Requests", "Share"], rows: r.status.map((s) => [s.label, s.value, pct(s.value, r.kpis.total)]) }),
  },
  {
    id: "partners",
    title: "Partner outcomes",
    kind: "Grouped bar",
    Icon: Users,
    subtitle: () => "Requests each partner handled vs. confirmed by the resident",
    render: (r, w) => <GroupedBarChart items={r.partners.slice(0, 10).map((p) => ({ label: p.name, a: p.handled, b: p.verified }))} series={["Handled", "Resident-verified"]} width={w} label="Partner outcomes" />,
    table: (r) => ({ head: ["Partner", "Handled", "Verified", "Verified rate"], rows: r.partners.map((p) => [p.name, p.handled, p.verified, `${p.rate}%`]) }),
  },
  {
    id: "neighborhoods",
    title: "Neighborhoods",
    kind: "Bar chart",
    Icon: MapPin,
    subtitle: (r) => `Top neighborhoods by requests, ${r.period.label} (areas, never people)`,
    render: (r, w) => <HBarChart items={r.neighborhoods.slice(0, 10).map((h) => ({ label: h.neighborhood, value: h.total, note: `${h.open} still open` }))} width={w} label="Requests by neighborhood" />,
    table: (r) => ({ head: ["Neighborhood", "Requests", "Still open"], rows: r.neighborhoods.map((h) => [h.neighborhood, h.total, h.open]) }),
  },
  {
    id: "verification",
    title: "Resident verification",
    kind: "Pie chart",
    Icon: ShieldCheck,
    subtitle: () => "What residents said when asked “Did the help arrive?”",
    render: (r, w) => <PieChart items={r.feedback.map((f) => ({ label: f.label, value: f.value }))} width={w} label="Resident verification" />,
    table: (r) => ({ head: ["Resident answer", "Requests"], rows: r.feedback.map((f) => [f.label, f.value]) }),
  },
  {
    id: "channels",
    title: "Intake channels",
    kind: "Bar chart",
    Icon: Radio,
    subtitle: () => "How residents reached out: text, web form or phone",
    render: (r, w) => <HBarChart items={r.channels.map((c) => ({ label: c.label, value: c.value }))} width={w} label="Intake channels" />,
    table: (r) => ({ head: ["Channel", "Requests", "Share"], rows: r.channels.map((c) => [c.label, c.value, pct(c.value, r.kpis.total)]) }),
  },
];
