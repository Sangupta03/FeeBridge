import type { Repository } from './repository';
import { LocalRepository } from './localAdapter';
import { FirestoreRepository } from './firestoreAdapter';
import { isFirebaseConfigured } from '../lib/firebase';

/**
 * Pick a data source.
 *
 * Set VITE_DATA_SOURCE=firebase in .env.local to use Firestore. Anything else
 * (or missing Firebase config) falls back to the seeded local school, so the app
 * always runs — including on a laptop with no network at a demo table.
 */
export function createRepository(): Repository {
  const wantsFirebase = import.meta.env.VITE_DATA_SOURCE === 'firebase';

  if (wantsFirebase && isFirebaseConfigured) {
    try {
      return new FirestoreRepository();
    } catch (err) {
      console.warn('[data] Firestore unavailable, falling back to local seed:', err);
      return new LocalRepository();
    }
  }
  return new LocalRepository();
}

export const dataSourceName = () =>
  import.meta.env.VITE_DATA_SOURCE === 'firebase' && isFirebaseConfigured ? 'Firestore' : 'Demo data';

export * from './repository';
