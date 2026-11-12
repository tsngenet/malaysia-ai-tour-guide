/** Single source of truth for the CSV collection template and the field dictionary. */

const SRC = (n) => [
  { column: `source_${n}_name`, type: 'text', description: `Source ${n}: publisher or page name.` },
  { column: `source_${n}_url`, type: 'url', description: `Source ${n}: URL. Keep the URL; do not paste large copied passages.` },
  { column: `source_${n}_type`, type: 'enum', allowed: 'operator | tourism_authority | trip_com | traveller_review | contributor | other', description: `Source ${n}: what kind of source it is. Prefer an operator source to confirm activities.` },
  { column: `source_${n}_accessed_at`, type: 'date YYYY-MM-DD', description: `Source ${n}: date you read it.` },
  { column: `source_${n}_supports`, type: 'list (|)', description: `Source ${n}: which claims it supports, e.g. location|hours|activities.` },
  { column: `source_${n}_notes`, type: 'text', description: `Source ${n}: verification notes, unresolved conflicts.` }
];

export const FIELDS = [
  { column: 'candidate_id', required: 'recommended', type: 'text', description: 'Your own stable key for this row (e.g. SEED-011). Together with the import namespace it becomes the permanent POI ID, which makes re-imports idempotent. Never use a display name here if the name may change.' },
  { column: 'name_en', required: 'one name required', type: 'text', description: 'English name.' },
  { column: 'name_zh', type: 'text', description: 'Chinese name (UTF-8). Leave blank if unverified; do not machine-translate silently.' },
  { column: 'name_ms', type: 'text', description: 'Malay name, if known.' },
  { column: 'aliases', type: 'list (|)', description: 'Alternative names and spellings, separated by |.' },
  { column: 'category', type: 'text', description: 'e.g. landmark, food, farm, nature, culture, museum, family, viewpoint.' },
  { column: 'subcategory', type: 'text', description: 'Free text refinement.' },
  { column: 'tags', type: 'list (|)', description: 'Searchable tags, e.g. family-friendly|evening|hidden-gem|heritage.' },
  { column: 'summary_en', type: 'text', description: 'One or two sentences. Write in your own words.' },
  { column: 'summary_zh', type: 'text', description: 'Chinese summary.' },
  { column: 'story_en', type: 'text', description: 'Longer story / facts. Original wording or short attributed paraphrase only.' },
  { column: 'story_zh', type: 'text', description: 'Chinese story.' },
  { column: 'state', type: 'text', description: 'Actual state or federal territory (e.g. Selangor, Kuala Lumpur, Penang). Batu Caves is Selangor even in a KL tour. Unrecognised text is left blank and flagged.' },
  { column: 'state_basis', type: 'enum', allowed: 'documented | inferred | unknown', description: 'How sure you are of the state. Default: inferred.' },
  { column: 'city', type: 'text', description: 'City or nearest useful town.' },
  { column: 'address', type: 'text', description: 'Street address.' },
  { column: 'latitude', type: 'decimal', description: 'WGS84 latitude. Leave blank if unknown. Never estimate.' },
  { column: 'longitude', type: 'decimal', description: 'WGS84 longitude. Both or neither. Must fall in Peninsular Malaysia.' },
  { column: 'coordinate_source', type: 'text', description: 'Where the coordinates came from (e.g. operator map link, OpenStreetMap, on-site GPS).' },
  { column: 'coordinate_status', type: 'enum', allowed: 'verified | source_reported | approximate | unknown', description: 'Only "verified" coordinates are drawn as exact pins for everyone. "verified" requires coordinate_source and coordinate_verified_at.' },
  { column: 'coordinate_verified_at', type: 'date', description: 'Date a human checked the coordinate.' },
  { column: 'location_note', type: 'text', description: 'e.g. "approximate - area only" or "entrance is on the north side".' },
  { column: 'entrance_lat', type: 'decimal', description: 'Optional visitor entrance / pickup point latitude, if different.' },
  { column: 'entrance_lng', type: 'decimal', description: 'Optional visitor entrance / pickup point longitude.' },
  { column: 'entrance_note', type: 'text', description: 'Pickup / drop-off remarks.' },
  { column: 'experience_types', type: 'list (|)', description: 'e.g. farm|food|culture|nature|family.' },
  { column: 'duration_minutes', type: 'integer 1-1440', description: 'Suggested visit time in minutes.' },
  { column: 'duration_basis', type: 'enum', allowed: 'sourced | estimate | unknown', description: 'Whether the duration comes from a source or is your estimate. Blank + a value = estimate.' },
  { column: 'hours_text', type: 'text', description: 'Opening hours as stated by the source.' },
  { column: 'hours_checked_at', type: 'date', description: 'When hours were last checked. Required in practice: hours go stale.' },
  { column: 'admission_text', type: 'text', description: 'Admission / ticket information.' },
  { column: 'admission_checked_at', type: 'date', description: 'When admission was last checked.' },
  { column: 'booking_required', type: 'enum', allowed: 'yes | no | unknown', description: 'Booking requirement.' },
  { column: 'booking_note', type: 'text', description: 'How to book.' },
  { column: 'seasonality_text', type: 'text', description: 'Seasonal availability, e.g. durian season months.' },
  { column: 'seasonality_checked_at', type: 'date', description: 'When seasonality was last checked.' },
  { column: 'accessibility_text', type: 'text', description: 'Accessibility and practical visitor notes.' },
  { column: 'accessibility_checked_at', type: 'date', description: 'When accessibility info was last checked.' },
  { column: 'walking_difficulty', type: 'text', description: 'e.g. easy / moderate / steep stairs.' },
  { column: 'weather_dependence', type: 'text', description: 'Weather or tide dependence, if any.' },
  { column: 'contact_url', type: 'url', description: 'Public contact link.' },
  { column: 'booking_url', type: 'url', description: 'Public booking link.' },
  { column: 'farm_tour', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Operator offers a farm tour. Use unknown unless a source says so.' },
  { column: 'fruit_tasting', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Visitors can taste fruit.' },
  { column: 'fruit_picking', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Visitors can pick fruit.' },
  { column: 'herb_picking', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Visitors can pick herbs.' },
  { column: 'durian_tasting', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Durian tasting offered.' },
  { column: 'durian_picking', type: 'enum', allowed: 'confirmed | not_offered | unknown', description: 'Visitors can pick durian. NEVER infer from "grows durian" or "serves durian"; needs explicit operator evidence.' },
  { column: 'activity_season_note', type: 'text', description: 'Which activities are seasonal.' },
  ...SRC(1), ...SRC(2), ...SRC(3),
  { column: 'parent_candidate_id', type: 'text', description: 'candidate_id of a parent POI in the same file (e.g. Skybridge -> Petronas Twin Towers).' },
  { column: 'related_candidate_ids', type: 'list (|)', description: 'candidate_ids of related POIs in the same file.' },
  { column: 'review_flags', type: 'list (|)', description: 'Claims needing human checking, e.g. conflicting_hours|price_unverified.' },
  { column: 'review_notes', type: 'text', description: 'Internal reviewer notes. Never shown to passengers.' },
  { column: 'origin', type: 'text', description: 'Where this row came from (document name, research run id).' },
  { column: 'status', type: 'enum', allowed: 'draft | needs_review', description: 'Imports are always draft or needs_review. "approved"/"archived" are ignored with a warning.' }
];

export const TEMPLATE_HEADERS = FIELDS.map((f) => f.column);

export function fieldDictionaryMarkdown() {
  const rows = FIELDS.map((f) =>
    `| \`${f.column}\` | ${f.required || 'optional'} | ${f.type}${f.allowed ? ` (${f.allowed})` : ''} | ${f.description.replace(/\|/g, '\\|')} |`);
  return ['| Column | Required? | Type / values | Notes |', '|---|---|---|---|', ...rows].join('\n');
}
