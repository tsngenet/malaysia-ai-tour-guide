import test from 'node:test';
import assert from 'node:assert/strict';
import { stopFromSnapshot } from '../src/poi/stopFromPoi.js';
import { serializeTourStops } from '../src/lib/tourSerialization.js';

const snap = (o = {}) => ({ poiId: 'poi_1', poiVersion: 3, name: { en: 'Batu Caves', zh: '黑风洞' }, label: 'Batu Caves', coordinates: null, durationMinutes: 90, summary: { en: 'Draft text', zh: '草稿' }, sourceStatus: 'needs_review', ...o });

test('unreviewed POI stop carries no summary text anywhere (not even in poiRef)', () => {
  const s = stopFromSnapshot(snap());
  assert.equal(s.customNarration.en, '');
  assert.ok(!JSON.stringify(s).includes('Draft text'));
  assert.equal(s.coordinates, undefined);
});
test('approved POI stop exposes the approved summary; Chinese survives; snapshot is frozen with version', () => {
  const s = stopFromSnapshot(snap({ sourceStatus: 'approved' }), 2);
  assert.equal(s.customNarration.zh, '草稿');
  assert.equal(s.title.zh, '黑风洞');
  assert.equal(s.poiRef.poiVersion, 3);
  assert.equal(s.day, 2);
});
test('poiRef and duration survive cloud serialisation used for drafts', () => {
  const out = serializeTourStops([stopFromSnapshot(snap())]);
  assert.equal(out[0].poiRef.poiId, 'poi_1');
  assert.equal(out[0].durationMinutes, 90);
});
