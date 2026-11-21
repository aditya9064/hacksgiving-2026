# Data

**Synthetic data only.** The hackathon requires "appropriately authorized, de-identified, or synthetic data," and the product never identifies or predicts individuals.

- `synthetic/`: generated demo residents, cases, and partner orgs (seeded and reproducible)
- Public open data (e.g. data.milwaukee.gov, Census ACS) is used **aggregated to neighborhood level only**, with its source and license noted

## `public/`: cached open data (aggregates only)

Pulled by `node tools/storm-data/pull.mjs`, so the demo never depends on a live API. Re-run it to refresh.

| File | What | Source |
| --- | --- | --- |
| `milwaukee-neighborhoods.geojson` | 190 neighborhood polygons, WGS84 | City of Milwaukee, [Neighborhoods](https://data.milwaukee.gov/dataset/neighborhoods) (reprojected from WKID 32054 by the city's map service) |
| `dr4923-milwaukee.json` | FEMA DR-4923 (Apr 13–23, 2026 storms) housing-assistance registrations and approved aid by ZIP; per-neighborhood MFD Fire/Rescue and EMS call counts during the storm vs. the six weeks before; 2023 building fires per neighborhood | [OpenFEMA Housing Assistance](https://www.fema.gov/openfema-data-page/housing-assistance-program-data-owners-v2) (public domain); MFD [Calls For Service (Current)](https://data.milwaukee.gov/dataset/mfdopendatafire) and [Fire Incident Detail (Historical)](https://data.milwaukee.gov/dataset/incident-detail-historical) |

Individual calls are used only in memory to assign a neighborhood; no addresses, coordinates or names are stored. The Relay Board's requests are still synthetic: they are fictional residents placed in the neighborhoods these aggregates show were hardest hit (`src/lib/db/seed.ts`).
