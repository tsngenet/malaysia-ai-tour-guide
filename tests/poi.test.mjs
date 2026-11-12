import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseCsv, toCsv } from '../src/poi/csv.js';
import { entriesFromCsv, entriesFromJson, planImport, reportToMarkdown } from '../src/poi/importer.js';
import { createPoiStore, createPrivateStore, memoryStorage } from '../src/poi/store.js';
import { normalizePoi, validateDraft } from '../src/poi/schema.js';
import { publicView, countsByState, pinKind, visiblePois, snapshotPoi } from '../src/poi/access.js';
import { canonicalState, project, unproject, clusterPins, regionContaining, regionIdFor } from '../src/poi/geo.js';
import { TEMPLATE_HEADERS } from '../src/poi/template.js';

const driver = { uid: 'u-driver', role: 'driver' };
const reviewer = { uid: 'u-rev', role: 'reviewer' };
const contributor = { uid: 'u-con', role: 'contributor' };
const seedCsv = fs.readFileSync(new URL('../data/poi/seed_collection.csv', import.meta.url), 'utf8');
const NS = 'handover-2026-11';

const freshStore = () => createPoiStore({ storage: memoryStorage(), now: () => '2026-11-12T00:00:00.000Z' });

test('CSV: quotes, embedded newlines, BOM and Unicode survive a round trip', () => {
  const headers = ['a', 'b'];
  const text = toCsv(headers, [{ a: '黑风洞 "Batu Caves"', b: 'line1\nline2, comma' }]);
  const { records } = parseCsv('\uFEFF' + text);
  assert.equal(records[0].a, '黑风洞 "Batu Caves"');
  assert.equal(records[0].b, 'line1\nline2, comma');
});

test('seed collection: 39 rows parse, all needs_review, no invented coordinates except one sourced candidate', () => {
  const plan = planImport(entriesFromCsv(seedCsv), [], { namespace: NS });
  assert.equal(plan.summary.total, 39);
  assert.equal(plan.summary.failed, 0);
  const withCoords = plan.items.filter((i) => i.poi.location.lat !== null);
  assert.deepEqual(withCoords.map((i) => i.candidateId), ['SEED-036']);
  assert.equal(withCoords[0].poi.location.coordinateStatus, 'source_reported');
  assert.ok(plan.items.every((i) => i.poi.status === 'needs_review'));
  const batu = plan.items.find((i) => i.candidateId === 'SEED-011').poi;
  assert.equal(batu.location.state, 'Selangor');
  assert.equal(batu.names.zh, '黑风洞');
});

test('Green Acres pilot: durian picking is not inferred and the conflict is flagged', () => {
  const plan = planImport(entriesFromCsv(seedCsv), [], { namespace: NS });
  const ga = plan.items.find((i) => i.candidateId === 'SEED-036').poi;
  assert.equal(ga.activities.durianTasting, 'confirmed');
  assert.equal(ga.activities.durianPicking, 'unknown');
  assert.equal(ga.visit.durationBasis, 'sourced');
  assert.ok(ga.review.flags.includes('durian_picking_conflict'));
});

test('Unicode survives import -> store -> reload', () => {
  const kv = memoryStorage();
  const a = createPoiStore({ storage: kv });
  const plan = planImport(entriesFromCsv(seedCsv), a.list(), { namespace: NS });
  assert.ok(a.applyImport(plan, driver, { rawText: seedCsv }).ok);
  const b = createPoiStore({ storage: kv });
  const names = b.list().map((p) => p.names.zh).filter(Boolean);
  assert.ok(names.includes('双峰塔空中天桥'));
  assert.ok(names.includes('城中城水族馆'));
  assert.equal(b.imports()[0].rawText, seedCsv, 'original import text is preserved verbatim');
});

test('re-importing the same file is idempotent (no new records)', () => {
  const s = freshStore();
  s.applyImport(planImport(entriesFromCsv(seedCsv), s.list(), { namespace: NS }), driver);
  const n = s.list().length;
  const again = planImport(entriesFromCsv(seedCsv), s.list(), { namespace: NS });
  assert.equal(again.summary.skipped, 39);
  s.applyImport(again, driver);
  assert.equal(s.list().length, n);
});

test('same places under a different namespace are held as possible duplicates, not created', () => {
  const s = freshStore();
  s.applyImport(planImport(entriesFromCsv(seedCsv), s.list(), { namespace: NS }), driver);
  const plan = planImport(entriesFromCsv(seedCsv), s.list(), { namespace: 'other-run' });
  assert.equal(plan.summary.held, 39);
  const res = s.applyImport(plan, driver);
  assert.equal(s.list().length, 39, 'nothing created without confirmation');
  assert.equal(res.report.summary.held, 39);
});

test('duplicate rows inside one file: second row is held; confirmation creates it with a duplicate flag', () => {
  const csv = 'candidate_id,name_en\nA1,Aquaria KLCC\nA2,Aquaria KLCC\n';
  const plan = planImport(entriesFromCsv(csv), [], { namespace: 't' });
  assert.deepEqual(plan.items.map((i) => i.action), ['create', 'held_duplicate']);
  const s = freshStore();
  s.applyImport(plan, driver);
  assert.equal(s.list().length, 1);
  const plan2 = planImport(entriesFromCsv(csv), [], { namespace: 't' });
  s.applyImport(plan2, driver, { confirmDuplicates: ['A2'] });
  const dup = s.list().find((p) => p.origin.candidateId === 'A2');
  assert.ok(dup.review.flags.includes('possible_duplicate'));
  assert.equal(dup.relations.possibleDuplicateIds.length, 1);
});

test('conflicting re-import never overwrites; accepted fields are applied and audited', () => {
  const s = freshStore();
  s.applyImport(planImport(entriesFromCsv('candidate_id,name_en,city\nX1,Test Cave,Ipoh\n'), [], { namespace: 't' }), driver);
  const csv2 = 'candidate_id,name_en,city,address\nX1,Test Cave,Gopeng,Jalan Test\n';
  const plan = planImport(entriesFromCsv(csv2), s.list(), { namespace: 't' });
  assert.equal(plan.items[0].action, 'update_proposed');
  s.applyImport(plan, driver);
  assert.equal(s.list()[0].location.city, 'Ipoh', 'default keeps existing');
  s.applyImport(plan, driver, { resolutions: { X1: { accept: ['location.address'] } } });
  const p = s.list()[0];
  assert.equal(p.location.city, 'Ipoh');
  assert.equal(p.location.address, 'Jalan Test');
  assert.ok(s.history(p.id).some((h) => h.action === 'import_update'));
});

test('incomplete draft (name only) saves; empty record is rejected', () => {
  const s = freshStore();
  const ok = s.save({ id: 'poi_x', names: { zh: '某地' } }, contributor);
  assert.ok(ok.ok);
  assert.equal(ok.poi.status, 'draft');
  assert.equal(s.save({ id: 'poi_y' }, contributor).ok, false);
});

test('invalid coordinates are dropped on import (never presented), swapped lat/lng rejected on save', () => {
  const plan = planImport(entriesFromCsv('candidate_id,name_en,latitude,longitude\nB1,Swapped,101.7,3.1\n'), [], { namespace: 't' });
  assert.equal(plan.items[0].poi.location.lat, null);
  assert.ok(plan.items[0].warnings.some((w) => /outside Peninsular/.test(w)));
  const s = freshStore();
  const r = s.save({ id: 'poi_z', names: { en: 'Z' }, location: { lat: 101.7, lng: 3.1 } }, contributor);
  assert.equal(r.ok, false);
});

test('"verified" without source/date is downgraded; "approved" in a file is ignored', () => {
  const csv = 'candidate_id,name_en,latitude,longitude,coordinate_status,status\nV1,Place,3.14,101.7,verified,approved\n';
  const it = planImport(entriesFromCsv(csv), [], { namespace: 't' }).items[0];
  assert.equal(it.poi.location.coordinateStatus, 'source_reported');
  assert.equal(it.poi.status, 'needs_review');
});

test('private columns are ignored and reported, never stored', () => {
  const csv = 'candidate_id,name_en,commission_percent,driver_notes\nP1,Cafe,15,secret note\n';
  const plan = planImport(entriesFromCsv(csv), [], { namespace: 't' });
  assert.deepEqual(plan.items[0].ignoredColumns, ['commission_percent', 'driver_notes']);
  assert.ok(!JSON.stringify(plan.items[0].poi).includes('secret note'));
  const js = entriesFromJson({ pois: [{ candidateId: 'J1', names: { en: 'Cafe' }, commission: 15, driverNotes: 'x' }] });
  assert.equal(JSON.stringify(js[0].poi).includes('commission'), false);
});

test('JSON example imports with Chinese text intact', () => {
  const ex = JSON.parse(fs.readFileSync(new URL('../data/poi/import_example.json', import.meta.url), 'utf8'));
  const plan = planImport(entriesFromJson(ex), [], { namespace: ex.namespace });
  assert.equal(plan.summary.failed, 0);
  assert.equal(plan.items[0].poi.names.zh, '示例榴莲园');
});

test('template headers parse the template file and seed file identically', () => {
  const t = parseCsv(fs.readFileSync(new URL('../data/poi/poi_collection_template.csv', import.meta.url), 'utf8'));
  assert.deepEqual(t.headers, TEMPLATE_HEADERS);
  assert.equal(parseCsv(seedCsv).headers.length, TEMPLATE_HEADERS.length);
});

test('original starter CSV (legacy headers) is accepted via aliases', () => {
  const legacy = fs.readFileSync(new URL('../data/poi/source/poi_starter_original.csv', import.meta.url), 'utf8');
  const plan = planImport(entriesFromCsv(legacy), [], { namespace: 'legacy' });
  assert.equal(plan.summary.failed, 0);
  assert.equal(plan.summary.total, 39);
});

test('state/status counts follow permissions; unverified pins are staff-only; no pin without coordinates', () => {
  const s = freshStore();
  s.applyImport(planImport(entriesFromCsv(seedCsv), s.list(), { namespace: NS }), driver);
  const all = s.list();
  assert.equal(visiblePois(all, 'passenger').length, 0);
  assert.equal(countsByState(all, 'passenger')['Kuala Lumpur'], undefined);
  const kl = countsByState(all, 'driver')['Kuala Lumpur'];
  assert.equal(kl.total, kl.byStatus.needs_review);
  assert.equal(countsByState(all, 'passenger')['Selangor'], undefined);

  const id = all.find((p) => p.origin.candidateId === 'SEED-004').id;
  assert.equal(s.setStatus(id, 'approved', driver).ok, false, 'drivers cannot approve');
  assert.equal(s.setStatus(id, 'approved', reviewer).ok, true);
  assert.equal(countsByState(s.list(), 'passenger')['Kuala Lumpur'].total, 1);
  assert.equal(countsByState(s.list(), 'passenger')['Kuala Lumpur'].byStatus, null);
  s.setStatus(id, 'archived', reviewer);
  assert.equal(countsByState(s.list(), 'passenger')['Kuala Lumpur'], undefined);
  assert.equal(countsByState(s.list(), 'driver')['Kuala Lumpur'].byStatus.archived, 1);

  const pins = s.list().map((p) => [p.origin.candidateId, pinKind(p, 'driver')]).filter(([, k]) => k !== 'none');
  assert.deepEqual(pins, [['SEED-036', 'unconfirmed']]);
  assert.equal(pinKind(s.list().find((p) => p.origin.candidateId === 'SEED-036'), 'passenger'), 'none');
});

test('cannot approve without a state and a source', () => {
  const s = freshStore();
  s.save({ id: 'poi_a', names: { en: 'A' } }, contributor);
  const r = s.setStatus('poi_a', 'approved', reviewer);
  assert.equal(r.ok, false);
  assert.match(r.error, /state/);
});

test('public view exposes no private, review, origin or unapproved-media data', () => {
  const s = freshStore();
  s.save({
    id: 'poi_pub', status: 'needs_review', names: { en: 'Pub', zh: '公' },
    location: { state: 'Perak', lat: 4.6, lng: 101.1, coordinateStatus: 'verified', coordinateSource: 'survey', coordinateVerifiedAt: '2026-11-01' },
    sources: [{ name: 'op', url: 'https://x.example', type: 'operator' }],
    review: { notes: 'INTERNAL-NOTE', flags: ['x'] }, origin: { note: 'ORIGIN-NOTE' },
    media: [{ ref: 'a.jpg', rights: { status: 'unknown' }, reviewStatus: 'approved' }, { ref: 'b.jpg', rights: { status: 'licensed' }, reviewStatus: 'approved' }]
  }, driver);
  assert.equal(publicView(s.get('poi_pub')), null, 'not visible until approved');
  s.setStatus('poi_pub', 'approved', reviewer);
  const pv = publicView(s.get('poi_pub'));
  const json = JSON.stringify(pv);
  for (const bad of ['INTERNAL-NOTE', 'ORIGIN-NOTE', 'createdBy', 'review', 'commission', 'a.jpg']) assert.ok(!json.includes(bad), bad);
  assert.ok(json.includes('b.jpg'));
});

test('private notes/commission: only driver/admin; unknown commission stays unknown', () => {
  const kv = memoryStorage();
  const ps = createPrivateStore({ storage: kv, now: () => 'T' });
  assert.equal(ps.set('poi_1', { driverNotes: 'n' }, contributor).ok, false);
  assert.equal(ps.set('poi_1', { driverNotes: 'n' }, driver).ok, true);
  assert.equal(ps.get('poi_1', 'passenger'), null);
  assert.equal(ps.get('poi_1', 'reviewer'), null);
  const got = ps.get('poi_1', 'driver');
  assert.equal(got.commission.kind, 'unknown');
  assert.equal(got.commission.value, null);
  assert.equal(got.suppliedBy, 'u-driver');
});

test('storage failure is reported, not swallowed', () => {
  const s = createPoiStore({ storage: { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } } });
  const r = s.save({ id: 'poi_q', names: { en: 'Q' } }, driver);
  assert.equal(r.ok, false);
  assert.match(r.error, /Quota/);
});

test('optimistic concurrency detects stale edits; history records who/what; archive preserves record', () => {
  const s = freshStore();
  s.save({ id: 'poi_c', names: { en: 'C' } }, driver);
  assert.equal(s.save({ id: 'poi_c', names: { en: 'C2' } }, driver, { expectedVersion: 1 }).ok, true);
  const stale = s.save({ id: 'poi_c', names: { en: 'C3' } }, driver, { expectedVersion: 1 });
  assert.equal(stale.code, 'conflict');
  const h = s.history('poi_c');
  assert.equal(h.at(-1).actor, 'u-driver');
  assert.ok(h.at(-1).changes.some((c) => c.path === 'names.en' && c.to === 'C2'));
});

test('itinerary snapshot is frozen: later edits/archive do not change it; unverified coords excluded', () => {
  const s = freshStore();
  s.save({ id: 'poi_s', names: { en: 'Old name', zh: '旧' }, location: { state: 'Perak', lat: 4.6, lng: 101.1, coordinateStatus: 'source_reported' }, visit: { durationMinutes: 60 } }, driver);
  const snap = snapshotPoi(s.get('poi_s'), 'T');
  s.save({ id: 'poi_s', names: { en: 'New name' }, visit: { durationMinutes: 90 } }, driver);
  assert.equal(snap.name.en, 'Old name');
  assert.equal(snap.durationMinutes, 60);
  assert.equal(snap.coordinates, null);
});

test('geo: region names normalise; projection round-trips; clustering groups near pins', () => {
  assert.equal(canonicalState('Pulau Pinang'), 'Penang');
  assert.equal(canonicalState('WP Kuala Lumpur'), 'Kuala Lumpur');
  assert.equal(canonicalState('Narnia'), null);
  assert.equal(regionIdFor('吉隆坡'), 'kul');
  const p = project(3.1579, 101.7116);
  const back = unproject(p.x, p.y);
  assert.ok(Math.abs(back.lat - 3.1579) < 1e-9 && Math.abs(back.lng - 101.7116) < 1e-9);
  const cl = clusterPins([{ id: 'a', x: 10, y: 10 }, { id: 'b', x: 12, y: 11 }, { id: 'c', x: 500, y: 500 }], 40);
  assert.deepEqual(cl.map((c) => c.type).sort(), ['cluster', 'pin']);
});

test('boundary data: known landmarks fall in the right state (when boundary file is present)', async (t) => {
  const url = new URL('../src/data/geo/peninsula-states.json', import.meta.url);
  if (!fs.existsSync(url)) return t.skip('boundary file not built yet');
  const fc = JSON.parse(fs.readFileSync(url, 'utf8'));
  assert.equal(fc.features.length, 13);
  const cases = [[3.1579, 101.7116, 'kul'], [2.936, 101.6896, 'pjy'], [3.2379, 101.684, 'sgr'], [2.1944, 102.2497, 'mlk'], [5.4141, 100.3288, 'png'], [1.4927, 103.7414, 'jhr']];
  for (const [lat, lng, id] of cases) assert.equal(regionContaining(lat, lng, fc), id, `${lat},${lng}`);
});

test('import report lists imported/skipped/conflicting/held/failed', () => {
  const plan = planImport(entriesFromCsv('candidate_id,name_en\nR1,Okay\nR2,\n'), [], { namespace: 't' });
  const md = reportToMarkdown(plan);
  assert.match(md, /failed 1/);
  assert.match(md, /Dry run/);
});

test('normalize/validate: hours without date warn; verified coords need source', () => {
  const p = normalizePoi({ id: 'x', names: { en: 'X' }, visit: { hours: { text: '9-5' } }, location: { lat: 3, lng: 101, coordinateStatus: 'verified' } });
  const v = validateDraft(p);
  assert.equal(v.ok, false);
  assert.ok(v.warnings.some((w) => /hours/.test(w)));
});
