/**
 * POI import pipeline: parse -> validate -> match -> plan (dry run) -> apply (explicit confirmation).
 *
 * Guarantees:
 *  - Imported rows are always draft / needs_review; "approved" in a file is downgraded with a warning.
 *  - Stable IDs come from (namespace, candidate id), never from names, so re-imports are idempotent.
 *  - Existing records are never overwritten or merged: differences become reviewable proposals.
 *  - Possible duplicates are held until a human confirms; nothing is deleted.
 *  - Private columns (commission, driver notes) are ignored and reported, never stored via import.
 */
import { parseCsv } from './csv.js';
import {
  normalizePoi, validateDraft, stableIdFor, newPoiId, toNumber, inPeninsulaBox, ACTIVITY_KEYS
} from './schema.js';
import { canonicalState } from './geo.js';

const HEADER_ALIASES = {
  state_or_territory: 'state',
  coordinates_status: 'coordinate_status',
  suggested_duration_minutes: 'duration_minutes',
  notes: 'review_notes',
  source_url: 'source_1_url',
  source_name: 'source_1_name',
  source_type: 'source_1_type',
  source_accessed_at: 'source_1_accessed_at',
  source_supports: 'source_1_supports',
  source_notes: 'source_1_notes',
  possible_duplicate_or_related: 'related_text'
};
const PRIVATE_HEADER = /commission|driver[_ ]?note|private|payout|kickback/i;
const MAX_SOURCES = 3;

const pipe = (v) => String(v || '').split('|').map((s) => s.trim()).filter(Boolean);
const activity = (v) => {
  const t = String(v || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (['confirmed', 'yes', 'true', 'y'].includes(t)) return 'confirmed';
  if (['not_offered', 'no', 'false', 'n'].includes(t)) return 'not_offered';
  return 'unknown';
};

export function fold(s) {
  return String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

/** CSV record -> import entry {row, candidateId, poi, errors, warnings, ignoredColumns}. */
export function entryFromCsvRecord(rec, headers) {
  const get = {};
  const ignoredColumns = [];
  for (const h of headers) {
    const key = HEADER_ALIASES[h.toLowerCase()] || h.toLowerCase();
    if (PRIVATE_HEADER.test(h)) { if (rec[h]) ignoredColumns.push(h); continue; }
    get[key] = rec[h];
  }
  const errors = [];
  const warnings = [];
  const flags = [];

  const lat = toNumber(get.latitude);
  const lng = toNumber(get.longitude);
  let loc = { lat: null, lng: null };
  if (get.latitude || get.longitude) {
    if (lat === null || lng === null) {
      warnings.push('Coordinates not both numeric; dropped (kept as unknown).');
      flags.push('coordinates_dropped');
    } else if (!inPeninsulaBox(lat, lng)) {
      warnings.push(`Coordinates ${lat}, ${lng} are outside Peninsular Malaysia; dropped.`);
      flags.push('coordinates_out_of_range');
    } else loc = { lat, lng };
  }
  let coordStatus = String(get.coordinate_status || '').toLowerCase();
  if (loc.lat !== null && coordStatus === 'verified' && !(get.coordinate_verified_at && get.coordinate_source)) {
    warnings.push('Marked verified without source/date; downgraded to source_reported.');
    coordStatus = 'source_reported';
  }

  let state = '';
  let locationNote = get.location_note || '';
  if (get.state) {
    const canon = canonicalState(get.state);
    if (canon) state = canon;
    else {
      warnings.push(`Unrecognised state "${get.state}"; left blank for review.`);
      flags.push('state_unrecognised');
      locationNote = [locationNote, `Original state text: ${get.state}`].filter(Boolean).join(' | ');
    }
  }

  const sources = [];
  for (let i = 1; i <= MAX_SOURCES; i++) {
    const name = get[`source_${i}_name`];
    const url = get[`source_${i}_url`];
    if (!name && !url) continue;
    sources.push({
      name: name || url, url, type: get[`source_${i}_type`] || 'other',
      accessedAt: get[`source_${i}_accessed_at`] || '', supports: pipe(get[`source_${i}_supports`]),
      notes: get[`source_${i}_notes`] || '', conflicts: get[`source_${i}_conflicts`] || ''
    });
  }
  if (!sources.length) warnings.push('No source recorded.');

  let durationBasis = String(get.duration_basis || '').toLowerCase();
  const minutes = toNumber(get.duration_minutes);
  if (minutes !== null && !durationBasis) {
    durationBasis = 'estimate';
    warnings.push('Duration has no basis; recorded as estimate.');
  }

  const status = String(get.status || '').toLowerCase();
  if (status === 'approved' || status === 'archived') warnings.push(`Status "${status}" in file ignored; imported as needs_review.`);

  const activities = { seasonalNote: get.activity_season_note || '' };
  for (const k of ACTIVITY_KEYS) {
    const col = k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
    activities[k] = activity(get[col]);
  }

  const relatedText = get.related_text || '';
  const poi = normalizePoi({
    status: status === 'draft' ? 'draft' : 'needs_review',
    names: { en: get.name_en, zh: get.name_zh, ms: get.name_ms },
    aliases: pipe(get.aliases),
    category: get.category, subcategory: get.subcategory, tags: pipe(get.tags),
    summary: { en: get.summary_en, zh: get.summary_zh },
    story: { en: get.story_en, zh: get.story_zh },
    location: {
      state, stateBasis: get.state_basis || undefined, city: get.city, address: get.address, ...loc,
      coordinateSource: get.coordinate_source, coordinateStatus: coordStatus || undefined,
      coordinateVerifiedAt: get.coordinate_verified_at, locationNote,
      entrance: toNumber(get.entrance_lat) !== null && toNumber(get.entrance_lng) !== null
        ? { lat: toNumber(get.entrance_lat), lng: toNumber(get.entrance_lng), note: get.entrance_note } : null
    },
    visit: {
      experienceTypes: pipe(get.experience_types), durationMinutes: minutes, durationBasis,
      hours: { text: get.hours_text, checkedAt: get.hours_checked_at },
      admission: { text: get.admission_text, checkedAt: get.admission_checked_at },
      booking: { required: get.booking_required, text: get.booking_note },
      seasonality: { text: get.seasonality_text, checkedAt: get.seasonality_checked_at },
      accessibility: { text: get.accessibility_text, checkedAt: get.accessibility_checked_at, walkingDifficulty: get.walking_difficulty },
      weatherDependence: get.weather_dependence,
      links: [
        get.contact_url && { label: 'Contact', url: get.contact_url },
        get.booking_url && { label: 'Booking', url: get.booking_url }
      ].filter(Boolean)
    },
    activities,
    sources,
    relations: { parentId: '', relatedIds: [], possibleDuplicateIds: [] },
    review: {
      flags: [...flags, ...pipe(get.review_flags)],
      notes: [get.review_notes, relatedText && `Related/duplicate note: ${relatedText}`].filter(Boolean).join(' | ')
    },
    origin: { candidateId: get.candidate_id, note: get.origin }
  });
  return {
    row: rec.__row, candidateId: get.candidate_id || '', poi, errors, warnings, ignoredColumns,
    parentCandidateId: get.parent_candidate_id || '',
    relatedCandidateIds: pipe(get.related_candidate_ids)
  };
}

export function entriesFromCsv(text) {
  const { headers, records } = parseCsv(text);
  return records.map((r) => entryFromCsvRecord(r, headers));
}

/** JSON import: {namespace?, pois:[{candidateId, ...partial POI}]} */
export function entriesFromJson(json) {
  const doc = typeof json === 'string' ? JSON.parse(json) : json;
  const arr = Array.isArray(doc) ? doc : doc.pois || [];
  return arr.map((raw, i) => {
    const warnings = [];
    const status = String(raw.status || '').toLowerCase();
    if (status === 'approved' || status === 'archived') warnings.push(`Status "${status}" in file ignored; imported as needs_review.`);
    const ignoredColumns = Object.keys(raw).filter((k) => PRIVATE_HEADER.test(k));
    const clean = { ...raw };
    ignoredColumns.forEach((k) => delete clean[k]);
    const candidateId = raw.candidateId || raw.origin?.candidateId || '';
    const poi = normalizePoi({
      ...clean, id: '', status: status === 'draft' ? 'draft' : 'needs_review',
      origin: { ...(raw.origin || {}), candidateId },
      location: { ...(raw.location || {}), state: canonicalState(raw.location?.state) || '' }
    });
    if (raw.location?.state && !poi.location.state) {
      warnings.push(`Unrecognised state "${raw.location.state}"; left blank for review.`);
      poi.review.flags.push('state_unrecognised');
    }
    if (raw.location?.lat != null && !inPeninsulaBox(poi.location.lat, poi.location.lng)) {
      warnings.push('Coordinates outside Peninsular Malaysia; dropped.');
      poi.location = { ...poi.location, lat: null, lng: null, coordinateStatus: 'unknown' };
    }
    if (poi.location.coordinateStatus === 'verified' && !(poi.location.coordinateVerifiedAt && poi.location.coordinateSource)) {
      warnings.push('Marked verified without source/date; downgraded to source_reported.');
      poi.location.coordinateStatus = 'source_reported';
    }
    return { row: i + 1, candidateId, poi, errors: [], warnings, ignoredColumns };
  });
}

/* ---------------- matching ---------------- */

const tokens = (s) => new Set(fold(s).split(' ').filter((t) => t.length > 1));
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  a.forEach((t) => { if (b.has(t)) inter++; });
  return inter / (a.size + b.size - inter);
}
function metersBetween(a, b) {
  const R = 6371000; const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad; const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const namesOf = (p) => [p.names.en, p.names.zh, p.names.ms, ...p.aliases].filter(Boolean);

/** Returns {score, reason} for how likely two POIs are the same place. */
export function similarity(a, b) {
  let best = { score: 0, reason: '' };
  for (const x of namesOf(a)) for (const y of namesOf(b)) {
    if (fold(x) && fold(x) === fold(y)) return { score: 1, reason: `same name "${x}"` };
    const j = jaccard(tokens(x), tokens(y));
    if (j > best.score) best = { score: j, reason: `similar name "${x}" ~ "${y}"` };
  }
  const la = a.location; const lb = b.location;
  if (la.lat !== null && lb.lat !== null) {
    const d = metersBetween({ lat: la.lat, lng: la.lng }, { lat: lb.lat, lng: lb.lng });
    if (d < 150 && best.score >= 0.4) {
      return { score: Math.max(best.score, 0.8), reason: `${best.reason}; ${Math.round(d)} m apart` };
    }
  }
  const urls = new Set(a.sources.map((s) => s.url).filter(Boolean));
  const sameUrlOnly = b.sources.some((s) => s.url && urls.has(s.url)) && best.score >= 0.5;
  if (sameUrlOnly) return { score: Math.max(best.score, 0.75), reason: `${best.reason}; shared source URL` };
  return best;
}

export const DUPLICATE_THRESHOLD = 0.75;
export const SIMILAR_THRESHOLD = 0.5;

/* ---------------- diffing ---------------- */

const IGNORE_DIFF = /^(id|schemaVersion|status|createdAt|updatedAt|createdBy|version|origin(\..*)?|review(\..*)?|relations(\..*)?)$/;
export function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out[path] = v;
  }
  return out;
}
const isEmpty = (v) => v === null || v === '' || v === undefined || (Array.isArray(v) && v.length === 0) ||
  v === 'unknown';

export function diffPoi(existing, incoming) {
  const a = flatten(existing); const b = flatten(incoming);
  const changes = [];
  for (const path of Object.keys(b)) {
    if (IGNORE_DIFF.test(path) || path === 'location.coordinateStatus' && isEmpty(b[path])) continue;
    if (isEmpty(b[path])) continue;
    if (JSON.stringify(a[path]) === JSON.stringify(b[path])) continue;
    changes.push({ path, from: a[path] ?? null, to: b[path], kind: isEmpty(a[path]) ? 'fill' : 'conflict' });
  }
  return changes;
}

/* ---------------- planning ---------------- */

/**
 * Dry run. Returns a plan whose items each carry an action:
 *  create | skip_identical | update_proposed | held_duplicate | failed
 */
export function planImport(entries, existing = [], { namespace = 'import', importId = '' } = {}) {
  const byId = new Map(existing.map((p) => [p.id, p]));
  const seenIds = new Map();
  const accepted = []; // POIs created earlier in this same batch
  const candToId = new Map();
  const items = [];

  for (const e of entries) {
    const item = {
      row: e.row, candidateId: e.candidateId, name: e.poi.names.en || e.poi.names.zh || e.poi.names.ms || '',
      errors: [...e.errors], warnings: [...e.warnings], ignoredColumns: e.ignoredColumns || [],
      matches: [], changes: [], action: 'failed', poi: null
    };
    items.push(item);
    if (item.ignoredColumns.length) item.warnings.push(`Private columns ignored: ${item.ignoredColumns.join(', ')}.`);

    const id = e.candidateId ? stableIdFor(namespace, e.candidateId) : newPoiId();
    const poi = { ...e.poi, id, origin: { ...e.poi.origin, importId } };
    item.poiId = id;
    if (e.candidateId) candToId.set(e.candidateId, id);
    item.poi = poi;
    item._parent = e.parentCandidateId; item._related = e.relatedCandidateIds || [];

    const v = validateDraft(poi);
    item.errors.push(...v.errors);
    item.warnings.push(...v.warnings);
    if (poi.activities.durianPicking === 'confirmed' && !poi.sources.some((s) => s.type === 'operator')) {
      item.warnings.push('Durian picking is "confirmed" without an operator source; needs human check.');
      poi.review.flags.push('durian_picking_needs_operator_source');
    }
    if (item.errors.length) { item.action = 'failed'; continue; }

    if (seenIds.has(id)) {
      item.action = 'failed';
      item.errors.push(`Duplicate candidate_id "${e.candidateId}" in this file (first seen row ${seenIds.get(id)}).`);
      continue;
    }
    seenIds.set(id, e.row);

    const current = byId.get(id);
    if (current) {
      item.changes = diffPoi(current, poi);
      item.action = item.changes.length ? 'update_proposed' : 'skip_identical';
      continue;
    }

    const pool = [...existing, ...accepted];
    for (const other of pool) {
      if (other.id === id) continue;
      const s = similarity(poi, other);
      if (s.score >= SIMILAR_THRESHOLD) item.matches.push({ poiId: other.id, name: other.names.en || other.names.zh, ...s });
    }
    item.matches.sort((x, y) => y.score - x.score);
    const dup = item.matches.filter((m) => m.score >= DUPLICATE_THRESHOLD);
    if (dup.length) {
      item.action = 'held_duplicate';
      item.warnings.push(`Possible duplicate of ${dup.map((m) => `${m.name} (${m.poiId})`).join(', ')}; held for review.`);
    } else {
      item.action = 'create';
      if (item.matches.length) item.warnings.push('Similar names found; flagged as related for review.');
    }
    accepted.push(poi); // later rows in the batch are matched against this one too
  }

  // Resolve parent/related candidate references to stable ids.
  for (const it of items) {
    if (!it.poi) continue;
    const parent = it._parent && candToId.get(it._parent);
    if (it._parent && !parent) it.warnings.push(`Parent candidate "${it._parent}" not found in this file.`);
    if (parent) it.poi.relations.parentId = parent;
    it.poi.relations.relatedIds = it._related.map((c) => candToId.get(c)).filter(Boolean);
    it.poi.relations.possibleDuplicateIds = it.matches.map((m) => m.poiId);
    delete it._parent; delete it._related;
  }
  return { namespace, importId, items, summary: summarize(items) };
}

const BUCKET = {
  updated: 'updated',
  create: 'imported', held_duplicate: 'held', skip_identical: 'skipped',
  update_proposed: 'conflicting', failed: 'failed'
};
export function summarize(items) {
  const s = { total: items.length, updated: 0, imported: 0, skipped: 0, conflicting: 0, held: 0, failed: 0 };
  items.forEach((i) => { s[BUCKET[i.finalAction || i.action]] += 1; });
  return s;
}

/** Human-readable report (also used as the downloadable import report). */
export function reportToMarkdown(plan, { applied = false } = {}) {
  const lines = [`# Import report${plan.importId ? ` ${plan.importId}` : ''}`, '',
    applied ? '_Changes were applied._' : '_Dry run: nothing has been changed._', '',
    `Total ${plan.summary.total} | imported/new ${plan.summary.imported} | skipped ${plan.summary.skipped} | ` +
    `conflicting ${plan.summary.conflicting} | held (duplicates) ${plan.summary.held} | failed ${plan.summary.failed}`, '',
    '| Row | Candidate | Name | Result | Notes |', '|---|---|---|---|---|'];
  for (const i of plan.items) {
    const notes = [...i.errors.map((m) => `ERROR: ${m}`), ...i.warnings,
      ...i.changes.map((c) => `${c.kind} ${c.path}`)].join('; ').replace(/\|/g, '/');
    lines.push(`| ${i.row} | ${i.candidateId} | ${i.name} | ${BUCKET[i.finalAction || i.action]} | ${notes} |`);
  }
  return lines.join('\n') + '\n';
}
