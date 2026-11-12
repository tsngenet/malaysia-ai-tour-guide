/**
 * POI master schema (v1): constants, normalisation and draft validation.
 * Everything except an id and one name is optional so incomplete drafts can be saved.
 */

export const SCHEMA_VERSION = 1;

export const STATUSES = ['draft', 'needs_review', 'approved', 'archived'];
export const ACTIVITY_VALUES = ['confirmed', 'not_offered', 'unknown'];
export const ACTIVITY_KEYS = [
  'farmTour', 'fruitTasting', 'fruitPicking', 'herbPicking', 'durianTasting', 'durianPicking'
];
export const COORDINATE_STATUSES = ['verified', 'source_reported', 'approximate', 'unknown'];
export const DURATION_BASES = ['sourced', 'estimate', 'unknown'];
export const SOURCE_TYPES = ['operator', 'tourism_authority', 'trip_com', 'traveller_review', 'contributor', 'other'];
export const MEDIA_RIGHTS = ['owned_by_contributor', 'licensed', 'permission_granted', 'unknown'];
export const MEDIA_REVIEW = ['pending', 'approved', 'rejected'];
export const TRI = ['yes', 'no', 'unknown'];

// Peninsular bounding box (deliberately generous) used to reject typos like swapped lat/lng.
export const PENINSULA_BBOX = { minLat: 1.1, maxLat: 6.8, minLng: 99.5, maxLng: 104.7 };

const str = (v) => (v === undefined || v === null ? '' : String(v).normalize('NFC').trim());
const oneOf = (v, list, fallback) => (list.includes(str(v).toLowerCase()) ? str(v).toLowerCase() : fallback);

export function toNumber(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  return Number.isFinite(n) ? n : null;
}

export function inPeninsulaBox(lat, lng) {
  return lat >= PENINSULA_BBOX.minLat && lat <= PENINSULA_BBOX.maxLat &&
    lng >= PENINSULA_BBOX.minLng && lng <= PENINSULA_BBOX.maxLng;
}

const dated = (o) => ({ text: str(o?.text), checkedAt: str(o?.checkedAt) });
const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean) : []);

/** Coerce arbitrary input into a canonical POI object. Never invents data. */
export function normalizePoi(input = {}) {
  const loc = input.location || {};
  const lat = toNumber(loc.lat);
  const lng = toNumber(loc.lng);
  const hasCoords = lat !== null && lng !== null;
  const ent = loc.entrance || {};
  const entLat = toNumber(ent.lat);
  const entLng = toNumber(ent.lng);
  const visit = input.visit || {};
  const act = input.activities || {};

  const poi = {
    schemaVersion: SCHEMA_VERSION,
    id: str(input.id),
    status: oneOf(input.status, STATUSES, 'draft'),
    names: { en: str(input.names?.en), zh: str(input.names?.zh), ms: str(input.names?.ms) },
    aliases: list(input.aliases),
    category: str(input.category),
    subcategory: str(input.subcategory),
    tags: list(input.tags).map((t) => t.toLowerCase()),
    summary: { en: str(input.summary?.en), zh: str(input.summary?.zh) },
    story: { en: str(input.story?.en), zh: str(input.story?.zh) },
    location: {
      state: str(loc.state),
      stateBasis: oneOf(loc.stateBasis, ['documented', 'inferred', 'unknown'], loc.state ? 'inferred' : 'unknown'),
      city: str(loc.city),
      address: str(loc.address),
      lat: hasCoords ? lat : null,
      lng: hasCoords ? lng : null,
      coordinateSource: str(loc.coordinateSource),
      coordinateStatus: hasCoords ? oneOf(loc.coordinateStatus, COORDINATE_STATUSES, 'source_reported') : 'unknown',
      coordinateVerifiedAt: str(loc.coordinateVerifiedAt),
      locationNote: str(loc.locationNote),
      entrance: entLat !== null && entLng !== null ? { lat: entLat, lng: entLng, note: str(ent.note) } : null
    },
    visit: {
      experienceTypes: list(visit.experienceTypes),
      durationMinutes: toNumber(visit.durationMinutes),
      durationBasis: oneOf(visit.durationBasis, DURATION_BASES, 'unknown'),
      hours: dated(visit.hours),
      admission: dated(visit.admission),
      booking: { required: oneOf(visit.booking?.required, TRI, 'unknown'), text: str(visit.booking?.text) },
      seasonality: dated(visit.seasonality),
      accessibility: { ...dated(visit.accessibility), walkingDifficulty: str(visit.accessibility?.walkingDifficulty) },
      weatherDependence: str(visit.weatherDependence),
      links: (Array.isArray(visit.links) ? visit.links : [])
        .map((l) => ({ label: str(l?.label), url: str(l?.url) })).filter((l) => l.url)
    },
    activities: {
      ...Object.fromEntries(ACTIVITY_KEYS.map((k) => [k, oneOf(act[k], ACTIVITY_VALUES, 'unknown')])),
      seasonalNote: str(act.seasonalNote)
    },
    sources: (Array.isArray(input.sources) ? input.sources : []).map((s) => ({
      name: str(s?.name),
      url: str(s?.url),
      type: oneOf(s?.type, SOURCE_TYPES, 'other'),
      accessedAt: str(s?.accessedAt),
      supports: list(s?.supports),
      notes: str(s?.notes),
      conflicts: str(s?.conflicts)
    })).filter((s) => s.name || s.url),
    media: (Array.isArray(input.media) ? input.media : []).map((m) => ({
      ref: str(m?.ref),
      contributor: str(m?.contributor),
      rights: { status: oneOf(m?.rights?.status, MEDIA_RIGHTS, 'unknown'), note: str(m?.rights?.note) },
      caption: str(m?.caption),
      lang: str(m?.lang),
      reviewStatus: oneOf(m?.reviewStatus, MEDIA_REVIEW, 'pending')
    })).filter((m) => m.ref),
    relations: {
      parentId: str(input.relations?.parentId),
      relatedIds: list(input.relations?.relatedIds),
      possibleDuplicateIds: list(input.relations?.possibleDuplicateIds)
    },
    review: {
      flags: list(input.review?.flags),
      notes: str(input.review?.notes),
      reviewedBy: str(input.review?.reviewedBy),
      reviewedAt: str(input.review?.reviewedAt)
    },
    origin: {
      importId: str(input.origin?.importId),
      candidateId: str(input.origin?.candidateId),
      note: str(input.origin?.note)
    },
    createdAt: str(input.createdAt),
    updatedAt: str(input.updatedAt),
    createdBy: str(input.createdBy),
    version: Number.isInteger(input.version) ? input.version : 1
  };
  return poi;
}

/** Draft validation: only hard-fails on things that would corrupt the collection. */
export function validateDraft(poi) {
  const errors = [];
  const warnings = [];
  if (!poi.id) errors.push('Missing stable POI id.');
  if (!poi.names.en && !poi.names.zh && !poi.names.ms) errors.push('At least one name (English, Chinese or Malay) is required.');
  if (!STATUSES.includes(poi.status)) errors.push(`Unknown status "${poi.status}".`);

  const l = poi.location;
  if ((l.lat === null) !== (l.lng === null)) errors.push('Latitude and longitude must both be provided or both blank.');
  if (l.lat !== null && !inPeninsulaBox(l.lat, l.lng)) {
    errors.push('Coordinates are outside the Peninsular Malaysia bounding box (swapped lat/lng or East Malaysia?).');
  }
  if (l.coordinateStatus === 'verified' && (!l.coordinateVerifiedAt || !l.coordinateSource)) {
    errors.push('Coordinates marked "verified" need a coordinate source and verification date.');
  }
  if (l.lat === null) warnings.push('No coordinates: this POI will not appear as a map pin.');
  if (!l.state) warnings.push('State / federal territory is unknown.');
  if (poi.visit.durationMinutes !== null && !(poi.visit.durationMinutes > 0 && poi.visit.durationMinutes <= 1440)) {
    errors.push('Visit duration must be between 1 and 1440 minutes.');
  }
  for (const f of ['hours', 'admission', 'seasonality']) {
    if (poi.visit[f].text && !poi.visit[f].checkedAt) warnings.push(`${f} has no last-checked date.`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

/** Machine-readable id derivation for imports: deterministic, independent of display names. */
export function hashString(s) {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

export function stableIdFor(namespace, candidateId) {
  return `poi_${hashString(`${namespace}:${str(candidateId).toLowerCase()}`)}`;
}

export function newPoiId() {
  const rnd = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  return `poi_${rnd}`;
}

export const displayName = (poi, lang = 'en') =>
  (lang === 'zh' ? poi.names.zh || poi.names.en : poi.names.en || poi.names.zh) || poi.names.ms || poi.id;
