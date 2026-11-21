// Grant-readiness engine. Pure functions over a Report (lib/report.ts) and cluster stats
// (lib/clusters.ts) so the page, the API route and tests all see the same numbers.
//
// Funders below are real Milwaukee / Wisconsin funders whose published priorities fit
// ComForce's work (see docs/research/09-comforce-funding.md). Deadlines are NOT tracked here
// on purpose: they change, and a wrong date is worse than none. Verify before applying.
import type { Report } from "./report";
import type { ClusterStats } from "./clusters";
import type { Need } from "./types";
import { HOMICIDE_SHARE_IN_CLUSTERS } from "./clusters";

export type FunderKind = "city" | "county" | "state" | "foundation" | "corporate";

export interface Funder {
  id: string;
  name: string;
  program: string;
  kind: FunderKind;
  /** What they say they fund, in their words (condensed). */
  priorities: string;
  /** Needs they weight. Sum does not have to be 1. */
  needWeights: Partial<Record<Need, number>>;
  /** Extra fit when activity lands inside the DCWS clusters (city/county CVI money). */
  clusterWeight: number;
  /** Typical award range, for context only. */
  range: string;
  /** Requirement ids (see REQUIREMENTS) this funder is known or very likely to ask for. */
  requires: RequirementId[];
  /** What the funder measures; used to phrase the draft in their language. */
  metricsLanguage: string;
  source: string;
}

export type RequirementId = "outcomes" | "geography" | "partners" | "follow_up" | "logic_model" | "evaluation" | "fiscal" | "budget" | "board" | "insurance" | "dei_data";

export interface Requirement {
  id: RequirementId;
  label: string;
  /** auto: Relay produces it from the record. manual: ComForce must supply it. */
  kind: "auto" | "manual";
  hint: string;
}

export const REQUIREMENTS: Requirement[] = [
  { id: "outcomes", label: "Outcome data, not just outputs", kind: "auto", hint: "Resident-verified completion rate, median time to help, reopen rate — per request, auditable." },
  { id: "geography", label: "Where the work happened", kind: "auto", hint: "Requests by neighborhood and by DCWS Countdown cluster. Areas only, never addresses." },
  { id: "partners", label: "Partner network with handoff records", kind: "auto", hint: "Every dispatch to a partner is logged with their answer and the delivery outcome." },
  { id: "follow_up", label: "Follow-up with residents", kind: "auto", hint: "Verification text, then Jordan's call-back in the resident's language. Who answered, what they said." },
  { id: "logic_model", label: "Logic model", kind: "auto", hint: "Inputs → activities → outputs → outcomes, filled from the period's numbers." },
  { id: "evaluation", label: "Evaluation plan", kind: "auto", hint: "How success is measured and by whom (the resident), with the data already flowing." },
  { id: "fiscal", label: "501(c)(3) status or fiscal sponsor letter", kind: "manual", hint: "We could not find an IRS record for Community Task Force MKE. A fiscal sponsor (e.g. a partner nonprofit) unlocks most foundation money." },
  { id: "budget", label: "Program budget", kind: "manual", hint: "Staff time, volunteer stipends, supplies, platform cost. Relay's own running cost is in the Evidence pack." },
  { id: "board", label: "Board / leadership list", kind: "manual", hint: "Names and roles. Most foundation portals require it." },
  { id: "insurance", label: "Certificate of insurance", kind: "manual", hint: "City and county contracts require general liability coverage." },
  { id: "dei_data", label: "Demographics of people served", kind: "manual", hint: "Relay deliberately does not collect race, age or income. If a funder requires it, add an optional consented question at intake." },
];

export const FUNDERS: Funder[] = [
  {
    id: "dcws-countdown",
    name: "City of Milwaukee · Dept. of Community Wellness & Safety",
    program: "This Is Our City: The Countdown (26 incident clusters)",
    kind: "city",
    priorities: "Partners commit dates and places to bring resources — food, eviction prevention, jobs, gun locks, Narcan — into 26 incident clusters that hold 88.5% of homicide victims. Theory of change: resources + engagement in clusters → protective factors → fewer shootings.",
    needWeights: { safety: 1, mediation: 1, youth: 0.8, food: 0.6, rent: 0.6, housing: 0.6, utilities: 0.4, health: 0.4 },
    clusterWeight: 1,
    range: "In-kind partnership today; the office allocated $5.1M in grants in 2024",
    requires: ["outcomes", "geography", "partners", "follow_up", "insurance"],
    metricsLanguage: "incidents responded to, % requiring follow-up, hours of response, resources delivered inside clusters",
    source: "https://carvdnstone.com/city-of-milwaukee-launches-this-is-our-city-the-countdown-to-mobilize-community-partners-in-26-areas-impacted-by-violence/",
  },
  {
    id: "dcws-promise-keepers",
    name: "City of Milwaukee · DCWS",
    program: "MKE Promise Keepers (Promise Zones) — ComForce's existing contract",
    kind: "city",
    priorities: "Trained, credible community members engaging residents and business owners in Promise Zones with concentrated violence and poverty. Year-round since the 2022 pilot.",
    needWeights: { safety: 1, mediation: 1, youth: 0.8, housing: 0.5, food: 0.5, other: 0.3 },
    clusterWeight: 0.8,
    range: "Existing partnership (paid role); ARPA-funded, winding down in 2026",
    requires: ["outcomes", "geography", "follow_up", "insurance"],
    metricsLanguage: "residents engaged, incidents, follow-ups completed, referrals that resulted in a service",
    source: "https://carvdnstone.com/comforce-mke-team-unified-and-milwaukees-critical-response-team-continue-making-a-difference-in-communities-impacted-by-violence-through-city-partnership/",
  },
  {
    id: "county-dfg",
    name: "Milwaukee County · Dept. of Health & Human Services",
    program: "Destined for Greater (state CVI funds, $1.5M)",
    kind: "county",
    priorities: "Connect residents in high-need neighborhoods to employment, housing assistance, mental health support and violence intervention — organizations that 'connect residents to needed services even when they cannot provide those services themselves.'",
    needWeights: { housing: 1, rent: 0.9, health: 0.9, safety: 0.8, youth: 0.8, legal: 0.5, transport: 0.5, food: 0.4 },
    clusterWeight: 0.6,
    range: "Sub-awards from a $1.5M pool (2026)",
    requires: ["outcomes", "partners", "follow_up", "evaluation", "fiscal", "budget", "insurance"],
    metricsLanguage: "referrals made, referrals completed (warm handoffs), residents connected to housing / jobs / care, follow-through rate",
    source: "https://milwaukeenns.org/2026/06/25/backed-by-state-funding-local-groups-collaborate-to-strengthen-violence-prevention-efforts/",
  },
  {
    id: "wi-ovp",
    name: "Wisconsin Office of Violence Prevention (Gov. Evers)",
    program: "Violence prevention grants — evidence-based intervention & outreach category",
    kind: "state",
    priorities: "Evidence-based violence intervention and outreach, suicide prevention, safe firearm storage. $15M; 460 applications, 73 funded (~16%). Awards $5K–$1.5M.",
    needWeights: { safety: 1, mediation: 0.9, youth: 0.7, health: 0.5 },
    clusterWeight: 0.5,
    range: "$5,000 – $1,500,000",
    requires: ["outcomes", "evaluation", "logic_model", "fiscal", "budget", "board", "insurance"],
    metricsLanguage: "evidence base, participants served, incidents mediated, retaliation prevented, program fidelity",
    source: "https://pro.stateaffairs.com/wi/press-releases/milwaukee-county-executive-crowley-announces-1-8-million-grant-from-the-state-of-wisconsin-for-violence-prevention",
  },
  {
    id: "gmf",
    name: "Greater Milwaukee Foundation",
    program: "Community grants — thriving neighborhoods, safety & wellbeing",
    kind: "foundation",
    priorities: "Resident-led neighborhood organizations; racial equity; housing stability; safety and wellbeing. Prefers measurable community outcomes and collaboration.",
    needWeights: { housing: 1, rent: 0.8, food: 0.6, youth: 0.8, safety: 0.6, mediation: 0.5, utilities: 0.5 },
    clusterWeight: 0.3,
    range: "Typically $10,000 – $100,000",
    requires: ["outcomes", "logic_model", "fiscal", "budget", "board", "dei_data"],
    metricsLanguage: "households stabilized, residents served, neighborhood indicators, collaboration",
    source: "https://www.greatermilwaukeefoundation.org/",
  },
  {
    id: "zilber",
    name: "Zilber Family Foundation",
    program: "Neighborhood initiatives — resident leadership, safety, stability",
    kind: "foundation",
    priorities: "Long-term investment in specific Milwaukee neighborhoods (historically Lindsay Heights, Clarke Square, Layton Boulevard West); resident-led safety and housing work.",
    needWeights: { housing: 1, rent: 0.8, safety: 0.7, youth: 0.6, mediation: 0.5, food: 0.4 },
    clusterWeight: 0.3,
    range: "Typically $10,000 – $75,000",
    requires: ["outcomes", "geography", "fiscal", "budget", "board"],
    metricsLanguage: "resident leaders engaged, housing stability, perceived safety, neighborhood reach",
    source: "https://zilberfamilyfoundation.org/",
  },
  {
    id: "nm-foundation",
    name: "Northwestern Mutual Foundation",
    program: "Neighborhood investment (Amani & Metcalfe Park) and youth",
    kind: "corporate",
    priorities: "Place-based work in Amani and Metcalfe Park; youth development; neighborhood safety through resident-led partners.",
    needWeights: { youth: 1, safety: 0.7, housing: 0.5, food: 0.4, mediation: 0.5 },
    clusterWeight: 0.4,
    range: "Varies; multi-year neighborhood commitments",
    requires: ["outcomes", "geography", "fiscal", "budget", "board"],
    metricsLanguage: "youth engaged, residents in Amani/Metcalfe Park reached, partner collaboration",
    source: "https://www.northwesternmutual.com/foundation/",
  },
  {
    id: "bucks-brewers",
    name: "Milwaukee Bucks Foundation / Brewers Community Foundation",
    program: "Community grants — youth, safety, basic needs",
    kind: "corporate",
    priorities: "Youth, violence prevention, food security and basic needs in Milwaukee neighborhoods. Smaller, faster awards; strong on visibility and stories.",
    needWeights: { youth: 1, food: 0.8, safety: 0.6, other: 0.3 },
    clusterWeight: 0.2,
    range: "Typically $5,000 – $50,000",
    requires: ["outcomes", "fiscal", "budget"],
    metricsLanguage: "youth and families served, meals/supplies delivered, stories of impact",
    source: "https://www.nba.com/bucks/foundation",
  },
];

export interface FunderFit {
  funder: Funder;
  score: number; // 0-100
  reasons: string[];
  gaps: Requirement[];
  ready: Requirement[];
}

export interface ReadinessState {
  /** Manual requirement ids ComForce has confirmed they have. */
  have: RequirementId[];
}

/** Share of the period's need mentions covered by a funder's weighted needs, blended with cluster reach. */
export function scoreFunders(report: Report, clusters: ClusterStats, readiness: ReadinessState): FunderFit[] {
  const totalNeeds = report.needs.reduce((s, n) => s + n.value, 0) || 1;
  return FUNDERS.map((f) => {
    const maxW = Math.max(...Object.values(f.needWeights));
    let weighted = 0;
    const hits: string[] = [];
    for (const n of report.needs) {
      const w = f.needWeights[n.key] ?? 0;
      if (w) {
        weighted += (n.value / totalNeeds) * (w / maxW);
        if (w >= 0.8 * maxW && n.value) hits.push(`${n.label.toLowerCase()} (${n.value})`);
      }
    }
    const needScore = Math.min(1, weighted * 1.6);
    const clusterScore = clusters.pctInClusters / 100;
    const verifiedBonus = report.kpis.verifiedPct >= 50 ? 0.08 : report.kpis.verifiedPct >= 25 ? 0.04 : 0;
    const raw = needScore * (1 - f.clusterWeight * 0.4) + clusterScore * (f.clusterWeight * 0.4) + verifiedBonus;
    const score = Math.round(Math.max(5, Math.min(98, raw * 100)));

    const reasons: string[] = [];
    if (hits.length) reasons.push(`Top needs match: ${hits.slice(0, 3).join(", ")}`);
    if (f.clusterWeight >= 0.5 && clusters.inClusters) reasons.push(`${clusters.pctInClusters}% of requests fall inside ${clusters.clustersReached} of the 26 DCWS clusters`);
    if (report.kpis.verifiedPct) reasons.push(`${report.kpis.verifiedPct}% of completed help confirmed by the resident — the outcome metric they ask for`);
    if (report.kpis.partnersActive > 1) reasons.push(`${report.kpis.partnersActive} partner organizations with logged handoffs`);

    const reqs = f.requires.map((id) => REQUIREMENTS.find((r) => r.id === id)!);
    const ready = reqs.filter((r) => r.kind === "auto" || readiness.have.includes(r.id));
    const gaps = reqs.filter((r) => !ready.includes(r));
    return { funder: f, score, reasons, gaps, ready };
  }).sort((a, b) => b.score - a.score);
}

// ---- Evidence pack ------------------------------------------------------------------

export interface LogicModel {
  inputs: string[];
  activities: string[];
  outputs: string[];
  outcomes: string[];
  impact: string;
}

export function buildLogicModel(report: Report, clusters: ClusterStats): LogicModel {
  const k = report.kpis;
  const voice = report.channels.find((c) => c.key === "voice")?.value ?? 0;
  const sms = report.channels.find((c) => c.key === "sms")?.value ?? 0;
  return {
    inputs: [
      "ComForce MKE volunteers and credible messengers (300+ network)",
      `${k.partnersActive} partner organizations (pantries, legal aid, housing, rides, clinics)`,
      "Relay MKE: Jordan (AI intake & call-back), board, dispatch, routing — near-zero running cost",
      "Resident trust: people call ComForce directly, often before 911",
    ],
    activities: [
      `Intake by phone, text and web in English, Spanish and Hmong (${voice} calls, ${sms} texts this period)`,
      "Triage with redaction and safety screening; crisis resources shared on the call",
      "Dispatch: Jordan calls and emails the partner, records their answer, routes the volunteer",
      "Verification: text to the resident, then a call-back in their language if no reply",
      "Attention queue: overdue and partly-helped cases flagged, nudged, reassigned",
    ],
    outputs: [
      `${k.total} requests handled across ${k.neighborhoods} neighborhoods`,
      `${k.delivered} deliveries of help; ${k.households} household members reached`,
      `${clusters.inClusters} requests (${clusters.pctInClusters}%) inside ${clusters.clustersReached} DCWS Countdown clusters`,
      `${k.partnersActive} partners handled at least one handoff`,
    ],
    outcomes: [
      `${k.verifiedPct}% of completed help confirmed by the resident (${k.verified} of ${k.delivered})`,
      `Median ${fmtMin(k.medianMinutes)} from first contact to delivered help`,
      `${k.reopened} reopened and ${k.partlyHelped} partly-helped cases caught and returned to an owner instead of closed`,
      "Residents in crisis connected to 988 / 211 / Sojourner on the first call",
    ],
    impact: `Residents in the ${HOMICIDE_SHARE_IN_CLUSTERS}%-of-homicides clusters get basic needs met faster and by people they trust, strengthening the protective factors DCWS's theory of change relies on — with evidence a funder can audit request by request.`,
  };
}

export interface UnitEconomics {
  assumptions: { item: string; unit: string; cost: number }[];
  periodCost: number;
  perRequest: number;
  perVerified: number;
  note: string;
}

/** Platform running cost only (not staff). Public list prices, rounded up; edit in one place. */
export function buildUnitEconomics(report: Report): UnitEconomics {
  const k = report.kpis;
  const voice = report.channels.find((c) => c.key === "voice")?.value ?? 0;
  const assumptions = [
    { item: "Voice minutes (intake + partner call + call-back, ~9 min per voice request)", unit: "per min", cost: 0.1 },
    { item: "SMS messages (~6 per request incl. verification)", unit: "per msg", cost: 0.0083 },
    { item: "LLM triage, summaries, drafting (~3 calls per request)", unit: "per request", cost: 0.02 },
    { item: "Hosting, database, maps", unit: "per month", cost: 25 },
  ];
  const months = report.timeline.unit === "month" ? Math.max(1, report.timeline.points.filter((p) => p.value).length) : 1;
  const periodCost = voice * 9 * 0.1 + k.total * 6 * 0.0083 + k.total * 0.02 + 25 * months;
  return {
    assumptions,
    periodCost: round2(periodCost),
    perRequest: k.total ? round2(periodCost / k.total) : 0,
    perVerified: k.verified ? round2(periodCost / k.verified) : 0,
    note: "Platform cost only, at public list prices. Excludes volunteer time and the goods delivered. A Twilio number adds about $1.15/month.",
  };
}

export interface Story {
  title: string;
  body: string;
  requestId: string;
}

/** One de-identified narrative from a verified case. Template, not AI: nothing can be invented. */
export function pickStory(report: Report): Story | null {
  const rows = report.rows.filter((r) => r.status === "verified" && r.residentFeedback === "yes" && r.deliveredAt);
  if (!rows.length) return null;
  const r = rows.sort((a, b) => (b.householdSize ?? 0) - (a.householdSize ?? 0) || b.createdAt.localeCompare(a.createdAt))[0];
  const mins = Math.max(1, Math.round((new Date(r.deliveredAt!).getTime() - new Date(r.createdAt).getTime()) / 60000));
  const hh = r.householdSize ? `a household of ${r.householdSize}` : "a resident";
  const via = r.channel === "voice" ? "called" : r.channel === "sms" ? "texted" : "reached out online to";
  const partner = r.ownerOrg && r.ownerOrg !== "ComForce MKE" ? ` ${r.ownerOrg} accepted the handoff;` : "";
  const when = new Date(r.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return {
    requestId: r.id,
    title: `${r.needs.map(cap).join(" and ")} in ${r.neighborhood}`,
    body: `In ${when}, ${hh} in ${r.neighborhood} ${via} ComForce MKE: ${lower(r.summary)}.${partner} help was delivered ${fmtMin(mins)} after first contact. When Relay checked back, the resident confirmed the help had arrived. No name, address or phone number was needed to produce this record, and the same request can be audited line by line.`,
  };
}

// ---- Application draft --------------------------------------------------------------

export interface ApplicationDraft {
  need: string;
  outcomes: string;
  evaluation: string;
  source: "llm" | "template";
}

export interface DraftInput {
  funder: Funder;
  report: Report;
  clusters: ClusterStats;
  logic: LogicModel;
  story: Story | null;
}

/** Deterministic fallback used when no LLM key is configured or the call fails. */
export function templateDraft({ funder, report, clusters, story }: DraftInput): ApplicationDraft {
  const k = report.kpis;
  const top = report.needs.slice(0, 3).map((n) => n.label.toLowerCase()).join(", ");
  const hoods = report.neighborhoods.slice(0, 4).map((h) => h.neighborhood).join(", ");
  return {
    source: "template",
    need: `Milwaukee's violence is concentrated: DCWS reports ${HOMICIDE_SHARE_IN_CLUSTERS}% of homicide victims fall within 26 incident clusters. In ${report.period.label.toLowerCase() === "all time" ? "the current record" : report.period.label}, ComForce MKE received ${k.total} requests for help, ${clusters.pctInClusters}% of them from inside those clusters (${clusters.clustersReached} clusters reached), led by ${top}. Residents in ${hoods} call ComForce because they trust it — often before any agency. What has been missing is not the response but the record: until now, every request, handoff and outcome lived in phone memories and group chats, so the work could not be shown to ${funder.name}.`,
    outcomes: `With Relay MKE, ComForce now measures what ${funder.name} asks for — ${funder.metricsLanguage}. This period: ${k.delivered} deliveries of help to ${k.households} household members across ${k.neighborhoods} neighborhoods; ${k.verifiedPct}% of completed help confirmed by the resident themselves (${k.verified} confirmations); median ${fmtMin(k.medianMinutes)} from first contact to delivered help; ${k.partnersActive} partner organizations with logged handoffs; ${k.reopened + k.partlyHelped} cases where the resident said help had not fully arrived were reopened rather than counted as done.${story ? ` One example: ${story.body}` : ""}`,
    evaluation: `Success is defined by the resident, not the responder. Every delivery triggers a verification text and, if unanswered, a call-back in the resident's language; only a clear "yes" counts as a verified outcome. Relay records time to claim, time to delivery, partner response, and resident confirmation per request, so ${funder.name} receives (1) a monthly report with these figures by neighborhood and by DCWS cluster, (2) a de-identified request-level export for audit, and (3) the reopen and partly-helped rate as an honesty check. No names, addresses or phone numbers leave the intake boundary; counts are reported by area only.`,
  };
}

// ---- helpers ------------------------------------------------------------------------

function fmtMin(m: number): string {
  if (!m) return "n/a";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h < 24) return r ? `${h} h ${r} min` : `${h} h`;
  return `${Math.round(h / 24)} d`;
}
const round2 = (n: number) => Math.round(n * 100) / 100;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const lower = (s: string) => s.replace(/\.$/, "").replace(/^./, (c) => c.toLowerCase());
