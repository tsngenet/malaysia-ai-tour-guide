/** Convert a frozen POI snapshot into a tour stop. Unreviewed POIs expose only their name to passengers. */
export function stopFromSnapshot(snap, day = 1) {
  const approved = snap.sourceStatus === 'approved';
  const summary = approved ? snap.summary : { en: '', zh: '' };
  return {
    stopId: `poi-${snap.poiId}-${Date.now().toString(36)}`,
    isCustom: true,
    poiRef: { ...snap, summary },
    title: { en: snap.name.en || snap.label, zh: snap.name.zh || snap.name.en || snap.label },
    coordinates: snap.coordinates || undefined,
    triggerRadiusMeters: 500,
    durationMinutes: snap.durationMinutes ?? 60,
    day,
    customNarration: { en: summary.en || '', zh: summary.zh || '' }
  };
}
