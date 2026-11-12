# Firebase security rules (prototype, NOT deployed)

Files: `firestore.rules`, `storage.rules`, `firestore.indexes.json`, tests in `rules-tests/`.
Nothing here has been deployed. `.firebaserc` names project `msiatguide`; whether that is production or staging is unverified. Tests use the demo project `demo-rules-test` and the local emulators only.

## Roles
Roles come from the custom auth claim `request.auth.token.role`: `driver`, `contributor`, `reviewer`, `admin`. No claim (or signed out) = passenger/public. `admin` is also treated as reviewer and driver.

## Firestore
| Path | Rule |
|---|---|
| `pois/{id}` | Anyone may get/list only `status == 'approved'` (queries must filter `where('status','==','approved')`). Staff read all. Create: staff, status `draft`/`needs_review`, `createdBy == uid`, `id == docId`, non-empty string `nameEn`. Update: reviewer/admin any status; others only their own docs, only while draft/needs_review and staying there. `id` and `createdBy` immutable. Delete: nobody (archive via `status: 'archived'`). |
| `pois/{id}/private/{doc}` | driver/admin only (read and write). Writes need `suppliedBy == uid` and timestamp `suppliedAt`. No delete. |
| `pois/{id}/history/{entry}` | Staff create with `actor == uid`, `at == request.time` (use `serverTimestamp()`). reviewer/admin read. No update/delete. |
| `imports/{id}` | Staff create with `createdBy == uid`. Read: creator or reviewer/admin. Update: reviewer/admin. No delete. |
| `itineraries/{id}` | Driver/admin owner (`ownerUid == uid`) read/create/update; `ownerUid` immutable. No delete; archive with `archived: true`. List must filter `where('ownerUid','==',uid)`. |
| `sharedItineraries/{shareId}` | Anyone may `get` one doc; `list` denied (share IDs must be unguessable). Owner driver/admin create/update; top-level keys `commission`, `privateNotes`, `driverNotes` rejected. No delete. |
| everything else | denied |

## Storage
- `poiMedia/public/{poiId}/{file}`: public read; reviewer/admin create/update, `image/*`, < 5 MB; delete admin only.
- `poiMedia/pending/{poiId}/{file}`: staff read/create/update, `image/*`, < 5 MB; delete admin only.
- everything else denied.

## Run the tests
Requires Node and Java 21+ (e.g. `mise x java@temurin-21 -- npm test`).

```
cd rules-tests
npm install
npm test   # stages the rules into .staged/, starts Firestore+Storage emulators, runs node:test
```

Last run: 213 tests, 213 pass, 0 fail. Config: `rules-tests/firebase.test.json` (rules are staged into `.staged/` because the CLI rejects paths outside the config directory).

## Assigning roles (Admin SDK, from a trusted server or script)

```js
import { getAuth } from 'firebase-admin/auth';
await getAuth().setCustomUserClaims(uid, { role: 'driver' });
```

The user must refresh their token (`getIdToken(true)`) or sign in again. Never set claims from client code.

## Known limitations
- Rules are not deployed, and were only tested against the emulator.
- Claims provisioning is not implemented in the app; there is no admin tool yet.
- Storage rules cannot check Firestore (e.g. whether the POI exists or is approved). Promoting a file from pending to public is a manual reviewer/admin action not tied to POI approval.
- Any staff member can overwrite pending files (no per-user ownership in Storage).
- Shared snapshots are readable by anyone holding the ID; privacy relies on unguessable IDs and on the client building snapshots without private data. Rules reject only three top-level key names, not nested ones.
- Role claims persist until token refresh (up to about an hour after revocation).
- History entries are client-written, so only as trustworthy as the client; a Cloud Function trigger would be stronger.
- POI field validation is minimal (`id`, `nameEn`, `status`, `createdBy` only).
- `private` docs are writable by any driver, not only the POI's creator.
- Existing app code was not checked against these rules; deploying them may break current reads/writes.
