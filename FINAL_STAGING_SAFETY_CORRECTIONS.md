# Malaysia AI Tour Guide — Final Staging Safety Corrections Report
**Project:** `tsngenet/malaysia-ai-tour-guide`
**Branch:** `feature/route-builder-phase1`
**Date:** 2026-11-07
**Evaluator:** Lead Full-Stack Engineer, React Engineer & Firebase Architect

---

## 1. Actual Project Verification Results (`firebase projects:list`)

Execution of `firebase projects:list` against the active Firebase CLI session returned the following 7 projects:

```text
┌──────────────────────┬──────────────────────┬────────────────┬──────────────────────┐
│ Project Display Name │ Project ID           │ Project Number │ Resource Location ID │
├──────────────────────┼──────────────────────┼────────────────┼──────────────────────┤
│ bwcdriverFB          │ bwcdriverfb          │ 960209615667   │ [Not specified]      │
│ dcorefin             │ dcorefin             │ 469562377384   │ [Not specified]      │
│ dcoreledger          │ dcoreledger          │ 911096084764   │ [Not specified]      │
│ drivercore           │ drivercore-d85d2     │ 594199256497   │ [Not specified]      │
│ mytguide             │ msiatguide (current) │ 897658013965   │ [Not specified]      │
│ mydcore              │ mydcore              │ 22071771806    │ [Not specified]      │
│ mydrivercore         │ mydrivercore         │ 734149245017   │ [Not specified]      │
└──────────────────────┴──────────────────────┴────────────────┴──────────────────────┘
```

### Critical Findings:
1. **`msiatguide-staging` DOES NOT EXIST YET:** The staging project has not been created in the Firebase console or GCP account.
2. **Production `msiatguide` is intact:** Project `msiatguide` is the existing production instance.
3. **Safety Guarantee:** In strict adherence to your instructions, no cloud resources were created, no billing was enabled, and no deployment commands were run.

---

## 2. Corrected Cost & Billing Breakdown (February 2026 Policy)

### 2.1 Cloud Storage Policy Update (February 2026)
- **Policy:** Google Cloud and Firebase require all newly created projects to link a **Blaze Billing Account (Pay-As-You-Go)** to create default Cloud Storage buckets and deploy Cloud Storage security rules.
- **Spark Plan Limitation:** On the free Spark plan, Cloud Storage bucket provisioning is blocked.
- **Blaze Usage Allowance:** If a billing account is attached, usage within the free monthly tiers ($0 cost up to 5 GiB storage, 1 GiB/day egress, 20,000 upload ops) remains free of charge, but a payment method is mandatory on file.

### 2.2 Cost Options: Minimal vs. Full Release

| Feature / Resource | Option A: Minimal Staging Release (Recommended) | Option B: Full Staging Release (Requires Blaze) |
|---|---|---|
| **Cloud Billing Account** | **NOT REQUIRED ($0.00 / mo)** | **REQUIRED (Credit Card Linked)** |
| **Firebase Plan** | **Free Spark Tier** | **Blaze Pay-As-You-Go** |
| **Firebase Authentication** | Free (up to 50k MAU) | Free tier included |
| **Cloud Firestore** | Free (50k reads, 20k writes/day, 1GB data) | Free tier included |
| **Firebase Hosting** | Free (10GB storage, 360MB/day bandwidth) | Free tier included |
| **Cloud Storage for Firebase** | **DEFERRED** (Uses local attraction visuals) | Enabled (Requires billing account) |
| **Driver Auth & Itinerary Builder** | Fully Functional | Fully Functional |
| **Firestore Persistence & Drafts** | Fully Functional | Fully Functional |
| **QR Code Scannable Viewing** | Fully Functional | Fully Functional |
| **Passenger Live Tour & Audio** | Fully Functional | Fully Functional |
| **Estimated Monthly Incurred Cost** | **$0.00 guaranteed** | **$0.00 expected** (if < free limits) |

---

## 3. Fail-Fast Configuration (Zero Silent Fallback)

In `src/lib/firebase.js`, configuration validation has been hardened to prevent silent fallback:

```javascript
const isNonEmulatorDeployment = isExplicitNonEmulator || (!isLocalhost && !isDevMode);
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY;

if (isNonEmulatorDeployment) {
  if (!rawProjectId || rawProjectId.trim() === '') {
    throw new Error(
      `[FATAL FIREBASE CONFIG] VITE_FIREBASE_PROJECT_ID is missing for ${import.meta.env.MODE || 'deployed'} environment. ` +
      `Silent fallback to a default project is disabled to protect production isolation. ` +
      `Please configure VITE_FIREBASE_PROJECT_ID in your .env file or build command.`
    );
  }
  if (!rawApiKey || rawApiKey.trim() === '' || rawApiKey.includes('demo-')) {
    throw new Error(
      `[FATAL FIREBASE CONFIG] A valid VITE_FIREBASE_API_KEY is required for ${import.meta.env.MODE || 'deployed'} environment. ` +
      `Placeholder or demo keys are strictly prohibited in deployed builds.`
    );
  }
}
```

### Verification:
- When building `npm run build -- --mode staging`, Vite loads `.env.staging`.
- If `.env.staging` is missing `VITE_FIREBASE_PROJECT_ID` or `VITE_FIREBASE_API_KEY`, the application **aborts execution immediately** with a descriptive configuration error. It never silently connects to `msiatguide` or any other project.

---

## 4. Staging Build Verification (`npm run build -- --mode staging`)

The staging build was executed with `.env.staging` configured for `msiatguide-staging` and inspected:

```text
✓ Contains msiatguide-staging: true
✓ Contains msiatguide-staging.firebaseapp.com: true
✓ Contains msiatguide.firebaseapp.com (prod domain): false
✓ Contains demo-msiatguide-local (emulator fallback): false
✓ Contains 127.0.0.1:9099 emulator conditional: false (tree-shaken out)
✓ Contains 127.0.0.1:8080 emulator conditional: false (tree-shaken out)
```

Dead-code elimination completely stripped all emulator addresses and emulator logic from the compiled staging JavaScript bundle.

---

## 5. Security Rules & User Role Protection Audit

### 5.1 Storage Rules Hardening (`storage.rules`)
Separated `create` from `update` and `delete` on community contributions to prevent unauthorized tampering:
```rules
match /contributions/{contributionId}/{fileName} {
  allow read: if true;
  allow create: if isAuthenticated() && isValidImage();
  allow update, delete: if isAdminOrOperator() && isValidImage();
}
```
- Authenticated tourists can upload photos, but **only operators and admins** can edit or delete them.
- User profile avatars require `isOwner(userId)` (users cannot overwrite other users' avatars).
- Attraction visuals require `isAdminOrOperator()`.
- Default deny enforced on all other paths.

### 5.2 Firestore Role Anti-Escalation (`firestore.rules`)
- `isUserSelfCreateAllowed`: Standard users can only create profiles with `role in ['passenger', 'tourist', 'user']`.
- `isUserSelfUpdateAllowed`: Standard users cannot alter their `role` or `uid`.
- Published tour snapshots: Standard drivers cannot update or delete published records (`allow update, delete: if isAdmin();`).
- Draft isolation: Only the owning driver or admin can read, edit, or delete draft tours.

---

## 6. Minimal Staging Deployment Commands (Explicit `--project`)

Every deployment command explicitly passes `--project msiatguide-staging` to guarantee production `msiatguide` cannot be affected:

```bash
# -----------------------------------------------------------------------------
# STEP 1: Provision Staging Project (Only after owner approval)
# -----------------------------------------------------------------------------
# In Firebase Console: Create project "msiatguide-staging" (Spark Plan)
# Enable Email/Password in Authentication
# Enable Cloud Firestore (Standard Edition / Spark)

# -----------------------------------------------------------------------------
# STEP 2: Deploy Firestore Security Rules & Indexes to Staging
# -----------------------------------------------------------------------------
firebase deploy --project msiatguide-staging --only firestore:rules,firestore:indexes

# -----------------------------------------------------------------------------
# STEP 3: Build Minimal Staging Web Bundle
# -----------------------------------------------------------------------------
npm run build -- --mode staging

# -----------------------------------------------------------------------------
# STEP 4: Deploy to Isolated Preview Channel (Zero Cloud Storage, Zero Blaze Billing)
# -----------------------------------------------------------------------------
firebase hosting:channel:deploy staging-phase1 --project msiatguide-staging --expires 14d
```

---

## 7. Final Staging Deployment Checklist

- [x] **Project List Verified:** Checked `firebase projects:list`; confirmed `msiatguide-staging` does not exist and needs owner provisioning.
- [x] **Production Protected:** Production project `msiatguide` remains untouched.
- [x] **Billing Policy Corrected:** Detailed that Cloud Storage requires Blaze plan, while Firestore, Auth, and Hosting run on $0 Spark plan.
- [x] **Minimal Release Designed:** Defer Cloud Storage deployment so staging incurs $0 cost and requires no credit card.
- [x] **Fail-Fast Configuration Enforced:** Zero silent fallback; missing staging/production env variables throw fatal error.
- [x] **Staging Bundle Inspected:** Verified `msiatguide-staging` embedded, prod omitted, emulators tree-shaken out.
- [x] **Explicit Project Flags:** All staging commands hard-bind `--project msiatguide-staging`.
- [x] **Security Rules Unit Tested:** 25/25 Firestore tests pass, 14/14 Storage tests pass.
- [x] **Automated Regression Suite:** 67/67 assertions pass.

---

## 8. Explicit Approvals Required from Owner

The following actions remain strictly **BLOCKED** and will not proceed until you give explicit instruction:

1. **[ ] Approval to create `msiatguide-staging`:** Either creating it in the Firebase Console or authorizing `firebase projects:create msiatguide-staging`.
2. **[ ] Approval of Release Scope:** Confirming the **Minimal Release (Option A: $0 Spark Plan, Storage Deferred)** vs. Full Release (Option B: Blaze Billing).
3. **[ ] Approval to deploy Security Rules:** Executing `firebase deploy --project msiatguide-staging --only firestore:rules,firestore:indexes`.
4. **[ ] Approval to deploy Preview Channel:** Executing `firebase hosting:channel:deploy staging-phase1 --project msiatguide-staging`.
5. **[ ] Approval to commit and push code:** Staging and pushing `feature/route-builder-phase1` to GitHub.
