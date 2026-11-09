/**
 * Schedule & Itinerary Calculation Engine
 *
 * Computes arrival/departure timestamps, duration totals, travel time estimations,
 * multi-day boundaries, and collision-resistant tour codes.
 */

import { distanceMetres } from './distance.js';
import { ATTRACTIONS } from '../data/attractions.js';

/**
 * Generates collision-resistant human-readable tour code.
 * Format: MYTG-YYYYMMDD-XXXX (e.g. MYTG-20261107-H7K2)
 */
export function generateTourCode(date = new Date(), prefix = 'MYTG') {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  // Random 4-character suffix excluding confusing chars: 0, O, 1, I, L
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Estimates driving travel duration in minutes between two coordinates.
 * Defaults to 45 km/h average for mixed urban/intercity roads in Malaysia + 5 min traffic buffer.
 */
export function estimateTravelMinutes(coordA, coordB, speedKmh = 45) {
  if (!coordA || !coordB || typeof coordA.lat !== 'number' || typeof coordB.lat !== 'number') {
    return null;
  }
  if (coordA.lat === 0 && coordA.lng === 0) return null;
  if (coordB.lat === 0 && coordB.lng === 0) return null;

  const meters = distanceMetres(coordA.lat, coordA.lng, coordB.lat, coordB.lng);
  if (meters < 100) return 0; // Co-located or near-identical stops
  const km = meters / 1000;
  // Apply 1.25 winding-road detour factor for road distance vs straight-line distance
  const roadKm = km * 1.25;
  const hours = roadKm / speedKmh;
  const minutes = Math.round(hours * 60) + 5; // 5 min buffer

  return Math.max(5, minutes);
}

/**
 * Returns estimated road distance in kilometres between two coordinates (with 1.25 detour factor).
 */
export function getRoadDistanceKm(coordA, coordB) {
  if (!coordA || !coordB || typeof coordA.lat !== 'number' || typeof coordB.lat !== 'number') {
    return 0;
  }
  if ((coordA.lat === 0 && coordA.lng === 0) || (coordB.lat === 0 && coordB.lng === 0)) {
    return 0;
  }
  const meters = distanceMetres(coordA.lat, coordA.lng, coordB.lat, coordB.lng);
  return Math.round((meters / 1000) * 1.25 * 10) / 10;
}

/**
 * Formats minutes from midnight into 24h "HH:MM" string.
 */
export function minutesToTimeString(totalMinutes) {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Parses "HH:MM" string to minutes from midnight.
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return 540; // Default 09:00 (540 mins)
  const parts = timeStr.split(':');
  if (parts.length < 2) return 540;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Calculates a complete tour schedule given stops and timing configurations.
 * Handles single-day and multi-day tours with day breaks.
 *
 * @param {Object} options
 * @param {string} options.startTime - Tour start time, e.g. "08:30"
 * @param {Array} options.stops - Array of tour stops
 * @param {number} [options.defaultStopDuration=45] - Default visit duration in minutes
 * @param {Object} [options.dayRestartTimes={}] - Map of day number to start time string, e.g. { 2: "09:00" }
 * @returns {Object} Calculated schedule details
 */
export function calculateSchedule({
  startTime = '09:00',
  stops = [],
  defaultStopDuration = 45,
  dayRestartTimes = {}
}) {
  if (!stops || stops.length === 0) {
    return {
      scheduledStops: [],
      totalDurationMinutes: 0,
      totalVisitMinutes: 0,
      totalTravelMinutes: 0,
      totalDays: 1,
      startTime,
      endTime: startTime
    };
  }

  let currentDay = 1;
  let currentMinutes = timeStringToMinutes(startTime);
  let totalVisitMinutes = 0;
  let totalTravelMinutes = 0;

  const scheduledStops = [];
  let prevCoords = null;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];

    // If stop explicitly specifies a new day or day boundary
    if (stop.day && stop.day > currentDay) {
      currentDay = stop.day;
      const dayStart = dayRestartTimes[currentDay] || '09:00';
      currentMinutes = timeStringToMinutes(dayStart);
      prevCoords = null; // Reset previous coords across day boundaries
    }

    // Resolve attraction details for durations and coordinates
    const attraction = stop.attractionId ? ATTRACTIONS[stop.attractionId] : null;
    const coords = stop.coordinates || attraction?.coordinates || null;

    // Determine travel time to this stop
    let travelMins = 0;
    let travelEstimated = false;

    if (stop.manualTravelMinutes !== undefined && stop.manualTravelMinutes !== null) {
      travelMins = Number(stop.manualTravelMinutes) || 0;
    } else if (prevCoords && coords) {
      const est = estimateTravelMinutes(prevCoords, coords);
      if (est !== null) {
        travelMins = est;
        travelEstimated = true;
      }
    }

    currentMinutes += travelMins;
    totalTravelMinutes += travelMins;

    const arrivalTimeStr = minutesToTimeString(currentMinutes);

    // Determine stop visit duration
    let visitMins = defaultStopDuration;
    if (stop.durationMinutes !== undefined && stop.durationMinutes !== null) {
      visitMins = Number(stop.durationMinutes);
    } else if (attraction?.suggestedDurationMinutes) {
      visitMins = attraction.suggestedDurationMinutes;
    } else if (stop.type === 'meal_break') {
      visitMins = 60;
    } else if (stop.type === 'rest_stop') {
      visitMins = 20;
    }

    totalVisitMinutes += visitMins;
    const departureMinutes = currentMinutes + visitMins;
    const departureTimeStr = minutesToTimeString(departureMinutes);

    scheduledStops.push({
      ...stop,
      stopIndex: i,
      day: currentDay,
      travelMinutesFromPrev: travelMins,
      isTravelEstimated: travelEstimated,
      arrivalMinutes: currentMinutes,
      arrivalTime: arrivalTimeStr,
      visitDurationMinutes: visitMins,
      departureMinutes: departureMinutes,
      departureTime: departureTimeStr
    });

    currentMinutes = departureMinutes;
    if (coords) {
      prevCoords = coords;
    }
  }

  const finalStop = scheduledStops[scheduledStops.length - 1];
  const totalTourMinutes = totalVisitMinutes + totalTravelMinutes;

  return {
    scheduledStops,
    totalDurationMinutes: totalTourMinutes,
    totalVisitMinutes,
    totalTravelMinutes,
    totalDays: currentDay,
    startTime,
    endTime: finalStop?.departureTime || startTime
  };
}

/**
 * Creates an immutable published snapshot from an editable tour draft.
 * Prevents editing from mutating the active passenger experience.
 */
export function createPublishedSnapshot(tourDraft, options = {}) {
  // Deep clone draft to completely isolate published snapshot from subsequent mutations
  const cloned = JSON.parse(JSON.stringify(tourDraft || {}));
  const publishedAt = new Date().toISOString();
  const code = cloned.code || generateTourCode();
  const version = (cloned.publishedVersion || 0) + 1;

  // Pre-calculate full schedule for static distribution
  const schedule = calculateSchedule({
    startTime: cloned.startTime || '09:00',
    stops: cloned.stops || [],
    dayRestartTimes: cloned.dayRestartTimes || {}
  });

  return {
    ...cloned,
    publicationStatus: 'published',
    publishedVersion: version,
    publishedAt,
    code,
    scheduleSummary: {
      totalDays: schedule.totalDays,
      totalDurationMinutes: schedule.totalDurationMinutes,
      totalStops: schedule.scheduledStops.length,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    },
    stops: schedule.scheduledStops,
    // Use the current Hosting origin when supplied by the caller (staging/production).
    // Server-side/unit-test callers retain the baseline origin unless overridden.
    passengerLink: `${String(options.passengerOrigin || 'https://msiatguide.web.app').replace(/\/$/, '')}/?tour=${encodeURIComponent(code)}`
  };
}

/**
 * Computes duration warnings, overtime metrics, midnight crossings,
 * and geographic detour alerts without blocking driver modifications.
 *
 * @param {Object} options
 * @param {Object} options.schedule - Calculated schedule from calculateSchedule()
 * @param {number} [options.agreedLimitHours=10] - Tour limit agreed with passenger (e.g. 10 hours)
 * @returns {Object} Warning report and duration breakdown
 */
export function getScheduleWarnings({ schedule, agreedLimitHours = 10 }) {
  const agreedLimitMinutes = Math.round(Number(agreedLimitHours || 10) * 60);
  const totalPlannedMinutes = schedule?.totalDurationMinutes || 0;
  const visitDurationMinutes = schedule?.totalVisitMinutes || 0;
  const estimatedRoadMinutes = schedule?.totalTravelMinutes || 0;
  const overtimeMinutes = Math.max(0, totalPlannedMinutes - agreedLimitMinutes);

  // Status flags
  const isWithinWindow = totalPlannedMinutes <= agreedLimitMinutes;
  const isApproachingLimit = totalPlannedMinutes > (agreedLimitMinutes - 45) && totalPlannedMinutes <= agreedLimitMinutes;
  const isExceedingLimit = totalPlannedMinutes > agreedLimitMinutes;

  // Check midnight crossing
  const startMins = timeStringToMinutes(schedule?.startTime || '09:00');
  const rawEndMins = startMins + totalPlannedMinutes;
  const isCrossingMidnight = rawEndMins >= 1440 || (schedule?.totalDays || 1) > 1;

  // Overnight requirement:
  // Triggered if total duration >= 16h (960m) or route crosses midnight and finishes between 00:00 and 06:00
  const endOfDayMins = rawEndMins % 1440;
  const isOvernightRequired = totalPlannedMinutes >= 960 || (isCrossingMidnight && endOfDayMins > 0 && endOfDayMins <= 360);

  // Check geographic detours between consecutive coordinated stops
  const detours = [];
  const stops = schedule?.scheduledStops || [];
  let lastCoordinatedStop = null;

  // Track duplicates & misplaced return stops
  const seenAttractions = new Map();
  const duplicateWarnings = [];
  let returnStopIndex = -1;
  let returnStopTitle = '';

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const attraction = s.attractionId ? ATTRACTIONS[s.attractionId] : null;
    const coords = s.coordinates || attraction?.coordinates || null;
    const name = s.title?.en || attraction?.name?.en || `Stop #${i + 1}`;

    // Duplicate detection
    if (s.attractionId) {
      if (seenAttractions.has(s.attractionId)) {
        const prevIdx = seenAttractions.get(s.attractionId);
        duplicateWarnings.push({
          attractionId: s.attractionId,
          name,
          firstIndex: prevIdx,
          secondIndex: i,
          message: `Duplicate stop: "${name}" is already included at Stop #${prevIdx + 1}.`
        });
      } else {
        seenAttractions.set(s.attractionId, i);
      }
    }

    // Check if a return/disembarkation stop is not at the end
    const lowerTitle = (s.title?.en || attraction?.name?.en || '').toLowerCase();
    if (
      returnStopIndex === -1 &&
      (lowerTitle.includes('return') || lowerTitle.includes('disembarkation') || lowerTitle.includes('hotel dropoff'))
    ) {
      if (i < stops.length - 1) {
        returnStopIndex = i;
        returnStopTitle = name;
      }
    }

    if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number' && !(coords.lat === 0 && coords.lng === 0)) {
      if (lastCoordinatedStop) {
        const roadDistKm = getRoadDistanceKm(lastCoordinatedStop.coords, coords);
        // Flag significant detours (> 70 km single-leg transit)
        if (roadDistKm >= 70) {
          detours.push({
            fromIndex: lastCoordinatedStop.index,
            fromName: lastCoordinatedStop.name,
            toIndex: i,
            toName: name,
            distanceKm: roadDistKm,
            estimatedTravelMinutes: s.travelMinutesFromPrev || estimateTravelMinutes(lastCoordinatedStop.coords, coords)
          });
        }
      }
      lastCoordinatedStop = { index: i, name, coords };
    }
  }

  // Determine overall status severity
  let severity = 'ok'; // 'ok' | 'approaching' | 'exceeded' | 'overnight'
  let headline = `Within planned window (${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m / ${agreedLimitHours}h limit)`;

  if (isOvernightRequired) {
    severity = 'overnight';
    headline = `Requires overnight itinerary (ends ${schedule.endTime} next day · ${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m total)`;
  } else if (isExceedingLimit) {
    severity = 'exceeded';
    headline = `Exceeds agreed tour limit (+${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m overtime)`;
  } else if (isApproachingLimit) {
    severity = 'approaching';
    headline = `Approaching agreed tour limit (${agreedLimitMinutes - totalPlannedMinutes}m buffer remaining)`;
  }

  const warnings = [];
  if (isOvernightRequired) {
    warnings.push({
      type: 'overnight',
      level: 'danger',
      message: `Total duration (${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m) crosses midnight and ends at ${schedule.endTime} the following day. For passenger comfort and driver rest safety, split this route across multiple days.`
    });
  } else if (isCrossingMidnight) {
    warnings.push({
      type: 'midnight',
      level: 'warning',
      message: `Scheduled route concludes past midnight (at ${schedule.endTime}). Verify driver working hours and passenger night dropoff feasibility.`
    });
  }

  if (isExceedingLimit && !isOvernightRequired) {
    warnings.push({
      type: 'exceeded',
      level: 'warning',
      message: `Total planned time exceeds the ${agreedLimitHours}-hour package limit by ${Math.floor(overtimeMinutes / 60)}h ${overtimeMinutes % 60}m. Consider adjusting dwell durations or converting non-essential stops to optional.`
    });
  }

  if (returnStopIndex !== -1) {
    const trailingCount = stops.length - 1 - returnStopIndex;
    warnings.push({
      type: 'return_sequence',
      level: 'warning',
      message: `Stop #${returnStopIndex + 1} ("${returnStopTitle}") is designated as a return/disembarkation point, but is followed by ${trailingCount} more stop(s). Consider reordering so return stops remain at the end.`
    });
  }

  if (duplicateWarnings.length > 0) {
    duplicateWarnings.forEach(dup => {
      warnings.push({
        type: 'duplicate',
        level: 'warning',
        message: dup.message
      });
    });
  }

  if (detours.length > 0) {
    detours.forEach(d => {
      warnings.push({
        type: 'detour',
        level: 'info',
        message: `Long driving leg detected: Stop ${d.fromIndex + 1} (${d.fromName}) to Stop ${d.toIndex + 1} (${d.toName}) is ~${d.distanceKm} km (estimated ~${d.estimatedTravelMinutes}m transit). Verify this cross-regional leg is intended.`
      });
    });
  }

  return {
    severity,
    headline,
    isWithinWindow,
    isApproachingLimit,
    isExceedingLimit,
    isCrossingMidnight,
    isOvernightRequired,
    agreedLimitHours: Number(agreedLimitHours),
    agreedLimitMinutes,
    totalPlannedMinutes,
    visitDurationMinutes,
    estimatedRoadMinutes,
    overtimeMinutes,
    detours,
    duplicateWarnings,
    returnStopIndex,
    warnings,
    isEstimateUnverified: true,
    estimationDisclaimer: 'Road times are straight-line Haversine estimates (+25% road detour buffer at 45 km/h). Real transit times may vary with traffic, highway toll plazas, and weather.'
  };
}
