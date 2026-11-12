#!/usr/bin/env node
// Rebuilds src/data/geo/peninsula-states.json from geoBoundaries gbOpen MYS ADM1.
// Usage: node tools/build-boundaries.mjs [--validate-only]
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const COMMIT = '9469f09';
const URL_GJ = `https://github.com/wmgeolab/geoBoundaries/raw/${COMMIT}/releaseData/gbOpen/MYS/ADM1/geoBoundaries-MYS-ADM1.geojson`;
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/geo/peninsula-states.json');

const REGIONS = {
  'MY-01': ['jhr', 'Johor', '柔佛', 'Johor'],
  'MY-02': ['kdh', 'Kedah', '吉打', 'Kedah'],
  'MY-03': ['ktn', 'Kelantan', '吉兰丹', 'Kelantan'],
  'MY-04': ['mlk', 'Melaka', '马六甲', 'Melaka'],
  'MY-05': ['nsn', 'Negeri Sembilan', '森美兰', 'Negeri Sembilan'],
  'MY-06': ['phg', 'Pahang', '彭亨', 'Pahang'],
  'MY-08': ['prk', 'Perak', '霹雳', 'Perak'],
  'MY-09': ['pls', 'Perlis', '玻璃市', 'Perlis'],
  'MY-07': ['png', 'Penang', '槟城', 'Pulau Pinang'],
  'MY-10': ['sgr', 'Selangor', '雪兰莪', 'Selangor'],
  'MY-11': ['trg', 'Terengganu', '登嘉楼', 'Terengganu'],
  'MY-14': ['kul', 'Kuala Lumpur', '吉隆坡联邦直辖区', 'Wilayah Persekutuan Kuala Lumpur'],
  'MY-16': ['pjy', 'Putrajaya', '布城联邦直辖区', 'Wilayah Persekutuan Putrajaya'],
};

const BASE_TOL = 0.004; // degrees (~450 m) for the largest rings
const MIN_TOL = 0.0003; // lighter tolerance for small rings
const MIN_RING_AREA = 1e-6; // deg^2; drops sub-hectare slivers, never a state's largest polygon

function sqSegDist(p, a, b) {
  let [x, y] = a;
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx || dy) {
    const t = Math.max(0, Math.min(1, ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)));
    x += dx * t;
    y += dy * t;
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function dp(pts, tol) {
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = sqSegDist(pts[i], pts[s], pts[e]);
      if (d > max) { max = d; idx = i; }
    }
    if (max > t2) { keep[idx] = 1; stack.push([s, idx], [idx, e]); }
  }
  return pts.filter((_, i) => keep[i]);
}

const area = (r) => {
  let s = 0;
  for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
  return Math.abs(s / 2);
};
const bboxOf = (r) => r.reduce(
  (b, [x, y]) => [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)],
  [Infinity, Infinity, -Infinity, -Infinity],
);
const r4 = (n) => Math.round(n * 1e4) / 1e4;

function simplifyRing(ring) {
  const [x0, y0, x1, y1] = bboxOf(ring);
  const diag = Math.hypot(x1 - x0, y1 - y0);
  const tol = Math.max(MIN_TOL, Math.min(BASE_TOL, diag * 0.004));
  let out = dp(ring.slice(0, -1), tol).map(([x, y]) => [r4(x), r4(y)]);
  out = out.filter((p, i) => i === 0 || p[0] !== out[i - 1][0] || p[1] !== out[i - 1][1]);
  if (out.length < 3) return null;
  out.push(out[0]);
  return out;
}

function simplifyGeometry(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const biggest = Math.max(...polys.map((p) => area(p[0])));
  const res = [];
  for (const poly of polys) {
    const a = area(poly[0]);
    if (a < MIN_RING_AREA && a !== biggest) continue;
    const rings = poly.map(simplifyRing).filter(Boolean);
    if (rings.length) res.push(rings);
  }
  return res.length === 1
    ? { type: 'Polygon', coordinates: res[0] }
    : { type: 'MultiPolygon', coordinates: res };
}

function pip(pt, geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const inRing = (r) => {
    let c = false;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i];
      const [xj, yj] = r[j];
      if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  return polys.some((p) => inRing(p[0]) && !p.slice(1).some(inRing));
}

function validate(fc) {
  let ok = true;
  const ids = new Set();
  for (const f of fc.features) {
    ids.add(f.properties.id);
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    let n = 0;
    for (const poly of polys) {
      for (const r of poly) {
        n += r.length;
        const closed = r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1];
        const range = r.every(([x, y]) => x >= 99.5 && x <= 104.7 && y >= 1.1 && y <= 6.8);
        if (!closed || !range || r.length < 4) {
          ok = false;
          console.error('INVALID ring in', f.properties.id, { closed, range });
        }
      }
    }
    const b = bboxOf(polys.flatMap((p) => p[0]));
    console.log(f.properties.id.padEnd(4), String(n).padStart(5), 'pts', polys.length, 'poly', 'bbox', b.map((v) => v.toFixed(3)).join(','));
  }
  if (ids.size !== 13) { ok = false; console.error('expected 13 features, got', ids.size); }
  const checks = [
    ['Petronas Twin Towers', 3.1579, 101.7116, 'kul'],
    ['Putra Mosque', 2.936, 101.6896, 'pjy'],
    ['Batu Caves', 3.2379, 101.684, 'sgr'],
    ['A Famosa', 2.1944, 102.2497, 'mlk'],
    ['George Town', 5.4141, 100.3288, 'png'],
    ['Langkawi Kuah', 6.32, 99.85, 'kdh'],
    ['Johor Bahru', 1.4927, 103.7414, 'jhr'],
  ];
  for (const [name, lat, lon, want] of checks) {
    const hit = fc.features.filter((f) => pip([lon, lat], f.geometry)).map((f) => f.properties.id);
    const pass = hit.length === 1 && hit[0] === want;
    if (!pass) ok = false;
    console.log(pass ? 'PASS' : 'FAIL', name, '->', hit.join(',') || 'none', `(want ${want})`);
  }
  return ok;
}

if (process.argv.includes('--validate-only')) {
  process.exit(validate(JSON.parse(readFileSync(OUT, 'utf8'))) ? 0 : 1);
}

const res = await fetch(URL_GJ);
if (!res.ok) throw new Error(`download failed: ${res.status}`);
const src = await res.json();
const features = [];
for (const [iso, [id, nameEn, nameZh, nameMs]] of Object.entries(REGIONS)) {
  const f = src.features.find((x) => x.properties.shapeISO === iso);
  if (!f) throw new Error(`missing ${iso} in source`);
  features.push({
    type: 'Feature',
    id,
    properties: { id, iso3166_2: iso, nameEn, nameZh, nameMs },
    geometry: simplifyGeometry(f.geometry),
  });
}
features.sort((a, b) => a.id.localeCompare(b.id));
const fc = {
  type: 'FeatureCollection',
  metadata: {
    source: `geoBoundaries gbOpen MYS ADM1 (wmgeolab/geoBoundaries@${COMMIT}); underlying data: OpenStreetMap via Wambacher, 2017 boundaries`,
    sourceUrl: URL_GJ,
    licence: 'geoBoundaries gbOpen: CC BY 4.0; API reports underlying licence as ODbL 1.0 (OpenStreetMap contributors)',
    attribution: 'State boundaries: geoBoundaries (CC BY 4.0), derived from © OpenStreetMap contributors (ODbL). Simplified for display.',
    retrievedAt: new Date().toISOString().slice(0, 10),
    simplifiedWith: 'tools/build-boundaries.mjs (Douglas-Peucker, per-ring tolerance, coordinates rounded to 4 decimals)',
    tolerance: `${MIN_TOL}-${BASE_TOL} degrees (scaled to ring size)`,
  },
  features,
};
writeFileSync(OUT, JSON.stringify(fc));
console.log('wrote', OUT);
if (!validate(fc)) process.exit(1);
