/**
 * Future Integration Socket: MyDCore / External Fleet & Booking Systems
 *
 * SPECIFICATION & BOUNDARY RULES:
 * 1. This Tour Guide is a standalone product ("mytguide").
 * 2. It is NOT a module or branch of MyDCore / Driver Core.
 * 3. It must remain fully operable without MyDCore.
 * 4. No shared databases: no driver financial records, commissions, claims,
 *    or vehicle private records may enter this application.
 * 5. This socket defines a clean, one-way import adapter for incoming itineraries.
 */

/**
 * Standardized External Reference Identifiers
 */
export const INTEGRATION_SCHEMA_VERSION = '1.0.0';

/**
 * Adapter: Convert external job/booking message into a Draft Tour
 *
 * Incoming format expected from external fleet message / AI parser:
 * {
 *   jobId: "JOB-9921",
 *   vehicleId: "V-VAN-08",
 *   operatorId: "OP-MALAYSIA-TOURS",
 *   customerName: "Private Booking", // Kept private, not published
 *   date: "2026-11-05",
 *   rawStops: [
 *     { name: "KL Hotel", lat: 3.1578, lng: 101.7119, type: "pickup" },
 *     { name: "Batu Caves", matchedPlaceId: "batu-caves" },
 *     { name: "Putrajaya Pink Mosque", matchedPlaceId: "putra-mosque" },
 *     { name: "Melaka Dutch Square", matchedPlaceId: "dutch-square" }
 *   ]
 * }
 */
export function convertExternalJobToDraftTour(externalJob) {
  if (!externalJob || !externalJob.jobId) {
    throw new Error('Invalid external job payload: missing jobId');
  }

  const generatedTourId = `tour-ext-${externalJob.jobId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const code = `EXT-${externalJob.jobId.slice(-4).toUpperCase()}`;

  const stops = (externalJob.rawStops || []).map((s, idx) => {
    if (s.matchedPlaceId) {
      return {
        stopId: `stop-${idx + 1}-${s.matchedPlaceId}`,
        attractionId: s.matchedPlaceId,
        triggerRadiusMeters: s.triggerRadiusMeters || 500,
        notes: s.notes || undefined
      };
    }

    return {
      stopId: `stop-${idx + 1}-custom`,
      isCustom: true,
      title: {
        en: s.name || `Stop ${idx + 1}`,
        zh: s.nameZh || s.name || `停靠点 ${idx + 1}`,
        ms: s.nameMs || s.name || `Hentian ${idx + 1}`
      },
      coordinates: {
        lat: Number(s.lat) || 0,
        lng: Number(s.lng) || 0
      },
      triggerRadiusMeters: s.triggerRadiusMeters || 500,
      customNarration: {
        en: s.narrationEn || '',
        zh: s.narrationZh || '',
        ms: s.narrationMs || ''
      }
    };
  });

  return {
    tourId: generatedTourId,
    code,
    title: {
      en: externalJob.title || `Day Tour (${externalJob.jobId})`,
      zh: externalJob.titleZh || `包车一日游 (${externalJob.jobId})`,
      ms: externalJob.titleMs || `Lawatan Harian (${externalJob.jobId})`
    },
    publicationStatus: 'draft', // MUST enter draft for operator review
    externalReferences: {
      sourceSystem: 'MyDCore',
      jobId: externalJob.jobId,
      vehicleId: externalJob.vehicleId || null,
      operatorId: externalJob.operatorId || 'default-operator',
      importedAt: new Date().toISOString()
    },
    availableLanguages: ['en', 'zh', 'ms'],
    passengerLink: `https://msiatguide.web.app/?tour=${code}`,
    stops
  };
}
