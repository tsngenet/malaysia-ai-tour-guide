/**
 * POI rules tests: Firestore + Storage EMULATORS only (demo project; no real Firebase project is contacted).
 * Run: npx firebase emulators:exec --only firestore,storage --project demo-poi-test "node scripts/test_poi_rules_emulator.mjs"
 */
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, query, where, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

const env = await initializeTestEnvironment({
  projectId: 'demo-poi-test',
  firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') },
  storage: { host: '127.0.0.1', port: 9199, rules: readFileSync('storage.rules', 'utf8') }
});

let pass = 0; let fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); } catch (e) { fail++; console.error(`  ✗ ${name}\n    ${e.message.split('\n')[0]}`); }
};

const anon = () => env.unauthenticatedContext();
const driverA = () => env.authenticatedContext('driverA');           // self-registered driver: no role claim
const driverB = () => env.authenticatedContext('driverB');
const reviewer = () => env.authenticatedContext('rev1', { role: 'reviewer' });
const admin = () => env.authenticatedContext('adm1', { role: 'admin' });

const poi = (id, status, createdBy = 'driverA', extra = {}) => ({
  id, status, createdBy, names: { en: `Place ${id}`, zh: '黑风洞' }, location: { state: 'Selangor' }, version: 1, ...extra
});
const seed = async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'poi_master/ok'), poi('ok', 'approved', 'rev1'));
    await setDoc(doc(db, 'poi_master/dr'), poi('dr', 'draft'));
    await setDoc(doc(db, 'poi_master/nr'), poi('nr', 'needs_review'));
    await setDoc(doc(db, 'poi_master/ar'), poi('ar', 'archived', 'rev1'));
    await setDoc(doc(db, 'driver_poi_private/driverA/pois/ok'), { driverNotes: 'SECRET', commission: { kind: 'unknown' }, suppliedBy: 'driverA', suppliedAt: Timestamp.now() });
    await setDoc(doc(db, 'poi_master/ok/history/h1'), { actor: 'rev1', at: Timestamp.now() });
    await setDoc(doc(db, 'tours_published/t1'), { tourId: 't1', code: 'MYTG-1', driverUid: 'driverA' });
  });
};
await seed();

console.log('Firestore: POI master visibility (emulator)');
await t('passenger can read an approved POI', () => assertSucceeds(getDoc(doc(anon().firestore(), 'poi_master/ok'))));
await t('passenger can list approved POIs with a status filter', () => assertSucceeds(getDocs(query(collection(anon().firestore(), 'poi_master'), where('status', '==', 'approved')))));
await t('passenger cannot list POIs without the approved filter', () => assertFails(getDocs(collection(anon().firestore(), 'poi_master'))));
for (const id of ['dr', 'nr', 'ar']) {
  await t(`passenger cannot read ${id}`, () => assertFails(getDoc(doc(anon().firestore(), `poi_master/${id}`))));
}
await t('creator can read own draft', () => assertSucceeds(getDoc(doc(driverA().firestore(), 'poi_master/dr'))));
await t('another driver cannot read someone else\'s draft', () => assertFails(getDoc(doc(driverB().firestore(), 'poi_master/dr'))));
await t('reviewer can read needs_review and archived', async () => {
  await assertSucceeds(getDoc(doc(reviewer().firestore(), 'poi_master/nr')));
  await assertSucceeds(getDoc(doc(reviewer().firestore(), 'poi_master/ar')));
});

console.log('Firestore: POI master writes');
await t('signed-in user can create a name-only Chinese draft', () => assertSucceeds(setDoc(doc(driverB().firestore(), 'poi_master/n1'), { id: 'n1', status: 'draft', createdBy: 'driverB', names: { zh: '榴莲园' } })));
await t('passenger cannot create', () => assertFails(setDoc(doc(anon().firestore(), 'poi_master/n2'), poi('n2', 'draft', 'x'))));
await t('cannot create as approved', () => assertFails(setDoc(doc(driverB().firestore(), 'poi_master/n3'), poi('n3', 'approved', 'driverB'))));
await t('cannot spoof createdBy', () => assertFails(setDoc(doc(driverB().firestore(), 'poi_master/n4'), poi('n4', 'draft', 'driverA'))));
await t('cannot create without any name', () => assertFails(setDoc(doc(driverB().firestore(), 'poi_master/n5'), { id: 'n5', status: 'draft', createdBy: 'driverB', names: {} })));
await t('commission / driverNotes keys rejected on the public master doc', async () => {
  await assertFails(setDoc(doc(driverB().firestore(), 'poi_master/n6'), poi('n6', 'draft', 'driverB', { commission: '15%' })));
  await assertFails(setDoc(doc(driverB().firestore(), 'poi_master/n7'), poi('n7', 'draft', 'driverB', { driverNotes: 'x' })));
});
await t('creator can edit own draft but cannot self-approve', async () => {
  await assertSucceeds(updateDoc(doc(driverA().firestore(), 'poi_master/dr'), { 'names.en': 'Edited' }));
  await assertFails(updateDoc(doc(driverA().firestore(), 'poi_master/dr'), { status: 'approved' }));
});
await t('other driver cannot edit', () => assertFails(updateDoc(doc(driverB().firestore(), 'poi_master/dr'), { 'names.en': 'Hijack' })));
await t('creator cannot edit once approved', () => assertFails(updateDoc(doc(driverA().firestore(), 'poi_master/ok'), { 'names.en': 'x' })));
await t('reviewer can approve, archive and restore', async () => {
  await assertSucceeds(updateDoc(doc(reviewer().firestore(), 'poi_master/nr'), { status: 'approved' }));
  await assertSucceeds(updateDoc(doc(reviewer().firestore(), 'poi_master/nr'), { status: 'archived' }));
  await assertSucceeds(updateDoc(doc(reviewer().firestore(), 'poi_master/nr'), { status: 'needs_review' }));
});
await t('reviewer cannot change createdBy or id', async () => {
  await assertFails(updateDoc(doc(reviewer().firestore(), 'poi_master/dr'), { createdBy: 'rev1' }));
  await assertFails(updateDoc(doc(reviewer().firestore(), 'poi_master/dr'), { id: 'other' }));
});
await t('nobody can delete a POI (including admin)', async () => {
  for (const c of [anon(), driverA(), reviewer(), admin()]) await assertFails(deleteDoc(doc(c.firestore(), 'poi_master/dr')));
});

console.log('Firestore: history, imports');
await t('history: signed-in actor can append with server time; others cannot spoof actor', async () => {
  await assertSucceeds(setDoc(doc(driverA().firestore(), 'poi_master/dr/history/h2'), { actor: 'driverA', at: serverTimestamp() }));
  await assertFails(setDoc(doc(driverA().firestore(), 'poi_master/dr/history/h3'), { actor: 'driverB', at: serverTimestamp() }));
});
await t('history: reviewer reads, driver and passenger cannot; immutable', async () => {
  await assertSucceeds(getDoc(doc(reviewer().firestore(), 'poi_master/ok/history/h1')));
  await assertFails(getDoc(doc(driverA().firestore(), 'poi_master/ok/history/h1')));
  await assertFails(getDoc(doc(anon().firestore(), 'poi_master/ok/history/h1')));
  await assertFails(updateDoc(doc(admin().firestore(), 'poi_master/ok/history/h1'), { actor: 'x' }));
  await assertFails(deleteDoc(doc(admin().firestore(), 'poi_master/ok/history/h1')));
});
await t('imports: creator creates and reads own, others cannot, no delete', async () => {
  await assertSucceeds(setDoc(doc(driverA().firestore(), 'poi_imports/i1'), { createdBy: 'driverA', rawText: '黑风洞,Batu Caves' }));
  await assertSucceeds(getDoc(doc(driverA().firestore(), 'poi_imports/i1')));
  await assertFails(getDoc(doc(driverB().firestore(), 'poi_imports/i1')));
  await assertSucceeds(getDoc(doc(reviewer().firestore(), 'poi_imports/i1')));
  await assertFails(updateDoc(doc(driverA().firestore(), 'poi_imports/i1'), { rawText: 'tampered' }));
  await assertFails(deleteDoc(doc(admin().firestore(), 'poi_imports/i1')));
});

console.log('Firestore: private driver notes / commission');
await t('owner can read and write own private notes', async () => {
  const d = await assertSucceeds(getDoc(doc(driverA().firestore(), 'driver_poi_private/driverA/pois/ok')));
  await assertSucceeds(setDoc(doc(driverA().firestore(), 'driver_poi_private/driverA/pois/dr'), { driverNotes: 'n', commission: { kind: 'unknown' }, suppliedBy: 'driverA', suppliedAt: Timestamp.now() }));
});
await t('passenger, other driver, reviewer and admin cannot read private notes', async () => {
  for (const c of [anon(), driverB(), reviewer(), admin()]) await assertFails(getDoc(doc(c.firestore(), 'driver_poi_private/driverA/pois/ok')));
});
await t('cannot write private notes into another driver\'s space or spoof suppliedBy', async () => {
  await assertFails(setDoc(doc(driverB().firestore(), 'driver_poi_private/driverA/pois/x'), { suppliedBy: 'driverB', suppliedAt: Timestamp.now() }));
  await assertFails(setDoc(doc(driverA().firestore(), 'driver_poi_private/driverA/pois/y'), { suppliedBy: 'driverB', suppliedAt: Timestamp.now() }));
});
await t('private notes cannot be listed by passengers or other drivers', async () => {
  await assertFails(getDocs(collection(anon().firestore(), 'driver_poi_private/driverA/pois')));
  await assertFails(getDocs(collection(driverB().firestore(), 'driver_poi_private/driverA/pois')));
});
await t('private notes cannot be deleted', () => assertFails(deleteDoc(doc(driverA().firestore(), 'driver_poi_private/driverA/pois/ok'))));

console.log('Firestore: existing passenger/driver behaviour preserved');
await t('published tour readable without login; unknown code query is simply empty', async () => {
  await assertSucceeds(getDoc(doc(anon().firestore(), 'tours_published/t1')));
  const snap = await assertSucceeds(getDocs(query(collection(anon().firestore(), 'tours_published'), where('code', '==', 'NOPE-0000'))));
  if (!snap.empty) throw new Error('expected empty result');
});
await t('draft tours remain private to the owner', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => setDoc(doc(ctx.firestore(), 'tours_draft/d1'), { tourId: 'd1', driverUid: 'driverA' }));
  await assertFails(getDoc(doc(anon().firestore(), 'tours_draft/d1')));
  await assertFails(getDoc(doc(driverB().firestore(), 'tours_draft/d1')));
  await assertSucceeds(getDoc(doc(driverA().firestore(), 'tours_draft/d1')));
});

console.log('Storage: POI media');
const png = new Uint8Array([137, 80, 78, 71]);
const meta = { contentType: 'image/png' };
await t('signed-in user can upload to pending; passenger cannot read or upload', async () => {
  await assertSucceeds(uploadBytes(ref(driverA().storage(), 'poi_media/pending/p1/a.png'), png, meta));
  await assertFails(uploadBytes(ref(anon().storage(), 'poi_media/pending/p1/b.png'), png, meta));
  await assertFails(getBytes(ref(anon().storage(), 'poi_media/pending/p1/a.png')));
  await assertFails(getBytes(ref(driverB().storage(), 'poi_media/pending/p1/a.png')));
});
await t('reviewer can read pending and publish to public; passenger can read public', async () => {
  await assertSucceeds(getBytes(ref(reviewer().storage(), 'poi_media/pending/p1/a.png')));
  await assertSucceeds(uploadBytes(ref(reviewer().storage(), 'poi_media/public/p1/a.png'), png, meta));
  await assertSucceeds(getBytes(ref(anon().storage(), 'poi_media/public/p1/a.png')));
});
await t('ordinary driver cannot write to public; non-image rejected; no deletes on pending', async () => {
  await assertFails(uploadBytes(ref(driverA().storage(), 'poi_media/public/p1/x.png'), png, meta));
  await assertFails(uploadBytes(ref(reviewer().storage(), 'poi_media/public/p1/x.txt'), png, { contentType: 'text/plain' }));
  await assertFails(deleteObject(ref(admin().storage(), 'poi_media/pending/p1/a.png')));
});

await env.cleanup();
console.log(`\nPOI rules (emulator): ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
