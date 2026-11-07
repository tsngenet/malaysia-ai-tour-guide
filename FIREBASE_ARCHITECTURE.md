# Malaysia AI Tour Guide — Firebase Architecture Plan (Phase 1)

## 1. Authentication & Role-Based Access Control (RBAC)

The PWA supports five distinct personas with tiered permissions:

```
┌─────────────────────────┐
│     Platform Admin      │ ── Full read/write to all collections, verification queue, settings
└───────────┬─────────────┘
            │
┌───────────┴─────────────┐
│       Tour Agency       │ ── Review & publish driver tours, manage fleet itineraries
└───────────┬─────────────┘
            │
┌───────────┴─────────────┐
│         Driver          │ ── Create & manage draft tours, add custom stops, adjust durations
└───────────┬─────────────┘
            │
┌───────────┴─────────────┐
│  Contributor / Reviewer │ ── Submit local knowledge, photos, tips, review queue
└───────────┬─────────────┘
            │
┌───────────┴─────────────┐
│   Anonymous Passenger   │ ── No login required: scan QR, read published tours, listen & ask AI
└─────────────────────────┘
```

### Auth Claims & Roles
- **Passenger:** Unauthenticated (`request.auth == null`) or anonymous Firebase Auth token.
- **Driver:** `request.auth.token.role == 'driver'`.
- **Tour Agency:** `request.auth.token.role == 'agency'` (carries `request.auth.token.agencyId`).
- **Contributor:** Authenticated user submitting tips to community pool.
- **Operator / Admin:** `request.auth.token.role in ['admin', 'operator']`.

---

## 2. Firestore Data Model

### A. Collections

#### 1. `attractions/{placeId}`
The centralized point-of-interest catalog.
- **Read:** Public for all if `verificationStatus == 'approved'`. Admins/operators can read all.
- **Write:** Admins/operators only.
- **Key Fields:** `placeId`, `name` (multilingual), `destination`, `category`, `coordinates`, `suggestedDurationMinutes`, `shortIntro`, `narration`, `facilities`, `verificationStatus`.

#### 2. `tours_published/{tourId}`
Immutable, published tour snapshots served to passengers.
- **Read:** Public for all passengers without authentication.
- **Write:** Drivers who own the tour, their managing agency, or admins.
- **Key Fields:** `tourId`, `code` (`MYTG-YYYYMMDD-XXXX`), `publishedVersion`, `publishedAt`, `stops` (with pre-computed schedule timestamps), `passengerLink`.

#### 3. `tours_draft/{tourId}`
Work-in-progress tour itineraries created by drivers.
- **Read/Write:** Owner driver (`driverUid == request.auth.uid`), assigned agency, or admins.
- **Key Fields:** `tourId`, `driverUid`, `agencyId`, `title`, `startTime`, `stops`, `publicationStatus: 'draft'`.

#### 4. `contributions/{contributionId}`
Crowdsourced tips, local corrections, and photo suggestions.
- **Read:** Submitting contributor or reviewers/admins.
- **Write (Create):** Authenticated users.
- **Update (Review):** Reviewers/admins only (`status: 'pending_review' | 'approved' | 'rejected'`).

#### 5. `users/{uid}`
Driver and operator profile metadata.
- **Read:** Self or admin.
- **Write:** Self (profile info only; cannot modify own role claim) or admin.

---

## 3. Cloud Storage Media Structure

Bucket structure:
- `/attractions/{placeId}/{fileName}`: Verified hero and gallery photos (public read, admin write).
- `/contributions/{contributionId}/{fileName}`: Community uploads (public read once verified, auth write, max 10MB, jpeg/png/webp only).
- `/users/{userId}/{fileName}`: Profile pictures (owner write only).

---

## 4. Offline & PWA Sync Strategy

1. **Static Payload Cache:** Pre-bundled baseline attraction library in local bundle ensures passenger journey works even if network disconnects during mountain transit (e.g., Genting or Cameron Highlands pass).
2. **IndexedDB / LocalStorage Fallback:** Drivers can build and save draft tours in browser local store when offline, synchronizing to Firestore when vehicle re-enters 4G/5G coverage.
3. **Published Snapshot Immutability:** Passenger sessions reference frozen snapshots, ensuring in-flight tours are not corrupted by mid-journey driver revisions.
