# Malaysia AI Tour Guide — Phase 1B Implementation Report: Firebase Shared Itineraries

**Working Branch:** `feature/route-builder-phase1`  
**Test Environment:** Node / Vite HTTP daemon (Port `3055`), Firebase Auth Emulator (Port `9099`), Playwright Multi-Context Automation  
**Status:** Tested Local Release Candidate (No unapproved Git pushes or production Firebase deployments)

---

## 1. Executive Summary

Phase 1B successfully bridges the gap between **driver-created custom itineraries** and **passenger in-vehicle access**. Prior to this phase, itineraries created in the Driver Itinerary Builder were trapped inside the driver's local device storage (`localStorage`) and could not be accessed by passengers scanning a vehicle QR code on a separate device.

With Phase 1B:
1. **Authenticated Driver Management:** Drivers must authenticate (Firebase Auth / local emulator session) to create, save drafts, and publish itineraries.
2. **Public QR / Link Access for Passengers:** Passengers can open published itineraries across any device without signing in or downloading an app.
3. **Collision-Resistant Tour Codes:** Every itinerary generates a unique, human-friendly, collision-resistant tour code (`MYTG-YYYYMMDD-XXXX`).
4. **Draft vs. Published Snapshot Isolation:** Private drafts (`tours_draft/{tourId}`) are completely isolated from immutable published snapshots (`tours_published/{tourId}`). A driver editing a draft in their route builder will **never** alter the passenger's live, published route without an explicit re-publish action.
5. **Strict Invalid Code Handling (Requirement 9):** Invalid tour codes or expired links render a dedicated, branded "Tour Not Found" recovery card, strictly prohibiting silent fallback to an unrelated default tour.
6. **Zero Anonymous Passenger PII Collection:** No passenger personal identifying information is captured or stored.
7. **No Fabricated GPS Coordinates:** Vetted attractions retain accurate Malaysian coordinates; custom stops without verified GPS coordinates remain safely null and do not trigger false proximity notifications.

---

## 2. Architecture & Data Flow

```
+-----------------------------------------------------------------------------------+
| DRIVER CONTEXT (Authenticated: drv-ipoh-882 / Captain Ramesh)                     |
|                                                                                   |
|  1. Load Template / Add Stops  ───>  2. Save Draft (Private)                      |
|                                              │                                    |
|                                              ▼                                    |
|                                     tours_draft/{tourId}                          |
|                                              │                                    |
|                                      3. Publish Snapshot                          |
|                                              │                                    |
|                                              ▼                                    |
|                                   tours_published/{tourId}                        |
|                                   - Immutable Snapshot                            |
|                                   - Tour Code: MYTG-20261107-XXXX                 |
|                                   - Real Scannable Vehicle QR                     |
+-----------------------------------------------------------------------------------+
                                              │
                    QR Scan / Direct Link     │
                    http://localhost:3055/?tour=MYTG-20261107-XXXX
                                              │
                                              ▼
+-----------------------------------------------------------------------------------+
| PASSENGER CONTEXT (Clean Storage / Incognito / Separate Phone Device)            |
|                                                                                   |
|  1. Anonymous Query to /api/tours/published/:idOrCode                             |
|  2. Fetches EXACT immutable snapshot (7 Ipoh stops, scheduled durations)          |
|  3. Subsequent driver draft edits DO NOT affect active passenger view             |
|  4. Invalid codes -> Branded "Tour Not Found" card (No silent fallback!)         |
+-----------------------------------------------------------------------------------+
```

---

## 3. Key Implementation Highlights

### 3.1 Driver Authentication & Session State
- Integrated `src/lib/firebase.js` with Firebase Auth and the local Auth Emulator on `127.0.0.1:9099`.
- Added seeded test driver account: `driver@mytguide.my` / `DriveSafe2026!` (UID: `drv-ipoh-882`).
- Added responsive **Driver Status Bar** and **Driver Login Modal** in `src/components/OperatorTourBuilder.jsx`.
- Unauthenticated drivers attempting to save drafts or publish are prompted with a secure login dialog.

### 3.2 Draft vs. Published Snapshot Isolation
- In `server.mjs` and `firestore.rules`:
  - `tours_draft`: Read and write permitted only to the owner driver (`driverUid == request.auth.uid`).
  - `tours_published`: Read permitted to anyone (passengers without login); creation/updates permitted only to the authenticated owner driver; critical snapshot fields (`tourId`, `code`, `driverUid`, `publishedAt`, `stops`) are verified and protected against accidental tampering.
- Tested by editing Stop 1 in the driver's draft from 30 minutes to 75 minutes after publishing: the passenger's view in an independent browser context maintained the original published 30-minute duration.

### 3.3 Scannable Vehicle QR Code Generation
- Generated on-the-fly using `qrcode` library with the China-red visual identity (`#C8102E` on `#FFFFFF`).
- Dynamically resolves to `http://localhost:3055/?tour=${tourCode}` in local test environments and `https://msiatguide.web.app/?tour=${tourCode}` in production.

### 3.4 Requirement 9: Invalid Tour Code Handling
- Previously, unknown tour codes defaulted to `DEFAULT_TOUR_ID` (KL/Melaka).
- Updated `src/data/tours.js` (`getTourById(idOrCode, fallbackToDefault = false)` and `fetchTourByIdOrCodeAsync`) to return `null` on unknown codes.
- Added a dedicated, branded `.tour-error-screen` in `src/main.jsx` and `src/styles/app.css` with:
  - Error badge: `TOUR NOT FOUND`
  - Highlighted entered code: `"{tourError.code}"`
  - Action buttons: `[ Enter Another Tour Code ]`, `[ View Sample Tour ]`, and `[ Go to Driver Route Builder ]`.

---

## 4. Verification & Automated Test Results

### 4.1 Unit & Invariant Test Suite (`node test_route_builder.mjs`)
- **Total Tests:** 23
- **Passed:** 23
- **Failed:** 0
- **Duration:** < 1 second

### 4.2 Playwright Multi-Context End-to-End Suite (`node scripts/test_shared_itineraries.mjs`)
- **Test Context A (Driver Workspace):**
  - Unauthenticated banner detected: **PASS**
  - Driver login via modal (`driver@mytguide.my`): **PASS**
  - Driver authenticated badge (`Captain Ramesh`, UID: `drv-ipoh-882`): **PASS**
  - Template loading (`tpl-ipoh-1day`, 7 stops): **PASS**
  - Private draft save: **PASS**
  - Itinerary publication & collision-resistant code generation (`MYTG-20261107-48CU`): **PASS**
  - QR Code generation (`data:image/png;base64,...`): **PASS**
  - Draft isolation (draft edit from 30m to 75m does not affect published snapshot): **PASS**
- **Test Context B (Clean Passenger Browser, Incognito, No Cookies/LocalStorage):**
  - Open passenger QR link without login: **PASS**
  - Welcome screen loads with published title: **PASS**
  - Click "START LIVE TOUR" & bypass GPS modal: **PASS**
  - Live Tour shell loads: **PASS**
  - Open Itinerary Drawer: sees all 7 stops: **PASS**
  - Stop 1: `Pickup & Morning White Coffee`: **PASS**
  - Stop 7: `Perak Tong Cave Temple`: **PASS**
  - Stop 1 duration verified at original published 30 mins: **PASS**
- **Requirement 9 (Invalid Tour Code):**
  - Open `/?tour=INVALID-TOUR-CODE-9999`: **PASS**
  - `.tour-error-screen` displayed with exact code: **PASS**
  - No silent fallback to default tour: **PASS**
  - Recovery button returns to Landing Page: **PASS**

### 4.3 Screenshots Captured
1. `audit_screenshots/phase1b_01_driver_published_qr.png` — Driver Authenticated Workspace with scannable QR Code modal and Tour Code.
2. `audit_screenshots/phase1b_02_passenger_welcome.png` — Clean Passenger Welcome Screen loaded from QR link without login.
3. `audit_screenshots/phase1b_03_passenger_itinerary_drawer.png` — Passenger Itinerary Drawer showing all 7 verified Ipoh stops.
4. `audit_screenshots/phase1b_04_tour_not_found_error.png` — Requirement 9 "Tour Not Found" error card preventing silent redirection.

---

## 5. Operations Requiring Owner Deployment Permission

Per strict safety guidelines, no production deployment, merging into `main`, or GitHub push has been executed. The following operations require explicit owner authorization:

1. **Git Remote Push:**
   - Push branch `feature/route-builder-phase1` to `https://github.com/tsngenet/malaysia-ai-tour-guide.git`.
2. **Main Branch Pull Request / Merge:**
   - Open PR to merge `feature/route-builder-phase1` into `main`.
3. **Firebase Hosting Deployment:**
   - `firebase deploy --only hosting` to publish latest Vite bundle (`dist/`) to `https://msiatguide.web.app`.
4. **Cloud Firestore Rules Deployment:**
   - `firebase deploy --only firestore:rules` to deploy hardened rules in `firestore.rules`.
5. **Firebase Storage Rules Deployment:**
   - `firebase deploy --only storage` to deploy media rules in `storage.rules`.
