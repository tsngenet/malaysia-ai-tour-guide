/**
 * Attraction Library
 * Independent from Tours: One attraction can belong to many tours.
 * Includes coordinates, trigger radii (meters), multilingual narration, 
 * historical context, practical visitor info, facilities, and source references.
 *
 * Enforces validation against attractionSchema.js.
 */

import { KL_PUTRAJAYA_ATTRACTIONS } from './attractions/kualaLumpur.js';
import { MELAKA_ATTRACTIONS } from './attractions/melaka.js';
import { IPOH_ATTRACTIONS } from './attractions/ipoh.js';
import { PENANG_ATTRACTIONS } from './attractions/penang.js';
import { KUALA_SELANGOR_ATTRACTIONS } from './attractions/kualaSelangor.js';
import { GENTING_ATTRACTIONS } from './attractions/genting.js';
import { CAMERON_ATTRACTIONS } from './attractions/cameron.js';
import { KAMPAR_ATTRACTIONS } from './attractions/kampar.js';

export const ATTRACTIONS = {
  ...KL_PUTRAJAYA_ATTRACTIONS,
  ...MELAKA_ATTRACTIONS,
  ...IPOH_ATTRACTIONS,
  ...PENANG_ATTRACTIONS,
  ...KUALA_SELANGOR_ATTRACTIONS,
  ...GENTING_ATTRACTIONS,
  ...CAMERON_ATTRACTIONS,
  ...KAMPAR_ATTRACTIONS
};

export function getAttractionById(placeId) {
  if (!placeId) return null;
  return ATTRACTIONS[placeId] || null;
}

export function getAllAttractions() {
  return Object.values(ATTRACTIONS);
}

export function getAttractionsByDestination(destination) {
  if (!destination) return getAllAttractions();
  return Object.values(ATTRACTIONS).filter(a => a.destination === destination);
}

export function getAttractionsByCategory(category) {
  if (!category) return getAllAttractions();
  return Object.values(ATTRACTIONS).filter(a => a.category === category);
}
