import { computeStats } from "./stats";
import { NEED_LABEL, STATUSES, STATUS_LABEL, type HelpRequest, type Need, type Partner, type Status } from "./types";

/** Fields a report needs. Works for server HelpRequest and client SafeRequest alike (no contact tier). */
export type ReportRequest = Pick<
  HelpRequest,
  "id" | "shortCode" | "createdAt" | "status" | "channel" | "needs" | "urgency" | "neighborhood" | "householdSize" | "ownerOrg" | "partnerId" | "deliveredAt" | "verifiedAt" | "residentFeedback" | "summary" | "language"
>;

/** year null = all time; month null = whole year. month is 0-11. */
export interface Period {
  year: number | null;
  month: number | null;
}

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MON = MONTHS.map((m) => m.slice(0, 3));

export function periodLabel(p: Period): string {
  if (p.year === null) return "All time";
  if (p.month === null) return String(p.year);
  return `${MONTHS[p.month]} ${p.year}`;
}

export function inPeriod(iso: string, p: Period): boolean {
  if (p.year === null) return true;
  const d = new Date(iso);
  return d.getFullYear() === p.year && (p.month === null || d.getMonth() === p.month);
}

/** Years that have at least one request, newest first. */
export function availableYears(requests: ReportRequest[]): number[] {
  return [...new Set(requests.map((r) => new Date(r.createdAt).getFullYear()))].sort((a, b) => b - a);
}

export interface Slice<K extends string = string> {
  key: K;
  label: string;
  value: number;
}

export interface Report {
  period: Period & { label: string };
  generatedAt: string;
  kpis: {
    total: number;
    delivered: number;
    verified: number;
    verifiedPct: number;
    partlyHelped: number;
    medianMinutes: number;
    reopened: number;
    open: number;
    partnersActive: number;
    neighborhoods: number;
    households: number;
  };
  needs: Slice<Need>[];
  status: Slice<Status>[];
  channels: Slice[];
  feedback: Slice[];
  partners: { name: string; handled: number; verified: number; rate: number }[];
  neighborhoods: { neighborhood: string; total: number; open: number }[];
  responseTime: Slice[];
  timeline: { unit: "day" | "month"; points: Slice[] };
  rows: ReportRequest[];
}

const CHANNEL_LABEL: Record<string, string> = { sms: "SMS", web: "Web", voice: "Voice", partner: "Partner" };
const BUCKETS: [number, string][] = [
  [30, "< 30 min"],
  [60, "30–60 min"],
  [120, "1–2 h"],
  [240, "2–4 h"],
  [480, "4–8 h"],
  [1440, "8–24 h"],
  [Infinity, "> 24 h"],
];

export function buildReport(all: ReportRequest[], partners: Partner[], period: Period, now = new Date()): Report {
  const rows = all.filter((r) => inPeriod(r.createdAt, period)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const s = computeStats(rows as HelpRequest[], partners);

  const count = <K extends string>(keys: readonly K[], pick: (r: ReportRequest) => K | K[] | undefined, label: (k: K) => string): Slice<K>[] => {
    const m = new Map<K, number>();
    for (const r of rows) {
      const v = pick(r);
      for (const k of Array.isArray(v) ? v : v ? [v] : []) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return keys.map((k) => ({ key: k, label: label(k), value: m.get(k) ?? 0 }));
  };

  const needs = count(Object.keys(NEED_LABEL) as Need[], (r) => r.needs, (k) => NEED_LABEL[k]).filter((x) => x.value).sort((a, b) => b.value - a.value);
  const status = count(STATUSES, (r) => r.status, (k) => STATUS_LABEL[k]);
  const channels = count(["sms", "web", "voice", "partner"], (r) => r.channel, (k) => CHANNEL_LABEL[k]).filter((x) => x.value);
  const done = rows.filter((r) => r.status === "delivered" || r.status === "verified");
  const feedback: Slice[] = [
    { key: "yes", label: "Confirmed help arrived", value: done.filter((r) => r.residentFeedback === "yes").length },
    { key: "partial", label: "Partly helped", value: done.filter((r) => r.residentFeedback === "partial").length },
    { key: "no", label: "Not helped (reopened)", value: rows.filter((r) => r.residentFeedback === "no").length },
    { key: "awaiting", label: "Awaiting reply", value: done.filter((r) => !r.residentFeedback).length },
  ];

  const responseTime: Slice[] = BUCKETS.map(([, label]) => ({ key: label, label, value: 0 }));
  for (const r of done) {
    if (!r.deliveredAt) continue;
    const mins = (Date.parse(r.deliveredAt) - Date.parse(r.createdAt)) / 60_000;
    responseTime[BUCKETS.findIndex(([max]) => mins < max)].value++;
  }

  let timeline: Report["timeline"];
  if (period.year !== null && period.month !== null) {
    const days = new Date(period.year, period.month + 1, 0).getDate();
    const pts = Array.from({ length: days }, (_, i) => ({ key: String(i + 1), label: `${MON[period.month!]} ${i + 1}`, value: 0 }));
    for (const r of rows) pts[new Date(r.createdAt).getDate() - 1].value++;
    timeline = { unit: "day", points: pts };
  } else {
    const keys: [number, number][] = [];
    if (period.year !== null) for (let m = 0; m < 12; m++) keys.push([period.year, m]);
    else if (rows.length) {
      const a = new Date(rows[0].createdAt);
      const b = new Date(rows[rows.length - 1].createdAt);
      for (let y = a.getFullYear(), m = a.getMonth(); y < b.getFullYear() || (y === b.getFullYear() && m <= b.getMonth()); m === 11 ? (y++, (m = 0)) : m++) keys.push([y, m]);
    }
    const pts = keys.map(([y, m]) => ({ key: `${y}-${m}`, label: period.year !== null ? MON[m] : `${MON[m]} ${String(y).slice(2)}`, value: 0 }));
    for (const r of rows) {
      const d = new Date(r.createdAt);
      const i = keys.findIndex(([y, m]) => y === d.getFullYear() && m === d.getMonth());
      if (i >= 0) pts[i].value++;
    }
    timeline = { unit: "month", points: pts };
  }

  return {
    period: { ...period, label: periodLabel(period) },
    generatedAt: now.toISOString(),
    kpis: {
      total: s.total,
      delivered: s.deliveredOrVerified,
      verified: s.verified,
      verifiedPct: s.verifiedPct,
      partlyHelped: s.partlyHelped,
      medianMinutes: s.medianMinutes,
      reopened: rows.filter((r) => r.residentFeedback === "no").length,
      open: rows.filter((r) => r.status !== "delivered" && r.status !== "verified").length,
      partnersActive: s.partnerCount,
      neighborhoods: s.neighborhoodCount,
      households: rows.reduce((n, r) => n + (r.householdSize ?? 0), 0),
    },
    needs,
    status,
    channels,
    feedback,
    partners: s.byPartner.map((p) => ({ name: p.name, handled: p.handled, verified: p.verified, rate: p.handled ? Math.round((p.verified / p.handled) * 100) : 0 })),
    neighborhoods: s.byNeighborhood.map((h) => ({ neighborhood: h.neighborhood, total: h.total, open: h.open })).sort((a, b) => b.total - a.total),
    responseTime,
    timeline,
    rows,
  };
}

/** De-identified request rows for CSV/Excel/appendix tables. No contact tier, no free text from residents. */
export const ROW_HEADERS = ["Code", "Opened", "Status", "Channel", "Needs", "Urgency", "Neighborhood", "Household", "Partner", "Delivered", "Verified", "Resident feedback", "Summary"];
export function rowValues(r: ReportRequest): (string | number)[] {
  const d = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "");
  return [r.shortCode, d(r.createdAt), STATUS_LABEL[r.status], CHANNEL_LABEL[r.channel] ?? r.channel, r.needs.map((n) => NEED_LABEL[n]).join(", "), r.urgency, r.neighborhood, r.householdSize ?? "", r.ownerOrg ?? "", d(r.deliveredAt), d(r.verifiedAt), r.residentFeedback ?? "", r.summary];
}
