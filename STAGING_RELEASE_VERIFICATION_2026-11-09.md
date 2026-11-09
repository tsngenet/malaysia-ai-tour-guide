# Malaysia AI Tour Guide — Production Release Candidate QA

**Verification date:** 2026-11-09 (Malaysia time)
**Working branch:** `feature/route-builder-phase1`
**Staging Firebase project:** `msiatguide-staging`
**Production Firebase project:** `msiatguide` — NOT DEPLOYED by this QA round
**Staging preview:** https://msiatguide-staging--staging-phase1-0kpbvc8c.web.app/
**Preview Hosting version:** `59e3ced81b71a76e` (expires 2026-11-23)

## Verified code repairs

- Mobile itinerary/catalog switcher, and properly fixed viewport login/custom/QR modals.
- Publish UI shows passenger QR and success only after Firestore acknowledges the write.
- Passenger link uses the current Hosting origin (staging and production correctly separated).
- Shared sample tour and already-published tours get new IDs and codes for new drafts/publications; existing published records remain immutable.
- Custom stops may be saved without GPS coordinates. Invalid or one-sided coordinates are rejected; no assumed prior-stop/KL coordinates.
- Published and draft Firestore stop payloads retain day, custom narration, GPS trigger radius, travel and schedule information.
- New unit regression tests added and `npm test` runs route and API integration checks.

## Automated validation results

- `npm test`: **26/26 route-builder tests PASS; 5/5 API integration checks PASS**.
- Real Firestore emulator with checked-in `firestore.rules`: **25/25 PASS**, including public published reads, private drafts, immutability and role restrictions.
- Real Storage emulator with checked-in `storage.rules`: **14/14 PASS**, including upload ownership and file type restrictions.
- `vite build --mode staging`: PASS, bundle references staging Firebase project.
- `vite build --mode production`: PASS, bundle references `msiatguide.firebaseapp.com` and does NOT contain `msiatguide-staging`.
- `git diff --check`: PASS (Windows line-ending warnings only).
- Bundler advisory: JavaScript chunk around 1.16 MB / 363 KB gzip; optimization later, not a blocking error.

## Staging browser E2E (Browser Use)

PASS at 390x844 and 1280x900:
1. Modal opens correctly and is usable on mobile.
2. Fresh disposable driver registers successfully in staging.
3. Title-only custom stop (both GPS fields blank) is saved without invented coordinates.
4. Draft is acknowledged as saved in cloud.
5. Published snapshot generates a genuine tour link `MYTG-20261109-TXSU`.
6. After logout, the passenger tour opens with 10 stops including custom stop.
7. Edited republish creates immutable new code `MYTG-20261109-29KZ`; it opens logged out with updated title and 10 stops.
8. No horizontal overflow or final passenger console errors.

Original: https://msiatguide-staging--staging-phase1-0kpbvc8c.web.app/?tour=MYTG-20261109-TXSU
Edited: https://msiatguide-staging--staging-phase1-0kpbvc8c.web.app/?tour=MYTG-20261109-29KZ

## Non-blocking warnings / limits

- One transient `auth/network-request-failed` appeared during a sign-in; retry worked. Monitor on production and improve retry messaging later.
- An attempt to open a separate browser context failed with proxy error `ERR_SOCKS_CONNECTION_FAILED`; logged-out same-browser verification succeeded.
- Route estimates use Haversine approximation rather than verified road navigation; long-distance/overnight warnings are advisory. Do not market estimates as exact road travel times.
- No new Exa, AdSense, restaurant-sponsor or GPS-pin-autodiscovery feature is part of this release.

## Production release gate — still required

1. Verify production Firebase Authentication Email/Password provider, deployed Firestore and Storage rule versions, authorized domains, indexes, and any required backups using production console.
2. Approve a specific production go-live/hosting deployment with project ID `msiatguide`; do NOT deploy the staging bundle.
3. Immediately before approved production deploy, rebuild with `vite build --mode production`, verify bundled project, then deploy hosting explicitly with `--project msiatguide`.
4. Validate a new production driver / publish / anonymous passenger link, and retain a Firebase Hosting rollback version.
5. Begin AdSense readiness only after production is stable.

**Current decision:** staging-tested release candidate; production website remains untouched. Production readiness means code/QA is prepared, not that production deployment is authorized or finished.

## Final production preflight addendum (2026-11-09)

**Production authentication:** Read-only Identity Toolkit Admin API confirmed Email/Password enabled and authorized domains `msiatguide.firebaseapp.com`, `msiatguide.web.app`.
**Production Firestore rules:** Active deployed ruleset SHA-256 (normalized newlines) exactly matched the tested checked-in `firestore.rules`. Its public tour read and restrictive ownership rules passed the local Firestore emulator tests (25/25).
**Anonymous production Firestore query:** Actual Firebase client query `tours_published` by a deliberately nonexistent code completed successfully without authentication; no production record created.
**App Check:** API returned no configured service enforcement entries; no evidence of blocking web clients.
**Production Storage:** API reported no Storage bucket. Image uploads are NOT a working feature in this hosting-only release; current frontend does not call Storage upload APIs.
**Rollback:** Preserved previous live Hosting release in channel `pre-release-20261109` at https://msiatguide--pre-release-20261109-uz73z0oc.web.app
**Existing production Hosting release:** version `79e3496cd46d8498` (2026-11-07). No live deployment performed during preflight.
**Staging preview refreshed:** version `0d5a9833c1ad6b35`; URL https://msiatguide-staging--staging-phase1-0kpbvc8c.web.app
**Final guided-question repair:** Firebase Hosting uses prepared guide notes without making broken POST requests to `/api/ask`; clearly labeled `Built-in guide notes (not live AI)`. Config flag `VITE_GUIDE_API_ENABLED` must explicitly be `true` only after a real backend is deployed.
**Chrome staging smoke:** Logged-out passenger tour `MYTG-20261109-TXSU` loaded and advanced to Batu Caves. Ask Guide opened and returned notes. Label and no-live-AI notice both appeared; zero requests to `/api/ask`; no unhandled errors.
**Limitations:** Live generative AI Q&A is not yet deployed; real road travel times are not provided, and photo uploads have no production Storage bucket. Do not market these as working features. Ads/Exa remain deferred.
**Release decision:** Core itinerary/QR/passenger pilot meets tested release criteria. Hosting-only production deployment allowed following explicit user approval; no database or rule writes are part of this deployment.
