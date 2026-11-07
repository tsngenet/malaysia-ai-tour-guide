/**
 * Attraction Schema & Validation Utility
 *
 * Enforces data integrity across the Malaysia AI Tour Guide Attraction Library.
 * Reusable data record, independent of any particular tour.
 */

export const DESTINATIONS = [
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

export const ATTRACTION_CATEGORIES = [
  'heritage',
  'culture',
  'nature',
  'culinary',
  'viewpoint',
  'activity',
  'shopping',
  'museum'
];

export const VERIFICATION_STATUSES = [
  'approved',
  'pending_review',
  'draft',
  'rejected'
];

/**
 * Validates a single attraction object against the schema.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateAttraction(attraction) {
  const errors = [];

  if (!attraction || typeof attraction !== 'object') {
    return { valid: false, errors: ['Attraction must be an object'] };
  }

  // 1. placeId
  if (!attraction.placeId || typeof attraction.placeId !== 'string' || !/^[a-z0-9-]+$/.test(attraction.placeId)) {
    errors.push(`Invalid or missing placeId: "${attraction.placeId}". Must be kebab-case.`);
  }

  // 2. name (multilingual with at least English)
  if (!attraction.name || typeof attraction.name !== 'object' || !attraction.name.en) {
    errors.push(`Missing or invalid name for "${attraction.placeId}". English name is mandatory.`);
  }

  // 3. destination
  if (!attraction.destination || !DESTINATIONS.includes(attraction.destination)) {
    errors.push(`Invalid destination "${attraction.destination}" for "${attraction.placeId}". Must be one of: ${DESTINATIONS.join(', ')}`);
  }

  // 4. category
  if (!attraction.category || !ATTRACTION_CATEGORIES.includes(attraction.category)) {
    errors.push(`Invalid category "${attraction.category}" for "${attraction.placeId}". Must be one of: ${ATTRACTION_CATEGORIES.join(', ')}`);
  }

  // 5. coordinates (must be null or valid non-zero latitude & longitude)
  if (attraction.coordinates !== null && attraction.coordinates !== undefined) {
    const { lat, lng } = attraction.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      errors.push(`Coordinates for "${attraction.placeId}" must contain numeric lat and lng, or be null.`);
    } else if (lat === 0 && lng === 0) {
      errors.push(`Fake coordinates (0, 0) prohibited for "${attraction.placeId}". Use null when unverified.`);
    } else if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push(`Coordinates out of bounds for "${attraction.placeId}": lat ${lat}, lng ${lng}.`);
    }
  }

  // 6. suggestedDurationMinutes
  if (typeof attraction.suggestedDurationMinutes !== 'number' || attraction.suggestedDurationMinutes <= 0) {
    errors.push(`suggestedDurationMinutes must be a positive number for "${attraction.placeId}".`);
  }

  // 7. durationRange (optional, but if present must be valid)
  if (attraction.durationRange) {
    const { minMinutes, maxMinutes } = attraction.durationRange;
    if (typeof minMinutes === 'number' && typeof maxMinutes === 'number') {
      if (minMinutes > maxMinutes) {
        errors.push(`minMinutes (${minMinutes}) cannot exceed maxMinutes (${maxMinutes}) for "${attraction.placeId}".`);
      }
    }
  }

  // 8. shortIntro & narration
  if (!attraction.shortIntro || typeof attraction.shortIntro !== 'object' || !attraction.shortIntro.en) {
    errors.push(`Missing shortIntro with English fallback for "${attraction.placeId}".`);
  }
  if (!attraction.narration || typeof attraction.narration !== 'object' || !attraction.narration.en) {
    errors.push(`Missing narration with English fallback for "${attraction.placeId}".`);
  }

  // 9. verificationStatus
  if (!attraction.verificationStatus || !VERIFICATION_STATUSES.includes(attraction.verificationStatus)) {
    errors.push(`Invalid verificationStatus for "${attraction.placeId}". Must be one of: ${VERIFICATION_STATUSES.join(', ')}`);
  }

  // 10. heroVisual
  if (attraction.heroVisual) {
    if (!['photo', 'aerial', 'satellite'].includes(attraction.heroVisual.type)) {
      errors.push(`Invalid heroVisual type "${attraction.heroVisual.type}" for "${attraction.placeId}".`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates an entire collection/map of attractions.
 * Throws or returns summary of validation.
 */
export function validateAttractionsCatalog(attractionsMap) {
  const allErrors = {};
  const seenIds = new Set();
  let validCount = 0;

  for (const [key, attraction] of Object.entries(attractionsMap)) {
    if (seenIds.has(key)) {
      allErrors[key] = [`Duplicate key in catalog: "${key}"`];
      continue;
    }
    seenIds.add(key);

    if (key !== attraction.placeId) {
      allErrors[key] = [`Map key "${key}" does not match placeId "${attraction.placeId}"`];
      continue;
    }

    const { valid, errors } = validateAttraction(attraction);
    if (!valid) {
      allErrors[key] = errors;
    } else {
      validCount++;
    }
  }

  return {
    isValid: Object.keys(allErrors).length === 0,
    totalCount: Object.keys(attractionsMap).length,
    validCount,
    errors: allErrors
  };
}
