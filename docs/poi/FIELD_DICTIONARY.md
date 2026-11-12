# POI field dictionary (CSV columns)

Generated from `src/poi/template.js` by `node tools/build-seed.mjs`. Do not edit by hand.

Only one name is required to save a draft. Everything else is optional. Unknown stays blank or `unknown`; never guess.
Private columns (commission, driver notes) are **not importable**: they are ignored and reported.

| Column | Required? | Type / values | Notes |
|---|---|---|---|
| `candidate_id` | recommended | text | Your own stable key for this row (e.g. SEED-011). Together with the import namespace it becomes the permanent POI ID, which makes re-imports idempotent. Never use a display name here if the name may change. |
| `name_en` | one name required | text | English name. |
| `name_zh` | optional | text | Chinese name (UTF-8). Leave blank if unverified; do not machine-translate silently. |
| `name_ms` | optional | text | Malay name, if known. |
| `aliases` | optional | list (|) | Alternative names and spellings, separated by \|. |
| `category` | optional | text | e.g. landmark, food, farm, nature, culture, museum, family, viewpoint. |
| `subcategory` | optional | text | Free text refinement. |
| `tags` | optional | list (|) | Searchable tags, e.g. family-friendly\|evening\|hidden-gem\|heritage. |
| `summary_en` | optional | text | One or two sentences. Write in your own words. |
| `summary_zh` | optional | text | Chinese summary. |
| `story_en` | optional | text | Longer story / facts. Original wording or short attributed paraphrase only. |
| `story_zh` | optional | text | Chinese story. |
| `state` | optional | text | Actual state or federal territory (e.g. Selangor, Kuala Lumpur, Penang). Batu Caves is Selangor even in a KL tour. Unrecognised text is left blank and flagged. |
| `state_basis` | optional | enum (documented | inferred | unknown) | How sure you are of the state. Default: inferred. |
| `city` | optional | text | City or nearest useful town. |
| `address` | optional | text | Street address. |
| `latitude` | optional | decimal | WGS84 latitude. Leave blank if unknown. Never estimate. |
| `longitude` | optional | decimal | WGS84 longitude. Both or neither. Must fall in Peninsular Malaysia. |
| `coordinate_source` | optional | text | Where the coordinates came from (e.g. operator map link, OpenStreetMap, on-site GPS). |
| `coordinate_status` | optional | enum (verified | source_reported | approximate | unknown) | Only "verified" coordinates are drawn as exact pins for everyone. "verified" requires coordinate_source and coordinate_verified_at. |
| `coordinate_verified_at` | optional | date | Date a human checked the coordinate. |
| `location_note` | optional | text | e.g. "approximate - area only" or "entrance is on the north side". |
| `entrance_lat` | optional | decimal | Optional visitor entrance / pickup point latitude, if different. |
| `entrance_lng` | optional | decimal | Optional visitor entrance / pickup point longitude. |
| `entrance_note` | optional | text | Pickup / drop-off remarks. |
| `experience_types` | optional | list (|) | e.g. farm\|food\|culture\|nature\|family. |
| `duration_minutes` | optional | integer 1-1440 | Suggested visit time in minutes. |
| `duration_basis` | optional | enum (sourced | estimate | unknown) | Whether the duration comes from a source or is your estimate. Blank + a value = estimate. |
| `hours_text` | optional | text | Opening hours as stated by the source. |
| `hours_checked_at` | optional | date | When hours were last checked. Required in practice: hours go stale. |
| `admission_text` | optional | text | Admission / ticket information. |
| `admission_checked_at` | optional | date | When admission was last checked. |
| `booking_required` | optional | enum (yes | no | unknown) | Booking requirement. |
| `booking_note` | optional | text | How to book. |
| `seasonality_text` | optional | text | Seasonal availability, e.g. durian season months. |
| `seasonality_checked_at` | optional | date | When seasonality was last checked. |
| `accessibility_text` | optional | text | Accessibility and practical visitor notes. |
| `accessibility_checked_at` | optional | date | When accessibility info was last checked. |
| `walking_difficulty` | optional | text | e.g. easy / moderate / steep stairs. |
| `weather_dependence` | optional | text | Weather or tide dependence, if any. |
| `contact_url` | optional | url | Public contact link. |
| `booking_url` | optional | url | Public booking link. |
| `farm_tour` | optional | enum (confirmed | not_offered | unknown) | Operator offers a farm tour. Use unknown unless a source says so. |
| `fruit_tasting` | optional | enum (confirmed | not_offered | unknown) | Visitors can taste fruit. |
| `fruit_picking` | optional | enum (confirmed | not_offered | unknown) | Visitors can pick fruit. |
| `herb_picking` | optional | enum (confirmed | not_offered | unknown) | Visitors can pick herbs. |
| `durian_tasting` | optional | enum (confirmed | not_offered | unknown) | Durian tasting offered. |
| `durian_picking` | optional | enum (confirmed | not_offered | unknown) | Visitors can pick durian. NEVER infer from "grows durian" or "serves durian"; needs explicit operator evidence. |
| `activity_season_note` | optional | text | Which activities are seasonal. |
| `source_1_name` | optional | text | Source 1: publisher or page name. |
| `source_1_url` | optional | url | Source 1: URL. Keep the URL; do not paste large copied passages. |
| `source_1_type` | optional | enum (operator | tourism_authority | trip_com | traveller_review | contributor | other) | Source 1: what kind of source it is. Prefer an operator source to confirm activities. |
| `source_1_accessed_at` | optional | date YYYY-MM-DD | Source 1: date you read it. |
| `source_1_supports` | optional | list (|) | Source 1: which claims it supports, e.g. location\|hours\|activities. |
| `source_1_notes` | optional | text | Source 1: verification notes, unresolved conflicts. |
| `source_2_name` | optional | text | Source 2: publisher or page name. |
| `source_2_url` | optional | url | Source 2: URL. Keep the URL; do not paste large copied passages. |
| `source_2_type` | optional | enum (operator | tourism_authority | trip_com | traveller_review | contributor | other) | Source 2: what kind of source it is. Prefer an operator source to confirm activities. |
| `source_2_accessed_at` | optional | date YYYY-MM-DD | Source 2: date you read it. |
| `source_2_supports` | optional | list (|) | Source 2: which claims it supports, e.g. location\|hours\|activities. |
| `source_2_notes` | optional | text | Source 2: verification notes, unresolved conflicts. |
| `source_3_name` | optional | text | Source 3: publisher or page name. |
| `source_3_url` | optional | url | Source 3: URL. Keep the URL; do not paste large copied passages. |
| `source_3_type` | optional | enum (operator | tourism_authority | trip_com | traveller_review | contributor | other) | Source 3: what kind of source it is. Prefer an operator source to confirm activities. |
| `source_3_accessed_at` | optional | date YYYY-MM-DD | Source 3: date you read it. |
| `source_3_supports` | optional | list (|) | Source 3: which claims it supports, e.g. location\|hours\|activities. |
| `source_3_notes` | optional | text | Source 3: verification notes, unresolved conflicts. |
| `parent_candidate_id` | optional | text | candidate_id of a parent POI in the same file (e.g. Skybridge -> Petronas Twin Towers). |
| `related_candidate_ids` | optional | list (|) | candidate_ids of related POIs in the same file. |
| `review_flags` | optional | list (|) | Claims needing human checking, e.g. conflicting_hours\|price_unverified. |
| `review_notes` | optional | text | Internal reviewer notes. Never shown to passengers. |
| `origin` | optional | text | Where this row came from (document name, research run id). |
| `status` | optional | enum (draft | needs_review) | Imports are always draft or needs_review. "approved"/"archived" are ignored with a warning. |
