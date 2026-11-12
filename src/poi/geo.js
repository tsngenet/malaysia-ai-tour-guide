/** Regions of Peninsular Malaysia, name normalisation, projection and clustering. Pure functions. */

export const REGIONS = [
  { id: 'jhr', en: 'Johor', zh: '柔佛', aliases: ['johor darul takzim'] },
  { id: 'kdh', en: 'Kedah', zh: '吉打', aliases: ['kedah darul aman'] },
  { id: 'ktn', en: 'Kelantan', zh: '吉兰丹', aliases: ['kelantan darul naim'] },
  { id: 'mlk', en: 'Melaka', zh: '马六甲', aliases: ['malacca', 'malaka'] },
  { id: 'nsn', en: 'Negeri Sembilan', zh: '森美兰', aliases: ['negri sembilan'] },
  { id: 'phg', en: 'Pahang', zh: '彭亨', aliases: ['pahang darul makmur'] },
  { id: 'prk', en: 'Perak', zh: '霹雳', aliases: ['perak darul ridzuan'] },
  { id: 'pls', en: 'Perlis', zh: '玻璃市', aliases: ['perlis indera kayangan'] },
  { id: 'png', en: 'Penang', zh: '槟城', aliases: ['pulau pinang', 'penang island', 'george town penang'] },
  { id: 'sgr', en: 'Selangor', zh: '雪兰莪', aliases: ['selangor darul ehsan'] },
  { id: 'trg', en: 'Terengganu', zh: '登嘉楼', aliases: ['terengganu darul iman'] },
  { id: 'kul', en: 'Kuala Lumpur', zh: '吉隆坡', aliases: ['wp kuala lumpur', 'wilayah persekutuan kuala lumpur', 'federal territory of kuala lumpur', 'kl'] },
  { id: 'pjy', en: 'Putrajaya', zh: '布城', aliases: ['wp putrajaya', 'wilayah persekutuan putrajaya', 'federal territory of putrajaya'] }
];

const fold = (s) => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

const REGION_INDEX = new Map();
for (const r of REGIONS) {
  [r.id, r.en, r.zh, ...r.aliases].forEach((a) => REGION_INDEX.set(fold(a), r.id));
}

/** Map free text to a region id, or null if unrecognised (never guesses). */
export function regionIdFor(text) {
  return REGION_INDEX.get(fold(text)) || null;
}

export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

/** Canonical stored state value is the English region name. */
export function canonicalState(text) {
  const id = regionIdFor(text);
  return id ? regionById(id).en : null;
}

/* ---- Projection: Web-Mercator (EPSG:3857-style), fitted to a viewBox ---- */

export const MAP_BOUNDS = { minLng: 99.55, maxLng: 104.65, minLat: 1.15, maxLat: 6.8 };
export const MAP_WIDTH = 1000;

const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2));
const Y_MIN = mercY(MAP_BOUNDS.minLat);
const Y_MAX = mercY(MAP_BOUNDS.maxLat);
const SCALE = MAP_WIDTH / ((MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng) * Math.PI / 180);
export const MAP_HEIGHT = Math.round((Y_MAX - Y_MIN) * SCALE);

/** lat/lng -> SVG coordinates. The same function draws boundaries and pins, so they always agree. */
export function project(lat, lng) {
  return {
    x: (lng - MAP_BOUNDS.minLng) * Math.PI / 180 * SCALE,
    y: (Y_MAX - mercY(lat)) * SCALE
  };
}

export function unproject(x, y) {
  const lng = x / SCALE * 180 / Math.PI + MAP_BOUNDS.minLng;
  const my = Y_MAX - y / SCALE;
  const lat = (2 * Math.atan(Math.exp(my)) - Math.PI / 2) * 180 / Math.PI;
  return { lat, lng };
}

/** Grid clustering in screen space. `cell` is in SVG units at the current zoom. */
export function clusterPins(pins, cell) {
  const buckets = new Map();
  for (const p of pins) {
    const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
    (buckets.get(key) || buckets.set(key, []).get(key)).push(p);
  }
  return [...buckets.values()].map((items) => {
    if (items.length === 1) return { type: 'pin', ...items[0], items };
    const x = items.reduce((a, p) => a + p.x, 0) / items.length;
    const y = items.reduce((a, p) => a + p.y, 0) / items.length;
    return { type: 'cluster', x, y, count: items.length, items, id: `c:${items.map((i) => i.id).sort().join(',')}` };
  });
}

/** Ray-casting point-in-polygon for a GeoJSON (Multi)Polygon geometry, lng/lat order. */
export function pointInGeometry(lat, lng, geometry) {
  const polys = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const inRing = (ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  return polys.some((poly) => inRing(poly[0]) && !poly.slice(1).some(inRing));
}

export function regionContaining(lat, lng, featureCollection) {
  const f = featureCollection.features.find((ft) => pointInGeometry(lat, lng, ft.geometry));
  return f ? f.properties.id : null;
}
