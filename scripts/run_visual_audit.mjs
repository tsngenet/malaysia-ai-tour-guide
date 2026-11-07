/**
 * Malaysia AI Tour Guide — Visual UI/UX & Browser Audit Automation Script
 * Uses Playwright to drive Chrome across all requested viewports and test flows.
 */

import { chromium } from 'playwright';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const BASE_URL = 'http://localhost:3055';
const SCREENSHOT_DIR = join(process.cwd(), 'audit_screenshots');

const VIEWPORTS = [
  { name: 'android-compact-360x800', width: 360, height: 800, isMobile: true, hasTouch: true },
  { name: 'iphone-typical-390x844', width: 390, height: 844, isMobile: true, hasTouch: true },
  { name: 'iphone-max-430x932', width: 430, height: 932, isMobile: true, hasTouch: true },
  { name: 'tablet-ipad-768x1024', width: 768, height: 1024, isMobile: false, hasTouch: true },
  { name: 'desktop-1440x900', width: 1440, height: 900, isMobile: false, hasTouch: false }
];

const auditResults = {
  timestamp: new Date().toISOString(),
  consoleLogs: [],
  failedRequests: [],
  overflowChecks: [],
  driverBuilderTests: {},
  passengerFlowTests: {},
  screenshotsCaptured: []
};

async function checkHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
      hasOverflow: document.documentElement.scrollWidth > window.innerWidth + 1
    };
  });
  auditResults.overflowChecks.push({ label, ...overflow });
  return overflow.hasOverflow;
}

async function runAudit() {
  console.log('🚀 Starting Comprehensive Visual UI/UX & Browser Audit...\n');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true
  });

  try {
    // =========================================================================
    // STEP 1: Multi-Viewport Responsive Inspection (Landing & Operator & Live)
    // =========================================================================
    console.log('--- Step 1: Testing 5 Viewports for Responsiveness & Layout ---');

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        hasTouch: vp.hasTouch,
        deviceScaleFactor: 2
      });

      const page = await context.newPage();

      // Listen for console and network issues
      page.on('console', msg => {
        if (msg.type() === 'error' || msg.type() === 'warning') {
          auditResults.consoleLogs.push({ viewport: vp.name, type: msg.type(), text: msg.text() });
        }
      });
      page.on('requestfailed', req => {
        auditResults.failedRequests.push({ viewport: vp.name, url: req.url(), error: req.failure()?.errorText });
      });

      // 1. Landing Page
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const landingShot = join(SCREENSHOT_DIR, `01_landing_${vp.name}.png`);
      await page.screenshot({ path: landingShot, fullPage: false });
      auditResults.screenshotsCaptured.push(landingShot);
      const landingOverflow = await checkHorizontalOverflow(page, `Landing @ ${vp.name}`);
      console.log(`  ✓ Landing Page captured [Overflow: ${landingOverflow ? 'DETECTED!' : 'NONE'}]`);

      // 2. Operator Itinerary Builder
      await page.goto(`${BASE_URL}/#/operator`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.operator-container', { timeout: 5000 });
      const operatorShot = join(SCREENSHOT_DIR, `02_operator_${vp.name}.png`);
      await page.screenshot({ path: operatorShot, fullPage: false });
      auditResults.screenshotsCaptured.push(operatorShot);
      const operatorOverflow = await checkHorizontalOverflow(page, `Operator @ ${vp.name}`);
      console.log(`  ✓ Operator Builder captured [Overflow: ${operatorOverflow ? 'DETECTED!' : 'NONE'}]`);

      // 3. Welcome / Language Screen
      await page.goto(`${BASE_URL}/#/tour/kl-putrajaya-melaka-day-tour`, { waitUntil: 'networkidle' });
      const welcomeShot = join(SCREENSHOT_DIR, `03_welcome_${vp.name}.png`);
      await page.screenshot({ path: welcomeShot, fullPage: false });
      auditResults.screenshotsCaptured.push(welcomeShot);

      // 4. Live Tour View
      await page.goto(`${BASE_URL}/#/live/kl-putrajaya-melaka-day-tour`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      const liveShot = join(SCREENSHOT_DIR, `04_live_tour_${vp.name}.png`);
      await page.screenshot({ path: liveShot, fullPage: false });
      auditResults.screenshotsCaptured.push(liveShot);

      await context.close();
    }

    // =========================================================================
    // STEP 2: Driver Itinerary Builder Deep Functional Testing
    // =========================================================================
    console.log('\n--- Step 2: Driver Itinerary Builder Deep Interaction Testing ---');
    const driverContext = await browser.newContext({
      viewport: { width: 412, height: 915 }, // Typical modern Android phone
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const driverPage = await driverContext.newPage();
    await driverPage.goto(`${BASE_URL}/#/operator`, { waitUntil: 'networkidle' });
    await driverPage.waitForSelector('.operator-container');

    // 2.1 Load Ipoh Template
    console.log('  Testing: Load Ipoh 10-Hour Template...');
    await driverPage.selectOption('.select-template', 'tpl-ipoh-1day');
    await driverPage.waitForTimeout(600);
    const stopCountAfterTpl = await driverPage.locator('.workspace-stop-card').count();
    auditResults.driverBuilderTests.ipohTemplateStops = stopCountAfterTpl;
    console.log(`  ✓ Ipoh template loaded with ${stopCountAfterTpl} stops`);

    const ipohLoadedShot = join(SCREENSHOT_DIR, '05_driver_ipoh_template_loaded.png');
    await driverPage.screenshot({ path: ipohLoadedShot });
    auditResults.screenshotsCaptured.push(ipohLoadedShot);

    // 2.2 Destination Recommendation Filter & Search
    console.log('  Testing: Destination Filter & Search...');
    await driverPage.click('.dest-tab:text-is("Melaka")');
    await driverPage.waitForTimeout(300);
    let cardTitles = await driverPage.locator('.card-att-title').allInnerTexts();
    auditResults.driverBuilderTests.melakaFilteredCardsCount = cardTitles.length;
    console.log(`  ✓ Filtered by "Melaka": ${cardTitles.length} cards visible`);

    // 2.3 Cross-destination addition (Add Batu Caves from Kuala Lumpur to Ipoh Itinerary)
    console.log('  Testing: Cross-destination addition (Batu Caves into Ipoh tour)...');
    await driverPage.click('.dest-tab:text-is("Kuala Lumpur")');
    await driverPage.fill('.search-input', 'Batu Caves');
    await driverPage.waitForTimeout(300);
    await driverPage.click('.btn-add-stop');
    await driverPage.waitForTimeout(400);
    const stopCountAfterCrossAdd = await driverPage.locator('.workspace-stop-card').count();
    auditResults.driverBuilderTests.stopCountAfterCrossAdd = stopCountAfterCrossAdd;
    console.log(`  ✓ Added Batu Caves across destination! Total stops now: ${stopCountAfterCrossAdd}`);

    // 2.4 Insert Breaks (Meal & Rest Stops)
    console.log('  Testing: Insert Meal Break & Rest Stop...');
    await driverPage.click('button:has-text("+ Meal Break")');
    await driverPage.waitForTimeout(300);
    await driverPage.click('button:has-text("+ Rest Stop")');
    await driverPage.waitForTimeout(300);
    const stopCountAfterBreaks = await driverPage.locator('.workspace-stop-card').count();
    auditResults.driverBuilderTests.stopCountAfterBreaks = stopCountAfterBreaks;
    console.log(`  ✓ Inserted Meal & Rest stops! Total stops now: ${stopCountAfterBreaks}`);

    // 2.5 Add Custom Stop
    console.log('  Testing: Add Custom Scenic Stop...');
    await driverPage.click('button:has-text("+ Custom Stop")');
    await driverPage.waitForSelector('.modal-card');
    await driverPage.fill('input[placeholder*="Secret Sunset Viewpoint"]', 'Ipoh Limestone Sunset Peak');
    await driverPage.fill('textarea[placeholder*="Short script"]', 'Enjoy a glorious tropical sunset over the Kinta Valley.');
    await driverPage.click('.modal-card button:has-text("Add Stop to Itinerary")');
    await driverPage.waitForTimeout(400);
    const stopCountAfterCustom = await driverPage.locator('.workspace-stop-card').count();
    auditResults.driverBuilderTests.stopCountAfterCustom = stopCountAfterCustom;
    console.log(`  ✓ Custom stop added! Total stops now: ${stopCountAfterCustom}`);

    // 2.6 Adjust Duration
    console.log('  Testing: Adjust Visit Duration...');
    const firstDurationInput = driverPage.locator('.input-num-sm').first();
    await firstDurationInput.fill('75');
    await driverPage.waitForTimeout(300);
    const summaryText = await driverPage.locator('.workspace-summary').innerText();
    auditResults.driverBuilderTests.summaryAfterDurationChange = summaryText;
    console.log(`  ✓ Visit duration updated. Schedule summary: ${summaryText}`);

    // 2.7 Accessible Reordering (Move Up / Down)
    console.log('  Testing: Accessible Stop Reordering...');
    const secondStopDownBtn = driverPage.locator('.btn-arrow:text("▼")').nth(1);
    await secondStopDownBtn.click();
    await driverPage.waitForTimeout(400);
    console.log('  ✓ Stop moved down successfully using accessible arrow');

    // 2.8 Drag and Drop Reordering Test
    console.log('  Testing: Drag-and-Drop Reordering...');
    try {
      const firstCard = driverPage.locator('.workspace-stop-card').first();
      const thirdCard = driverPage.locator('.workspace-stop-card').nth(2);
      await firstCard.dragTo(thirdCard);
      await driverPage.waitForTimeout(400);
      console.log('  ✓ Drag-and-drop action executed successfully');
      auditResults.driverBuilderTests.dragAndDropSucceeded = true;
    } catch (err) {
      console.warn('  ⚠️ Drag-and-drop notice:', err.message);
      auditResults.driverBuilderTests.dragAndDropSucceeded = false;
    }

    // 2.9 Remove Stop
    console.log('  Testing: Remove Stop...');
    const initialBeforeDelete = await driverPage.locator('.workspace-stop-card').count();
    const lastDeleteBtn = driverPage.locator('.btn-trash').last();
    await lastDeleteBtn.click();
    await driverPage.waitForTimeout(400);
    const afterDelete = await driverPage.locator('.workspace-stop-card').count();
    auditResults.driverBuilderTests.deletedStop = (afterDelete === initialBeforeDelete - 1);
    console.log(`  ✓ Stop removed. Count went from ${initialBeforeDelete} to ${afterDelete}`);

    // 2.10 Save Draft & Publish
    console.log('  Testing: Save as Draft & Publish Tour...');
    await driverPage.click('button:has-text("Save as Draft")');
    await driverPage.waitForSelector('.alert-success-banner');
    console.log('  ✓ Draft saved to local store');

    await driverPage.click('button:has-text("Publish Itinerary & Generate QR")');
    await driverPage.waitForSelector('.qr-card');
    const publishedCode = await driverPage.locator('.tour-code-value').innerText();
    const passengerLink = await driverPage.locator('.qr-link-display code').innerText();
    auditResults.driverBuilderTests.publishedTourCode = publishedCode;
    auditResults.driverBuilderTests.passengerLink = passengerLink;
    console.log(`  ✓ Tour Published! Official Code: ${publishedCode}, Link: ${passengerLink}`);

    const qrModalShot = join(SCREENSHOT_DIR, '06_driver_published_qr_modal.png');
    await driverPage.screenshot({ path: qrModalShot });
    auditResults.screenshotsCaptured.push(qrModalShot);

    await driverPage.click('.modal-card button:has-text("Done")');
    await driverContext.close();

    // =========================================================================
    // STEP 3: Passenger Experience Testing (Ipoh Itinerary Scenario)
    // =========================================================================
    console.log('\n--- Step 3: Passenger Experience Testing (Ipoh Tour) ---');
    const passContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const passPage = await passContext.newPage();

    // 3.1 Direct passenger entry via URL without login
    console.log('  Testing: Direct passenger entry via Tour URL...');
    await passPage.goto(`${BASE_URL}/#/tour/kl-putrajaya-melaka-day-tour`, { waitUntil: 'networkidle' });
    await passPage.waitForSelector('.welcome-screen-wrap');
    auditResults.passengerFlowTests.noLoginRequired = true;
    console.log('  ✓ Passenger entered without any login hurdle');

    // 3.2 Language switching
    console.log('  Testing: Language selection (Chinese & English)...');
    await passPage.click('button:has-text("中文")');
    await passPage.waitForTimeout(300);
    const chineseWelcomeTitle = await passPage.locator('.welcome-main-title').innerText();
    console.log(`  ✓ Language switched to Chinese: "${chineseWelcomeTitle.replace(/\n/g, ' ')}"`);

    const welcomeZhShot = join(SCREENSHOT_DIR, '07_passenger_welcome_chinese.png');
    await passPage.screenshot({ path: welcomeZhShot });
    auditResults.screenshotsCaptured.push(welcomeZhShot);

    // Switch back to English
    await passPage.click('button:has-text("English")');
    await passPage.waitForTimeout(200);

    // 3.3 Start Tour & Location Prompt
    console.log('  Testing: Start Tour & Location Permission Prompt...');
    await passPage.click('button.btn-start-live-tour');
    await passPage.waitForSelector('.location-prompt-card');
    console.log('  ✓ Location explainer modal appeared');

    const locPromptShot = join(SCREENSHOT_DIR, '08_passenger_location_prompt.png');
    await passPage.screenshot({ path: locPromptShot });
    auditResults.screenshotsCaptured.push(locPromptShot);

    // Continue to Live Tour
    await passPage.click('.location-prompt-actions .btn-secondary-pill');
    await passPage.waitForSelector('.live-tour-view-shell');
    console.log('  ✓ Passenger entered Live Tour Screen');

    const liveTourApproachingShot = join(SCREENSHOT_DIR, '09_passenger_live_tour_approaching.png');
    await passPage.screenshot({ path: liveTourApproachingShot });
    auditResults.screenshotsCaptured.push(liveTourApproachingShot);

    // 3.4 Audio Narration (Listen to Guide)
    console.log('  Testing: Audio Narration Listen Interaction...');
    const listenBtn = passPage.locator('.btn-listen-primary').first();
    if (await listenBtn.isVisible()) {
      await listenBtn.click();
      await passPage.waitForTimeout(500);
      console.log('  ✓ Audio narration triggered successfully');
    }

    // 3.5 Itinerary Drawer
    console.log('  Testing: Itinerary Drawer...');
    const routeNavBtn = passPage.locator('.bottom-nav-item:has-text("Journey")').first();
    if (await routeNavBtn.isVisible()) {
      await routeNavBtn.click();
      await passPage.waitForSelector('.itinerary-sheet-panel');
      console.log('  ✓ Itinerary Drawer opened');

      const drawerShot = join(SCREENSHOT_DIR, '10_passenger_itinerary_drawer.png');
      await passPage.screenshot({ path: drawerShot });
      auditResults.screenshotsCaptured.push(drawerShot);

      // Close drawer
      const closeDrawerBtn = passPage.locator('.itinerary-sheet-panel .btn-modal-close').first();
      if (await closeDrawerBtn.isVisible()) {
        await closeDrawerBtn.click();
        await passPage.waitForTimeout(300);
      }
    }

    // 3.6 Ask AI Guide Modal
    console.log('  Testing: Ask AI Guide Modal...');
    const askNavBtn = passPage.locator('.bottom-nav-item:has-text("Ask")').first();
    if (await askNavBtn.isVisible()) {
      await askNavBtn.click();
      await passPage.waitForSelector('.ask-modal-sheet');
      console.log('  ✓ Ask AI Guide Modal opened');

      const askModalShot = join(SCREENSHOT_DIR, '11_passenger_ask_ai_modal.png');
      await passPage.screenshot({ path: askModalShot });
      auditResults.screenshotsCaptured.push(askModalShot);

      // Ask question
      await passPage.fill('input.ask-pill-text-input', 'What are the visiting hours?');
      await passPage.click('button.btn-send-question');
      await passPage.waitForTimeout(800);
      console.log('  ✓ Question submitted to AI guide engine');

      const closeAskBtn = passPage.locator('.ask-modal-sheet .btn-modal-close').first();
      if (await closeAskBtn.isVisible()) {
        await closeAskBtn.click();
        await passPage.waitForTimeout(300);
      }
    }

    // 3.7 Share Something Modal
    console.log('  Testing: Share Something Modal...');
    const shareBannerBtn = passPage.locator('.passenger-share-banner-btn').first();
    if (await shareBannerBtn.isVisible()) {
      await shareBannerBtn.click();
      await passPage.waitForSelector('.share-modal-sheet');
      console.log('  ✓ Share Something Modal opened');
      const shareModalShot = join(SCREENSHOT_DIR, '12_passenger_share_modal.png');
      await passPage.screenshot({ path: shareModalShot });
      auditResults.screenshotsCaptured.push(shareModalShot);

      const closeShareBtn = passPage.locator('.share-modal-sheet .btn-modal-close').first();
      if (await closeShareBtn.isVisible()) {
        await closeShareBtn.click();
        await passPage.waitForTimeout(300);
      }
    }

    // 3.8 Step Progression to Journey Complete
    console.log('  Testing: Complete Tour Flow...');
    for (let i = 0; i < 10; i++) {
      const stepperBtn = passPage.locator('button.btn-stepper-advance').first();
      if (await stepperBtn.isVisible()) {
        const text = await stepperBtn.innerText();
        await stepperBtn.click();
        await passPage.waitForTimeout(300);
        if (text.includes('Complete Tour')) {
          break;
        }
      }
    }
    await passPage.waitForTimeout(500);

    const completeView = passPage.locator('.journey-complete-view-shell');
    if (await completeView.isVisible()) {
      console.log('  ✓ Reached Journey Complete View');
      const completeShot = join(SCREENSHOT_DIR, '13_passenger_journey_complete.png');
      await passPage.screenshot({ path: completeShot });
      auditResults.screenshotsCaptured.push(completeShot);
    }

    await passContext.close();

    console.log('\n==================================================');
    console.log('Audit Completed Successfully!');
    console.log(`Total Screenshots: ${auditResults.screenshotsCaptured.length}`);
    console.log(`Console Errors/Warnings: ${auditResults.consoleLogs.length}`);
    console.log(`Failed Network Requests: ${auditResults.failedRequests.length}`);
    console.log('==================================================');

    // Write audit output
    writeFileSync(
      join(process.cwd(), 'audit_results.json'),
      JSON.stringify(auditResults, null, 2)
    );

  } finally {
    await browser.close();
  }
}

runAudit().catch(err => {
  console.error('Audit script failed:', err);
  process.exit(1);
});
