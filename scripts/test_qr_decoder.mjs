/**
 * Task 4: QR Code Verification Test
 * Generates an itinerary QR code in OperatorTourBuilder, decodes it using an independent
 * QR decoder (jsQR), verifies the encoded URL matches the published tour link,
 * and verifies accessibility in clean browser storage.
 */

import { chromium } from 'playwright';
import jsQR from 'jsqr';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3055';

async function runQrVerificationTest() {
  console.log('==================================================');
  console.log('Task 4: QR Code Verification Test');
  console.log('==================================================\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    console.log('1. Navigating to Operator Tour Builder...');
    await page.goto(`${BASE_URL}/#/operator`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.operator-container');

    console.log('2. Publishing tour and opening QR code modal...');
    await page.click('button:has-text("Publish Itinerary")');
    await page.waitForSelector('.modal-card.qr-card');

    const tourCode = (await page.locator('.tour-code-value').innerText()).trim();
    const displayedLink = (await page.locator('.qr-link-display code').innerText()).trim();
    console.log(`   Tour Code: ${tourCode}`);
    console.log(`   Displayed Link: ${displayedLink}`);

    // Wait for real QR image to render
    await page.waitForSelector('[data-testid="passenger-qr-image"]');
    const qrDataUrl = await page.getAttribute('[data-testid="passenger-qr-image"]', 'src');
    assert.ok(qrDataUrl.startsWith('data:image/png;base64,'), 'QR image must be a valid PNG data URL');
    console.log(`   QR Data URL length: ${qrDataUrl.length} bytes`);

    console.log('3. Extracting raw image pixels via canvas and decoding with jsQR...');
    const pixels = await page.evaluate(() => {
      const img = document.querySelector('[data-testid="passenger-qr-image"]');
      if (!img) throw new Error('QR image element not found in DOM');
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 240;
      canvas.height = img.naturalHeight || 240;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return {
        width: canvas.width,
        height: canvas.height,
        data: Array.from(imgData.data)
      };
    });

    const qrResult = jsQR(Uint8ClampedArray.from(pixels.data), pixels.width, pixels.height);
    assert.ok(qrResult, 'jsQR must successfully decode the rendered QR code image');
    console.log(`   ✓ Successfully decoded QR code with independent decoder!`);
    console.log(`   Decoded Data: "${qrResult.data}"`);

    // Verify decoded content matches intended tour link
    assert.equal(qrResult.data, displayedLink, 'Decoded QR URL must exactly match displayed tour link');
    assert.ok(qrResult.data.includes(tourCode) || qrResult.data.includes('kl-putrajaya-melaka-day-tour'),
      'Decoded QR URL must reference the tour ID or tour code');
    console.log('   ✓ Decoded URL perfectly matches intended tour link!');

    console.log('4. Testing accessibility with clean browser storage...');
    const cleanContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      storageState: undefined // Clean storage
    });
    const cleanPage = cleanContext.newPage();
    const parsedUrl = new URL(qrResult.data);
    const targetLocalUrl = `${BASE_URL}/?tour=${parsedUrl.searchParams.get('tour')}`;
    
    console.log(`   Loading decoded tour URL in clean storage context: ${targetLocalUrl}`);
    const navPage = await cleanPage;
    await navPage.goto(targetLocalUrl, { waitUntil: 'networkidle' });
    
    // Check if landing page or tour screen loads without crashing
    const bodyContent = await navPage.content();
    assert.ok(bodyContent.includes('Malaysia') || bodyContent.includes('Tour'), 'Application loads cleanly from decoded link');
    console.log('   ✓ Decoded tour URL loaded cleanly in isolated clean storage browser context!');

    await cleanContext.close();
    await context.close();

    console.log('\n==================================================');
    console.log('Task 4: QR Code Verification PASSED (Exit Code: 0)');
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n✗ Task 4: QR Code Verification FAILED:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runQrVerificationTest();
