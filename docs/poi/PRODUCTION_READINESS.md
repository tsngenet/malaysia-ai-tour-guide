# Baseline, test evidence and production-readiness report

Prepared 2026-11-12. **Not production-ready.** Staging was not provisioned and nothing was deployed.

## Verified baseline
- Repo `tsngenet/malaysia-ai-tour-guide` (public), branch `main` @ `9620cc9`; work on `hoplite/athenai-5041385a`. Working tree clean at start.
- Stack: Vite + React 18, Node `server.mjs` (AI Q&A + static), PWA service worker. `.firebaserc` default project `msiatguide`; hosting only (`firebase.json`). **No Firestore, Auth or Storage code, no rules existed.** Which Firebase project is production vs staging cannot be verified from the repo; the name alone proves nothing. No second project/target is configured.
- Data: attractions (6) bundled in `src/data/attractions.js`; tours in `localStorage`. No POI master, no map, no roles. Existing tests: `npm test` (API integration).
- Confirmed issues in the existing builder: it could only edit the default tour; save failures were swallowed while the UI still said "published"; no unsaved-work protection; the "QR" was a decorative static drawing; the passenger link pointed at a fixed hosting URL and only worked where the tour sat in the same browser's storage; stops had no visit duration.
- Not available: Firebase credentials/CLI login, Firecrawl/Exa keys, the Copilot spreadsheet, the original PWA design files. The illustrated reference image was inspected only as a style reference and is not committed.

## What was built
POI schema + store + audit history + role-gated private data; CSV/JSON import with dry run, duplicate matching, conflicts, report; boundary-based map (`#/map`) with hover/tap state summaries, searchable state list, filters, clustering, status key, keyboard access; collect/review screen (`#/poi`); itinerary builder upgrades (blank/copy itinerary, master-POI search, map picks, editable durations, up/down order, explicit saving/saved/error, draft recovery, leave-page warning, real QR); serverless passenger link (`#/s/<payload>`); Firestore/Storage rules.

## Tests actually run
| Area | Result |
|---|---|
| `node --test tests/*.test.mjs` (POI core, importer, store, access, geo, share codec) | 30/30 pass |
| Firestore + Storage rules, emulator (`rules-tests`, Java 21 via mise, demo project) | 213/213 pass |
| `npm run build` | passes |
| Browser, 390×844 viewport (agent-browser): starter import 39/39; KL shows 19 needs-review as driver; as passenger counts are 0 and no status breakdown; 13 state shapes; one unconfirmed pin visible to staff only; no horizontal overflow | pass |
| Passenger link opened in cleared browser state stores the shared tour | pass (live tour screen not walked through) |

## Four-hour itinerary test (phone viewport, **automated emulation, not a human on a real phone**)
Blank itinerary → add 5 places by search → move one up → set one duration → save → open QR: **15 gestures** (1 + 5×2 search/tap + 1 reorder + 1 duration + 1 save + 1 QR). Elapsed time is not meaningful because it is script-driven. Friction seen: each add requires typing a query; multi-select from the map needs a round trip to the builder. A real driver test is still required.

## Not tested / blocked / remaining
- Real Firebase Auth, role claims, Firestore-backed POIs and itineraries: **not implemented** (no project access). The in-app role switcher is a demo simulation, not security; `/operator` remains ungated as before. The rules are tested in isolation, not against the app.
- Staging release: none. A separate Firebase staging project must be created/confirmed by you.
- Offline: edits are local-first; no sync is promised or tested.
- Passenger share link carries the itinerary in the URL (public fields only); long itineraries may exceed QR capacity (warned). Passenger live view in Chinese for shared POI stops not exercised end-to-end.
- Map: no tiles used (no licence needed); boundaries are geoBoundaries (CC BY 4.0, underlying OSM ODbL; 2017, simplified; shared borders can gap by a few hundred metres) — legal review before production. Decorative emoji art stands in for the illustrated style; a commissioned/licensed illustration is a remaining design task. Touch pinch-zoom not implemented (buttons + drag).
- Hard-coded `msiatguide.web.app` fallback links remain in older code paths.
- Accessibility: keyboard/aria implemented, no screen-reader or automated audit run.
- Reference image rights unestablished; research pilot covers one place only; 23 candidates and 16 KL records all need human review and verified coordinates.
- Existing UI: not regression-tested beyond build and the flows above.

## Decisions needed from you
1. Create/confirm a Firebase **staging** project and grant access (or confirm `msiatguide` is staging).
2. Confirm whether Word originals may be stored in a private location (repo is public).
3. Approve provisioning Firebase Auth roles (driver/contributor/reviewer/admin).
4. Rotate the API credential mentioned in the handover README if still active.
