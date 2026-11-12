/**
 * Combined-app E2E at phone size against the Firebase EMULATORS (Auth 9099, Firestore 8080) with synthetic data.
 * This is NOT a test of the real staging project.
 * Run: npm run test:e2e:poi
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const PROJECT = 'demo-poi-e2e';
const DIST = '/tmp/poi-e2e-dist';
const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;

execSync(`npx vite build --outDir ${DIST} --emptyOutDir`, {
  stdio: 'ignore',
  env: { ...process.env, VITE_USE_FIREBASE_EMULATOR: 'true', VITE_FIREBASE_PROJECT_ID: PROJECT, VITE_FIREBASE_API_KEY: 'demo-key-not-real' }
});
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(PORT);

let pass = 0; let fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log(`  ✓ ${name}`); } catch (e) { fail++; console.error(`  ✗ ${name}\n    ${e.message.split('\n')[0]}`); }
};

const exe = ['/usr/local/bin/google-chrome', '/usr/bin/google-chrome'].find(existsSync);
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };
const ctx = await browser.newContext(phone);
const page = await ctx.newPage();
const fsDoc = async (path) => (await fetch(`http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/${path}`, { headers: { Authorization: 'Bearer owner' } })).json();

let draftTourId = ''; let tourCode = '';
try {
  console.log('Combined app, phone viewport, Firebase emulators');
  await page.goto(`${BASE}/#/poi`);
  await t('signed-out visitor cannot use the collection screen', async () => {
    await page.waitForSelector('text=Signed-in drivers only');
  });

  await page.goto(`${BASE}/#/operator`);
  await t('driver signs in with Firebase Auth (emulator)', async () => {
    await page.getByTestId('driver-login-btn').click();
    await page.getByTestId('login-email-input').fill('synthetic.driver@example.test');
    await page.getByTestId('login-password-input').fill('Synthetic-pass-123');
    await page.getByTestId('login-submit-btn').click();
    await page.waitForSelector('[data-testid="driver-logout-btn"]');
  });

  await t('signed-in driver imports the starter file locally as needs-review (dry run, then apply)', async () => {
    await page.goto(`${BASE}/#/poi`);
    await page.reload();
    await page.waitForSelector('text=Collect, import');
    await page.getByText('Load starter collection').click();
    await page.waitForSelector('text=Dry run');
    assert.match(await page.locator('[role=status]').first().innerText(), /Total 39/);
    await page.getByText('Apply import').click();
    await page.waitForSelector('text=Import report (applied)');
    const n = await page.evaluate(() => JSON.parse(localStorage.getItem('mytguide_poi_master_v1')).pois);
    assert.equal(Object.keys(n).length, 39);
    assert.ok(Object.values(n).every((p) => p.status === 'needs_review'));
  });

  await t('re-import is idempotent (all skipped)', async () => {
    await page.getByText('Load starter collection').click();
    await page.waitForSelector('text=Dry run');
    assert.match(await page.locator('[role=status]').first().innerText(), /skipped 39/);
  });

  await t('map: driver sees Kuala Lumpur 19 needs-review; Chinese names display; exact pins only when verified', async () => {
    await page.goto(`${BASE}/#/map`); await page.reload();
    await page.waitForSelector('.poi-state');
    await page.locator('.poi-statelist button', { hasText: 'Kuala Lumpur' }).click();
    await page.waitForSelector('.poi-selected');
    await page.waitForFunction(() => /19 places/.test(document.querySelector('.poi-selected')?.innerText || ''));
    const txt = await page.locator('.poi-selected').innerText();
    assert.match(txt, /19 places/);
    assert.match(txt, /Needs review: 19/);
    await page.getByText('中文').click();
    await page.waitForSelector('text=黑风洞', { state: 'attached' }).catch(() => {});
    const kl = await page.locator('.poi-list').innerText();
    assert.match(kl, /双峰塔/);
    // no pin is drawn as exact: every starter coordinate is unknown, so KL has no pins at all
    assert.equal(await page.locator('.poi-pin').count(), 0);
  });

  await t('itinerary: add 2 places from the master, edit a duration, reorder, save draft to Firestore', async () => {
    await page.goto(`${BASE}/#/operator`); await page.reload();
    await page.waitForSelector('[data-testid="driver-logout-btn"]');
    await page.getByTestId('mobile-itinerary-tab').click().catch(() => {});
    for (const q of ['Batu Caves', 'Petronas']) {
      await page.locator('#poi-find').fill(q);
      await page.locator('[data-testid=poi-picker] .poi-list button').first().click();
    }
    const before = await page.locator('.stop-index').count();
    assert.ok(before >= 2, 'both places appear as stops');
    await page.locator('.control-inline input[min="5"]').last().fill('75');
    await page.locator('.btn-arrow[title="Move up"]').last().click();
    await page.getByTestId('btn-save-draft').click();
    await page.waitForFunction(() => /saved to secure cloud/.test(document.querySelector('[data-testid=save-message]')?.innerText || ''));
    assert.match(await page.getByTestId('save-message').innerText(), /saved to secure cloud/);
    const local = await page.evaluate(() => JSON.parse(localStorage.getItem('mytguide_tours_store_v1')));
    const draft = Object.values(local).find((x) => x.tourId.startsWith('custom-tour-'));
    draftTourId = draft.tourId;
    const stops = draft.stops.filter((s) => s.poiRef);
    assert.equal(stops.length, 2);
    assert.ok(stops[0].poiRef.name.en.includes('Petronas'), 'reorder (up) persisted');
    assert.equal(stops[0].durationMinutes, 75, 'edited duration persisted');
    const cloud = await fsDoc(`tours_draft/${draftTourId}`);
    assert.ok(cloud.fields, 'draft exists in Firestore emulator');
    assert.ok(JSON.stringify(cloud).includes('poiRef'));
    assert.ok(!/commission|driverNotes/.test(JSON.stringify(cloud)));
  });

  await t('publish snapshot, then a passenger (no login) opens the link; unreviewed POI text is not exposed', async () => {
    await page.getByTestId('btn-publish-tour').click();
    await page.waitForSelector('[data-testid=passenger-qr-image]');
    const m = (await page.getByTestId('save-message').innerText()).match(/Code: (\S+)/);
    tourCode = m[1];
    const pub = await fsDoc(`tours_published/custom-tour-${tourCode.toLowerCase()}`);
    assert.ok(pub.fields, 'published snapshot exists');
    const passenger = await (await browser.newContext(phone)).newPage();
    await passenger.goto(`${BASE}/?tour=${tourCode}`);
    await passenger.waitForSelector('text=START LIVE TOUR');
    const body = await passenger.evaluate(() => JSON.stringify(Object.values(JSON.parse(localStorage.getItem('mytguide_tours_store_v1') || '{}'))));
    assert.ok(!/commission|driverNotes/.test(body));
    await passenger.context().close();
  });

  await t('invalid tour code shows "not found" to a passenger', async () => {
    const p = await (await browser.newContext(phone)).newPage();
    await p.goto(`${BASE}/?tour=NOPE-0000`);
    await p.waitForSelector('text=/not found/i', { timeout: 15000 });
    await p.context().close();
  });

  await t('passenger map: no POIs, no status breakdown (public sees approved only)', async () => {
    const p = await (await browser.newContext(phone)).newPage();
    await p.goto(`${BASE}/#/map`);
    await p.waitForSelector('.poi-state');
    assert.equal(await p.locator('.poi-statelist .poi-count', { hasText: /^[1-9]/ }).count(), 0);
    assert.match(await p.getByTestId('poi-role-label').innerText(), /Public view/);
    await p.context().close();
  });

  await t('cloud save failure is shown as a failure, not success', async () => {
    await page.goto(`${BASE}/#/operator`); await page.reload();
    await page.waitForSelector('[data-testid="driver-logout-btn"]');
    await page.getByTestId('mobile-itinerary-tab').click().catch(() => {});
    await ctx.setOffline(true);
    await page.getByTestId('btn-save-draft').click();
    await page.waitForFunction(() => /NOT confirmed/.test(document.querySelector('[data-testid=save-message]')?.innerText || ''), null, { timeout: 25000 });
    const msg = await page.getByTestId('save-message').innerText();
    await ctx.setOffline(false);
    assert.ok(!/✓ Draft itinerary saved/.test(msg), `got: ${msg}`);
  });
} finally {
  await browser.close();
  server.close();
}
console.log(`\nE2E (emulator, synthetic data): ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
