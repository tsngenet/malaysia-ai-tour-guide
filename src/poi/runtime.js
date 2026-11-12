import { useCallback, useEffect, useState } from 'react';
import { createPoiStore, createPrivateStore } from '../poi/store.js';
import { ROLES } from '../poi/access.js';
import { auth } from '../lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * STORAGE: the POI master here is BROWSER-LOCAL (localStorage). It is not synced to Firebase.
 * Cloud-side rules for `poi_master`, `poi_imports` and `driver_poi_private` exist in firestore.rules and are
 * emulator-tested, but the UI does not yet read or write those collections.
 *
 * ROLE: derived from the real Firebase sign-in. Signed out = passenger; signed in = driver; a custom
 * claim role of reviewer/operator/admin maps to reviewer/admin. Because the store is local, this is a UI
 * gate only; backend enforcement lives in the rules. A demo role switcher exists in dev builds only.
 */
export const poiStore = createPoiStore();
export const privateStore = createPrivateStore();

export const DEMO_ROLES_ENABLED = !!import.meta.env.DEV;
const DEMO_KEY = 'mytguide_demo_role_v1';
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

let authRole = 'passenger';
let authUid = '';
if (typeof window !== 'undefined') {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { authRole = 'passenger'; authUid = ''; emit(); return; }
    authUid = user.uid;
    authRole = 'driver';
    emit();
    try {
      const claims = (await user.getIdTokenResult()).claims;
      if (claims.role === 'admin') authRole = 'admin';
      else if (claims.role === 'reviewer' || claims.role === 'operator') authRole = 'reviewer';
    } catch { /* keep driver */ }
    emit();
  });
}

export function getRole() {
  if (DEMO_ROLES_ENABLED) {
    try { const r = sessionStorage.getItem(DEMO_KEY); if (ROLES.includes(r)) return r; } catch { /* ignore */ }
  }
  return authRole;
}
export function setRole(role) {
  if (!DEMO_ROLES_ENABLED) return;
  try { sessionStorage.setItem(DEMO_KEY, role); } catch { /* ignore */ }
  emit();
}
export const actorFor = (role) => ({ uid: authUid || `local-${role}`, role });

export function notifyPoiChange() { emit(); }

export function usePoiRuntime() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const role = getRole();
  const mutate = useCallback((fn) => { const r = fn(); emit(); return r; }, []);
  return { role, actor: actorFor(role), pois: poiStore.list(), mutate };
}
