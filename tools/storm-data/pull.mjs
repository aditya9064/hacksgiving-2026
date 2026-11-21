// Pulls public data behind the DR-4923 storm replay and caches it as static JSON,
// so the demo never depends on a live API.
//
//   node tools/storm-data/pull.mjs
//
// Writes:
//   data/public/milwaukee-neighborhoods.geojson   city neighborhood polygons (WGS84)
//   data/public/dr4923-milwaukee.json              all aggregates + sources
//
// Privacy: only aggregate counts leave this script. No addresses, no coordinates of
// individual calls, no names. Points are used in memory to assign a neighborhood, then dropped.

import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CKAN = "https://data.milwaukee.gov/api/3/action";
const NBHD_URL =
  "https://milwaukeemaps.milwaukee.gov/arcgis/rest/services/planning/special_districts/MapServer/4/query?where=1%3D1&outFields=NEIGHBORHD&outSR=4326&f=geojson";
const FEMA = "https://www.fema.gov/api/open/v2";
const MFD_CURRENT = "cdf51c45-5fe3-415e-a08c-14ed134dcb64"; // MFD Calls For Service Detail (Current)
const MFD_2023 = "d18ef942-9630-4b82-b5a1-61fad0af422a"; // Fire Incident Detail (Historical), 2023
const DR = 4923;
const STORM_START = "2026-04-13";
const STORM_END = "2026-04-24"; // exclusive; FEMA incident period Apr 13–23
const BASE_START = "2026-03-02"; // six weeks before, same length windows compared per day
const BASE_END = "2026-04-13";

async function json(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return await r.json();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((res) => setTimeout(res, 1500 * i));
    }
  }
}

async function sql(query) {
  const d = await json(`${CKAN}/datastore_search_sql?sql=${encodeURIComponent(query)}`);
  if (!d.success) throw new Error(JSON.stringify(d.error));
  return d.result.records;
}

async function sqlAll(base, page = 30000) {
  const out = [];
  for (let off = 0; ; off += page) {
    const rows = await sql(`${base} LIMIT ${page} OFFSET ${off}`);
    out.push(...rows);
    process.stdout.write(`  ${out.length} rows\r`);
    if (rows.length < page) break;
  }
  process.stdout.write("\n");
  return out;
}

// ---- geometry -------------------------------------------------------------
function ringContains(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function polyContains(poly, x, y) {
  if (!ringContains(poly[0], x, y)) return false;
  for (let h = 1; h < poly.length; h++) if (ringContains(poly[h], x, y)) return false;
  return true;
}
function buildIndex(fc) {
  return fc.features.map((f) => {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of polys) for (const [x, y] of p[0]) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { name: f.properties.NEIGHBORHD, polys, box: [minX, minY, maxX, maxY] };
  });
}
function locate(index, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  for (const n of index) {
    const [a, b, c, d] = n.box;
    if (x < a || x > c || y < b || y > d) continue;
    if (n.polys.some((p) => polyContains(p, x, y))) return n.name;
  }
  return null;
}
const title = (s) => s.toLowerCase().replace(/(^|[\s\-/'(])([a-z])/g, (m, p, c) => p + c.toUpperCase()).replace(/'S\b/g, "'s").replace(/^Mcgovern/, "McGovern");

// ---- main -----------------------------------------------------------------
async function main() {
  console.log("1/5 neighborhoods");
  const nb = await json(NBHD_URL);
  const index = buildIndex(nb);
  console.log(`  ${index.length} polygons`);

  console.log("2/5 FEMA DR-4923 housing assistance, Milwaukee County");
  const fema = {};
  for (const t of ["HousingAssistanceOwners", "HousingAssistanceRenters"]) {
    const d = await json(`${FEMA}/${t}?$filter=disasterNumber%20eq%20${DR}%20and%20county%20eq%20'Milwaukee%20(County)'&$top=1000`);
    for (const r of d[t]) {
      if (!/^53[12]\d\d$/.test(r.zipCode)) continue; // drop miscoded out-of-area ZIPs
      const z = (fema[r.zipCode] ??= { zip: r.zipCode, registrations: 0, approved: 0, approvedUsd: 0, ownerRegistrations: 0, renterRegistrations: 0, rentalAssistanceUsd: 0, majorOrSubstantialRenterDamage: 0 });
      z.registrations += r.validRegistrations ?? 0;
      z.approved += r.approvedForFemaAssistance ?? 0;
      z.approvedUsd += r.totalApprovedIhpAmount ?? 0;
      z.rentalAssistanceUsd += r.rentalAmount ?? 0;
      if (t.endsWith("Owners")) z.ownerRegistrations += r.validRegistrations ?? 0;
      else {
        z.renterRegistrations += r.validRegistrations ?? 0;
        z.majorOrSubstantialRenterDamage += (r.totalWithMajorDamage ?? 0) + (r.totalWithSubstantialDamage ?? 0);
      }
    }
  }
  const zips = Object.values(fema).map((z) => ({ ...z, approvedUsd: Math.round(z.approvedUsd), rentalAssistanceUsd: Math.round(z.rentalAssistanceUsd) })).sort((a, b) => b.registrations - a.registrations);
  const femaTotals = zips.reduce((t, z) => ({ registrations: t.registrations + z.registrations, approved: t.approved + z.approved, approvedUsd: t.approvedUsd + z.approvedUsd }), { registrations: 0, approved: 0, approvedUsd: 0 });
  console.log(`  ${zips.length} ZIPs, ${femaTotals.registrations} registrations, $${femaTotals.approvedUsd.toLocaleString()}`);

  console.log("3/5 MFD 2023 incidents → ZIP crosswalk + building fires");
  const hist = await sqlAll(`SELECT "ZIP_Code" z, "Latitude" la, "Longitude" lo, "Final_Call_for_Service_Type" t FROM "${MFD_2023}" WHERE "Latitude" IS NOT NULL ORDER BY "_id"`);
  const zipVotes = {}; // neighborhood -> zip -> count
  const fires2023 = {};
  for (const r of hist) {
    const n = locate(index, Number(r.lo), Number(r.la));
    if (!n) continue;
    if (/^53[12]\d\d$/.test(r.z ?? "")) ((zipVotes[n] ??= {})[r.z] = (zipVotes[n][r.z] ?? 0) + 1);
    if (/^Building Fire/i.test(r.t ?? "")) fires2023[n] = (fires2023[n] ?? 0) + 1;
  }
  const primaryZip = {};
  for (const [n, v] of Object.entries(zipVotes)) primaryZip[n] = Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];

  console.log("4/5 MFD calls during the storm vs the six weeks before");
  const cur = await sqlAll(`SELECT "IncidentStarted" s, "IncidentType" t, "latitude" la, "longitude" lo FROM "${MFD_CURRENT}" WHERE "IncidentStarted" >= '${BASE_START}' AND "IncidentStarted" < '${STORM_END}' AND "IncidentType" IN ('EMS','Fire/Rescue') ORDER BY "_id"`);
  const stormDays = (Date.parse(STORM_END) - Date.parse(STORM_START)) / 864e5;
  const baseDays = (Date.parse(BASE_END) - Date.parse(BASE_START)) / 864e5;
  const calls = {}; // neighborhood -> counts
  for (const r of cur) {
    const n = locate(index, Number(r.lo), Number(r.la));
    if (!n) continue;
    const c = (calls[n] ??= { stormFire: 0, stormEms: 0, baseFire: 0, baseEms: 0 });
    const storm = r.s >= STORM_START;
    if (r.t === "Fire/Rescue") storm ? c.stormFire++ : c.baseFire++;
    else storm ? c.stormEms++ : c.baseEms++;
  }

  console.log("5/5 writing");
  const zipByCode = Object.fromEntries(zips.map((z) => [z.zip, z]));
  const neighborhoods = index.map(({ name }) => {
    const c = calls[name] ?? { stormFire: 0, stormEms: 0, baseFire: 0, baseEms: 0 };
    const zip = primaryZip[name];
    const z = zipByCode[zip];
    const stormFirePerDay = c.stormFire / stormDays;
    const baseFirePerDay = c.baseFire / baseDays;
    return {
      neighborhood: title(name),
      primaryZip: zip ?? null,
      femaZipRegistrations: z?.registrations ?? 0,
      femaZipApprovedUsd: z?.approvedUsd ?? 0,
      mfdStormFireRescueCalls: c.stormFire,
      mfdStormEmsCalls: c.stormEms,
      mfdFireRescuePerDayStorm: +stormFirePerDay.toFixed(2),
      mfdFireRescuePerDayBefore: +baseFirePerDay.toFixed(2),
      buildingFires2023: fires2023[name] ?? 0,
    };
  }).sort((a, b) => b.femaZipRegistrations - a.femaZipRegistrations || b.mfdStormFireRescueCalls - a.mfdStormFireRescueCalls);

  const sources = [
    { name: "FEMA OpenFEMA Housing Assistance Program Data (Owners, Renters) v2", url: "https://www.fema.gov/openfema-data-page/housing-assistance-program-data-owners-v2", license: "Public domain (US federal government)", note: `DR-${DR}, Milwaukee County, ZIP-level aggregates` },
    { name: "FEMA Disaster Declarations Summaries v2", url: `https://www.fema.gov/disaster/${DR}`, license: "Public domain (US federal government)", note: "Declared 2026-06-30; incident period 2026-04-13 to 2026-04-23" },
    { name: "City of Milwaukee, Neighborhoods (Neighborhood Identification Project)", url: "https://data.milwaukee.gov/dataset/neighborhoods", license: "City of Milwaukee Open Data, see data.milwaukee.gov terms", note: "Reprojected server-side from WKID 32054 to WGS84" },
    { name: "Milwaukee Fire Department, MFD Calls For Service Detail (Current)", url: "https://data.milwaukee.gov/dataset/mfdopendatafire", license: "City of Milwaukee Open Data, see data.milwaukee.gov terms", note: `Counted per neighborhood for ${STORM_START}..${STORM_END} (exclusive) and ${BASE_START}..${BASE_END}; individual calls not retained` },
    { name: "Milwaukee Fire Department, Fire Incident Detail (Historical) 2023", url: "https://data.milwaukee.gov/dataset/incident-detail-historical", license: "City of Milwaukee Open Data, see data.milwaukee.gov terms", note: "Building Fire counts per neighborhood; also used to map neighborhoods to their primary ZIP" },
  ];

  const full = {
    generatedAt: new Date().toISOString(),
    disaster: { number: DR, title: "Severe Storms, Tornadoes, and Flooding", incidentStart: "2026-04-13", incidentEnd: "2026-04-23", declared: "2026-06-30" },
    milwaukeeCountyTotals: femaTotals,
    zips,
    neighborhoods,
    sources,
  };

  await mkdir(join(ROOT, "data/public"), { recursive: true });
  await writeFile(join(ROOT, "data/public/milwaukee-neighborhoods.geojson"), JSON.stringify(nb));
  await writeFile(join(ROOT, "data/public/dr4923-milwaukee.json"), JSON.stringify(full, null, 2) + "\n");
  console.log("  done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
