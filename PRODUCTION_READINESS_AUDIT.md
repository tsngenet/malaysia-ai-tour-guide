# Production-Readiness Audit Report
**Project:** Malaysia AI Tour Guide PWA (`tsngenet/malaysia-ai-tour-guide`)
**Working Branch:** `feature/route-builder-phase1`
**Audit Date:** 2026-11-07
**Evaluator:** Antigravity Engineering Lead / Full-Stack & Security Auditor

---

## 1. Executive Summary & Classification Matrix

This production-readiness audit evaluated the complete Malaysia AI Tour Guide progressive web application (PWA) across six dimensions:
1. **Passenger & Driver Experience Invariants** (anonymous access, route building, scannable QR, schedule calculation).
2. **Security & Access Control** (Firestore Security Rules, Storage Rules, RBAC anti-escalation, immutable snapshots).
3. **Automated Test Suites** (unit, emulator rules testing, multi-context E2E, API integration).
4. **Code, Configuration & Secret Hygiene** (credential scan, emulator vs. production switching, bundle hygiene).
5. **Infrastructure & Hosting Configuration** (`firebase.json`, SPA routing, caching headers).
6. **Deployment Staging & Approval Requirements** (explicit prerequisites prior to production release).

### Overall Readiness Classification: `READY FOR STAGING (BLOCKED FROM PROD PENDING OWNER APPROVAL)`

| Component / Subsystem | Classification | Key Findings / Verification Evidence |
|---|---|---|
| **Passenger Anonymous Access** | `PASS` | Verified in Playwright E2E with clean, unauthenticated browser storage. Loads published itineraries directly from Cloud Firestore via `tours_published` with zero login hurdles. |
| **Driver Authentication & Isolation** | `PASS` | Official Firebase Auth SDK Email/Password authentication. Driver A and Driver B drafts in `tours_draft` are strictly isolated; cross-driver tampering blocked. |
| **Published Snapshot Immutability** | `PASS` | Drivers cannot update or delete published snapshots. Snapshot updates restricted to `isAdmin()`. Editing a draft does not alter the published passenger itinerary. |
| **Firestore Security Rules** | `PASS` | All **21 / 21 tests** passed against Cloud Firestore Emulator on port 8080. Default deny enforced on all unhandled paths; coordinate (0,0) validation in place. |
| **Storage Security Rules** | `PASS` | Strict content-type (`image/*`), max size (10MB), and role-based path scoping enforced. |
| **Route Builder & Schedule Engine** | `PASS` | All **23 / 23 unit tests** passed. Accurately handles multi-day scheduling, meal breaks, duration warnings, and eliminates the 21h itinerary bug. |
| **End-to-End Browser Flow** | `PASS` | Multi-context Chromium tests passed (Exit Code 0). Verified QR creation, passenger scanning, Journey drawer, and server restart resilience. |
| **Requirement 9 (Invalid Tour Codes)** | `PASS` | Unknown or mistyped codes render branded "Tour Not Found" recovery screen; zero silent fallback to default tour. |
| **Credential & Secret Scanning** | `PASS` | Automated regex scanner confirmed **0 exposed production credentials, private keys, or passwords** in source files. |
| **Emulator Configuration Leak Protection** | `PASS` | `src/lib/firebase.js` hardened: emulators only connect when `window.location.hostname` is `localhost` / `127.0.0.1` or when `VITE_USE_FIREBASE_EMULATOR=true`. Production domains bypass emulators. |
| **Production Build (`npm run build`)** | `PASS` | Vite v5 built 159 modules in 4.34s without errors into `dist/`. Assets chunked into `index-*.js` and `index-*.css`. |
| **Live Production Firebase Resources** | `NOT TESTED` | Live Firebase project (`msiatguide`) deployment has **NOT** been executed, abiding strictly by repository safety constraints. |
| **Production Driver Accounts** | `BLOCKED` | Awaiting owner provisioning of authorized driver email/password accounts in the production Firebase project. |
| **GitHub Remote Push & Main Merge** | `BLOCKED` | Preserved on `feature/route-builder-phase1`. Blocked pending explicit repository owner sign-off. |

---

## 2. Security Rules & Data Access Audit

### 2.1 Cloud Firestore Rules (`firestore.rules`)
Audited against Google Cloud Firestore Security Rules specification:

1. **Anonymous Passenger Read Access:**
   - Path: `match /tours_published/{tourId}` and `match /published_tours/{tourId}`
   - Rule: `allow read: if true;`
   - Evaluation: **PASS**. Enables collection queries by public short code (`where('code', '==', idOrCode)`) and direct document retrieval without requiring passenger accounts.
2. **Driver Draft Privacy & Ownership:**
   - Path: `match /tours_draft/{tourId}`
   - Rule: `allow read, update, delete: if isAuthenticated() && (request.auth.uid == resource.data.driverUid || isAdmin());`
   - Rule: `allow create: if isAuthenticated() && (request.auth.uid == request.resource.data.driverUid || isAdmin()) && isValidDraftTour(request.resource.data, tourId);`
   - Evaluation: **PASS**. Prevents unauthorized drivers and anonymous passengers from viewing, editing, or deleting drafts.
3. **Published Snapshot Immutability:**
   - Rule: `allow update, delete: if isAdmin();`
   - Evaluation: **PASS**. Standard drivers cannot tamper with, overwrite, or delete published snapshots. Drivers must publish a new numbered version snapshot if changes are needed.
4. **User Profile Role Anti-Escalation:**
   - Path: `match /users/{userId}`
   - Rule: Prevents standard users from assigning `role: 'admin'` or modifying their own `uid` or `role` upon update.
   - Evaluation: **PASS**.
5. **Default Deny Fallback:**
   - Path: `match /{document=**}`
   - Rule: `allow read, write: if false;`
   - Evaluation: **PASS**. Tested and verified in Group 1 of emulator rules suite.

### 2.2 Cloud Storage Rules (`storage.rules`)
- Validates MIME type: `image/(jpeg|png|webp)`
- Validates payload size: `<= 10MB`
- Admin/Operator write for attraction imagery (`/attractions/{placeId}/*`)
- Authenticated write for community contributions (`/contributions/{contributionId}/*`)
- Owner write for user avatars (`/users/{userId}/*`)
- Default deny for all other storage paths (`match /{allPaths=**} { allow read, write: if false; }`)
- Evaluation: **PASS**.

---

## 3. Automated Test Suite Execution Summary

| Suite | File | Tests Run | Result | Exit Code |
|---|---|---|---|---|
| **Firestore Rules Unit Tests** | `scripts/test_firestore_rules_emulator.mjs` | 21 | **21 PASS / 0 FAIL** | `0` |
| **Route Builder & Scheduling** | `test_route_builder.mjs` | 23 | **23 PASS / 0 FAIL** | `0` |
| **Real Firebase E2E Flow** | `scripts/test_phase1c_real_firebase.mjs` | 5 Parts | **ALL PASS** | `0` |
| **Mobile Drag-and-Drop Invariants** | `scripts/test_mobile_drag_drop_invariants.mjs` | 8 Invariants | **8 PASS / 0 FAIL** | `0` |
| **QR Code Encoding & Decoding** | `scripts/test_qr_decoder.mjs` | 1 | **1 PASS / 0 FAIL** | `0` |
| **API & Integration Suite** | `test_integration.mjs` | 5 | **5 PASS / 0 FAIL** | `0` |
| **Frontend Production Build** | `npm run build` (Vite) | 159 modules | **SUCCESS (4.34s)** | `0` |

---

## 4. Environment & Secret Hygiene Audit

### 4.1 Secret & Credential Scan
An automated recursive scan across all project files (`.js`, `.jsx`, `.mjs`, `.json`, `.env`, `.md`) verified:
- **No hardcoded production API keys** exist in client bundles.
- **No private driver passwords or service account keys** are checked into the repository.
- `src/lib/firebase.js` reads `import.meta.env.VITE_FIREBASE_API_KEY` with a public fallback placeholder.
- Local test scripts (`scripts/test_shared_itineraries.mjs`, `scripts/verify_firebase_authenticity.mjs`) use isolated test credentials meant strictly for the local emulator.

### 4.2 Emulator Connection Guard
In `src/lib/firebase.js`, emulator connections are guarded against production execution:
```javascript
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

const shouldConnectEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true' ||
  (import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false' && isLocalhost);

if (shouldConnectEmulator) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
```
- **When deployed to `https://msiatguide.web.app`:** `isLocalhost` evaluates to `false`, and the app communicates directly with production Firebase.
- **When developing on `localhost`:** Uses the local emulators by default.

### 4.3 Git Hygiene & Tracked Files
The `.gitignore` properly excludes:
- `node_modules/`
- `.tools/` (contains local portable OpenJDK 21)
- `.firebase/`
- `.env` and `.env.local`
- `firebase-debug.log*` and `firestore-debug.log*`

---

## 5. File Inventory & Audit of Uncommitted Changes

### Modified Files:
- `.gitignore`: Added `.tools/` to isolate the local Java JRE.
- `firebase.json`: Configured emulator ports (`auth: 9099`, `firestore: 8080`, `ui: false`) and hosting SPA rewrites.
- `package.json` & `package-lock.json`: Added `@firebase/rules-unit-testing`, `playwright`, `qrcode`, `jsqr`, and `firebase`.
- `server.mjs`: Decommissioned mock `/api/auth/driver-*` and `/api/tours/*` endpoints (returns `HTTP 410`).
- `src/components/LandingPage.jsx`: Added collapsible direct tour code lookup input.
- `src/components/OperatorTourBuilder.jsx`: Integrated Firebase Auth SDK, Firestore draft saving, published snapshot creation, and duration warning metrics.
- `src/data/attractions.js` & `src/data/tours.js`: Integrated async Firestore lookup with local offline caching; zero silent fallback on invalid codes.
- `src/lib/journeyEngine.js`: Fixed stop detail resolution to handle custom stops and template stops gracefully without crashing.
- `src/main.jsx`: Added asynchronous remote tour loading, branded Requirement 9 error screen, and SPA routing support.
- `src/styles/app.css`: Added styles for tour builder, duration warnings, modal sheets, and error screens.

### Key Untracked Files Ready for Review:
- `firestore.rules`: Hardened Cloud Firestore Security Rules (21/21 emulator tests pass).
- `storage.rules`: Hardened Cloud Storage Security Rules.
- `src/lib/firebase.js`: Firebase Web SDK client and shared itineraries service layer.
- `src/lib/scheduleEngine.js`: Core itinerary scheduler, Haversine travel time estimator, and duration warnings generator.
- `src/data/routeTemplates.js`: Pre-built route templates (KL, Melaka, Ipoh, Penang).
- `src/data/attractionSchema.js`: Strict validation schema for attraction records.
- `scripts/test_firestore_rules_emulator.mjs`: Official rules unit test suite using `@firebase/rules-unit-testing`.
- `scripts/test_phase1c_real_firebase.mjs`: Playwright multi-context E2E verification script.
- `audit_screenshots/`: High-resolution audit screenshots of driver publishing and passenger views.

---

## 6. Recommended Staging Deployment Steps (Action Plan)

When the repository owner is ready to proceed with staging, execute the following step-by-step sequence:

### Step 1: Commit Feature Branch
```bash
git add .
git commit -m "feat(firebase): integrate genuine auth, firestore persistence, and hardened security rules"
```

### Step 2: Push Feature Branch to GitHub (DO NOT merge to `main` yet)
```bash
git push -u origin feature/route-builder-phase1
```

### Step 3: Configure Live Firebase Project Environment
Create a `.env.production` file (excluded from git) containing the live Firebase Web API credentials:
```bash
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_USE_FIREBASE_EMULATOR="false"
```

### Step 4: Provision Production Driver Accounts
In the Firebase Console (or via Firebase Admin CLI), create authorized driver accounts:
```bash
# Example using Firebase CLI or Console:
# Create driver: driver@mytguide.my
```

### Step 5: Deploy to Firebase Hosting Preview Channel (Staging)
Deploy to an isolated preview channel rather than the live production site:
```bash
# 1. Deploy Security Rules and Indexes first
firebase deploy --only firestore:rules,firestore:indexes,storage

# 2. Build production assets
npm run build

# 3. Deploy to a temporary preview channel
firebase hosting:channel:deploy staging-phase1
```
This generates a temporary staging URL (e.g., `https://msiatguide--staging-phase1-xxxx.web.app`) to test live cross-device behavior before affecting production users.

### Step 6: Validate on Staging URL
1. Driver logs into `https://<staging-url>/#/operator` using live Firebase Auth.
2. Driver publishes a test itinerary.
3. Driver scans QR on physical mobile phone (clean session).
4. Verify physical phone renders the exact itinerary without logging in.

### Step 7: Promote to Production (Requires Final Approval)
```bash
# Merge feature branch to main
git checkout main
git merge feature/route-builder-phase1
git push origin main

# Deploy live production hosting
firebase deploy --only hosting
```

---

## 7. Explicit Approvals Required from Owner

The following actions are **BLOCKED** and will not be executed until explicit owner approval is provided:

1. **[ ] Approval to commit changes to Git:** Staging all modified and untracked Phase 1 files on `feature/route-builder-phase1`.
2. **[ ] Approval to push branch to GitHub Remote:** Pushing `feature/route-builder-phase1` to `tsngenet/malaysia-ai-tour-guide`.
3. **[ ] Approval to deploy Security Rules to Live Firebase:** Deploying `firestore.rules` and `storage.rules` to Firebase project `msiatguide`.
4. **[ ] Approval to deploy to Firebase Preview Channel:** Running `firebase hosting:channel:deploy staging-phase1`.
5. **[ ] Approval to merge to `main` and deploy Production Hosting:** Live deployment to `https://msiatguide.web.app`.
