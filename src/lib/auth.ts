import {
  signInWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged, type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebase, isFirebaseConfigured } from './firebase';
import type { AppUser, Role } from '../types';

/**
 * Demo accounts.
 *
 * A hackathon submission needs to be openable by someone who is not us, so the
 * three roles sign in with fixed demo credentials rather than a sign-up flow.
 * These are seeded by `npm run seed`.
 */
export const DEMO_ACCOUNTS: Record<Role, { email: string; password: string }> = {
  admin:  { email: 'office@feebridge.demo', password: 'feebridge123' },
  clerk:  { email: 'desk@feebridge.demo',   password: 'feebridge123' },
  parent: { email: 'parent@feebridge.demo', password: 'feebridge123' },
};

/** Sign in as one of the three demo roles and load their profile document. */
export async function signInAsRole(role: Role): Promise<AppUser | null> {
  if (!isFirebaseConfigured) return null;
  const { auth, db } = getFirebase();
  if (!auth || !db) return null;

  const { email, password } = DEMO_ACCOUNTS[role];
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return loadProfile(cred.user);
}

export async function loadProfile(user: User): Promise<AppUser | null> {
  const { db } = getFirebase();
  if (!db) return null;
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) return null;
  return { uid: user.uid, ...snap.data() } as AppUser;
}

export async function signOutUser() {
  const { auth } = getFirebase();
  if (auth) await fbSignOut(auth);
}

/** Keeps the app signed in across refreshes. */
export function watchAuth(cb: (user: AppUser | null) => void) {
  if (!isFirebaseConfigured) return () => {};
  const { auth } = getFirebase();
  if (!auth) return () => {};
  return onAuthStateChanged(auth, async (u) => {
    cb(u ? await loadProfile(u) : null);
  });
}
