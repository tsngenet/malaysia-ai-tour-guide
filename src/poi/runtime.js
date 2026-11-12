import { useCallback, useEffect, useState } from 'react';
import { createPoiStore, createPrivateStore } from '../poi/store.js';
import { ROLES } from '../poi/access.js';

export const poiStore = createPoiStore();
export const privateStore = createPrivateStore();

const ROLE_KEY = 'mytguide_demo_role_v1';
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

/**
 * IMPORTANT: Firebase Authentication is not configured in this repository, so there is no real sign-in.
 * The role below is a local simulation for staging demos and testing the UI. It is NOT security.
 * Real enforcement is in firestore.rules (see docs/security/RULES.md) once the app is wired to Firestore.
 */
export function getRole() {
  try { const r = sessionStorage.getItem(ROLE_KEY); return ROLES.includes(r) ? r : 'passenger'; } catch { return 'passenger'; }
}
export function setRole(role) {
  try { sessionStorage.setItem(ROLE_KEY, role); } catch { /* ignore */ }
  emit();
}
export const actorFor = (role) => ({ uid: `local-${role}`, role });

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
