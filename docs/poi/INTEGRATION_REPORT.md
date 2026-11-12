# Integration report: POI master + map merged into the Firebase-enabled PWA

Branch `integration/poi-firebase`, based on `feature/route-builder-phase1` @ `26da531` (the Antigravity branch). Nothing was deployed. No Firebase project was contacted: this sandbox has no Google credentials, so every Firebase test below ran against **local emulators with synthetic data**.

## Is the POI master browser-local or Firebase-backed?
**Browser-local.** POIs, imports, history and private driver notes are kept in `localStorage` (`src/poi/store.js`). There is **no cloud sync of POIs**. Firestore rules for `poi_master`, `poi_imports` and `driver_poi_private` are written and emulator-tested, but the UI does not read or write those collections yet. Itinerary drafts and published snapshots remain Firestore-backed exactly as in the Antigravity branch. Consequences: another phone or browser sees an empty POI master; clearing site data removes it; the in-app role gate is only a UI gate (the real gate would be the rules once wired).

## What was merged (and what was not)
- Kept from the Firebase branch, untouched: Firebase Auth sign-in/registration, `tours_draft`, `tours_published` immutable snapshots, passenger QR/links, "tour not found", schedule engine, drag-and-drop plus up/down controls, route templates, service worker, all existing rules and their tests.
- Added from the POI branch: POI schema/store/audit history, CSV/JSON import with dry-run, duplicate warnings and conflict review, import report, state-boundary map (`#/map`), collection/review screen (`#/poi`), POI cards, field dictionary, template, example JSON, starter CSV (not auto-imported), boundary data and tooling.
- Reconciled by hand (not copied over): `main.jsx` (routes only), `OperatorTourBuilder.jsx` (adds a POI picker panel, a visible "Saving…" state and an explicit failure message when the cloud save is not confirmed), `tourSerialization.js` (keeps `poiRef`), `firestore.rules` and `storage.rules` (new collections appended before the catch-all; existing matches unchanged).
- **Not** brought over because the Firebase branch already does it better: my local-only builder, the serverless `#/s/` share link, and my own rules/test harness (superseded; its cases were rewritten for this role model).
- Role mapping: signed-out = passenger; any signed-in user (self-registered driver) = driver; token role `reviewer`/`operator` = reviewer; `admin` = admin. Demo role switcher exists in dev builds only.

## Privacy model (enforced in rules, emulator-tested)
- `poi_master`: public may read only `status == 'approved'` (queries must filter); drafts/needs-review readable by the creator and reviewers/admins; create only as draft/needs_review with `createdBy == uid`; reviewers approve/archive; commission/driverNotes keys rejected; **no deletes**.
- `driver_poi_private/{uid}/pois/{poiId}`: owner only. Passengers, other drivers, reviewers and admins are denied; no delete.
- `poi_master/*/history`: append-only, reviewers read. `poi_imports`: creator + reviewers read; originals immutable to authors.
- Storage `poi_media/pending` (signed-in upload, reviewer read) and `poi_media/public` (public read, reviewer write).
- Published snapshots keep a frozen `poiRef` per POI stop; unreviewed POIs expose name only, so editing/archiving a master POI never changes an agreed itinerary.
- The 39 starter records are bundled as a file and imported only by a signed-in driver pressing the button, into the local store. They are never written to Firestore automatically.

## Tests run (all local/emulator; none against msiatguide or msiatguide-staging)
| Suite | Command | Result |
|---|---|---|
| POI unit tests (import, Unicode, duplicates, idempotency, counts/filters, pin status, privacy, stop snapshots) | `npm run test:unit` | 29 / 29 pass |
| Existing route-builder + API tests | `npm test` | 26 + 5 pass |
| Existing Firestore + Storage rules tests (emulator) | `scripts/test_firestore_rules_emulator.mjs`, `scripts/test_storage_rules_emulator.mjs` | pass (storage 14/14) |
| New POI rules (Firestore + Storage emulators) | `npm run test:rules:poi` | 34 / 34 pass |
| Combined E2E at 390×844 on Auth+Firestore emulators: sign-in, local import, idempotent re-import, map counts (KL 19 needs-review), Chinese names, add places, edit duration, reorder, save draft to Firestore, publish, passenger opens link without login, invalid code "not found", passenger map shows nothing unapproved, offline save shows a not-confirmed warning | `npm run test:e2e:poi` | 10 / 10 pass |
| Production build | `npm run build` | pass |

Gaps: the earlier standalone 213-test rules suite was not carried over (superseded by the 34 above plus the existing suites); no real-device or screen-reader test; the E2E is scripted, so tap counts/timings are not a human usability result; no run against real Firebase.

## Not done
- Firestore-backed POI reads/writes, cloud sync, reviewer approval UI against Firestore, role-claim provisioning, media upload UI.
- Starter coordinates remain unknown except one third-party-reported (staff-only, dashed "unconfirmed" pin). No pins are exact until a reviewer verifies them.
- The "illustrated" look is decorative emoji over a boundary map; commissioned/licensed artwork is outstanding. Boundary data licence (CC BY 4.0 over OSM ODbL, 2017) needs legal review (`docs/map/BOUNDARIES.md`).
- Older hard-coded `msiatguide.web.app` fallbacks in the Firebase branch (`scheduleEngine.createPublishedSnapshot` default origin) were left as they were; the builder passes the real origin.

## Steps for Antigravity (staging only: `msiatguide-staging`; never `msiatguide`)
1. Authenticate with an identity limited to the staging project and run `firebase use staging` (`.firebaserc` already maps `staging` → `msiatguide-staging`; do not use `--project msiatguide`).
2. Read-only inspection first: list Auth users count, Firestore collections, Storage objects, current deployed rules. Do not assume the project is empty.
3. Diff the deployed rules with this branch's `firestore.rules`/`storage.rules` before deploying; keep any rules in staging that are newer.
4. Deploy only after review: `firebase deploy --only firestore:rules,storage --project msiatguide-staging`, then a staging build (`.env.staging`) to the staging Hosting site.
5. Provision synthetic reviewer/admin users with custom claims via the Admin SDK in staging only.
6. Re-run `npm run test:rules:poi`, `npm run test:e2e:poi` (emulators) and the existing `scripts/test_phase1c_real_firebase.mjs`, then a manual phone pass on the staging URL. Record results as staging evidence.
7. Production only after Felix reviews the staging evidence and approves.
