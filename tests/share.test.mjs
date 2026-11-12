import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeTour, decodeTour, compactTour } from '../src/data/shareCodec.js';
import { stopFromSnapshot } from '../src/components/OperatorTourBuilderStop.js';

const snap = (over = {}) => ({
  poiId: 'poi_1', poiVersion: 3, name: { en: 'Batu Caves', zh: '黑风洞' }, label: 'Batu Caves', state: 'Selangor', city: '',
  coordinates: null, durationMinutes: 90, summary: { en: 'Secret unreviewed text', zh: '未审核' }, sourceStatus: 'needs_review', snapshotAt: 'T', ...over
});

test('share link round-trips Chinese text and durations; contains no private fields', async () => {
  const tour = {
    tourId: 't1', code: 'MYTG-1', title: { en: 'Day', zh: '一日游' },
    stops: [stopFromSnapshot(snap()), { stopId: 'a', attractionId: 'batu-caves', triggerRadiusMeters: 600, durationMinutes: 45 }],
    commission: '15%', privateNotes: 'x'
  };
  const { payload } = await encodeTour(tour);
  const back = await decodeTour(payload);
  assert.equal(back.title.zh, '一日游');
  assert.equal(back.stops[0].title.zh, '黑风洞');
  assert.equal(back.stops[0].durationMinutes, 90);
  assert.equal(back.stops[1].attractionId, 'batu-caves');
  const json = JSON.stringify(compactTour(tour)) + JSON.stringify(back);
  assert.ok(!/commission|privateNotes|15%/.test(json));
});

test('unreviewed POI exposes only its name to passengers; approved POI exposes summary', () => {
  assert.equal(stopFromSnapshot(snap()).customNarration.en, '');
  assert.equal(stopFromSnapshot(snap({ sourceStatus: 'approved' })).customNarration.en, 'Secret unreviewed text');
});

test('a damaged share payload is rejected', async () => {
  await assert.rejects(() => decodeTour('not-a-valid-payload'));
});

test('snapshot stays frozen inside the stop after the master POI changes', () => {
  const s = stopFromSnapshot(snap());
  assert.equal(s.poiRef.name.en, 'Batu Caves');
  assert.equal(s.poiRef.poiVersion, 3);
});
