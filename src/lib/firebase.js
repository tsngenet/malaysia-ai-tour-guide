/**
 * Firebase Client & Shared Itineraries Service Layer (Phase 1C)
 *
 * Implements genuine Firebase Authentication and Cloud Firestore via the official
 * Firebase Web SDK connecting to local emulators:
 * - Auth Emulator: http://127.0.0.1:9099
 * - Firestore Emulator: 127.0.0.1:8080
 *
 * Eliminates custom in-memory mock endpoints.
 */

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator
} from 'firebase/storage';
import { INITIAL_TOURS, DEFAULT_TOUR_ID } from '../data/tours.js';

// Host environment checks
const isLocalhost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1');

const isExplicitEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
const isExplicitNonEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'false';
const isDevMode = !!import.meta.env.DEV;

// Deployed Staging/Production validation (fail-fast: zero silent fallback)
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

// In local dev/emulator mode, safe demo defaults are permitted for local emulator binding
const projectId = rawProjectId || 'demo-msiatguide-local';
const apiKey = rawApiKey || 'demo-ai-tour-guide-key';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1234567890';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '1:1234567890:web:abcdef123456';

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Cloud Storage (gracefully deferred if billing is not approved)
export let storage = null;
try {
  storage = getStorage(app);
} catch (e) {
  console.info('Cloud Storage initialization deferred:', e.message);
}

// Connect to official Firebase Emulators when running in development/local mode
const shouldConnectEmulator = isExplicitEmulator ||
  (!isExplicitNonEmulator && isLocalhost);

if (shouldConnectEmulator) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  } catch {
    // Ignore emulator re-connection warnings in HMR
  }
  try {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  } catch {
    // Ignore emulator re-connection warnings in HMR
  }
  if (storage) {
    try {
      connectStorageEmulator(storage, '127.0.0.1', 9199);
    } catch {
      // Ignore emulator re-connection warnings in HMR
    }
  }
}

// Session Storage Key
const DRIVER_SESSION_KEY = 'mytguide_driver_session_v1';

/**
 * Returns current authenticated driver session from local cache or auth state.
 */
export function getDriverSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DRIVER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Subscribes to Firebase Auth state changes.
 */
export function onDriverAuthStateChanged(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      const session = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Driver'),
        role: 'user'
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session));
      }
      callback(session);
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(DRIVER_SESSION_KEY);
      }
      callback(null);
    }
  });
}

/**
 * Authenticates a driver using genuine Firebase Auth Email/Password.
 * In local emulator mode, automatically provisions the test driver account if not existing.
 */
export async function loginDriver(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  try {
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } catch (authErr) {
      // If running on local emulator and user is not found, provision on the fly
      if (
        shouldConnectEmulator &&
        (authErr.code === 'auth/user-not-found' ||
         authErr.code === 'auth/invalid-credential' ||
         authErr.code === 'auth/invalid-login-credentials')
      ) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        throw authErr;
      }
    }

    const user = userCredential.user;
    const session = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Driver'),
      role: 'user',
      loginTimestamp: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session));
    }

    // Provision or update user document in Firestore users/{uid}
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: session.displayName,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.warn('Could not update user record in Firestore:', e.message);
    }

    return session;
  } catch (err) {
    console.error('Firebase Auth driver login error:', err.code || err.message);
    throw err;
  }
}

/** Register a new driver account without granting privileged Firebase roles. */
export async function registerDriver(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) throw new Error('Email and password are required.');
  if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
  const user = credential.user;
  const session = {
    uid: user.uid, email: user.email,
    displayName: user.displayName || normalizedEmail.split('@')[0],
    role: 'user'
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(DRIVER_SESSION_KEY, JSON.stringify(session));
  }
  // Firestore only permits self-registration with an unprivileged role.
  // The signed-in owner can still create their own tour drafts and snapshots.
  try {
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: session.displayName,
      role: 'user',
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Account created but user profile could not be saved:', err.code || err.message);
  }
  return session;
}

/** Send a reset link without exposing whether an email is registered. */
export async function requestDriverPasswordReset(email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('Enter your email address first.');
  await sendPasswordResetEmail(auth, normalizedEmail);
}

/**
 * Signs out current driver via Firebase Auth SDK.
 */
export async function logoutDriver() {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Firebase signOut warning:', e.message);
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(DRIVER_SESSION_KEY);
  }
}

/**
 * Saves a private itinerary draft to Cloud Firestore (tours_draft/{tourId}).
 * Requires authenticated driver matching driverUid.
 */
export async function saveDraftTour(draft) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: You must be logged in as a driver to save drafts.');
  }
  if (!draft?.tourId) {
    throw new Error('Valid tour draft with tourId is required.');
  }

  const payload = {
    tourId: draft.tourId,
    driverUid: currentUser.uid,
    code: draft.code || '',
    status: draft.status || 'draft',
    publicationStatus: 'draft',
    title: typeof draft.title === 'string' ? { en: draft.title } : (draft.title || { en: 'Draft Tour' }),
    stops: (draft.stops || []).map(s => {
      const stop = {
        stopId: String(s.stopId || `s-${Date.now()}`),
        durationMinutes: Number(s.durationMinutes) || 30
      };
      if (s.isCustom) stop.isCustom = true;
      if (s.attractionId) stop.attractionId = s.attractionId;
      if (s.title) stop.title = s.title;
      if (s.type) stop.type = s.type;
      if (s.coordinates) stop.coordinates = s.coordinates;
      if (s.plannedArrival) stop.plannedArrival = s.plannedArrival;
      if (s.plannedDeparture) stop.plannedDeparture = s.plannedDeparture;
      if (s.travelTimeToNextMinutes !== undefined) stop.travelTimeToNextMinutes = s.travelTimeToNextMinutes;
      return stop;
    }),
    ...(draft.agencyId ? { agencyId: draft.agencyId } : {}),
    ...(draft.availableLanguages ? { availableLanguages: draft.availableLanguages } : {}),
    ...(draft.coordinates ? { coordinates: draft.coordinates } : {}),
    ...(draft.routePolyline ? { routePolyline: draft.routePolyline } : {}),
    ...(draft.notes ? { notes: draft.notes } : {}),
    ...(draft.summary ? { summary: draft.summary } : {}),
    ...(draft.startTime ? { startTime: draft.startTime } : {}),
    ...(draft.scheduleSummary ? { scheduleSummary: draft.scheduleSummary } : {}),
    ...(draft.destination ? { destination: draft.destination } : {}),
    lastUpdated: new Date().toISOString()
  };

  const draftRef = doc(db, 'tours_draft', draft.tourId);
  await setDoc(draftRef, payload, { merge: true });
  return { ok: true, tourId: draft.tourId };
}

/**
 * Fetches a private itinerary draft by tourId from Cloud Firestore.
 * Requires authenticated owner driver or admin.
 */
export async function fetchDraftTour(tourId) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required to access draft itineraries.');
  }

  const draftRef = doc(db, 'tours_draft', tourId);
  const snap = await getDoc(draftRef);
  if (!snap.exists()) return null;

  const data = snap.data();
  if (data.driverUid !== currentUser.uid) {
    throw new Error('Permission Denied: You do not own this tour draft.');
  }
  return data;
}

/**
 * Publishes an immutable tour snapshot to Cloud Firestore (tours_published/{tourId}).
 * Enforces ownership and snapshot integrity.
 */
export async function publishTourSnapshot(snapshot) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: You must be logged in as a driver to publish itineraries.');
  }
  if (!snapshot?.tourId || !snapshot?.code || !Array.isArray(snapshot.stops)) {
    throw new Error('Valid tour snapshot with tourId, code, and stops array is required.');
  }

  const payload = {
    tourId: snapshot.tourId,
    driverUid: currentUser.uid,
    code: snapshot.code,
    publishedVersion: Number(snapshot.publishedVersion) || 1,
    publishedAt: Timestamp.now(),
    title: typeof snapshot.title === 'string' ? { en: snapshot.title } : (snapshot.title || { en: 'Malaysia Tour' }),
    publicationStatus: 'published',
    stops: (snapshot.stops || []).map(s => {
      const stop = {
        stopId: String(s.stopId || `s-${Date.now()}`),
        durationMinutes: Number(s.durationMinutes) || 30
      };
      if (s.isCustom) stop.isCustom = true;
      if (s.attractionId) stop.attractionId = s.attractionId;
      if (s.title) stop.title = s.title;
      if (s.type) stop.type = s.type;
      if (s.coordinates) stop.coordinates = s.coordinates;
      if (s.plannedArrival) stop.plannedArrival = s.plannedArrival;
      if (s.plannedDeparture) stop.plannedDeparture = s.plannedDeparture;
      if (s.travelTimeToNextMinutes !== undefined) stop.travelTimeToNextMinutes = s.travelTimeToNextMinutes;
      return stop;
    }),
    ...(snapshot.agencyId ? { agencyId: snapshot.agencyId } : {}),
    ...(snapshot.availableLanguages ? { availableLanguages: snapshot.availableLanguages } : {}),
    ...(snapshot.passengerLink ? { passengerLink: snapshot.passengerLink } : {}),
    ...(snapshot.coordinates ? { coordinates: snapshot.coordinates } : {}),
    ...(snapshot.routePolyline ? { routePolyline: snapshot.routePolyline } : {}),
    ...(snapshot.summary ? { summary: snapshot.summary } : {}),
    ...(snapshot.startTime ? { startTime: snapshot.startTime } : {}),
    ...(snapshot.scheduleSummary ? { scheduleSummary: snapshot.scheduleSummary } : {}),
    ...(snapshot.destination ? { destination: snapshot.destination } : {})
  };

  const publishedRef = doc(db, 'tours_published', snapshot.tourId);
  await setDoc(publishedRef, payload);
  return { ok: true, tourId: snapshot.tourId, code: snapshot.code };
}

/**
 * Fetches a published itinerary from Cloud Firestore by tourId or short code.
 * Accessible to passengers anonymously without login!
 *
 * REQUIREMENT 9:
 * If tour is not found, returns null. NEVER silently redirects to default tour!
 */
export async function fetchPublishedTour(idOrCode) {
  if (!idOrCode) return null;

  try {
    // 1. Direct document lookup by tourId in Firestore
    const directRef = doc(db, 'tours_published', idOrCode);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      const data = directSnap.data();
      if (data.publicationStatus === 'published') {
        return data;
      }
    }

    // 2. Query by code (case-insensitive uppercase) in Firestore
    const q = query(
      collection(db, 'tours_published'),
      where('code', '==', idOrCode.toUpperCase())
    );
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const data = querySnap.docs[0].data();
      if (data.publicationStatus === 'published') {
        return data;
      }
    }
  } catch (err) {
    console.warn('Firestore lookup error for published tour:', err.message);
  }

  // 3. Check static baseline catalog
  if (INITIAL_TOURS[idOrCode]) return INITIAL_TOURS[idOrCode];
  const staticMatch = Object.values(INITIAL_TOURS).find(
    t => t.code && t.code.toLowerCase() === idOrCode.toLowerCase()
  );
  if (staticMatch) return staticMatch;

  // 4. Truly not found - return explicit null (Requirement 9)
  return null;
}
