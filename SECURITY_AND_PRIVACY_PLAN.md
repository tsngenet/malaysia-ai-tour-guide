# Malaysia AI Tour Guide — Security & Privacy Plan (Phase 1)

## 1. Passenger Privacy by Design

### Zero Required PII for Passengers
- Passengers enter the PWA via QR scan or Tour Code (`MYTG-YYYYMMDD-XXXX`).
- No account registration, email address, telephone number, credit card, or personal identifiable information (PII) is requested or required.
- Session state (current stop, selected language, visited stop IDs) is held strictly in ephemeral browser memory (`sessionStorage` / React state).

### Localized Geolocation Privacy
- Geolocation data from the passenger's mobile browser is used **exclusively on the client device** to calculate Haversine distance to the approaching stop.
- **Continuous GPS tracking points are NEVER streamed to backend servers, logged, or recorded.**
- Location permission is requested contextually only when the passenger clicks "Start Live Tour".
- If location permission is denied, passengers can seamlessly manually advance stops without restriction.

---

## 2. Platform Security & Guardrails

### Role-Based Access Control (RBAC)
- Custom claims in Firebase Authentication tokens enforce roles: `driver`, `agency`, `reviewer`, `operator`, `admin`.
- Cloud Firestore rules prevent privilege escalation: users cannot modify their own `role` or `agencyId` fields.

### Anti-Hallucination & Fake Coordinate Prevention
- Strict schema validation explicitly prohibits placeholder or dummy `(0, 0)` coordinates.
- Unverified points must be assigned `coordinates: null`.
- The journey engine skips null-coordinate stops during proximity calculations, eliminating false triggering.

### Media & Storage Protection
- Uploaded media in Cloud Storage is restricted to `image/jpeg`, `image/png`, and `image/webp`.
- Maximum file size is enforced at 10 MB.
- Anonymous write access to Cloud Storage is completely blocked.

### Content Moderation & Verification Pipeline
- Community contributions (tips, photos, reviews) default to status `pending_review`.
- No user-submitted content appears on the live passenger route or attraction narration until explicitly vetted and marked `approved` by an authorized reviewer or operator.
