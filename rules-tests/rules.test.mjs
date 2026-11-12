import { test, before, after, beforeEach, describe } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rules-test',
    firestore: { rules: readFileSync('../firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('../storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});
after(async () => { await env.cleanup(); });

const as = (uid, role) => env.authenticatedContext(uid, role ? { role } : {});
const fs = (c) => c.firestore();
const st = (c) => c.storage();
const anon = () => env.unauthenticatedContext();

const poi = (id, status, createdBy = 'contrib1') => ({ id, names: { en: 'Place ' + id, zh: '吉隆坡双子塔' }, status, createdBy });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (c) => {
    const d = c.firestore();
    for (const s of ['draft', 'needs_review', 'approved', 'archived']) {
      await setDoc(doc(d, 'pois', s), poi(s, s));
    }
    await setDoc(doc(d, 'pois/approved/private/n1'), { note: 'x', commission: '10%', suppliedBy: 'drv1', suppliedAt: Timestamp.now() });
    await setDoc(doc(d, 'pois/approved/history/h1'), { actor: 'rev1', at: Timestamp.now() });
    await setDoc(doc(d, 'imports/i1'), { createdBy: 'contrib1', raw: 'abc' });
    await setDoc(doc(d, 'itineraries/it1'), { ownerUid: 'drv1', title: 't' });
    await setDoc(doc(d, 'sharedItineraries/s1'), { ownerUid: 'drv1', title: 't' });
  });
});

describe('pois read', () => {
  test('anon can get approved', () => assertSucceeds(getDoc(doc(fs(anon()), 'pois/approved'))));
  for (const s of ['draft', 'needs_review', 'archived']) {
    test(`anon cannot get ${s}`, () => assertFails(getDoc(doc(fs(anon()), 'pois/' + s))));
    test(`signed-in passenger (no role) cannot get ${s}`, () => assertFails(getDoc(doc(fs(as('p1')), 'pois/' + s))));
    for (const r of ['driver', 'contributor', 'reviewer', 'admin']) {
      test(`${r} can get ${s}`, () => assertSucceeds(getDoc(doc(fs(as('u', r)), 'pois/' + s))));
    }
  }
  test('anon list filtered to approved succeeds', () =>
    assertSucceeds(getDocs(query(collection(fs(anon()), 'pois'), where('status', '==', 'approved')))));
  test('anon unfiltered list fails', () => assertFails(getDocs(collection(fs(anon()), 'pois'))));
  test('anon list of needs_review fails', () =>
    assertFails(getDocs(query(collection(fs(anon()), 'pois'), where('status', '==', 'needs_review')))));
  test('driver unfiltered list succeeds', () => assertSucceeds(getDocs(collection(fs(as('d', 'driver')), 'pois'))));
});

describe('pois create', () => {
  for (const r of ['driver', 'contributor', 'reviewer', 'admin']) {
    test(`${r} can create draft`, () =>
      assertSucceeds(setDoc(doc(fs(as('u1', r)), 'pois/new'), poi('new', 'draft', 'u1'))));
    test(`${r} can create needs_review`, () =>
      assertSucceeds(setDoc(doc(fs(as('u1', r)), 'pois/new'), poi('new', 'needs_review', 'u1'))));
    test(`${r} cannot create approved`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/new'), poi('new', 'approved', 'u1'))));
  }
  test('minimal draft (id, one name only) allowed', () =>
    assertSucceeds(setDoc(doc(fs(as('u1', 'contributor')), 'pois/min'), { id: 'min', names: { zh: '最小' }, status: 'draft', createdBy: 'u1' })));
  test('anon cannot create', () => assertFails(setDoc(doc(fs(anon()), 'pois/new'), poi('new', 'draft', 'u1'))));
  test('role-less user cannot create', () => assertFails(setDoc(doc(fs(as('u1')), 'pois/new'), poi('new', 'draft', 'u1'))));
  test('createdBy must equal uid', () => assertFails(setDoc(doc(fs(as('u1', 'driver')), 'pois/new'), poi('new', 'draft', 'other'))));
  test('id must equal doc id', () => assertFails(setDoc(doc(fs(as('u1', 'driver')), 'pois/new'), poi('wrong', 'draft', 'u1'))));
  test('a name is required', () => assertFails(setDoc(doc(fs(as('u1', 'driver')), 'pois/new'), { id: 'new', status: 'draft', createdBy: 'u1' })));
  test('name must be a string', () => assertFails(setDoc(doc(fs(as('u1', 'driver')), 'pois/new'), { id: 'new', names: { en: 5 }, status: 'draft', createdBy: 'u1' })));
});

describe('pois update', () => {
  test('creator can edit own draft', () =>
    assertSucceeds(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/draft'), { descEn: 'hi' })));
  test('creator can move draft to needs_review', () =>
    assertSucceeds(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/draft'), { status: 'needs_review' })));
  test('creator cannot approve', () =>
    assertFails(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/draft'), { status: 'approved' })));
  test('creator cannot archive', () =>
    assertFails(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/draft'), { status: 'archived' })));
  test('driver creator cannot approve', () =>
    assertFails(updateDoc(doc(fs(as('contrib1', 'driver')), 'pois/needs_review'), { status: 'approved' })));
  test('creator cannot edit approved POI', () =>
    assertFails(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/approved'), { descEn: 'x' })));
  test('creator cannot change createdBy', () =>
    assertFails(updateDoc(doc(fs(as('contrib1', 'contributor')), 'pois/draft'), { createdBy: 'me' })));
  test('non-creator contributor cannot edit', () =>
    assertFails(updateDoc(doc(fs(as('other', 'contributor')), 'pois/draft'), { descEn: 'x' })));
  test('non-creator driver cannot edit', () =>
    assertFails(updateDoc(doc(fs(as('other', 'driver')), 'pois/draft'), { descEn: 'x' })));
  test('reviewer can approve', () =>
    assertSucceeds(updateDoc(doc(fs(as('rev1', 'reviewer')), 'pois/needs_review'), { status: 'approved' })));
  test('reviewer can archive', () =>
    assertSucceeds(updateDoc(doc(fs(as('rev1', 'reviewer')), 'pois/approved'), { status: 'archived' })));
  test('reviewer can restore archived', () =>
    assertSucceeds(updateDoc(doc(fs(as('rev1', 'reviewer')), 'pois/archived'), { status: 'needs_review' })));
  test('admin can approve', () =>
    assertSucceeds(updateDoc(doc(fs(as('adm', 'admin')), 'pois/draft'), { status: 'approved' })));
  test('reviewer cannot change createdBy', () =>
    assertFails(updateDoc(doc(fs(as('rev1', 'reviewer')), 'pois/draft'), { createdBy: 'rev1' })));
  test('reviewer cannot change id', () =>
    assertFails(updateDoc(doc(fs(as('rev1', 'reviewer')), 'pois/draft'), { id: 'zzz' })));
  test('anon cannot update', () => assertFails(updateDoc(doc(fs(anon()), 'pois/draft'), { descEn: 'x' })));
  test('passenger cannot update approved', () => assertFails(updateDoc(doc(fs(as('p1')), 'pois/approved'), { descEn: 'x' })));
});

describe('pois delete', () => {
  for (const r of [null, 'driver', 'contributor', 'reviewer', 'admin']) {
    test(`${r ?? 'no-role'} cannot delete`, () => assertFails(deleteDoc(doc(fs(as('contrib1', r)), 'pois/draft'))));
  }
  test('anon cannot delete', () => assertFails(deleteDoc(doc(fs(anon()), 'pois/approved'))));
});

describe('pois/private', () => {
  const p = 'pois/approved/private/n1';
  const good = () => ({ note: 'n', commission: 'unknown', suppliedBy: 'u1', suppliedAt: serverTimestamp() });
  for (const r of ['driver', 'admin']) {
    test(`${r} can read`, () => assertSucceeds(getDoc(doc(fs(as('u1', r)), p))));
    test(`${r} can create with suppliedBy/At`, () => assertSucceeds(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n2'), good())));
    test(`${r} can update with suppliedBy/At`, () => assertSucceeds(setDoc(doc(fs(as('u1', r)), p), good())));
    test(`${r} cannot write without suppliedBy`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n3'), { note: 'x', suppliedAt: serverTimestamp() })));
    test(`${r} cannot write with spoofed suppliedBy`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n3'), { ...good(), suppliedBy: 'someone' })));
    test(`${r} cannot write without suppliedAt`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n3'), { note: 'x', suppliedBy: 'u1' })));
    test(`${r} cannot write non-timestamp suppliedAt`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n3'), { note: 'x', suppliedBy: 'u1', suppliedAt: 'yesterday' })));
    test(`${r} cannot delete`, () => assertFails(deleteDoc(doc(fs(as('u1', r)), p))));
  }
  for (const r of ['contributor', 'reviewer', null]) {
    test(`${r ?? 'no-role'} cannot read`, () => assertFails(getDoc(doc(fs(as('u1', r)), p))));
    test(`${r ?? 'no-role'} cannot list`, () => assertFails(getDocs(collection(fs(as('u1', r)), 'pois/approved/private'))));
    test(`${r ?? 'no-role'} cannot write`, () => assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/private/n9'), good())));
  }
  test('anon cannot read', () => assertFails(getDoc(doc(fs(anon()), p))));
  test('anon cannot list', () => assertFails(getDocs(collection(fs(anon()), 'pois/approved/private'))));
  test('anon cannot write', () => assertFails(setDoc(doc(fs(anon()), 'pois/approved/private/n9'), good())));
});

describe('pois/history', () => {
  const p = 'pois/approved/history/h1';
  const entry = (uid) => ({ actor: uid, at: serverTimestamp(), change: 'x' });
  for (const r of ['driver', 'contributor', 'reviewer', 'admin']) {
    test(`${r} can append`, () => assertSucceeds(setDoc(doc(fs(as('u1', r)), 'pois/approved/history/h2'), entry('u1'))));
    test(`${r} cannot spoof actor`, () => assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/history/h2'), entry('u2'))));
    test(`${r} cannot backdate`, () =>
      assertFails(setDoc(doc(fs(as('u1', r)), 'pois/approved/history/h2'), { actor: 'u1', at: Timestamp.fromDate(new Date('2020-01-01')) })));
  }
  for (const r of ['reviewer', 'admin']) test(`${r} can read`, () => assertSucceeds(getDoc(doc(fs(as('u1', r)), p))));
  for (const r of ['driver', 'contributor', null]) test(`${r ?? 'no-role'} cannot read`, () => assertFails(getDoc(doc(fs(as('u1', r)), p))));
  test('anon cannot read', () => assertFails(getDoc(doc(fs(anon()), p))));
  test('anon cannot create', () => assertFails(setDoc(doc(fs(anon()), 'pois/approved/history/h2'), entry('u1'))));
  for (const r of ['reviewer', 'admin']) {
    test(`${r} cannot update`, () => assertFails(updateDoc(doc(fs(as('rev1', r)), p), { change: 'edit' })));
    test(`${r} cannot overwrite`, () => assertFails(setDoc(doc(fs(as('rev1', r)), p), { actor: 'rev1', at: serverTimestamp() })));
    test(`${r} cannot delete`, () => assertFails(deleteDoc(doc(fs(as('rev1', r)), p))));
  }
});

describe('imports', () => {
  test('contributor creates own', () => assertSucceeds(setDoc(doc(fs(as('c1', 'contributor')), 'imports/i2'), { createdBy: 'c1', raw: 'r' })));
  test('cannot create for someone else', () => assertFails(setDoc(doc(fs(as('c1', 'contributor')), 'imports/i2'), { createdBy: 'c2' })));
  test('anon cannot create', () => assertFails(setDoc(doc(fs(anon()), 'imports/i2'), { createdBy: 'c1' })));
  test('creator reads own', () => assertSucceeds(getDoc(doc(fs(as('contrib1', 'contributor')), 'imports/i1'))));
  test('other contributor cannot read', () => assertFails(getDoc(doc(fs(as('c2', 'contributor')), 'imports/i1'))));
  test('other driver cannot read', () => assertFails(getDoc(doc(fs(as('d2', 'driver')), 'imports/i1'))));
  test('reviewer reads any', () => assertSucceeds(getDoc(doc(fs(as('rev', 'reviewer')), 'imports/i1'))));
  test('admin reads any', () => assertSucceeds(getDoc(doc(fs(as('adm', 'admin')), 'imports/i1'))));
  test('anon cannot read', () => assertFails(getDoc(doc(fs(anon()), 'imports/i1'))));
  test('creator cannot update', () => assertFails(updateDoc(doc(fs(as('contrib1', 'contributor')), 'imports/i1'), { raw: 'z' })));
  test('reviewer can update', () => assertSucceeds(updateDoc(doc(fs(as('rev', 'reviewer')), 'imports/i1'), { report: 'ok' })));
  test('admin can update', () => assertSucceeds(updateDoc(doc(fs(as('adm', 'admin')), 'imports/i1'), { report: 'ok' })));
  for (const r of ['contributor', 'reviewer', 'admin']) test(`${r} cannot delete`, () => assertFails(deleteDoc(doc(fs(as('contrib1', r)), 'imports/i1'))));
});

describe('itineraries', () => {
  const p = 'itineraries/it1';
  for (const r of ['driver', 'admin']) {
    test(`${r} owner reads`, () => assertSucceeds(getDoc(doc(fs(as('drv1', r)), p))));
    test(`${r} owner updates`, () => assertSucceeds(updateDoc(doc(fs(as('drv1', r)), p), { title: 'new' })));
    test(`${r} owner archives`, () => assertSucceeds(updateDoc(doc(fs(as('drv1', r)), p), { archived: true })));
    test(`${r} owner creates`, () => assertSucceeds(setDoc(doc(fs(as('drv1', r)), 'itineraries/it2'), { ownerUid: 'drv1' })));
    test(`${r} owner cannot delete`, () => assertFails(deleteDoc(doc(fs(as('drv1', r)), p))));
  }
  test('owner cannot reassign ownerUid', () => assertFails(updateDoc(doc(fs(as('drv1', 'driver')), p), { ownerUid: 'drv2' })));
  test('cannot create for another owner', () => assertFails(setDoc(doc(fs(as('drv1', 'driver')), 'itineraries/it2'), { ownerUid: 'drv2' })));
  test('other driver cannot read', () => assertFails(getDoc(doc(fs(as('drv2', 'driver')), p))));
  test('other driver cannot update', () => assertFails(updateDoc(doc(fs(as('drv2', 'driver')), p), { title: 'x' })));
  test('reviewer cannot read', () => assertFails(getDoc(doc(fs(as('rev', 'reviewer')), p))));
  test('contributor with matching uid cannot read', () => assertFails(getDoc(doc(fs(as('drv1', 'contributor')), p))));
  test('anon cannot read', () => assertFails(getDoc(doc(fs(anon()), p))));
  test('driver cannot list others', () => assertFails(getDocs(collection(fs(as('drv2', 'driver')), 'itineraries'))));
  test('driver can list own via filter', () =>
    assertSucceeds(getDocs(query(collection(fs(as('drv1', 'driver')), 'itineraries'), where('ownerUid', '==', 'drv1')))));
});

describe('sharedItineraries', () => {
  const p = 'sharedItineraries/s1';
  test('anon can get', () => assertSucceeds(getDoc(doc(fs(anon()), p))));
  test('passenger can get', () => assertSucceeds(getDoc(doc(fs(as('p1')), p))));
  test('anon cannot list', () => assertFails(getDocs(collection(fs(anon()), 'sharedItineraries'))));
  test('driver cannot list', () => assertFails(getDocs(collection(fs(as('drv1', 'driver')), 'sharedItineraries'))));
  test('owner driver creates', () => assertSucceeds(setDoc(doc(fs(as('drv1', 'driver')), 'sharedItineraries/s2'), { ownerUid: 'drv1', title: 'x' })));
  test('owner driver updates', () => assertSucceeds(updateDoc(doc(fs(as('drv1', 'driver')), p), { title: 'y' })));
  test('other driver cannot update', () => assertFails(updateDoc(doc(fs(as('drv2', 'driver')), p), { title: 'y' })));
  test('cannot create for another owner', () => assertFails(setDoc(doc(fs(as('drv1', 'driver')), 'sharedItineraries/s2'), { ownerUid: 'drv2' })));
  test('contributor cannot create', () => assertFails(setDoc(doc(fs(as('drv1', 'contributor')), 'sharedItineraries/s2'), { ownerUid: 'drv1' })));
  test('anon cannot create', () => assertFails(setDoc(doc(fs(anon()), 'sharedItineraries/s2'), { ownerUid: 'drv1' })));
  test('anon cannot update', () => assertFails(updateDoc(doc(fs(anon()), p), { title: 'y' })));
  for (const k of ['commission', 'privateNotes', 'driverNotes']) {
    test(`create with ${k} rejected`, () =>
      assertFails(setDoc(doc(fs(as('drv1', 'driver')), 'sharedItineraries/s2'), { ownerUid: 'drv1', [k]: 'secret' })));
    test(`update adding ${k} rejected`, () =>
      assertFails(updateDoc(doc(fs(as('drv1', 'driver')), p), { [k]: 'secret' })));
  }
  test('owner cannot reassign ownerUid', () => assertFails(updateDoc(doc(fs(as('drv1', 'driver')), p), { ownerUid: 'drv2' })));
  test('owner cannot delete', () => assertFails(deleteDoc(doc(fs(as('drv1', 'driver')), p))));
  test('admin cannot delete', () => assertFails(deleteDoc(doc(fs(as('adm', 'admin')), p))));
});

describe('default deny', () => {
  test('unknown collection read denied for admin', () => assertFails(getDoc(doc(fs(as('adm', 'admin')), 'secrets/x'))));
  test('unknown collection write denied for admin', () => assertFails(setDoc(doc(fs(as('adm', 'admin')), 'secrets/x'), { a: 1 })));
  test('users collection denied for anon', () => assertFails(getDoc(doc(fs(anon()), 'users/u1'))));
});

describe('storage', () => {
  const img = new Uint8Array([1, 2, 3]);
  const meta = { contentType: 'image/png' };
  const seed = (path) => env.withSecurityRulesDisabled((c) => uploadBytes(ref(c.storage(), path), img, meta));

  test('anon reads public media', async () => {
    await seed('poiMedia/public/p1/a.png');
    await assertSucceeds(getBytes(ref(st(anon()), 'poiMedia/public/p1/a.png')));
  });
  for (const r of ['reviewer', 'admin']) {
    test(`${r} uploads public image`, () => assertSucceeds(uploadBytes(ref(st(as('u', r)), 'poiMedia/public/p1/b.png'), img, meta)));
    test(`${r} rejects non-image public`, () => assertFails(uploadBytes(ref(st(as('u', r)), 'poiMedia/public/p1/b.pdf'), img, { contentType: 'application/pdf' })));
    test(`${r} rejects >=5MB public`, () =>
      assertFails(uploadBytes(ref(st(as('u', r)), 'poiMedia/public/p1/big.png'), new Uint8Array(5 * 1024 * 1024), meta)));
  }
  for (const r of ['contributor', 'driver', null]) {
    test(`${r ?? 'no-role'} cannot upload public`, () => assertFails(uploadBytes(ref(st(as('u', r)), 'poiMedia/public/p1/c.png'), img, meta)));
  }
  test('anon cannot upload public', () => assertFails(uploadBytes(ref(st(anon()), 'poiMedia/public/p1/c.png'), img, meta)));
  test('admin can delete public', async () => {
    await seed('poiMedia/public/p1/d.png');
    await assertSucceeds(deleteObject(ref(st(as('a', 'admin')), 'poiMedia/public/p1/d.png')));
  });
  test('reviewer cannot delete public', async () => {
    await seed('poiMedia/public/p1/d.png');
    await assertFails(deleteObject(ref(st(as('r', 'reviewer')), 'poiMedia/public/p1/d.png')));
  });

  for (const r of ['driver', 'contributor', 'reviewer', 'admin']) {
    test(`${r} uploads pending image`, () => assertSucceeds(uploadBytes(ref(st(as('u', r)), 'poiMedia/pending/p1/a.png'), img, meta)));
    test(`${r} reads pending`, async () => {
      await seed('poiMedia/pending/p1/r.png');
      await assertSucceeds(getBytes(ref(st(as('u', r)), 'poiMedia/pending/p1/r.png')));
    });
    test(`${r} rejects non-image pending`, () => assertFails(uploadBytes(ref(st(as('u', r)), 'poiMedia/pending/p1/a.txt'), img, { contentType: 'text/plain' })));
    test(`${r} rejects >=5MB pending`, () =>
      assertFails(uploadBytes(ref(st(as('u', r)), 'poiMedia/pending/p1/big.png'), new Uint8Array(5 * 1024 * 1024), meta)));
  }
  test('anon cannot read pending', async () => {
    await seed('poiMedia/pending/p1/r.png');
    await assertFails(getBytes(ref(st(anon()), 'poiMedia/pending/p1/r.png')));
  });
  test('passenger cannot read pending', async () => {
    await seed('poiMedia/pending/p1/r.png');
    await assertFails(getBytes(ref(st(as('p1')), 'poiMedia/pending/p1/r.png')));
  });
  test('passenger cannot upload pending', () => assertFails(uploadBytes(ref(st(as('p1')), 'poiMedia/pending/p1/z.png'), img, meta)));
  for (const r of ['driver', 'contributor', 'reviewer']) {
    test(`${r} cannot delete pending`, async () => {
      await seed('poiMedia/pending/p1/x.png');
      await assertFails(deleteObject(ref(st(as('u', r)), 'poiMedia/pending/p1/x.png')));
    });
  }
  test('admin can delete pending', async () => {
    await seed('poiMedia/pending/p1/x.png');
    await assertSucceeds(deleteObject(ref(st(as('a', 'admin')), 'poiMedia/pending/p1/x.png')));
  });
  test('other paths: admin cannot write', () => assertFails(uploadBytes(ref(st(as('a', 'admin')), 'other/a.png'), img, meta)));
  test('other paths: admin/anon cannot read', async () => {
    await seed('other/b.png');
    await assertFails(getBytes(ref(st(as('a', 'admin')), 'other/b.png')));
    await assertFails(getBytes(ref(st(anon()), 'other/b.png')));
  });
});
