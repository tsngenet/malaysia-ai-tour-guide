/**
 * Phase 1C: Genuine Firestore Security Rules Unit Test Suite
 * Evaluated directly against the running Cloud Firestore Emulator (port 8080)
 * using @firebase/rules-unit-testing.
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const PROJECT_ID = 'msiatguide';
const RULES_PATH = join(process.cwd(), 'firestore.rules');
const rules = readFileSync(RULES_PATH, 'utf8');

async function runFirestoreRulesUnitTests() {
  console.log('================================================================');
  console.log('PHASE 1C: FIRESTORE SECURITY RULES UNIT TEST SUITE');
  console.log('Evaluated against Cloud Firestore Emulator on 127.0.0.1:8080');
  console.log('================================================================\n');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules
    }
  });

  // Ensure clean emulator state before running rules assertions
  await testEnv.clearFirestore();

  let passCount = 0;
  let failCount = 0;

  async function testCase(name, fn) {
    try {
      await fn();
      console.log(`  ✓ [PASS] ${name}`);
      passCount++;
    } catch (err) {
      console.error(`  ✗ [FAIL] ${name}`);
      console.error(`    Error: ${err.message}`);
      failCount++;
    }
  }

  try {
    // Contexts:
    // 1. Unauthenticated Passenger (public)
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    
    // 2. Authenticated Driver A (uid: 'driver-a')
    const driverADb = testEnv.authenticatedContext('driver-a', { role: 'driver' }).firestore();
    
    // 3. Authenticated Driver B (uid: 'driver-b')
    const driverBDb = testEnv.authenticatedContext('driver-b', { role: 'driver' }).firestore();

    // 4. Authenticated Admin (uid: 'admin-1', token: { role: 'admin' })
    const adminDb = testEnv.authenticatedContext('admin-1', { role: 'admin' }).firestore();

    // 5. Standard User (uid: 'user-1')
    const userDb = testEnv.authenticatedContext('user-1').firestore();

    // ========================================================================
    // Group 1: Global Default Deny
    // ========================================================================
    console.log('--- Group 1: Default Deny Policy ---');
    await testCase('Deny access by default to unhandled collections', async () => {
      await assertFails(unauthDb.collection('unhandled_collection').doc('doc1').get());
      await assertFails(driverADb.collection('unhandled_collection').doc('doc1').set({ foo: 'bar' }));
    });

    // ========================================================================
    // Group 2: Draft Tours (tours_draft) Ownership & Isolation
    // ========================================================================
    console.log('\n--- Group 2: Draft Tours (tours_draft) Ownership & Isolation ---');
    
    const validDraftData = {
      tourId: 'draft-tour-ipoh-1',
      driverUid: 'driver-a',
      title: { en: 'Ipoh Day Trip Draft' },
      stops: [{ stopId: 's1', durationMinutes: 45 }],
      status: 'draft',
      publicationStatus: 'draft'
    };

    await testCase('Driver A can create their own draft tour', async () => {
      await assertSucceeds(
        driverADb.collection('tours_draft').doc('draft-tour-ipoh-1').set(validDraftData)
      );
    });

    await testCase('Driver A can read their own draft tour', async () => {
      await assertSucceeds(
        driverADb.collection('tours_draft').doc('draft-tour-ipoh-1').get()
      );
    });

    await testCase('Driver A can update their own draft tour', async () => {
      await assertSucceeds(
        driverADb.collection('tours_draft').doc('draft-tour-ipoh-1').update({
          notes: 'Updated stop order and coffee break'
        })
      );
    });

    await testCase('Unauthenticated passenger CANNOT read private draft', async () => {
      await assertFails(
        unauthDb.collection('tours_draft').doc('draft-tour-ipoh-1').get()
      );
    });

    await testCase('Driver B CANNOT read Driver A\'s private draft', async () => {
      await assertFails(
        driverBDb.collection('tours_draft').doc('draft-tour-ipoh-1').get()
      );
    });

    await testCase('Driver B CANNOT update Driver A\'s draft', async () => {
      await assertFails(
        driverBDb.collection('tours_draft').doc('draft-tour-ipoh-1').update({
          notes: 'Hacked by Driver B'
        })
      );
    });

    await testCase('Driver B CANNOT delete Driver A\'s draft', async () => {
      await assertFails(
        driverBDb.collection('tours_draft').doc('draft-tour-ipoh-1').delete()
      );
    });

    await testCase('Driver A CANNOT alter immutable driverUid field on draft update', async () => {
      await assertFails(
        driverADb.collection('tours_draft').doc('draft-tour-ipoh-1').update({
          driverUid: 'driver-b'
        })
      );
    });

    // ========================================================================
    // Group 3: Published Tours (tours_published) Immutability & Public Reads
    // ========================================================================
    console.log('\n--- Group 3: Published Tours (tours_published) Immutability & Public Access ---');

    const validPublishedTour = {
      tourId: 'published-tour-ipoh-1',
      driverUid: 'driver-a',
      code: 'MYTG-20261107-IPOH',
      publishedVersion: 1,
      publishedAt: new Date(),
      title: { en: 'Ipoh Heritage & Gastronomy Tour' },
      publicationStatus: 'published',
      stops: [
        { stopId: 's1', title: { en: 'White Coffee' }, durationMinutes: 30 }
      ]
    };

    await testCase('Unauthenticated passenger CANNOT publish a tour', async () => {
      await assertFails(
        unauthDb.collection('tours_published').doc('published-tour-ipoh-1').set(validPublishedTour)
      );
    });

    await testCase('Driver A CAN publish an approved tour snapshot with their own driverUid', async () => {
      await assertSucceeds(
        driverADb.collection('tours_published').doc('published-tour-ipoh-1').set(validPublishedTour)
      );
    });

    await testCase('Unauthenticated passenger CAN read published tour (zero login hurdles)', async () => {
      const snap = await unauthDb.collection('tours_published').doc('published-tour-ipoh-1').get();
      assert.equal(snap.exists, true);
    });

    await testCase('Ordinary Driver A CANNOT modify published snapshot (enforcing immutability)', async () => {
      await assertFails(
        driverADb.collection('tours_published').doc('published-tour-ipoh-1').update({
          code: 'TAMPERED-CODE'
        })
      );
    });

    await testCase('Ordinary Driver A CANNOT delete published snapshot', async () => {
      await assertFails(
        driverADb.collection('tours_published').doc('published-tour-ipoh-1').delete()
      );
    });

    await testCase('Driver B CANNOT modify or overwrite Driver A\'s published snapshot', async () => {
      await assertFails(
        driverBDb.collection('tours_published').doc('published-tour-ipoh-1').update({
          title: { en: 'Hijacked by B' }
        })
      );
    });

    // ========================================================================
    // Group 4: User Profiles (users/{uid}) Role Escalation Prevention
    // ========================================================================
    console.log('\n--- Group 4: User Profiles Role Escalation Guardrails ---');

    await testCase('Standard user CANNOT create profile with admin role', async () => {
      await assertFails(
        userDb.collection('users').doc('user-1').set({
          uid: 'user-1',
          role: 'admin',
          displayName: 'Attacker'
        })
      );
    });

    await testCase('Standard user CAN create unprivileged profile', async () => {
      await assertSucceeds(
        userDb.collection('users').doc('user-1').set({
          uid: 'user-1',
          role: 'user',
          displayName: 'Regular Tourist'
        })
      );
    });

    await testCase('Standard user CANNOT escalate role to admin via update', async () => {
      await assertFails(
        userDb.collection('users').doc('user-1').update({
          role: 'admin'
        })
      );
    });

    await testCase('Standard user CANNOT alter their uid in user profile', async () => {
      await assertFails(
        userDb.collection('users').doc('user-1').update({
          uid: 'different-uid'
        })
      );
    });

    await testCase('Public/unauthenticated user CANNOT read user profile (PII protection)', async () => {
      await assertFails(
        unauthDb.collection('users').doc('user-1').get()
      );
    });

    // ========================================================================
    // Group 5: Coordinate Guardrails (Prohibiting fake 0,0)
    // ========================================================================
    console.log('\n--- Group 5: Safety Guardrails (Rejecting fake coordinates 0,0) ---');

    const fakeCoordsDraft = {
      tourId: 'draft-fake-coords',
      driverUid: 'driver-a',
      title: { en: 'Fake Coords Tour' },
      coordinates: { lat: 0, lng: 0 }
    };

    await testCase('Reject draft with fabricated (0, 0) coordinates', async () => {
      await assertFails(
        driverADb.collection('tours_draft').doc('draft-fake-coords').set(fakeCoordsDraft)
      );
    });

    // ========================================================================
    // Group 6: Anti-Leak Public Query Invariants (Requirement 6)
    // ========================================================================
    console.log('\n--- Group 6: Anti-Leak Public Query Invariants ---');

    await testCase('Unauthenticated passenger CANNOT query private draft collection (tours_draft)', async () => {
      await assertFails(
        unauthDb.collection('tours_draft').get()
      );
    });

    await testCase('Unauthenticated passenger CANNOT query user profiles collection (users)', async () => {
      await assertFails(
        unauthDb.collection('users').get()
      );
    });

    await testCase('Driver B CANNOT query or list Driver A private drafts', async () => {
      await assertFails(
        driverBDb.collection('tours_draft').where('driverUid', '==', 'driver-a').get()
      );
    });

    await testCase('Unauthenticated passenger CAN query published tours by code', async () => {
      await assertSucceeds(
        unauthDb.collection('tours_published').where('code', '==', 'MYTG-20261107-IPOH').get()
      );
    });

    console.log('\n================================================================');
    console.log(`FIRESTORE RULES RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} Tests`);
    console.log('================================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } finally {
    await testEnv.cleanup();
  }
}

runFirestoreRulesUnitTests().catch((err) => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
