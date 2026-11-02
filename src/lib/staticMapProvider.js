/**
 * Static Location Visual Provider Adapter
 *
 * Provides a decoupled abstraction between UI components and map image providers.
 *
 * Supported providers (configured via VITE_STATIC_MAP_PROVIDER):
 * - 'none' (default): Purely local. Returns null so the component renders approved
 *   attraction heroVisual or a polished CSS/SVG topographic fallback.
 * - 'google': Generates official Google Maps Static API satellite/roadmap URLs.
 *   Requires VITE_GOOGLE_MAPS_API_KEY with appropriate domain/referrer restrictions.
 */

export const STATIC_MAP_PROVIDERS = {
  NONE: 'none',
  GOOGLE: 'google'
};

/**
 * Returns a static map image URL if a configured provider is active, or null.
 *
 * @param {Object} options
 * @param {number} options.latitude
 * @param {number} options.longitude
 * @param {number} [options.zoom=16]
 * @param {number} [options.width=640]
 * @param {number} [options.height=360]
 * @param {string} [options.mapType='satellite'] - 'satellite' | 'roadmap' | 'hybrid' | 'terrain'
 * @param {string} [options.markerLabel='']
 * @returns {string|null}
 */
export function getStaticLocationVisual({
  latitude,
  longitude,
  zoom = 16,
  width = 640,
  height = 360,
  mapType = 'satellite',
  markerLabel = ''
}) {
  const provider = (import.meta.env?.VITE_STATIC_MAP_PROVIDER || 'none').toLowerCase();
  const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || '';

  if (provider === STATIC_MAP_PROVIDERS.GOOGLE && apiKey && latitude && longitude) {
    const encodedLabel = markerLabel ? encodeURIComponent(markerLabel.charAt(0).toUpperCase()) : '';
    const labelParam = encodedLabel ? `label:${encodedLabel}%7C` : '';
    const markerParam = `markers=color:red%7C${labelParam}${latitude},${longitude}`;
    return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&scale=2&maptype=${mapType}&${markerParam}&key=${apiKey}`;
  }

  // Default 'none' provider - returns null to trigger local heroVisual or polished fallback
  return null;
}
