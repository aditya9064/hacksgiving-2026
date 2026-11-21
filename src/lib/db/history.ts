import type { Channel, HelpRequest, Need, Urgency } from "../types";
import { NEIGHBORHOODS } from "../types";
import { SEED_PARTNERS, makeShortCode } from "./seed";

/**
 * SYNTHETIC ARCHIVE of closed cases for past months, so Impact & Reporting can filter by
 * month and year. Every case is fictional. It is generated deterministically per month (same
 * numbers on every restart) and is served separately from the live record (GET /api/history),
 * so the Relay Board, Pulse and dispatch never see it.
 *
 * Shape follows the real calendar: winter heat/utility pressure, back-to-school youth work,
 * and the April 13–23, 2026 storms (FEMA DR-4923) as a spike in housing and cleanup requests.
 */

interface Template {
  summary: string;
  needs: Need[];
  urgency: Urgency;
  weight: number;
  months?: number[]; // 0-11; boosts weight in these months
}

const TEMPLATES: Template[] = [
  { summary: "Groceries for family until payday", needs: ["food"], urgency: "high", weight: 10 },
  { summary: "Regular pantry support", needs: ["food"], urgency: "normal", weight: 7 },
  { summary: "Utility shutoff notice, behind on bill", needs: ["utilities"], urgency: "high", weight: 6, months: [0, 1, 2, 10, 11] },
  { summary: "No heat, landlord unresponsive", needs: ["housing", "legal"], urgency: "critical", weight: 3, months: [0, 1, 10, 11] },
  { summary: "5-day eviction notice", needs: ["rent", "legal"], urgency: "critical", weight: 5 },
  { summary: "Short on rent this month", needs: ["rent"], urgency: "high", weight: 7 },
  { summary: "Ride to medical appointment", needs: ["transport", "health"], urgency: "high", weight: 5 },
  { summary: "Bus pass to get to work", needs: ["transport"], urgency: "normal", weight: 4 },
  { summary: "Medication refill, insurance lapsed", needs: ["health"], urgency: "high", weight: 4 },
  { summary: "Neighbor dispute, mediation requested", needs: ["mediation", "safety"], urgency: "high", weight: 5, months: [5, 6, 7] },
  { summary: "Youth conflict that started online", needs: ["youth", "safety", "mediation"], urgency: "critical", weight: 4, months: [5, 6, 7, 8] },
  { summary: "School supplies and after-school program", needs: ["youth"], urgency: "normal", weight: 2, months: [7, 8] },
  { summary: "Reentry support: ID, phone, housing", needs: ["housing", "other", "safety"], urgency: "high", weight: 2 },
  { summary: "House fire, family displaced", needs: ["housing", "food", "other"], urgency: "critical", weight: 1.5, months: [0, 1, 11] },
];

const STORM: Template[] = [
  { summary: "Flooded basement, furnace and water heater out", needs: ["housing", "health"], urgency: "critical", weight: 6 },
  { summary: "Senior needs basement muck-out after flooding", needs: ["housing", "other"], urgency: "high", weight: 5 },
  { summary: "Power out, food spoiled", needs: ["food", "utilities"], urgency: "high", weight: 5 },
  { summary: "Help registering with FEMA", needs: ["other", "legal"], urgency: "high", weight: 4 },
  { summary: "Tree through roof, family needs shelter", needs: ["housing", "safety"], urgency: "critical", weight: 2 },
  { summary: "Renter in flooded unit, landlord demanding rent", needs: ["rent", "legal", "housing"], urgency: "critical", weight: 3 },
];

const RESPONDERS: Record<string, string[]> = {
  "p-comforce": ["Marcus T.", "Devin H.", "Andre K."],
  "p-disaster": ["Marcus T.", "Renee C."],
  "p-cleanup": ["Luis P.", "Sam O."],
  "p-pantry": ["Tasha B.", "Gloria N."],
  "p-hmong": ["Mai V.", "Tou X."],
  "p-southside": ["Rosa M.", "Diego A."],
  "p-housing": ["Keisha R.", "Brian L."],
  "p-energy": ["Jamal W."],
  "p-clinic": ["Dr. Patel", "Nurse Kim"],
  "p-rides": ["Dee L.", "Omar S."],
  "p-youth": ["Andre K.", "Coach Ray"],
  "p-legal": ["Ana G."],
};

// Cases per month before seasonal templates. April 2026 adds the storm surge on top.
const BASE_PER_MONTH = 11;
const STORM_YEAR = 2026;
const STORM_MONTH = 3;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(r: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((n, t) => n + weight(t), 0);
  let x = r() * total;
  for (const t of items) if ((x -= weight(t)) <= 0) return t;
  return items[items.length - 1];
}

// Minutes from first contact to delivered help, by urgency (log-uniform within the range).
const RESPONSE: Record<Urgency, [number, number]> = { critical: [18, 240], high: [35, 600], normal: [80, 1800], low: [180, 3000] };

/** Closed cases from 11 months before `now`'s month up to `cutoffDays` ago (the live seed covers the last few days). */
export function buildHistory(now = new Date(), cutoffDays = 6): HelpRequest[] {
  const out: HelpRequest[] = [];
  const cutoff = now.getTime() - cutoffDays * 86_400_000;
  const hoods = NEIGHBORHOODS as readonly string[];

  for (let back = 11; back >= 0; back--) {
    const y = new Date(now.getFullYear(), now.getMonth() - back, 1).getFullYear();
    const m = new Date(now.getFullYear(), now.getMonth() - back, 1).getMonth();
    const r = rng(y * 12 + m + 97);
    const start = new Date(y, m, 1).getTime();
    const end = Math.min(new Date(y, m + 1, 1).getTime(), cutoff);
    if (end <= start) continue;
    const span = (end - start) / (new Date(y, m + 1, 1).getTime() - start);

    const storm = y === STORM_YEAR && m === STORM_MONTH;
    const followUp = y === STORM_YEAR && m === STORM_MONTH + 1;
    const n = Math.round((BASE_PER_MONTH + Math.floor(r() * 6) + (storm ? 26 : followUp ? 8 : 0)) * span);

    for (let i = 0; i < n; i++) {
      const stormCase = (storm && i < 26 * span) || (followUp && i < 8 * span);
      const t = stormCase ? pick(r, STORM, (x) => x.weight) : pick(r, TEMPLATES, (x) => x.weight * (x.months?.includes(m) ? 2.5 : 1));
      let created = start + r() * (end - start);
      if (stormCase && storm) created = new Date(y, m, 13).getTime() + r() * (Math.min(end, new Date(y, m + 1, 1).getTime()) - new Date(y, m, 13).getTime());
      const d = new Date(created);
      d.setHours(7 + Math.floor(r() * 14), Math.floor(r() * 60), 0, 0);
      if (d.getTime() >= end) continue;

      const partners = SEED_PARTNERS.filter((p) => p.needs.includes(t.needs[0]));
      const partner = partners.length ? partners[Math.floor(r() * partners.length)] : SEED_PARTNERS[0];
      const names = RESPONDERS[partner.id] ?? ["Volunteer"];
      const [lo, hi] = RESPONSE[t.urgency];
      const mins = Math.round(lo * Math.pow(hi / lo, r()));
      const deliveredAt = new Date(d.getTime() + mins * 60_000);
      const roll = r();
      const feedback: HelpRequest["residentFeedback"] = roll < 0.7 ? "yes" : roll < 0.86 ? "partial" : roll < 0.93 ? "no" : undefined;
      const verifiedAt = feedback && feedback !== "no" ? new Date(deliveredAt.getTime() + (30 + r() * 600) * 60_000) : undefined;
      const ch = r();
      const channel: Channel = ch < 0.42 ? "sms" : ch < 0.72 ? "web" : "voice";
      const lang = r();

      out.push({
        id: `hist-${y}${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(3, "0")}`,
        shortCode: makeShortCode(y * 1000 + m * 50 + i),
        createdAt: d.toISOString(),
        updatedAt: (verifiedAt ?? deliveredAt).toISOString(),
        status: verifiedAt ? "verified" : "delivered",
        channel,
        redactedText: t.summary,
        summary: t.summary,
        needs: t.needs,
        urgency: t.urgency,
        neighborhood: hoods[Math.floor(r() * hoods.length)],
        householdSize: r() < 0.7 ? 1 + Math.floor(r() * 6) : undefined,
        language: lang < 0.86 ? "en" : lang < 0.96 ? "es" : "hmn",
        consentToShare: true,
        ownerName: names[Math.floor(r() * names.length)],
        ownerOrg: partner.name,
        partnerId: partner.id,
        deliveredAt: deliveredAt.toISOString(),
        verifiedAt: verifiedAt?.toISOString(),
        residentFeedback: feedback,
      });
    }
  }
  return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
