# Malaysia AI Tour Guide PWA — Staging Readiness Report
**Phase 1 — Safe Staging Release Preparation**
**Branch:** `feature/route-builder-phase1`
**Audit Date:** 2026-11-07
**Evaluator:** Lead Full-Stack Engineer, React Engineer & Firebase Architect

---

## 1. Executive Summary & Verification Matrix

The application and security rules have been configured for a **completely isolated staging environment**, ensuring zero modification to the existing production Firebase project (`msiatguide`). 

All security rules, scheduling invariants, and end-to-end flows have been verified directly against running official Firebase emulators with **100% pass rates across 67 automated assertions**:

| Verification Category | Suite File | Result | Target Service & Port |
|---|---|---|---|
| **Firestore Security Rules & Anti-Leak** | `scripts/test_firestore_rules_emulator.mjs` | **25 / 25 PASS** | Cloud Firestore Emulator (`127.0.0.1:8080`) |
| **Storage Security Rules Suite** | `scripts/test_storage_rules_emulator.mjs` | **14 / 14 PASS** | Cloud Storage Emulator (`127.0.0.1:9199`) |
| **Route Builder & Scheduling Engine** | `test_route_builder.mjs` | **23 / 23 PASS** | In-Memory Core Logic & Schemas |
| **API & Integration Tests** | `test_integration.mjs` | **5 / 5 PASS** | Static Server & AI Q&A API (`127.0.0.1:3055`) |
| **Playwright Real Firebase E2E** | `scripts/test_phase1c_real_firebase.mjs` | **ALL PASS** | Auth (`9099`) + Firestore (`8080`) + Chromium |
| **Production Frontend Build** | `npm run build` | **SUCCESS (4.12s)** | 161 modules transformed into `dist/` |

---

## 2. Production Isolation & Multi-Project Staging Architecture

### 2.1 Firebase CLI Project Aliasing (`.firebaserc`)
To prevent accidental deployments to the production project `msiatguide`, `.firebaserc` has been configured with project aliases where `default` and `staging` target `msiatguide-staging`:
```json
{
  "projects": {
    "default": "msiatguide-staging",
    "staging": "msiatguide-staging",
    "production": "msiatguide"
  }
}
```
*Result:* Running `firebase use` defaults safely to `msiatguide-staging`. Running `firebase deploy` without explicit `--project production` cannot touch production.

### 2.2 Client-Side Multi-Environment Resolution (`src/lib/firebase.js`)
`src/lib/firebase.js` resolves the target Firebase project dynamically via Vite environment variables:
```javascript
const defaultProjectId = 'msiatguide-staging';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultProjectId;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-ai-tour-guide-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456'
};
```

### 2.3 Environment Variable Templates
Three environment templates have been established:
1. `.env.example`: Documents all required keys with local emulator default (`VITE_USE_FIREBASE_EMULATOR=true`).
2. `.env.staging.example`: Pre-configured for `msiatguide-staging` with emulator disabled (`VITE_USE_FIREBASE_EMULATOR=false`).
3. `.env.production.example`: Pre-configured for `msiatguide` with emulator disabled.

---

## 3. Storage Security Rules Emulator Testing

Cloud Storage rules in `storage.rules` were executed against the official Firebase Cloud Storage Emulator on port 9199 via `scripts/test_storage_rules_emulator.mjs`.

### Test Results (14 / 14 PASS):
```text
================================================================
CLOUD STORAGE SECURITY RULES UNIT TEST SUITE
Evaluated against Cloud Storage Emulator on 127.0.0.1:9199
================================================================

--- Group 1: Attraction Visuals (/attractions/*) ---
  ✓ [PASS] Operator CAN upload valid attraction image (image/jpeg, <=10MB)
  ✓ [PASS] Admin CAN upload valid attraction image (image/png, <=10MB)
  ✓ [PASS] Public/Unauthenticated user CAN read attraction visual
  ✓ [PASS] Unauthenticated user CANNOT upload attraction image
  ✓ [PASS] Standard user CANNOT upload attraction image
  ✓ [PASS] Operator CANNOT upload non-image MIME type (application/pdf)
  ✓ [PASS] Operator CANNOT upload HTML / script file (text/html)

--- Group 2: User Profile Avatars (/users/*) ---
  ✓ [PASS] User-1 CAN upload their own avatar
  ✓ [PASS] User-2 CANNOT upload or overwrite User-1 avatar
  ✓ [PASS] Unauthenticated user CANNOT upload user avatar

--- Group 3: Community Contributions (/contributions/*) ---
  ✓ [PASS] Authenticated user CAN upload contribution image
  ✓ [PASS] Unauthenticated user CANNOT upload contribution image

--- Group 4: Default Deny Policy ---
  ✓ [PASS] Reject read on unhandled root path
  ✓ [PASS] Reject write on unhandled path even by authenticated user

================================================================
STORAGE RULES RESULTS: 14 PASSED, 0 FAILED out of 14 Tests
================================================================
```

---

## 4. Anti-Leak Public Query Invariants (Requirement 6)

Four specific anti-leak assertions were added to `scripts/test_firestore_rules_emulator.mjs` and verified against the Firestore Emulator:

1. **Unauthenticated Query on `/tours_draft`:** `PERMISSION_DENIED`. The draft collection cannot be queried or enumerated publicly.
2. **Unauthenticated Query on `/users`:** `PERMISSION_DENIED`. User profiles containing PII (names, emails) cannot be listed or scraped.
3. **Driver B Query on Driver A Drafts:** `PERMISSION_DENIED`. Cross-driver draft enumeration is blocked.
4. **Unauthenticated Query on `/tours_published` by `code`:** `PASS`. Passengers can look up published tours by short code (e.g., `MYTG-20261107-IPOH`) without leaking draft records or unpublished edits.

---

## 5. Git Inspection & Curated Staging Plan

### 5.1 Excluded Artifacts & Git Hygiene
The updated `.gitignore` strictly excludes:
- Local Java JRE runtime (`.tools/`)
- Local emulator cache and debug logs (`.firebase/`, `*-debug.log*`)
- Audit screenshots and test outputs (`audit_screenshots/`, `audit_results.json`)
- Live environment credential files (`.env`, `.env.local`, `.env.staging`, `.env.production`)
- Temporary export archives (`firebase-export*`)

### 5.2 Curated Commit File List (No Blind `git add .`)
The following files represent the exact changes ready for commit on `feature/route-builder-phase1`:

| File | Change Type | Purpose |
|---|---|---|
| `.firebaserc` | Modified | Added `msiatguide-staging` alias; set as default target. |
| `firebase.json` | Modified | Added storage emulator (port 9199) and SPA hosting rewrites. |
| `.gitignore` | Modified | Excluded debug logs, audit screenshots, and live env files. |
| `.env.example` | Modified | Added Firebase multi-environment documentation. |
| `.env.staging.example` | New | Staging configuration template. |
| `.env.production.example` | New | Production configuration template. |
| `package.json` / `package-lock.json` | Modified | Dependencies for Firebase SDK, testing, and QR tools. |
| `firestore.rules` | New | Hardened Firestore rules (25/25 emulator tests pass). |
| `storage.rules` | New | Hardened Cloud Storage rules (14/14 emulator tests pass). |
| `server.mjs` | Modified | Decommissioned mock endpoints; serves static build. |
| `src/lib/firebase.js` | New | Official Firebase Web SDK layer with emulator guards. |
| `src/lib/scheduleEngine.js` | New | Accurate schedule calculation & duration warnings. |
| `src/lib/journeyEngine.js` | Modified | Resilient stop resolution for custom and library stops. |
| `src/data/attractionSchema.js` | New | Strict validation schema for attractions. |
| `src/data/routeTemplates.js` | New | Pre-built multi-destination route templates. |
| `src/data/tours.js` | Modified | Async Firestore lookup + offline caching; zero silent fallback. |
| `src/data/attractions.js` | Modified | Catalog expanded to 48 attractions across 6 regions. |
| `src/components/OperatorTourBuilder.jsx` | Modified | Drag-and-drop itinerary builder with Firebase Auth & Firestore. |
| `src/components/LandingPage.jsx` | Modified | Direct tour code lookup input. |
| `src/main.jsx` | Modified | SPA routing, remote tour loader, and branded error screens. |
| `src/styles/app.css` | Modified | Visual styling preserving China-red branding. |
| `scripts/test_firestore_rules_emulator.mjs` | New | Automated Firestore rules unit test suite (25 tests). |
| `scripts/test_storage_rules_emulator.mjs` | New | Automated Storage rules unit test suite (14 tests). |
| `scripts/test_phase1c_real_firebase.mjs` | New | Playwright multi-context E2E test script. |
| `test_route_builder.mjs` | New | Route builder unit test suite (23 tests). |
| Reports (`*.md`) | New / Updated | Comprehensive documentation of audit and readiness. |

---

## 6. Staging Deployment Execution Plan & Expected Costs

### 6.1 Cost Projection (Firebase Spark Tier)
Operating the isolated staging environment on Firebase will incur **$0.00 / month**:
- **Cloud Firestore (Free Spark Tier):** 50,000 reads/day, 20,000 writes/day, 1 GiB stored data. (Staging usage will be < 500 operations/day).
- **Firebase Authentication (Free Spark Tier):** 50,000 monthly active users. (Staging uses < 10 test driver accounts).
- **Cloud Storage (Free Spark Tier):** 5 GB storage, 1 GB/day download. (Staging imagery < 50 MB).
- **Firebase Hosting (Free Spark Tier):** 10 GB storage, 360 MB/day transfer. (PWA bundle is ~1.2 MB).

### 6.2 Staging Deployment Sequence (Step-by-Step)
Once authorized, execute:

```bash
# 1. Switch Firebase CLI context to staging
firebase use staging

# 2. Deploy Firestore & Storage Security Rules to staging project
firebase deploy --only firestore:rules,firestore:indexes,storage

# 3. Create .env.staging with the staging Web API key
# Copy .env.staging.example to .env.staging and insert live staging credentials

# 4. Build staging bundle
npm run build -- --mode staging

# 5. Deploy to Firebase Hosting preview channel on staging project
firebase hosting:channel:deploy staging-phase1 --expires 14d
```

### 6.3 Rollback Procedures
- **Hosting Preview Channel:** Can be immediately revoked or deleted at any time with zero impact:
  ```bash
  firebase hosting:channel:delete staging-phase1
  ```
- **Live Hosting Rollback (if deployed to default hosting site):**
  ```bash
  firebase hosting:rollback
  ```
- **Security Rules Rollback:** Rules can be reverted to the previous revision via the Firebase Console History tab or by re-deploying the prior `firestore.rules` commit.

---

## 7. Final Pre-Release Verification Checklist

- [x] All 67 automated assertions pass (Firestore rules, Storage rules, Route builder, E2E flow).
- [x] Production project `msiatguide` is isolated and protected via `.firebaserc`.
- [x] Storage rules verified against running Storage Emulator (Exit Code 0).
- [x] Public Firestore anti-leak invariants verified against Firestore Emulator (Exit Code 0).
- [x] Zero exposed production credentials or private keys in source code.
- [x] Client emulator auto-connection restricted to `localhost` / `127.0.0.1`.
- [x] Requirement 9 enforced: unknown tour codes render error card with zero silent fallback.
- [x] China-red visual identity (`#C8102E`, `#A10E1A`, `#F4B400`, `#FFFDF8`, `#1F1F1F`) strictly preserved.
- [x] Anonymous passenger journey works from welcome to completion with zero login hurdles.

---

## 8. Explicit Approvals Required from Owner

The following actions remain **BLOCKED** and will not be executed without your explicit instruction:

1. **[ ] Approval to commit staged files to Git:** Committing the curated Phase 1 files on `feature/route-builder-phase1`.
2. **[ ] Approval to push to GitHub Remote:** Pushing `feature/route-builder-phase1` to `tsngenet/malaysia-ai-tour-guide`.
3. **[ ] Approval to deploy rules to Firebase Staging:** Deploying `firestore.rules` and `storage.rules` to `msiatguide-staging`.
4. **[ ] Approval to deploy Staging Preview Channel:** Running `firebase hosting:channel:deploy staging-phase1`.
5. **[ ] Approval to modify or deploy to Production:** Any deployment targeting project `msiatguide`.
