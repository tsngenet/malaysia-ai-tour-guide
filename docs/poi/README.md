# POI master & map: import process, research workflow, data model

## Data model (v1)
Defined in `src/poi/schema.js`. One record per place, stable ID `poi_<hash>` derived from `(import namespace, candidate_id)` — never from a display name. Only an ID and one name are required, so incomplete drafts save. Groups: names/aliases, category/tags, EN/ZH summary and story, `location` (state, city, address, lat/lng, coordinate source/status/verified date, optional entrance), `visit` (duration + basis sourced/estimate, hours/admission/seasonality/accessibility each with a *checked-at* date), `activities` (farm tour, fruit tasting, fruit picking, herb picking, durian tasting, durian picking: confirmed / not_offered / unknown), `sources[]`, `media[]` (rights + review status), `relations` (parent, related, possible duplicates), `review` (flags, internal notes), `origin`, version + timestamps.

Private driver notes and commission live in a separate structure (`pois/{id}/private/*` in Firestore; `createPrivateStore` locally). They are **not importable** via CSV/JSON (columns are ignored and reported) and are never part of `publicView`.

Firestore layout and rules: see `docs/poi/INTEGRATION_REPORT.md` (collections `poi_master`, `poi_imports`, `driver_poi_private/{uid}/pois/{poiId}`).

## Import process
1. Download `data/poi/poi_collection_template.csv` (columns documented in `FIELD_DICTIONARY.md`) or use `data/poi/import_example.json`.
2. App → `#/poi` → choose file → **dry run**. The report lists per row: new / skipped (identical) / conflicting (proposed changes to an existing ID) / held (possible duplicate) / failed, with warnings.
3. Reviewer decides: tick "create anyway" for held duplicates; tick individual field changes for conflicts. Nothing is merged or overwritten otherwise.
4. **Apply**. The raw file text and the report are stored with the import; each change is written to the audit history. Download the report as Markdown.

Rules enforced: imports become `draft`/`needs_review` only; `verified` coordinates need source + date (else downgraded to `source_reported`); out-of-range coordinates are dropped and flagged; unrecognised states are left blank and flagged; unknown stays unknown (durian picking is never inferred).

Matching: exact/near name (EN, ZH, alias), name + <150 m, shared source URL. Score ≥ 0.75 → held; 0.5–0.75 → flagged as related.

## Starter collection (`data/poi/seed_collection.csv`)
Built by `node tools/build-seed.mjs` from the untouched handover file `data/poi/source/poi_starter_original.csv`.
- 16 distinct KL-area POIs verified from the 17 Word files: Aquaria KLCC ×2 and Istana Negara ×2 are byte-identical duplicates (SHA-256), and `07-food-venues.docx` holds two restaurants (Ho Kow, Pik Wah). Batu Caves is Selangor.
- 23 research candidates (SEED-017…039) are unverified listings from the handover.
- All rows are `needs_review`. States are marked "inferred". No coordinates were invented; only SEED-036 has a third-party-reported coordinate (`source_reported`, shown to staff as an unconfirmed pin, never to passengers).
- Word originals and the reference image are **not** committed (repo is public; rights unknown). Document names and hashes are in the source entries.

## Research workflow (repeatable, human-in-the-loop)
1. Pick a region and a theme (major attraction, farm, food, cave/waterfall, craft, night).
2. Search permitted sources: operator sites, tourism boards, heritage bodies, Trip.com listings, reputable publications. Respect robots/terms; no scraping behind logins.
3. For each candidate record only short facts in your own words, the source URL, type and access date; keep unknown fields blank.
4. Activities: set `confirmed` only with explicit operator evidence; otherwise `unknown`. Conflicting sources → keep `unknown`, add a `review_flags` entry and a source note.
5. Never estimate coordinates, prices, hours or contacts.
6. Export to the CSV template with a fresh `candidate_id` range and namespace, run the dry run (duplicate check against the master), have a human review.
7. Log tool usage (known and unknown costs) in the pilot section below.

### Pilot and spend
`FIRECRAWL_API_KEY` and `EXA_API_KEY` are **not present** in this environment, so no Firecrawl credits or Exa dollars were spent and real balances are unknown. The pilot (Green Acres, Balik Pulau) used the platform's web search/fetch tools (cost not measurable here) and one plain HTTP fetch of the operator page. Findings: the operator booking page is JavaScript-rendered and could not be read automatically; farm tour and tasting are supported by the operator listing title plus an owner-quoted 2022 news article; one reseller's Chinese text mentions durian picking, which conflicts with other sources, so `durian_picking` stays `unknown` and is flagged. No hard spending cap is implemented; a future runner must check balances itself and stop before unknown-cost calls.

## Migration, backup, rollback
Nothing is migrated yet: the current app has no POI store (tours are in browser localStorage, attractions are bundled code). New data lives under new keys (`mytguide_poi_master_v1`, `mytguide_poi_private_v1`, `mytguide_itinerary_picks_v1`, `mytguide_builder_draft_v1`); existing keys are unchanged.
- Backup before any Firestore move: `gcloud firestore export` to a bucket (staging first), and keep the git commit of the pre-change `main` (`9620cc9`).
- Rollback: redeploy the previous hosting release (`firebase hosting:rollback`) and restore from the export; local data can be cleared by removing the four keys above.
- Old itineraries: stops that reference the bundled attraction library are unchanged. Stops added from the master carry a frozen snapshot (`poiRef`: name, state, verified coordinates only, duration, summary, source status, snapshot time, POI version), so later edits or archiving do not rewrite an agreed plan.
