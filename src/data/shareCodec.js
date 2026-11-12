/**
 * Serverless passenger share link: the agreed itinerary is compacted, deflated and placed in the URL
 * fragment (#/s/<payload>). It works on any phone with no login and without a backend, and contains
 * only public itinerary fields (names, coordinates for verified POIs, durations). No private notes or
 * commission data can be included because the encoder whitelists fields.
 * Limit: very long itineraries may exceed QR capacity; encodeTour reports the size so the UI can warn.
 */
const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function pipe(bytes, stream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export function compactTour(tour) {
  return {
    v: 1,
    i: tour.tourId,
    c: tour.code || '',
    t: [tour.title?.en || '', tour.title?.zh || ''],
    s: (tour.stops || []).map((s) => {
      if (!s.isCustom) return { a: s.attractionId, r: s.triggerRadiusMeters || 500, d: s.durationMinutes ?? null };
      return {
        n: [s.title?.en || '', s.title?.zh || ''],
        g: s.coordinates ? [s.coordinates.lat, s.coordinates.lng] : null,
        r: s.triggerRadiusMeters || 500,
        d: s.durationMinutes ?? null,
        u: s.customNarration ? [s.customNarration.en || '', s.customNarration.zh || ''] : null
      };
    })
  };
}

export function expandTour(c) {
  if (!c || c.v !== 1 || !Array.isArray(c.s)) throw new Error('Unrecognised itinerary link');
  return {
    tourId: c.i || `shared-${Date.now()}`,
    code: c.c || '',
    title: { en: c.t?.[0] || 'Shared itinerary', zh: c.t?.[1] || c.t?.[0] || '' },
    publicationStatus: 'published',
    availableLanguages: ['en', 'zh'],
    sharedFromLink: true,
    stops: c.s.map((s, idx) => (s.a
      ? { stopId: `s${idx}-${s.a}`, attractionId: s.a, triggerRadiusMeters: s.r, durationMinutes: s.d }
      : {
        stopId: `s${idx}-shared`, isCustom: true,
        title: { en: s.n?.[0] || 'Stop', zh: s.n?.[1] || s.n?.[0] || '' },
        coordinates: s.g ? { lat: s.g[0], lng: s.g[1] } : undefined,
        triggerRadiusMeters: s.r, durationMinutes: s.d,
        customNarration: s.u ? { en: s.u[0], zh: s.u[1] || s.u[0] } : { en: '', zh: '' }
      }))
  };
}

export async function encodeTour(tour) {
  const json = new TextEncoder().encode(JSON.stringify(compactTour(tour)));
  const z = await pipe(json, new CompressionStream('deflate-raw'));
  const payload = b64url(z);
  return { payload, bytes: payload.length };
}

export async function decodeTour(payload) {
  const z = unb64url(payload);
  const json = await pipe(z, new DecompressionStream('deflate-raw'));
  return expandTour(JSON.parse(new TextDecoder().decode(json)));
}

export const shareUrl = (origin, payload) => `${origin}/#/s/${payload}`;
