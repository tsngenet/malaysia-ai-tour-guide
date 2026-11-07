/**
 * Journey State Engine
 * Manages journey progression along ordered stops:
 * UPCOMING -> APPROACHING -> HERE -> VISITED -> NEXT
 *
 * Uses local Haversine calculations without continuous external API calls.
 * Trigger radii are configurable per stop/attraction.
 */

import { distanceMetres } from './distance.js';
import { ATTRACTIONS } from '../data/attractions.js';

export const JOURNEY_STATUS = {
  UPCOMING: 'UPCOMING',
  APPROACHING: 'APPROACHING',
  HERE: 'HERE',
  VISITED: 'VISITED',
  COMPLETED: 'COMPLETED'
};

/**
 * Resolves stop details combining custom tour stop data with the Attraction Library
 */
export function resolveStopDetails(stop, lang = 'en') {
  if (!stop) return null;

  const attraction = stop.attractionId ? ATTRACTIONS[stop.attractionId] : null;

  if (stop.isCustom || !stop.attractionId) {
    return {
      stopId: stop.stopId,
      isCustom: true,
      placeId: null,
      name: stop.title?.[lang] || stop.title?.en || (attraction ? (attraction.name?.[lang] || attraction.name?.en) : 'Tour Stop'),
      coordinates: stop.coordinates || (attraction ? attraction.coordinates : null),
      triggerRadiusMeters: stop.triggerRadiusMeters || (attraction ? attraction.triggerRadiusMeters : 500),
      shortIntro: stop.customNarration?.[lang] || stop.customNarration?.en || '',
      narration: stop.customNarration?.[lang] || stop.customNarration?.en || '',
      interestingFacts: [],
      facilities: null,
      sourceReferences: [],
      heroVisual: stop.heroVisual || null
    };
  }

  if (!attraction) {
    return {
      stopId: stop.stopId,
      isCustom: false,
      placeId: stop.attractionId,
      name: stop.title?.[lang] || stop.title?.en || ('Stop ' + stop.stopId),
      coordinates: stop.coordinates || null,
      triggerRadiusMeters: stop.triggerRadiusMeters || 500,
      shortIntro: '',
      narration: '',
      interestingFacts: [],
      facilities: null,
      sourceReferences: []
    };
  }

  return {
    stopId: stop.stopId,
    isCustom: false,
    placeId: attraction.placeId,
    name: attraction.name?.[lang] || attraction.name?.en || attraction.placeId,
    coordinates: attraction.coordinates,
    triggerRadiusMeters: stop.triggerRadiusMeters || attraction.triggerRadiusMeters || 500,
    shortIntro: attraction.shortIntro?.[lang] || attraction.shortIntro?.en || '',
    narration: attraction.narration?.[lang] || attraction.narration?.en || '',
    interestingFacts: (attraction.interestingFacts || []).map(f => f[lang] || f.en),
    facilities: attraction.facilities,
    sourceReferences: attraction.sourceReferences || [],
    lastVerified: attraction.lastVerified,
    heroVisual: attraction.heroVisual || null
  };
}

/**
 * Calculates current stop status and distances for the active tour.
 * Given GPS position (lat, lng), stops array, currentIndex, and visitedStopIds set.
 */
export function evaluateJourneyProgress({ currentPos, stops, currentIndex = 0, visitedIds = new Set(), lang = 'en' }) {
  if (!stops || stops.length === 0) {
    return {
      currentStop: null,
      currentStatus: JOURNEY_STATUS.COMPLETED,
      distanceMeters: null,
      nextStop: null,
      allStopsWithState: []
    };
  }

  // Build resolved stops with coordinates & distances
  const resolvedList = stops.map((stop, idx) => {
    const details = resolveStopDetails(stop, lang);
    let distance = null;
    if (
      currentPos &&
      details.coordinates &&
      typeof details.coordinates.lat === 'number' &&
      typeof details.coordinates.lng === 'number' &&
      !(details.coordinates.lat === 0 && details.coordinates.lng === 0)
    ) {
      distance = distanceMetres(
        currentPos.lat,
        currentPos.lng,
        details.coordinates.lat,
        details.coordinates.lng
      );
    }
    const isVisited = visitedIds.has(details.stopId) || idx < currentIndex;
    return {
      ...details,
      index: idx,
      distanceMeters: distance,
      isVisited
    };
  });

  // Check if journey is finished
  if (currentIndex >= resolvedList.length) {
    return {
      currentStop: resolvedList[resolvedList.length - 1],
      currentStatus: JOURNEY_STATUS.COMPLETED,
      distanceMeters: null,
      nextStop: null,
      allStopsWithState: resolvedList
    };
  }

  const active = resolvedList[currentIndex];
  let status = JOURNEY_STATUS.UPCOMING;

  if (active.distanceMeters !== null) {
    const radius = active.triggerRadiusMeters || 500;
    const immediateRadius = Math.min(150, radius * 0.4);

    if (active.distanceMeters <= immediateRadius) {
      status = JOURNEY_STATUS.HERE;
    } else if (active.distanceMeters <= radius) {
      status = JOURNEY_STATUS.APPROACHING;
    } else {
      status = JOURNEY_STATUS.UPCOMING;
    }
  }

  const nextStop = currentIndex + 1 < resolvedList.length ? resolvedList[currentIndex + 1] : null;

  return {
    currentStop: active,
    currentStatus: status,
    distanceMeters: active.distanceMeters,
    nextStop,
    allStopsWithState: resolvedList
  };
}
