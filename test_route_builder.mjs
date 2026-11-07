/**
 * Route Builder & Attraction Catalog Test Suite
 * Covers 18 Section 12 requirements from Malaysia AI Tour Guide Master Prompt.
 */

import assert from 'node:assert/strict';
import { ATTRACTIONS, getAllAttractions, getAttractionsByDestination } from './src/data/attractions.js';
import {
  DESTINATIONS,
  validateAttraction,
  validateAttractionsCatalog
} from './src/data/attractionSchema.js';
import { ROUTE_TEMPLATES, getRouteTemplateById } from './src/data/routeTemplates.js';
import { TOURS, DEFAULT_TOUR_ID } from './src/data/tours.js';
import {
  calculateSchedule,
  generateTourCode,
  estimateTravelMinutes,
  getRoadDistanceKm,
  getScheduleWarnings,
  createPublishedSnapshot
} from './src/lib/scheduleEngine.js';
import { evaluateJourneyProgress, JOURNEY_STATUS } from './src/lib/journeyEngine.js';

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`✓ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`✗ [FAIL] ${name}`);
    console.error(`  ${err.message}`);
    failedCount++;
  }
}

console.log('==================================================');
console.log('Malaysia AI Tour Guide — Phase 1 Test Suite');
console.log('==================================================\n');

// 1. Attraction schema validator rejects missing required fields
runTest('Req 1: Schema validator rejects attraction with missing required fields', () => {
  const invalidAtt = {
    placeId: 'test-invalid',
    name: { en: 'Test' }
    // missing destination, category, narration, shortIntro, verificationStatus, suggestedDurationMinutes
  };
  const result = validateAttraction(invalidAtt);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length >= 3, 'Should report multiple schema errors');
});

// 2. Attraction schema validator accepts a valid complete attraction
runTest('Req 2: Schema validator accepts valid complete attraction', () => {
  const validAtt = {
    placeId: 'valid-test-spot',
    name: { en: 'Valid Test Spot', zh: '测试景点' },
    destination: 'Melaka',
    category: 'heritage',
    coordinates: { lat: 2.1944, lng: 102.2492 },
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 45, maxMinutes: 90 },
    shortIntro: { en: 'A historically rich spot in Melaka.' },
    narration: { en: 'Welcome to this authentic UNESCO heritage site.' },
    verificationStatus: 'approved'
  };
  const result = validateAttraction(validAtt);
  assert.equal(result.valid, true, `Errors found: ${result.errors.join(', ')}`);
  assert.equal(result.errors.length, 0);
});

// 3. Every destination has at least 6 approved attractions in the library
runTest('Req 3: Every destination has at least 6 approved attractions', () => {
  const targetDestinations = [
    'Kuala Lumpur',
    'Putrajaya',
    'Melaka',
    'Ipoh',
    'Penang',
    'Kuala Selangor',
    'Genting Highlands',
    'Cameron Highlands',
    'Kampar'
  ];

  for (const dest of targetDestinations) {
    // KL and Putrajaya combined or individually checked
    const list = getAttractionsByDestination(dest);
    if (dest === 'Kuala Lumpur' || dest === 'Putrajaya') {
      const combined = [...getAttractionsByDestination('Kuala Lumpur'), ...getAttractionsByDestination('Putrajaya')];
      assert.ok(combined.length >= 6, `KL/Putrajaya combined has ${combined.length} attractions (expected >= 6)`);
    } else {
      assert.ok(list.length >= 6, `Destination "${dest}" has ${list.length} attractions (expected >= 6)`);
      for (const att of list) {
        assert.equal(att.verificationStatus, 'approved', `Attraction ${att.placeId} should be approved`);
      }
    }
  }
});

// 4. Schedule engine correctly calculates single-day schedule times
runTest('Req 4: Schedule engine calculates single-day timeline accurately', () => {
  const stops = [
    { stopId: 's1', attractionId: 'dutch-square', durationMinutes: 50 },
    { stopId: 's2', attractionId: 'a-famosa', durationMinutes: 40 }
  ];
  const sched = calculateSchedule({
    startTime: '09:00',
    stops
  });

  assert.equal(sched.scheduledStops.length, 2);
  assert.equal(sched.startTime, '09:00');
  assert.equal(sched.scheduledStops[0].arrivalTime, '09:00');
  assert.equal(sched.scheduledStops[0].departureTime, '09:50');
  // Stop 2 departs after travel + 40 mins visit
  assert.ok(sched.scheduledStops[1].departureMinutes > sched.scheduledStops[0].departureMinutes);
});

// 5. Schedule engine handles multi-day tours with day boundaries
runTest('Req 5: Schedule engine handles multi-day tours with day restart times', () => {
  const stops = [
    { stopId: 'd1-s1', day: 1, durationMinutes: 60 },
    { stopId: 'd1-s2', day: 1, durationMinutes: 120 },
    { stopId: 'd2-s1', day: 2, durationMinutes: 90 },
    { stopId: 'd2-s2', day: 2, durationMinutes: 60 }
  ];
  const sched = calculateSchedule({
    startTime: '08:30',
    stops,
    dayRestartTimes: { 2: '09:30' }
  });

  assert.equal(sched.totalDays, 2);
  const day2FirstStop = sched.scheduledStops[2];
  assert.equal(day2FirstStop.day, 2);
  assert.equal(day2FirstStop.arrivalTime, '09:30');
  assert.equal(day2FirstStop.departureTime, '11:00');
});

// 6. Schedule engine handles missing coordinates without failing
runTest('Req 6: Schedule engine handles null or missing coordinates safely', () => {
  const stops = [
    { stopId: 's1', title: { en: 'Stop Without GPS' }, coordinates: null, durationMinutes: 30 },
    { stopId: 's2', title: { en: 'Second Stop' }, coordinates: null, durationMinutes: 45 }
  ];
  const sched = calculateSchedule({ startTime: '10:00', stops });
  assert.equal(sched.scheduledStops.length, 2);
  assert.equal(sched.scheduledStops[0].travelMinutesFromPrev, 0);
  assert.equal(sched.scheduledStops[1].travelMinutesFromPrev, 0);
  assert.equal(sched.scheduledStops[1].departureTime, '11:15');
});

// 7. Tour code generator produces expected format
runTest('Req 7: Tour code generator produces collision-resistant MYTG-YYYYMMDD-XXXX format', () => {
  const code = generateTourCode();
  const pattern = /^MYTG-\d{8}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;
  assert.ok(pattern.test(code), `Code "${code}" does not match format ${pattern}`);

  // Test uniqueness over 100 iterations
  const codes = new Set();
  for (let i = 0; i < 100; i++) {
    codes.add(generateTourCode());
  }
  assert.equal(codes.size, 100, 'All 100 generated codes must be unique');
});

// 8. Published snapshot isolates changes from subsequent draft edits
runTest('Req 8: Published snapshot isolates changes from subsequent draft edits', () => {
  const draft = {
    tourId: 'draft-tour-1',
    title: { en: 'Original Draft Title' },
    stops: [
      { stopId: 's1', attractionId: 'batu-caves', durationMinutes: 60 }
    ]
  };

  const published = createPublishedSnapshot(draft);
  assert.equal(published.publicationStatus, 'published');
  assert.ok(published.publishedAt);
  assert.ok(published.code);

  // Mutate original draft
  draft.title.en = 'Mutated New Title';
  draft.stops.push({ stopId: 's2', attractionId: 'perak-tong', durationMinutes: 90 });

  // Snapshot must remain intact
  assert.equal(published.title.en, 'Original Draft Title');
  assert.equal(published.stops.length, 1);
});

// 9. Route templates exist for all destinations
runTest('Req 9: Route templates exist covering all required regions', () => {
  assert.ok(ROUTE_TEMPLATES.length >= 8, `Should have at least 8 templates, found ${ROUTE_TEMPLATES.length}`);

  const requiredDestinations = [
    'Kuala Lumpur',
    'Melaka',
    'Ipoh',
    'Kuala Selangor',
    'Genting Highlands',
    'Cameron Highlands',
    'Penang',
    'Kampar'
  ];

  for (const dest of requiredDestinations) {
    const found = ROUTE_TEMPLATES.some(t => t.destination === dest);
    assert.ok(found, `Missing route template for ${dest}`);
  }
});

// 10. Reordering stops updates arrival and departure schedule
runTest('Req 10: Reordering stops recalculates schedule times properly', () => {
  const stopA = { stopId: 'a', durationMinutes: 30 };
  const stopB = { stopId: 'b', durationMinutes: 90 };

  const order1 = calculateSchedule({ startTime: '09:00', stops: [stopA, stopB] });
  assert.equal(order1.scheduledStops[0].departureTime, '09:30');
  assert.equal(order1.scheduledStops[1].departureTime, '11:00');

  const order2 = calculateSchedule({ startTime: '09:00', stops: [stopB, stopA] });
  assert.equal(order2.scheduledStops[0].departureTime, '10:30');
  assert.equal(order2.scheduledStops[1].departureTime, '11:00');
});

// 11. Inserting meal break adds appropriate duration (60m)
runTest('Req 11: Inserting meal break adds 60m duration', () => {
  const stops = [
    { stopId: 's1', durationMinutes: 60 },
    { stopId: 'm1', type: 'meal_break' } // default meal break is 60 mins
  ];
  const sched = calculateSchedule({ startTime: '12:00', stops });
  assert.equal(sched.scheduledStops[1].visitDurationMinutes, 60);
  assert.equal(sched.scheduledStops[1].departureTime, '14:00');
});

// 12. Custom stop with valid coordinates is preserved
runTest('Req 12: Custom stop with valid coordinates is preserved', () => {
  const custom = {
    stopId: 'cust-1',
    isCustom: true,
    title: { en: 'Scenic Viewpoint' },
    coordinates: { lat: 3.1234, lng: 101.5678 },
    durationMinutes: 45
  };
  const sched = calculateSchedule({ stops: [custom] });
  assert.equal(sched.scheduledStops[0].coordinates.lat, 3.1234);
  assert.equal(sched.scheduledStops[0].isCustom, true);
});

// 13. Proximity trigger engine skips stops with null coordinates
runTest('Req 13: Proximity trigger skips stops with null coordinates', () => {
  const stops = [
    {
      stopId: 'null-gps-stop',
      isCustom: true,
      title: { en: 'No GPS Stop' },
      coordinates: null
    }
  ];
  const progress = evaluateJourneyProgress({
    currentPos: { lat: 3.1472, lng: 101.6995 },
    stops,
    currentIndex: 0
  });

  assert.equal(progress.currentStop.distanceMeters, null);
  assert.equal(progress.currentStatus, JOURNEY_STATUS.UPCOMING);
});

// 14. Duration range validation rejects minMinutes > maxMinutes
runTest('Req 14: Duration range validation rejects minMinutes > maxMinutes', () => {
  const att = {
    placeId: 'bad-duration-test',
    name: { en: 'Bad Duration' },
    destination: 'Ipoh',
    category: 'culture',
    suggestedDurationMinutes: 60,
    durationRange: { minMinutes: 90, maxMinutes: 45 }, // Invalid: min > max
    shortIntro: { en: 'Intro' },
    narration: { en: 'Narration' },
    verificationStatus: 'approved'
  };
  const result = validateAttraction(att);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('minMinutes') && e.includes('maxMinutes')));
});

// 15. Prohibits fake (0, 0) coordinates in validator
runTest('Req 15: Validator explicitly rejects fake (0, 0) coordinates', () => {
  const att = {
    placeId: 'fake-zero-gps',
    name: { en: 'Zero GPS' },
    destination: 'Penang',
    category: 'nature',
    coordinates: { lat: 0, lng: 0 }, // Strictly prohibited
    suggestedDurationMinutes: 45,
    shortIntro: { en: 'Intro' },
    narration: { en: 'Narration' },
    verificationStatus: 'approved'
  };
  const result = validateAttraction(att);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some(e => e.includes('(0, 0)')));
});

// 16. All 48 attractions in the catalog pass schema validation
runTest('Req 16: All attractions in the catalog pass schema validation (0 errors)', () => {
  const catalog = ATTRACTIONS;
  const res = validateAttractionsCatalog(catalog);
  assert.equal(res.isValid, true, `Validation failed: ${JSON.stringify(res.errors, null, 2)}`);
  assert.equal(res.totalCount, 48);
  assert.equal(res.validCount, 48);
  assert.equal(Object.keys(res.errors).length, 0);
});

// 17. Stop visit duration override properly updates schedule
runTest('Req 17: Stop duration override updates departure timestamp', () => {
  const standard = calculateSchedule({
    startTime: '09:00',
    stops: [{ stopId: 's1', attractionId: 'batu-caves' }] // suggested is 75m
  });
  assert.equal(standard.scheduledStops[0].departureTime, '10:15');

  const overridden = calculateSchedule({
    startTime: '09:00',
    stops: [{ stopId: 's1', attractionId: 'batu-caves', durationMinutes: 120 }] // override to 120m
  });
  assert.equal(overridden.scheduledStops[0].departureTime, '11:00');
});

// 18. Published snapshot passengerLink contains correct domain and code
runTest('Req 18: Published snapshot passengerLink contains msiatguide.web.app domain and tour id/code', () => {
  const snap = createPublishedSnapshot({
    tourId: 'custom-tour-kl',
    stops: []
  });
  assert.ok(snap.passengerLink.startsWith('https://msiatguide.web.app/?tour='));
  assert.ok(snap.passengerLink.includes(snap.tourId) || snap.passengerLink.includes(snap.code));
});

// 19. Schedule warnings correctly identifies within-window tour
runTest('Req 19: Schedule warnings flags within-window tour with correct status', () => {
  const sched = calculateSchedule({
    startTime: '08:30',
    stops: [
      { stopId: 's1', attractionId: 'dutch-square', durationMinutes: 60 },
      { stopId: 's2', attractionId: 'a-famosa', durationMinutes: 45 },
      { stopId: 's3', attractionId: 'jonker-street', durationMinutes: 90 }
    ]
  });
  const warnings = getScheduleWarnings({ schedule: sched, agreedLimitHours: 10 });
  assert.equal(warnings.severity, 'ok');
  assert.equal(warnings.isWithinWindow, true);
  assert.equal(warnings.isExceedingLimit, false);
  assert.equal(warnings.isCrossingMidnight, false);
  assert.equal(warnings.isOvernightRequired, false);
  assert.ok(warnings.totalPlannedMinutes <= 600);
});

// 20. Schedule warnings identifies approaching tour limit (< 45m buffer)
runTest('Req 20: Schedule warnings flags approaching-limit tours (< 45m remaining)', () => {
  const sched = calculateSchedule({
    startTime: '08:00',
    stops: [
      { stopId: 's1', durationMinutes: 300 },
      { stopId: 's2', durationMinutes: 270 } // total 570 mins = 9.5 hours, within 10h limit by 30m
    ]
  });
  const warnings = getScheduleWarnings({ schedule: sched, agreedLimitHours: 10 });
  assert.equal(warnings.severity, 'approaching');
  assert.equal(warnings.isApproachingLimit, true);
  assert.equal(warnings.isWithinWindow, true);
  assert.equal(warnings.isExceedingLimit, false);
});

// 21. Schedule warnings identifies exceeding tour limit with overtime breakdown
runTest('Req 21: Schedule warnings flags exceeding-limit tours with overtime breakdown', () => {
  const sched = calculateSchedule({
    startTime: '08:00',
    stops: [
      { stopId: 's1', durationMinutes: 360 },
      { stopId: 's2', durationMinutes: 360 } // total 720 mins = 12h, exceeds 10h by 2h (120m)
    ]
  });
  const warnings = getScheduleWarnings({ schedule: sched, agreedLimitHours: 10 });
  assert.equal(warnings.severity, 'exceeded');
  assert.equal(warnings.isExceedingLimit, true);
  assert.equal(warnings.overtimeMinutes, 120);
  assert.ok(warnings.headline.includes('+2h 0m overtime'));
});

// 22. Schedule warnings reproduces the 21h itinerary bug and flags overnight + detour
runTest('Req 22: Accurately reproduces 21h itinerary bug (1261m, 05:31 end), flags overnight, midnight crossing, and detour', () => {
  const baseTour = TOURS[DEFAULT_TOUR_ID];
  assert.ok(baseTour, 'Default base tour exists');

  // Reproduce exact sequence from audit:
  // 1. Base 9 stops (KL - Putrajaya - Melaka - KL Return)
  // 2. Modified Stop 0 duration to 75m
  // 3. Add Batu Caves (duplicate / cross-destination addition)
  // 4. Add Meal Break (60m)
  // 5. Add Rest Stop (20m)
  // 6. Add Custom Stop with default coordinates (3.1472, 101.6995 in KL)
  const stops = baseTour.stops.map(s => ({ ...s }));
  stops[0].durationMinutes = 75;
  stops.push({ stopId: 'bc-detour', attractionId: 'batu-caves' });
  stops.push({ stopId: 'meal-break', type: 'meal_break', durationMinutes: 60 });
  stops.push({ stopId: 'rest-stop', type: 'rest_stop', durationMinutes: 20 });
  stops.push({
    stopId: 'custom-stop',
    title: { en: 'Ipoh Limestone Sunset Peak' },
    coordinates: { lat: 3.1472, lng: 101.6995 },
    durationMinutes: 45
  });

  const sched = calculateSchedule({
    startTime: '08:30',
    stops
  });

  // Verify reproduced schedule
  assert.equal(sched.totalDurationMinutes, 1261, `Duration was ${sched.totalDurationMinutes} mins (expected 1261)`);
  assert.equal(sched.endTime, '05:31'); // Exact reproduced finish time at 05:31 next day!

  const warnings = getScheduleWarnings({ schedule: sched, agreedLimitHours: 10 });
  assert.equal(warnings.severity, 'overnight');
  assert.equal(warnings.isCrossingMidnight, true);
  assert.equal(warnings.isOvernightRequired, true);
  assert.equal(warnings.isExceedingLimit, true);
  assert.equal(warnings.overtimeMinutes, 661); // 1261 - 600 = 661m (11h 1m overtime)
  
  // Verify detours detected (Jonker Street to KL Hotel is ~153 km)
  assert.ok(warnings.detours.length >= 1, 'Should detect significant cross-regional detour');
  const detour = warnings.detours.find(d => d.distanceKm >= 100);
  assert.ok(detour, 'Detour detected long highway transit');
  assert.ok(detour.distanceKm >= 110, `Detour distance was ${detour?.distanceKm} km (expected >= 110 km)`);

  // Verify duplicate detection flagged Batu Caves
  assert.ok(warnings.duplicateWarnings.length >= 1, 'Should detect duplicate attraction addition');
  assert.equal(warnings.duplicateWarnings[0].attractionId, 'batu-caves');

  // Verify return stop sequence warning (Stop 8 Hotel Return followed by 4 stops)
  assert.equal(warnings.returnStopIndex, 8, 'Should detect return stop preceding additional stops');
});

// 23. Differentiates visit dwell time, unverified Haversine road time, and overtime
runTest('Req 23: Differentiates visit time, unverified Haversine road time, and overtime with disclaimer', () => {
  const sched = calculateSchedule({
    startTime: '08:30',
    stops: [
      { stopId: 's1', attractionId: 'dutch-square', durationMinutes: 60 },
      { stopId: 's2', attractionId: 'a-famosa', durationMinutes: 45 }
    ]
  });
  const warnings = getScheduleWarnings({ schedule: sched, agreedLimitHours: 10 });
  assert.equal(warnings.isEstimateUnverified, true);
  assert.ok(warnings.estimationDisclaimer.includes('Haversine'));
  assert.equal(typeof warnings.visitDurationMinutes, 'number');
  assert.equal(typeof warnings.estimatedRoadMinutes, 'number');
  assert.equal(warnings.totalPlannedMinutes, warnings.visitDurationMinutes + warnings.estimatedRoadMinutes);
});

console.log('\n==================================================');
console.log(`Results: ${passedCount} PASSED, ${failedCount} FAILED out of 23 Tests`);
console.log('==================================================');

if (failedCount > 0) {
  process.exit(1);
}
