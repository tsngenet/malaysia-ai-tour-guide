/** Convert a frozen POI snapshot into a tour stop. Unreviewed POIs expose only their name to passengers. */
export function stopFromSnapshot(snap) {
  const approved = snap.sourceStatus === 'approved';
  const text = approved ? snap.summary : { en: '', zh: '' };
  return {
    stopId: `poi-${snap.poiId}-${Date.now().toString(36)}`,
    isCustom: true,
    poiRef: snap,
    title: { en: snap.name.en || snap.label, zh: snap.name.zh || snap.name.en || snap.label },
    coordinates: snap.coordinates || undefined,
    triggerRadiusMeters: 500,
    durationMinutes: snap.durationMinutes ?? 60,
    customNarration: { en: text.en || '', zh: text.zh || '' }
  };
}
