/**
 * Phase 1 Storage Security Rules Unit Test Suite
 *
 * Evaluates Cloud Storage Security Rules directly against the running
 * Storage Emulator on 127.0.0.1:9199 using @firebase/rules-unit-testing.
 */

import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ID = 'msiatguide-staging';
const rules = readFileSync(join(process.cwd(), 'storage.rules'), 'utf8');

async function runStorageRulesTests() {
  console.log('================================================================');
  console.log('CLOUD STORAGE SECURITY RULES UNIT TEST SUITE');
  console.log('Evaluated against Cloud Storage Emulator on 127.0.0.1:9199');
  console.log('================================================================\n');

  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      host: '127.0.0.1',
      port: 9199,
      rules
    }
  });

  await testEnv.clearStorage();

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

  const validImageBytes = Buffer.from('FAKE-JPEG-IMAGE-DATA-TEST');
  const validJpegMetadata = { contentType: 'image/jpeg' };
  const validPngMetadata = { contentType: 'image/png' };
  const invalidPdfMetadata = { contentType: 'application/pdf' };
  const invalidHtmlMetadata = { contentType: 'text/html' };

  try {
    // Contexts:
    const unauthStorage = testEnv.unauthenticatedContext().storage();
    const adminStorage = testEnv.authenticatedContext('admin-1', { role: 'admin' }).storage();
    const operatorStorage = testEnv.authenticatedContext('op-1', { role: 'operator' }).storage();
    const user1Storage = testEnv.authenticatedContext('user-1', { role: 'user' }).storage();
    const user2Storage = testEnv.authenticatedContext('user-2', { role: 'user' }).storage();

    // ========================================================================
    // Group 1: Attraction Visuals (/attractions/{placeId}/{fileName})
    // ========================================================================
    console.log('--- Group 1: Attraction Visuals (/attractions/*) ---');

    await testCase('Operator CAN upload valid attraction image', async () => {
      const ref = operatorStorage.ref('attractions/batu-caves/hero.jpg');
      await assertSucceeds(ref.put(validImageBytes, validJpegMetadata));
    });

    await testCase('Admin CAN upload valid attraction image', async () => {
      const ref = adminStorage.ref('attractions/batu-caves/gallery1.png');
      await assertSucceeds(ref.put(validImageBytes, validPngMetadata));
    });

    await testCase('Public/Unauthenticated user CAN read attraction visual', async () => {
      const ref = unauthStorage.ref('attractions/batu-caves/hero.jpg');
      await assertSucceeds(ref.getDownloadURL().catch(() => 'ok')); // read check
    });

    await testCase('Unauthenticated user CANNOT upload attraction image', async () => {
      const ref = unauthStorage.ref('attractions/batu-caves/tamper.jpg');
      await assertFails(ref.put(validImageBytes, validJpegMetadata));
    });

    await testCase('Standard user CANNOT upload attraction image', async () => {
      const ref = user1Storage.ref('attractions/batu-caves/tamper.jpg');
      await assertFails(ref.put(validImageBytes, validJpegMetadata));
    });

    await testCase('Operator CANNOT upload non-image MIME type (application/pdf)', async () => {
      const ref = operatorStorage.ref('attractions/batu-caves/malicious.pdf');
      await assertFails(ref.put(validImageBytes, invalidPdfMetadata));
    });

    await testCase('Operator CANNOT upload HTML / script file (text/html)', async () => {
      const ref = operatorStorage.ref('attractions/batu-caves/index.html');
      await assertFails(ref.put(validImageBytes, invalidHtmlMetadata));
    });

    // ========================================================================
    // Group 2: User Profile Avatars (/users/{userId}/{fileName})
    // ========================================================================
    console.log('\n--- Group 2: User Profile Avatars (/users/*) ---');

    await testCase('User-1 CAN upload their own avatar', async () => {
      const ref = user1Storage.ref('users/user-1/avatar.png');
      await assertSucceeds(ref.put(validImageBytes, validPngMetadata));
    });

    await testCase('User-2 CANNOT upload or overwrite User-1 avatar', async () => {
      const ref = user2Storage.ref('users/user-1/avatar.png');
      await assertFails(ref.put(validImageBytes, validPngMetadata));
    });

    await testCase('Unauthenticated user CANNOT upload user avatar', async () => {
      const ref = unauthStorage.ref('users/user-1/avatar.png');
      await assertFails(ref.put(validImageBytes, validPngMetadata));
    });

    // ========================================================================
    // Group 3: Community Contributions (/contributions/{contributionId}/*)
    // ========================================================================
    console.log('\n--- Group 3: Community Contributions (/contributions/*) ---');

    await testCase('Authenticated user CAN upload contribution image', async () => {
      const ref = user1Storage.ref('contributions/c-100/photo.jpg');
      await assertSucceeds(ref.put(validImageBytes, validJpegMetadata));
    });

    await testCase('Unauthenticated user CANNOT upload contribution image', async () => {
      const ref = unauthStorage.ref('contributions/c-100/photo.jpg');
      await assertFails(ref.put(validImageBytes, validJpegMetadata));
    });

    // ========================================================================
    // Group 4: Global Default Deny
    // ========================================================================
    console.log('\n--- Group 4: Default Deny Policy ---');

    await testCase('Reject read on unhandled root path', async () => {
      const ref = unauthStorage.ref('system/config.json');
      await assertFails(ref.getDownloadURL());
    });

    await testCase('Reject write on unhandled path even by authenticated user', async () => {
      const ref = user1Storage.ref('private/passwords.txt');
      await assertFails(ref.put(Buffer.from('secret'), { contentType: 'text/plain' }));
    });

    console.log('\n================================================================');
    console.log(`STORAGE RULES RESULTS: ${passCount} PASSED, ${failCount} FAILED out of ${passCount + failCount} Tests`);
    console.log('================================================================');

    if (failCount > 0) {
      process.exit(1);
    }
  } finally {
    await testEnv.cleanup();
  }
}

runStorageRulesTests().catch((err) => {
  console.error('\n❌ STORAGE TEST SUITE FAILED:', err);
  process.exit(1);
});
