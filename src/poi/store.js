/**
 * POI master store. Backed by a pluggable key/value storage (browser localStorage by default).
 * All mutators return {ok, ...} / {ok:false, error, code} instead of throwing, so the UI can show
 * saving / saved / failed states honestly. localStorage is NOT a security boundary; real privacy
 * enforcement lives in firestore.rules once a Firestore backend is wired in.
 */
import { normalizePoi, validateDraft, newPoiId } from './schema.js';
import { canReview, canSeePrivate, canCreate, isStaff } from './access.js';
import { diffPoi, flatten, summarize } from './importer.js';

export const MASTER_KEY = 'mytguide_poi_master_v1';
export const PRIVATE_KEY = 'mytguide_poi_private_v1';

const memoryStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, v); }, removeItem: (k) => { m.delete(k); } };
};

const setByPath = (obj, path, value) => {
  const keys = path.split('.');
  let o = obj;
  keys.slice(0, -1).forEach((k) => { o = o[k] ||= {}; });
  o[keys[keys.length - 1]] = value;
};

export function createPoiStore({ storage, now = () => new Date().toISOString() } = {}) {
  const kv = storage || (typeof localStorage !== 'undefined' ? localStorage : memoryStorage());

  function load() {
    try {
      const raw = kv.getItem(MASTER_KEY);
      if (!raw) return { pois: {}, history: [], imports: [] };
      const d = JSON.parse(raw);
      return { pois: d.pois || {}, history: d.history || [], imports: d.imports || [] };
    } catch {
      return { pois: {}, history: [], imports: [], corrupt: true };
    }
  }
  function persist(state) {
    try {
      kv.setItem(MASTER_KEY, JSON.stringify({ v: 1, pois: state.pois, history: state.history, imports: state.imports }));
      return { ok: true };
    } catch (e) {
      return { ok: false, code: 'storage_failed', error: `Could not save: ${e?.message || 'storage unavailable or full'}` };
    }
  }
  const hist = (state, poiId, action, actor, changes = [], extra = {}) => {
    state.history.push({ id: `h_${state.history.length + 1}_${Date.now().toString(36)}`, poiId, at: now(), actor: actor?.uid || 'unknown', role: actor?.role || '', action, changes, ...extra });
  };

  const api = {
    list: () => Object.values(load().pois).map(normalizePoi),
    get: (id) => { const p = load().pois[id]; return p ? normalizePoi(p) : null; },
    history: (poiId) => load().history.filter((h) => !poiId || h.poiId === poiId),
    imports: () => load().imports,

    /** Create or update a draft. Incomplete drafts are accepted if they have an id and a name. */
    save(input, actor, { expectedVersion } = {}) {
      if (!canCreate(actor?.role)) return { ok: false, code: 'forbidden', error: 'Your role cannot edit POIs.' };
      const state = load();
      const existing = state.pois[input.id];
      const next = normalizePoi({ ...input, id: input.id || newPoiId() });
      if (existing) {
        if (expectedVersion !== undefined && existing.version !== expectedVersion) {
          return { ok: false, code: 'conflict', error: 'This POI was changed by someone else. Reload before saving.' };
        }
        if (!canReview(actor.role) && next.status !== existing.status && !['draft', 'needs_review'].includes(next.status)) {
          return { ok: false, code: 'forbidden', error: 'Only reviewers can approve or archive.' };
        }
        if (!canReview(actor.role) && existing.status === 'approved') {
          return { ok: false, code: 'forbidden', error: 'Approved POIs can only be edited by reviewers.' };
        }
        next.createdAt = existing.createdAt; next.createdBy = existing.createdBy;
        next.version = existing.version + 1;
      } else {
        if (!['draft', 'needs_review'].includes(next.status) && !canReview(actor.role)) next.status = 'draft';
        next.createdAt = now(); next.createdBy = actor.uid; next.version = 1;
      }
      next.updatedAt = now();
      const v = validateDraft(next);
      if (!v.ok) return { ok: false, code: 'invalid', error: v.errors.join(' '), errors: v.errors };
      const changes = existing ? diffPoi(normalizePoi(existing), next) : [];
      state.pois[next.id] = next;
      hist(state, next.id, existing ? 'update' : 'create', actor, changes);
      const w = persist(state);
      return w.ok ? { ok: true, poi: next, warnings: v.warnings } : w;
    },

    setStatus(id, status, actor, note = '') {
      const state = load();
      const p = state.pois[id];
      if (!p) return { ok: false, code: 'not_found', error: 'POI not found.' };
      const needsReviewer = status === 'approved' || status === 'archived' || p.status === 'archived' || p.status === 'approved';
      if (needsReviewer && !canReview(actor?.role)) return { ok: false, code: 'forbidden', error: 'Only reviewers/admins can approve, archive or restore.' };
      if (!isStaff(actor?.role)) return { ok: false, code: 'forbidden', error: 'Not signed in as staff.' };
      if (status === 'approved') {
        const n = normalizePoi(p);
        const missing = [];
        if (!n.location.state) missing.push('state');
        if (!n.sources.length) missing.push('at least one source');
        if (missing.length) return { ok: false, code: 'not_ready', error: `Cannot approve: missing ${missing.join(', ')}.` };
      }
      const from = p.status;
      p.status = status; p.version += 1; p.updatedAt = now();
      if (canReview(actor.role)) { p.review = { ...p.review, reviewedBy: actor.uid, reviewedAt: now() }; }
      hist(state, id, status === 'archived' ? 'archive' : p.status === 'needs_review' && from === 'archived' ? 'restore' : 'status', actor,
        [{ path: 'status', from, to: status }], { note });
      const w = persist(state);
      return w.ok ? { ok: true, poi: normalizePoi(p) } : w;
    },

    /** Apply a reviewed import plan. Nothing is overwritten unless a resolution accepts it. */
    applyImport(plan, actor, { confirmDuplicates = [], resolutions = {}, rawText = '', format = 'csv' } = {}) {
      if (!canCreate(actor?.role)) return { ok: false, code: 'forbidden', error: 'Your role cannot import.' };
      const state = load();
      const confirmed = new Set(confirmDuplicates);
      const items = plan.items.map((i) => ({ ...i, finalAction: i.action }));
      const importId = plan.importId || `imp_${now().replace(/\D/g, '')}`;
      for (const it of items) {
        if (it.action === 'create' || (it.action === 'held_duplicate' && confirmed.has(it.candidateId || it.row))) {
          if (state.pois[it.poi.id]) { it.finalAction = 'skip_identical'; continue; }
          const p = { ...it.poi, origin: { ...it.poi.origin, importId }, createdAt: now(), updatedAt: now(), createdBy: actor.uid, version: 1 };
          if (it.action === 'held_duplicate') p.review.flags = [...new Set([...p.review.flags, 'possible_duplicate'])];
          state.pois[p.id] = p;
          hist(state, p.id, 'import_create', actor, [], { importId });
          it.finalAction = 'create';
        } else if (it.action === 'update_proposed') {
          const res = resolutions[it.candidateId || it.row];
          if (!res) continue;
          const cur = state.pois[it.poi.id];
          if (cur.status === 'approved' && !canReview(actor.role)) { it.warnings.push('Approved record: reviewer must accept changes.'); continue; }
          const accept = res.accept === 'all' ? it.changes : it.changes.filter((c) => res.accept.includes(c.path));
          if (!accept.length) continue;
          const merged = JSON.parse(JSON.stringify(cur));
          accept.forEach((c) => setByPath(merged, c.path, c.to));
          merged.version = cur.version + 1; merged.updatedAt = now();
          state.pois[merged.id] = normalizePoi(merged);
          hist(state, merged.id, 'import_update', actor, accept, { importId });
          it.finalAction = 'updated';
        }
      }
      const report = { ...plan, importId, items, summary: summarize(items) };
      state.imports.push({ id: importId, at: now(), actor: actor.uid, format, rawText, summary: report.summary });
      const w = persist(state);
      return w.ok ? { ok: true, report } : w;
    }
  };
  return api;
}

/* ---- Private driver / business data: separate store, role-gated at the API boundary ---- */
export function createPrivateStore({ storage, now = () => new Date().toISOString() } = {}) {
  const kv = storage || (typeof localStorage !== 'undefined' ? localStorage : memoryStorage());
  const read = () => { try { return JSON.parse(kv.getItem(PRIVATE_KEY) || '{}'); } catch { return {}; } };
  return {
    get(poiId, role) {
      if (!canSeePrivate(role)) return null;
      return read()[poiId] || null;
    },
    /** commission: {kind:'unknown'|'percentage'|'amount'|'text', value?, text?} - never defaulted to a number. */
    set(poiId, data, actor) {
      if (!canSeePrivate(actor?.role)) return { ok: false, code: 'forbidden', error: 'Private data is restricted to drivers and admins.' };
      const all = read();
      all[poiId] = {
        driverNotes: String(data.driverNotes || ''),
        commission: { kind: data.commission?.kind || 'unknown', value: data.commission?.value ?? null, text: String(data.commission?.text || '') },
        suppliedBy: actor.uid, suppliedAt: now()
      };
      try { kv.setItem(PRIVATE_KEY, JSON.stringify(all)); return { ok: true }; }
      catch (e) { return { ok: false, code: 'storage_failed', error: `Could not save: ${e?.message}` }; }
    }
  };
}

export { memoryStorage, flatten };
