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
