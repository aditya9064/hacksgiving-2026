// Approximate neighborhood centroids (public, area-level only — never individual addresses).
export const HOOD_COORDS: Record<string, [number, number]> = {
  "Sherman Park": [43.0665, -87.9665],
  Harambee: [43.0715, -87.9075],
  "Metcalfe Park": [43.0525, -87.9535],
  Amani: [43.0615, -87.9335],
  "Lindsay Heights": [43.0585, -87.9275],
  Riverwest: [43.0675, -87.8985],
  "Clarke Square": [43.0145, -87.9345],
  "Walker's Point": [43.0235, -87.9115],
  "Washington Park": [43.0465, -87.9685],
  "Garden Homes": [43.0875, -87.9485],
  "Bay View": [42.9975, -87.8985],
  "Historic Mitchell St": [43.0125, -87.9215],
  Concordia: [43.0445, -87.9465],
  "Silver City": [43.0165, -87.9565],
  Midtown: [43.0505, -87.9375],
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
