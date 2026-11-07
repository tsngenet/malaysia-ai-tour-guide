# Malaysia AI Tour Guide — Deployment Readiness Checklist (Phase 1)

## 1. Compliance with Safety Rules

- [x] Started from confirmed commit SHA (`9620cc9e90f7db76da2f1d0517b0fd16999eb852`).
- [x] All development executed strictly on branch `feature/route-builder-phase1`.
- [x] **No code merged into `main`.**
- [x] **No changes pushed to GitHub remote.**
- [x] **No deployment performed to Firebase Hosting or live infrastructure.**
- [x] China-red visual identity (`#C8102E`, `#A10E1A`, `#F4B400`, `#FFFDF8`, `#1F1F1F`) strictly preserved.
- [x] Anonymous passenger flow preserved (0 login hurdles).

---

## 2. Verification & Test Status

- **Unit & Feature Test Suite (`test_route_builder.mjs`):**
  - **23 / 23 PASS (100%)** (Exit Code: 0)
  - Schema validation, 48 attractions catalog, multi-day scheduling, tour code generator (`MYTG-YYYYMMDD-XXXX`), published snapshot isolation, proximity trigger null-skipping, duration warnings suite, 21h bug reproduction, time metric differentiation.
- **Phase 1C — Real Firebase Integration & Security Verification (`scripts/test_phase1c_real_firebase.mjs`):**
  - **ALL TESTS PASS (100%)** (Exit Code: 0)
  - **Firebase Auth Emulator (9099):** PASS (Real Email/Password driver login).
  - **Cloud Firestore Emulator (8080):** PASS (Persistence of `tours_draft` and `tours_published`).
  - **Firestore Security Rules Suite (`scripts/test_firestore_rules_emulator.mjs`):** **21 / 21 PASS (100%)** (Exit Code: 0).
  - **Published Immutability & Draft Isolation:** PASS (Editing draft does not alter published snapshot; standard drivers cannot overwrite published tours).
  - **Cross-Session Persistence:** PASS (Persists across browser sessions and physical server restarts).
  - **Requirement 9 (Invalid Tour Codes):** PASS (Tour Not Found screen; zero silent redirect).
- **Secret & Credential Scan (`scripts/scan_secrets_and_config.mjs`):**
  - **0 exposed production keys or credentials.**
  - Safe emulator fallback guarded by `isLocalhost` and `VITE_USE_FIREBASE_EMULATOR`.
- **Comprehensive Production Audit:** See [PRODUCTION_READINESS_AUDIT.md](./PRODUCTION_READINESS_AUDIT.md).
- **Task 3 — Mobile Drag-and-Drop Invariants Suite (`scripts/test_mobile_drag_drop_invariants.mjs`):**
  - **8 / 8 Invariants PASS (100%)** (Exit Code: 0)
  - First-to-last, last-to-first, long itinerary scrolling (11+ stops), drag cancellation, dropping outside target, stop deletion, duration editing live recalculation, and keyboard accessibility.
- **Task 4 — QR Code Generation & Independent Decoding (`scripts/test_qr_decoder.mjs`):**
  - **PASS (100%)** (Exit Code: 0)
  - Authentic scannable QR code generated via `qrcode` with `#C8102E` on `#FFFFFF`.
  - Independently decoded with `jsQR` matching the exact passenger tour URL: `https://msiatguide.web.app/?tour=...`.
- **Integration Test Suite (`test_integration.mjs`):**
  - **5 / 5 PASS (100%)** (Exit Code: 0)
  - Static server, health endpoints, AI Q&A API responses in English & Chinese.
- **Comprehensive Visual Audit (`scripts/run_visual_audit.mjs`):**
  - **29 Screenshots Captured** across 5 viewports (360x800, 390x844, 430x932, 768x1024, 1440x900).
  - **Horizontal Overflows:** 0
  - **Console Errors / Warnings:** 0
  - **Failed Network Requests:** 0
- **Production Build (`npm run build`):**
  - **SUCCESS:** Built 139 modules in 1.88s into `dist/`.

---

## 3. Recommended Deployment Procedure (For Owner Approval)

When the repository owner reviews and approves these Phase 1 enhancements, the following sequence should be executed:

1. **Review Local Changes:**
   ```bash
   git status
   git diff main..feature/route-builder-phase1
   ```

2. **Commit Phase 1 Changes on Feature Branch:**
   ```bash
   git add .
   git commit -m "feat(route-builder): phase 1 drag-and-drop itinerary builder, attraction catalog expansion & scheduling engine"
   ```

3. **Push Feature Branch to GitHub (Upon Approval):**
   ```bash
   git push -u origin feature/route-builder-phase1
   ```

4. **Merge to Main via Pull Request or Fast-Forward:**
   ```bash
   git checkout main
   git merge feature/route-builder-phase1
   git push origin main
   ```

5. **Deploy to Firebase (Upon Explicit Confirmation):**
   ```bash
   firebase deploy --only hosting,firestore:rules,storage:rules
   ```
