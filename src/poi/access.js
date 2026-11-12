/**
 * Role-based visibility (client mirror of firestore.rules; the rules are the real enforcement).
 * Roles: passenger (unauthenticated), driver, contributor, reviewer, admin.
 */
import { displayName } from './schema.js';

export const ROLES = ['passenger', 'driver', 'contributor', 'reviewer', 'admin'];
export const STAFF_ROLES = ['driver', 'contributor', 'reviewer', 'admin'];

export const isStaff = (role) => STAFF_ROLES.includes(role);
export const canSeePrivate = (role) => role === 'driver' || role === 'admin';
export const canReview = (role) => role === 'reviewer' || role === 'admin';
export const canCreate = (role) => isStaff(role);

export function canSeePoi(role, poi) {
  if (isStaff(role)) return true;
  return poi.status === 'approved';
}

export const visiblePois = (pois, role) => pois.filter((p) => canSeePoi(role, p));

/** Whether a POI may be drawn as an exact map pin for this viewer. */
export function pinKind(poi, role) {
  const l = poi.location;
  if (l.lat === null || l.lng === null) return 'none';
  if (l.coordinateStatus === 'verified') return 'exact';
  // Unverified coordinates are staff-only and are drawn with a distinct "unconfirmed" style.
  if (isStaff(role) && l.coordinateStatus === 'source_reported') return 'unconfirmed';
  return 'none';
}

/**
 * Passenger-safe projection. Whitelist-based so new internal fields never leak by default.
 * Approved POIs only; no review notes, origin, commission, driver notes, unapproved media.
 */
export function publicView(poi) {
  if (!poi || poi.status !== 'approved') return null;
  const exact = poi.location.coordinateStatus === 'verified';
  return {
    id: poi.id,
    names: { ...poi.names },
    category: poi.category,
    subcategory: poi.subcategory,
    tags: [...poi.tags],
    summary: { ...poi.summary },
    story: { ...poi.story },
    location: {
      state: poi.location.state,
      city: poi.location.city,
      address: poi.location.address,
      lat: exact ? poi.location.lat : null,
      lng: exact ? poi.location.lng : null,
      approximate: !exact
    },
    visit: {
      durationMinutes: poi.visit.durationMinutes,
      durationBasis: poi.visit.durationBasis,
      hours: { ...poi.visit.hours },
      admission: { ...poi.visit.admission },
      booking: { ...poi.visit.booking },
      seasonality: { ...poi.visit.seasonality },
      accessibility: { ...poi.visit.accessibility },
      weatherDependence: poi.visit.weatherDependence,
      links: poi.visit.links.map((l) => ({ ...l }))
    },
    activities: { ...poi.activities },
    media: poi.media
      .filter((m) => m.reviewStatus === 'approved' && m.rights.status !== 'unknown')
      .map((m) => ({ ref: m.ref, caption: m.caption, lang: m.lang, contributor: m.contributor }))
  };
}

/**
 * Per-state counts from the data the viewer may actually see. Status breakdown is staff-only.
 * `unlocated` counts POIs whose state is unknown.
 */
export function countsByState(pois, role) {
  const out = {};
  const staff = isStaff(role);
  for (const p of visiblePois(pois, role)) {
    const key = p.location.state || '__unknown__';
    const c = (out[key] ||= { total: 0, byStatus: staff ? { draft: 0, needs_review: 0, approved: 0, archived: 0 } : null });
    // Archived records are history, not part of the live collection total.
    if (p.status === 'archived') {
      if (staff) c.byStatus.archived += 1;
      continue;
    }
    c.total += 1;
    if (staff) c.byStatus[p.status] += 1;
  }
  return out;
}

/** Snapshot for itineraries: frozen copy so later edits/archives do not rewrite agreed plans. */
export function snapshotPoi(poi, nowIso) {
  const pv = {
    poiId: poi.id,
    poiVersion: poi.version,
    name: { en: poi.names.en, zh: poi.names.zh },
    label: displayName(poi),
    state: poi.location.state,
    city: poi.location.city,
    coordinates: poi.location.coordinateStatus === 'verified' ? { lat: poi.location.lat, lng: poi.location.lng } : null,
    durationMinutes: poi.visit.durationMinutes,
    durationBasis: poi.visit.durationBasis,
    summary: { ...poi.summary },
    sourceStatus: poi.status,
    snapshotAt: nowIso
  };
  return pv;
}
