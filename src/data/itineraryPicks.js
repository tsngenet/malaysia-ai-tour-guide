/** Driver's in-progress itinerary picks coming from the map / POI picker. Survives reloads. */
const KEY = 'mytguide_itinerary_picks_v1';

export function getPicks() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
export function addPick(snapshot) {
  const picks = getPicks();
  if (picks.some((p) => p.poiId === snapshot.poiId)) return { ok: true, already: true, count: picks.length };
  try {
    localStorage.setItem(KEY, JSON.stringify([...picks, snapshot]));
    return { ok: true, count: picks.length + 1 };
  } catch (e) {
    return { ok: false, error: e?.message || 'Could not store pick' };
  }
}
export function clearPicks() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
