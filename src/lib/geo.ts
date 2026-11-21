// Neighborhood centroids computed from City of Milwaukee polygons (data/public/milwaukee-neighborhoods.geojson).
// Area-level only, never individual addresses.
export const HOOD_COORDS: Record<string, [number, number]> = {
  "Sherman Park": [43.071, -87.9619],
  Harambee: [43.0711, -87.9133],
  "Metcalfe Park": [43.0643, -87.9542],
  Amani: [43.0687, -87.9441],
  Riverwest: [43.0728, -87.8994],
  "Clarke Square": [43.0206, -87.9404],
  "Walker's Point": [43.0228, -87.9214],
  "Washington Park": [43.0548, -87.9649],
  "Garden Homes": [43.0936, -87.9472],
  "Bay View": [42.9946, -87.8983],
  "Historic Mitchell Street": [43.0117, -87.9246],
  Concordia: [43.0416, -87.9527],
  "Silver City": [43.0208, -87.9572],
  Midtown: [43.0529, -87.9446],
  "Old North Milwaukee": [43.1083, -87.9562],
  "Silver Spring": [43.1222, -87.9992],
  "Hampton Heights": [43.1085, -87.9828],
  "Franklin Heights": [43.0826, -87.9453],
  "Lincoln Creek": [43.0956, -87.9722],
  "Rufus King": [43.0952, -87.9338],
  "Thurston Woods": [43.1228, -87.9564],
  "Roosevelt Grove": [43.0841, -87.9612],
  "Dineen Park": [43.0829, -87.997],
  Uptown: [43.0643, -87.9775],
  "Arlington Heights": [43.0855, -87.9291],
  "McGovern Park": [43.1156, -87.9765],
  Fairfield: [43.1329, -87.9567],
  "North Division": [43.0675, -87.9293],
  "Lincoln Village": [43.0009, -87.9247],
};
export const MKE_CENTER: [number, number] = [43.04, -87.935];

/** Where a ComForce volunteer typically starts a run when the browser can't share location (synthetic). */
export const COMFORCE_BASE: { name: string; coords: [number, number] } = { name: "ComForce MKE · Sherman Park base", coords: [43.0738, -87.9612] };

/** Deterministic ~300 m offset so resident pins never sit exactly on a neighborhood centroid (privacy + realism). */
export function residentApprox(neighborhood: string, seed: string): [number, number] {
  const c = HOOD_COORDS[neighborhood] ?? MKE_CENTER;
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const a = (h % 360) * (Math.PI / 180);
  const r = 0.0025 + ((h >> 9) % 100) / 100 * 0.002;
  return [c[0] + Math.sin(a) * r, c[1] + Math.cos(a) * r * 1.35];
}
