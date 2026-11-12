# Peninsular Malaysia state boundaries

File: `src/data/geo/peninsula-states.json` (GeoJSON FeatureCollection, WGS84 lon/lat, ~97 KB).

## Source and licence

- Dataset: geoBoundaries **gbOpen**, Malaysia ADM1 (release commit `9469f09` of `wmgeolab/geoBoundaries`, build date 12 Dec 2023, boundary year 2017).
- Download: https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/MYS/ADM1/geoBoundaries-MYS-ADM1.geojson
- API record: https://www.geoboundaries.org/api/current/gbOpen/MYS/ADM1/
- Retrieved: 2026-11-12.
- Licence: gbOpen is distributed under **CC BY 4.0**. The API record for this boundary, however, lists the underlying source as OpenStreetMap (Wambacher extract) under **ODbL 1.0**. Treat both as applying: attribute geoBoundaries and OpenStreetMap contributors, and keep the derived boundary data open under ODbL share-alike if it is redistributed as a database. Both permit commercial use. Have this confirmed before production (legal review is not done).
- Natural Earth was not needed; GADM was avoided (non-commercial licence).

### Attribution string for the UI

> State boundaries: geoBoundaries (CC BY 4.0), derived from © OpenStreetMap contributors (ODbL). Simplified for display.

(Also stored in the file's `metadata.attribution`.)

## Content

13 features: `jhr kdh ktn mlk nsn phg prk pls png sgr trg kul pjy`, each with `properties.id`, `iso3166_2`, `nameEn`, `nameZh`, `nameMs`. Sabah, Sarawak and Labuan (East Malaysia) are dropped. Source names "Malacca" and "Penang" are normalised to Melaka / Pulau Pinang (nameMs); `nameEn` is "Penang".
Multipolygons include Langkawi (in Kedah), Penang Island (in Penang) and Johor's offshore islands (e.g. Tioman, bbox reaches lon 104.54).

## Rebuild

```
node tools/build-boundaries.mjs                 # download, simplify, write, validate
node tools/build-boundaries.mjs --validate-only # validate existing file
```
Node 18+ (built-in `fetch`), no dependencies. Exit code is non-zero if validation fails.

## Simplification

Own Douglas-Peucker per ring; tolerance scales with ring size (0.0003°–0.004°, roughly 30–450 m), so KL and Putrajaya get the light tolerance. Coordinates rounded to 4 decimals (~11 m). Polygons smaller than ~1e-6 deg² (excluding each state's largest polygon) are dropped.

## Validation (last run)

All rings closed, within lon 99.5–104.7 / lat 1.1–6.8, 13 features. Point-in-polygon checks all passed: Petronas Twin Towers→KL, Putra Mosque→Putrajaya, Batu Caves→Selangor, A Famosa→Melaka, George Town→Penang, Langkawi Kuah→Kedah, Johor Bahru→Johor.

Point counts: jhr 884, kdh 1016, ktn 333, kul 141, mlk 109, nsn 116, phg 355, pjy 86, pls 88, png 258, prk 622, sgr 708, trg 610.

## Caveats

- For display and state counting only; **not** legal, cadastral or survey boundaries.
- Each ring is simplified independently, so shared borders between neighbouring states may show tiny gaps or overlaps (up to a few hundred metres at the coarsest tolerance). Points within a few hundred metres of a border, especially around the small KL / Putrajaya / Selangor frontier, may be assigned to the neighbouring state. Prefer a POI's recorded state field over point-in-polygon for counts; use geometry only for map drawing and sanity checks.
- The source is a 2017 OSM extract; KL and Putrajaya outlines are approximate (e.g. Putrajaya's lakes/water edges are generalised).
- Very small islets are omitted.
