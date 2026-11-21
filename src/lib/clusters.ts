// The City of Milwaukee Department of Community Wellness & Safety (DCWS) announced
// "This Is Our City: The Countdown" in October 2026: 26 incident clusters, named by
// intersection, that hold 88.5% of the city's homicide victims. Partners commit
// resources to those clusters on a shared action calendar.
// Source: https://carvdnstone.com/city-of-milwaukee-launches-this-is-our-city-the-countdown-to-mobilize-community-partners-in-26-areas-impacted-by-violence/
//
// Coordinates are approximate intersection centroids (street grid, ±200 m). DCWS has
// not published polygons; we treat each cluster as a ~0.6 mi radius around the
// intersection and only ever report counts per cluster, never individual locations.
import { residentApprox } from "./geo";

export interface Cluster {
  n: number;
  name: string;
  coords: [number, number];
  side: "North" | "South" | "Northwest" | "East";
}

export const CLUSTERS: Cluster[] = [
  { n: 1, name: "23rd & Locust", coords: [43.0712, -87.9425], side: "North" },
  { n: 2, name: "25th & Capitol", coords: [43.0896, -87.9455], side: "North" },
  { n: 3, name: "11th & Atkinson", coords: [43.0870, -87.9245], side: "North" },
  { n: 4, name: "2nd & Burleigh", coords: [43.0750, -87.9125], side: "North" },
  { n: 5, name: "8th & Greenfield", coords: [43.0170, -87.9215], side: "South" },
  { n: 6, name: "38th & Center", coords: [43.0677, -87.9605], side: "North" },
  { n: 7, name: "64th & Silver Spring", coords: [43.1190, -87.9930], side: "Northwest" },
  { n: 8, name: "37th & Hopkins", coords: [43.0945, -87.9595], side: "North" },
  { n: 9, name: "Water & Van Buren", coords: [43.0505, -87.9035], side: "East" },
  { n: 10, name: "13th & Concordia", coords: [43.0845, -87.9270], side: "North" },
  { n: 11, name: "40th & Lisbon", coords: [43.0570, -87.9640], side: "North" },
  { n: 12, name: "27th & Highland", coords: [43.0452, -87.9475], side: "North" },
  { n: 13, name: "42nd & Fond du Lac", coords: [43.0810, -87.9665], side: "North" },
  { n: 14, name: "38th & Silver Spring", coords: [43.1190, -87.9600], side: "North" },
  { n: 15, name: "95th & Silver Spring", coords: [43.1190, -88.0320], side: "Northwest" },
  { n: 16, name: "28th & National", coords: [43.0235, -87.9490], side: "South" },
  { n: 17, name: "68th & Chambers", coords: [43.0785, -87.9985], side: "Northwest" },
  { n: 18, name: "27th & Fond du Lac", coords: [43.0680, -87.9478], side: "North" },
  { n: 19, name: "76th & Appleton", coords: [43.1020, -88.0095], side: "Northwest" },
  { n: 20, name: "37th & Darien", coords: [43.1052, -87.9590], side: "North" },
  { n: 21, name: "16th & Pierce", coords: [43.0205, -87.9330], side: "South" },
  { n: 22, name: "107th (Silver Spring corridor)", coords: [43.1190, -88.0470], side: "Northwest" },
  { n: 23, name: "24th & Walnut", coords: [43.0530, -87.9435], side: "North" },
  { n: 24, name: "91st & Brown Deer", coords: [43.1769, -88.0270], side: "Northwest" },
  { n: 25, name: "9th & Cleveland", coords: [42.9955, -87.9230], side: "South" },
  { n: 26, name: "12th & Hadley", coords: [43.0700, -87.9262], side: "North" },
];

export const CLUSTER_RADIUS_MI = 0.6;
export const HOMICIDE_SHARE_IN_CLUSTERS = 88.5;

const MI_PER_DEG_LAT = 69.0;
const MI_PER_DEG_LNG = 50.5; // at 43°N

export function milesBetween(a: [number, number], b: [number, number]): number {
  const dy = (a[0] - b[0]) * MI_PER_DEG_LAT;
  const dx = (a[1] - b[1]) * MI_PER_DEG_LNG;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Nearest cluster within the radius, or null. Uses the same area-level approximate point the map uses. */
export function clusterFor(req: { id: string; neighborhood: string }): Cluster | null {
  const p = residentApprox(req.neighborhood, req.id);
  let best: Cluster | null = null;
  let bestD = CLUSTER_RADIUS_MI;
  for (const c of CLUSTERS) {
    const d = milesBetween(p, c.coords);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

export interface ClusterRow {
  cluster: Cluster;
  total: number;
  delivered: number;
  verified: number;
  open: number;
  needs: Record<string, number>;
  partners: string[];
}

export interface ClusterStats {
  rows: ClusterRow[];
  inClusters: number;
  outside: number;
  pctInClusters: number;
  clustersReached: number;
  verifiedInClusters: number;
  deliveredInClusters: number;
}

type ClusterReq = { id: string; neighborhood: string; status: string; needs: string[]; ownerOrg?: string; residentFeedback?: string };

export function clusterStats(requests: ClusterReq[]): ClusterStats {
  const map = new Map<number, ClusterRow>();
  let outside = 0;
  for (const r of requests) {
    const c = clusterFor(r);
    if (!c) {
      outside++;
      continue;
    }
    const row = map.get(c.n) ?? { cluster: c, total: 0, delivered: 0, verified: 0, open: 0, needs: {}, partners: [] };
    row.total++;
    const done = r.status === "delivered" || r.status === "verified";
    if (done) row.delivered++;
    if (r.status === "verified" && r.residentFeedback !== "partial") row.verified++;
    if (!done) row.open++;
    for (const n of r.needs) row.needs[n] = (row.needs[n] ?? 0) + 1;
    if (r.ownerOrg && !row.partners.includes(r.ownerOrg)) row.partners.push(r.ownerOrg);
    map.set(c.n, row);
  }
  const rows = [...map.values()].sort((a, b) => b.total - a.total || a.cluster.n - b.cluster.n);
  const inClusters = rows.reduce((s, r) => s + r.total, 0);
  return {
    rows,
    inClusters,
    outside,
    pctInClusters: requests.length ? Math.round((inClusters / requests.length) * 100) : 0,
    clustersReached: rows.length,
    verifiedInClusters: rows.reduce((s, r) => s + r.verified, 0),
    deliveredInClusters: rows.reduce((s, r) => s + r.delivered, 0),
  };
}
