/**
 * A custom stop may be saved without coordinates. If coordinates are provided,
 * both must describe one plausible Earth location; never guess.
 */
export function parseOptionalCoordinates(latitudeInput, longitudeInput) {
  const latText = String(latitudeInput ?? '').trim();
  const lngText = String(longitudeInput ?? '').trim();
  if (!latText && !lngText) return { valid: true, coordinates: null };
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!latText || !lngText || !Number.isFinite(lat) || !Number.isFinite(lng) ||
      lat < -90 || lat > 90 || lng < -180 || lng > 180 ||
      (lat === 0 && lng === 0)) {
    return { valid: false, coordinates: null };
  }
  return { valid: true, coordinates: { lat, lng } };
}

/**
 * Preserve driver-entered stop fields across cloud round-trips.
 * Unverified location stays absent; no coordinates or narration are fabricated.
 */
export function serializeTourStops(stops = []) {
  const fields = [
    'isCustom', 'attractionId', 'title', 'type', 'coordinates',
    'plannedArrival', 'plannedDeparture', 'travelTimeToNextMinutes',
    'manualTravelMinutes', 'triggerRadiusMeters', 'day', 'customNarration',
    'heroVisual', 'stopIndex', 'travelMinutesFromPrev', 'isTravelEstimated',
    'arrivalMinutes', 'arrivalTime', 'visitDurationMinutes',
    'departureMinutes', 'departureTime', 'notes'
  ];
  return stops.map((s, index) => {
    const result = {
      stopId: String(s.stopId || `stop-${index + 1}`),
      durationMinutes: Number(s.durationMinutes) || 30
    };
    for (const field of fields) {
      if (s[field] !== undefined && s[field] !== null) result[field] = s[field];
    }
    return result;
  });
}
