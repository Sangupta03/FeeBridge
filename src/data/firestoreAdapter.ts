import {
  collection, doc, query, where, onSnapshot, addDoc, updateDoc, setDoc,
  disableNetwork, enableNetwork, type Firestore, type Query,
} from 'firebase/firestore';
import type { Repository, DataSnapshot, SubscribeContext } from './repository';
import { getFirebase } from '../lib/firebase';
import type {
  AppUser, Family, FeeHead, InstallmentPlan, Invoice, Payment, Student,
} from '../types';

/** Firestore rejects any field explicitly set to undefined - it must be left out entirely. */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/**
 * Firestore-backed repository.
 *
 * Same interface as LocalRepository, so nothing in the UI changes when you swap
 * between them. Two things are worth pointing out:
 *
 * 1. `includeMetadataChanges: true` lets us see writes that are still queued on
 *    the device. That is how the cash desk knows to show "3 waiting to sync".
 * 2. `disableNetwork` / `enableNetwork` are the real Firestore APIs for going
 *    offline. We are not faking the offline demo — we are switching the actual
 *    client into offline mode, and Firestore's persistent cache does the rest.
 */
export class FirestoreRepository implements Repository {
  private db: Firestore;
  private state: DataSnapshot = {
    families: [], students: [], invoices: [], payments: [],
    feeHeads: [], plans: [], users: [], queuedWrites: 0, online: true,
  };
  private listeners = new Set<(s: DataSnapshot) => void>();
  private unsubs: Array<() => void> = [];

  constructor() {
    const { db } = getFirebase();
    if (!db) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* in .env.local');
    this.db = db;
  }

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((l) => l(snapshot));
  }

  /** Listen to one collection (optionally filtered) and keep it in local state. */
  private watch<T>(
    name: string,
    assign: (rows: T[]) => void,
    options: { countPending?: boolean; familyId?: string } = {},
  ) {
    const ref: Query = options.familyId
      ? query(collection(this.db, name), where('familyId', '==', options.familyId))
      : collection(this.db, name);
    const unsub = onSnapshot(
      ref,
      { includeMetadataChanges: true },
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
        assign(rows);
        if (options.countPending) {
          this.state.queuedWrites = snap.docs.filter((d) => d.metadata.hasPendingWrites).length;
        }
        this.emit();
      },
      (err) => console.error(`[firestore] ${name} listener failed:`, err),
    );
    this.unsubs.push(unsub);
  }

  subscribe(onChange: (s: DataSnapshot) => void, context?: SubscribeContext) {
    this.listeners.add(onChange);

    if (this.unsubs.length === 0) {
      if (context?.role === 'parent' && context.familyId) {
        this.watchOwnFamily(context.familyId);
      } else {
        // admin and clerk both pass a data-independent branch of every rule
        // (isAdmin()/isClerk()), so Firestore can prove an unfiltered list is
        // safe and allows it
        this.watch<Family>('families', (r) => { this.state.families = r; });
        this.watch<Student>('students', (r) => { this.state.students = r; });
        this.watch<Invoice>('invoices', (r) => { this.state.invoices = r; });
        this.watch<Payment>('payments', (r) => { this.state.payments = r; }, { countPending: true });
        this.watch<FeeHead>('feeHeads', (r) => { this.state.feeHeads = r; });
        this.watch<InstallmentPlan>('plans', (r) => { this.state.plans = r; });
        this.watch<AppUser>('users', (r) => { this.state.users = r; });
      }
    }

    onChange(this.state);
    return () => {
      this.listeners.delete(onChange);
    };
  }

  /**
   * A parent's security rule only has the resource.data.familyId == myFamily()
   * branch - a data-dependent condition. Firestore refuses to run an unfiltered
   * list against a rule like that, so every query here is scoped to this one
   * family up front, matching what the rule actually allows.
   */
  private watchOwnFamily(familyId: string) {
    const famUnsub = onSnapshot(
      doc(this.db, 'families', familyId),
      (snap) => {
        this.state.families = snap.exists() ? [{ id: snap.id, ...snap.data() } as Family] : [];
        this.emit();
      },
      (err) => console.error('[firestore] families listener failed:', err),
    );
    this.unsubs.push(famUnsub);

    this.watch<Student>('students', (r) => { this.state.students = r; }, { familyId });
    this.watch<Invoice>('invoices', (r) => { this.state.invoices = r; }, { familyId });
    this.watch<Payment>('payments', (r) => { this.state.payments = r; }, { countPending: true, familyId });
    this.watch<InstallmentPlan>('plans', (r) => { this.state.plans = r; }, { familyId });
    // feeHeads only requires signedIn(), so an unfiltered list already works
    this.watch<FeeHead>('feeHeads', (r) => { this.state.feeHeads = r; });
    // the parent UI never reads data.users, and its own rule needs a per-uid
    // check this app has no matching query for - skip it rather than list a
    // collection this role can't see
  }

  async addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    // Note: we deliberately do NOT await this when offline - Firestore resolves
    // the promise only once the server confirms. The local cache updates
    // immediately, so the UI is already correct.
    const ref = collection(this.db, 'payments');
    const created = stripUndefined({ ...payment }) as Omit<Payment, 'id'>;
    const docRef = await Promise.race([
      addDoc(ref, created),
      // if we are offline, addDoc never resolves; fall back after a tick
      new Promise<null>((res) => setTimeout(() => res(null), 400)),
    ]);
    return { ...created, id: docRef?.id ?? `local-${Date.now()}` } as Payment;
  }

  async updatePayment(payment: Payment): Promise<void> {
    const { id, ...rest } = payment;
    await Promise.race([
      updateDoc(doc(this.db, 'payments', id), stripUndefined(rest)),
      new Promise<void>((res) => setTimeout(res, 400)),
    ]);
  }

  async updateInvoice(invoice: Invoice): Promise<void> {
    const { id, ...rest } = invoice;
    await Promise.race([
      updateDoc(doc(this.db, 'invoices', id), rest),
      new Promise<void>((res) => setTimeout(res, 400)),
    ]);
  }

  async savePlan(plan: Omit<InstallmentPlan, 'id'>): Promise<InstallmentPlan> {
    const docRef = await Promise.race([
      addDoc(collection(this.db, 'plans'), plan),
      new Promise<null>((res) => setTimeout(() => res(null), 400)),
    ]);
    return { ...plan, id: docRef?.id ?? `local-${Date.now()}` } as InstallmentPlan;
  }

  async updatePlan(plan: InstallmentPlan): Promise<void> {
    const { id, ...rest } = plan;
    await Promise.race([
      updateDoc(doc(this.db, 'plans', id), rest),
      new Promise<void>((res) => setTimeout(res, 400)),
    ]);
  }

  async addFeeHead(fee: Omit<FeeHead, 'id'>): Promise<FeeHead> {
    const docRef = await Promise.race([
      addDoc(collection(this.db, 'feeHeads'), fee),
      new Promise<null>((res) => setTimeout(() => res(null), 400)),
    ]);
    return { ...fee, id: docRef?.id ?? `local-${Date.now()}` } as FeeHead;
  }

  /** Real Firestore offline mode, not a simulation. */
  async setOffline(offline: boolean) {
    if (offline) {
      await disableNetwork(this.db);
      this.state.online = false;
    } else {
      await enableNetwork(this.db);
      this.state.online = true;
    }
    this.emit();
  }

  /** Write a user profile document (role lookup for the security rules). */
  async saveUser(user: AppUser) {
    await setDoc(doc(this.db, 'users', user.uid), user, { merge: true });
  }

  dispose() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }
}
