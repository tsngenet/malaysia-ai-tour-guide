# Malaysia AI Tour Guide — Attraction Schema Documentation

## 1. Overview

The Attraction Library is a foundational, reusable collection of vetted points of interest across Malaysia. Attractions are independent data records that can be reused across multiple tours and routes.

## 2. Formal Schema Specification

Every attraction object stored in the library or database adheres to the schema validated by `src/data/attractionSchema.js`:

```typescript
interface Attraction {
  // Required: Unique kebab-case identifier (e.g. 'batu-caves')
  placeId: string;

  // Required: Multilingual names (English is mandatory)
  name: {
    en: string;
    zh?: string;
    ms?: string;
    ja?: string;
    ko?: string;
  };

  // Required: One of 9 approved destinations
  destination: 'Kuala Lumpur' | 'Putrajaya' | 'Melaka' | 'Ipoh' | 'Penang' | 
               'Kuala Selangor' | 'Genting Highlands' | 'Cameron Highlands' | 'Kampar';

  // Required: Attraction classification
  category: 'heritage' | 'culture' | 'nature' | 'culinary' | 'viewpoint' | 
            'activity' | 'shopping' | 'museum';

  // Nullable or validated GPS coordinates (strict: (0,0) prohibited)
  coordinates: {
    lat: number; // -90 to 90
    lng: number; // -180 to 180
  } | null;

  // Proximity trigger distance in meters (default: 500)
  triggerRadiusMeters?: number;

  // Required: Recommended visit time in minutes
  suggestedDurationMinutes: number;

  // Optional: Duration range boundary
  durationRange?: {
    minMinutes: number;
    maxMinutes: number; // Must be >= minMinutes
  };

  // Required: 1-2 sentence overview for passenger card displays
  shortIntro: {
    en: string;
    zh?: string;
    ms?: string;
    ja?: string;
    ko?: string;
  };

  // Required: Full audio narration script read aloud upon arrival/approach
  narration: {
    en: string;
    zh?: string;
    ms?: string;
    ja?: string;
    ko?: string;
  };

  // Multilingual interesting facts & trivia
  interestingFacts?: Array<{
    en: string;
    zh?: string;
    ms?: string;
  }>;

  // Practical passenger visitor facilities
  facilities?: {
    restroom?: string;
    prayerRoom?: string;
    parking?: string;
    pickupSuitability?: string;
    dressCode?: string;
  };

  // Vetting references and verifiable sources
  sourceReferences?: string[];
  sourceUrls?: string[];

  // Verification lifecycle
  verificationStatus: 'approved' | 'pending_review' | 'draft' | 'rejected';
  lastVerified?: string; // YYYY-MM-DD

  // Visual snapshot media
  heroVisual?: {
    type: 'photo' | 'aerial' | 'satellite';
    imageUrl: string;
    fallbackUrl?: string;
    alt: string;
    attribution?: string;
    focalPoint?: 'center' | 'top' | 'bottom';
  };
}
```

## 3. Strict Integrity Guardrails

1. **Anti-Hallucination GPS Guard:** Fabricated or dummy coordinates such as `lat: 0, lng: 0` are strictly rejected by the validator. When coordinates are unverified, `null` must be used.
2. **Proximity Trigger Safety:** The journey engine explicitly ignores stops with `null` or unverified coordinates, ensuring passengers never receive spurious proximity alerts.
3. **Cross-Language Fallback:** All UI and audio narrations gracefully fallback from passenger-selected language to English if a localized string is missing.
4. **Duration Integrity:** If `durationRange` is specified, `minMinutes` cannot exceed `maxMinutes`.

## 4. Current Library Catalog

The Attraction Library currently contains **48 approved attractions** (at least 6 per destination):
- **Kuala Lumpur & Putrajaya (6):** Batu Caves, Petronas Twin Towers, Merdeka Square, Putra Mosque, Perdana Putra, Putrajaya Lake Cruise.
- **Melaka (6):** Dutch Square, A Famosa, Jonker Street, St. Paul's Hill, Baba & Nyonya Museum, Melaka River Cruise.
- **Ipoh (6):** Kellie's Castle, Perak Tong Cave Temple, Kek Lok Tong Cave Temple, Concubine Lane, Birch Memorial, Sam Poh Tong Cave Temple.
- **Penang (6):** George Town Heritage Street Art, Penang Hill, Kek Lok Si Temple, Chew Jetty, Fort Cornwallis, Pinang Peranakan Mansion.
- **Kuala Selangor (6):** Bukit Melawati, Kampung Kuantan Fireflies, Sasaran Beach Sky Mirror, Pasir Penambang, Kuala Selangor Nature Park, Sri Shakti Temple.
- **Genting Highlands (6):** Chin Swee Caves Temple, Awana SkyWay Cable Car, Genting SkyWorlds, GHPO, Skytropolis, Genting Strawberry Farm.
- **Cameron Highlands (6):** BOH Sungei Palas Tea Garden, Mossy Forest, Kea Farm Market, Cameron Lavender Garden, MARDI Agro Technology Park, Time Tunnel Museum.
- **Kampar (6):** Kinta Tin Mining Museum, Gua Tempurung Cave, Bandar Barat Kampar Lake, Kampar Old Town Food Street, Sahom Valley, TT5 Tanjung Tualang Tin Dredge.
