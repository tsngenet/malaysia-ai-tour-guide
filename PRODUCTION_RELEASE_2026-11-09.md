# Malaysia AI Tour Guide — Production Release Record

**Deployment date:** 2026-11-09 (MYT)
**Live URL:** https://msiatguide.web.app
**Firebase project:** `msiatguide`
**Hosting version:** `b1380b6f3121af0b`
**Source branch:** `feature/route-builder-phase1`
**Source commit:** `2d2bd6b`
**Deployment scope:** Hosting only; no Firestore/Storage rules or database records were changed.

## Preflight evidence

- Firebase Auth Email/Password is enabled; `msiatguide.web.app` and its auth domain are authorized.
- Deployed Firestore rules match the checked-in rules exactly (normalized SHA-256), previously verified with **25/25** Firestore security emulator tests.
- Production Firestore public `tours_published` query succeeded anonymously.
- App Check service enforcement not configured.
- Staging end-to-end test passed: driver registration, cloud draft, publish, anonymous passenger link, immutable edited republish, mobile/Desktop responsive checks.
- `npm test`: **26 route-builder + 5 local Node/API integration tests passed**. The local API integration test does not imply a hosted live AI API.
- Storage emulator rules: **14/14 tests passed**, but no production Storage bucket exists; photo uploads remain unavailable.
- Production Vite build passed and verified `msiatguide.firebaseapp.com` and no staging project reference.

## Live smoke checks

- Chrome 390x844: public sample tour loads; manual journey advances to Batu Caves.
- Guide-question sheet displays prepared tour knowledge with the explicit label `Built-in guide notes (not live AI)`; **zero** requests to missing `/api/ask` backend.
- Driver operator page loads without horizontal overflow; sign-in modal appears fixed to viewport.
- Staging-only tour code `MYTG-20261109-TXSU` returns `TOUR NOT FOUND` in production, confirming data isolation.
- Postdeployment Firebase Hosting API confirms release `b1380b6f3121af0b`; Firestore rules stayed unchanged.

## Recovery

Prior live Hosting version: `79e3496cd46d8498`.
Rollback preview snapshot: https://msiatguide--pre-release-20261109-uz73z0oc.web.app

To restore earlier Hosting content if later authorized:

```bash
firebase hosting:clone msiatguide:pre-release-20261109 msiatguide:live --project msiatguide
```

## Explicit limitations and follow-up

- **No live generative AI backend:** Firebase Hosting serves prepared guide notes. Avoid promising unrestricted AI Q&A.
- **No production Storage bucket:** Contributions requiring photo uploads are not part of this pilot.
- Route travel times are approximate/straight-line-based and clearly flagged as unverified, not guaranteed road ETAs.
- AdSense, Exa data imports, smart POI/GPS discovery and sponsor integrations have **not** been deployed.
- Fresh production driver account creation was intentionally not performed to avoid generating test users/data; production Auth provider and Firestore policy were verified directly, and the complete write/publish flow passed on isolated staging.
