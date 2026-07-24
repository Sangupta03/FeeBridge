import { create } from 'zustand';
import type { DataSnapshot, Repository } from '../data/repository';
import { createRepository } from '../data';
import { signInAsRole, signOutUser, watchAuth } from '../lib/auth';
import { isFirebaseConfigured, getFirebase } from '../lib/firebase';
import { seed } from '../data/seed';
import { scoreFamily } from '../domain/risk';
import { matchPayment, applyPayment, outstandingOf } from '../domain/reconcile';
import { planInstallments } from '../domain/installments';
import { forecastCollection } from '../domain/forecast';
import type {
  AppUser, FamilyRiskProfile, Invoice, Payment, RiskFeatures, Role,
} from '../types';

/**
 * One store, three roles.
 *
 * The store owns the repository subscription and derives everything else -
 * risk profiles, the forecast, the reconciliation piles - from the raw data.
 * Components stay dumb and just read what they need.
 */

interface AppState {
  repo: Repository;
  user: AppUser | null;
  data: DataSnapshot | null;
  ready: boolean;
  subscribed: boolean;

  // ---- lifecycle
  init: () => void;
  signInAs: (role: Role) => Promise<void>;
  signOut: () => void;
  /** connect to the data source, once - called only once we have a real user,
   *  so a Firestore listener never fires before sign-in and dies for good */
  subscribeToData: () => void;

  // ---- actions
  recordPayment: (input: {
    familyId: string;
    studentId?: string;
    amount: number;
    method: Payment['method'];
    reference: string;
    note?: string;
  }) => Promise<{ status: Payment['status']; reason: string }>;
  offerPlan: (invoiceId: string) => Promise<void>;
  toggleOffline: () => void;

  // ---- derived
  riskProfiles: () => Record<string, FamilyRiskProfile>;
  openInvoices: () => Invoice[];
  familyBalance: (familyId: string) => number;
}

/** Build the feature vector the risk model needs from raw data. */
export function featuresFor(familyId: string, data: DataSnapshot): RiskFeatures {
  const history = seed.historyByFamily[familyId] ?? {
    latePayments: 0, installmentPlansUsed: 0, avgDelayDays: 0, hadPartialPayment: false,
  };
  const famInvoices = data.invoices.filter((i) => i.familyId === familyId);
  const outstandingAmount = famInvoices.reduce((s, i) => s + outstandingOf(i), 0);
  const overdueMonths = famInvoices.filter(
    (i) => outstandingOf(i) > 0 && new Date(i.dueDate) < new Date(),
  ).length;
  const siblings = data.students.filter((s) => s.familyId === familyId).length;

  return {
    latePayments: history.latePayments,
    overdueMonths,
    hadPartialPayment: history.hadPartialPayment,
    outstandingAmount,
    installmentPlansUsed: history.installmentPlansUsed,
    avgDelayDays: history.avgDelayDays,
    siblings,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  repo: createRepository(),
  user: null,
  data: null,
  ready: false,
  subscribed: false,

  init: () => {
    // in local demo mode there is no auth to wait for, so connect right away
    if (!isFirebaseConfigured) { get().subscribeToData(); return; }

    // in Firebase mode, wait for a real signed-in user before connecting.
    // Firestore rules require auth, and a listener that fires before sign-in
    // completes gets rejected and never retries - even after signing in.
    watchAuth((user) => {
      if (user) { set({ user }); get().subscribeToData(); }
    });
  },

  subscribeToData: () => {
    const { repo, subscribed } = get();
    if (subscribed) return;
    set({ subscribed: true });
    // TEMPORARY - remove once the Firestore permission issue is confirmed fixed
    if (isFirebaseConfigured) {
      const { auth } = getFirebase();
      console.log('[debug] connecting to Firestore. signed-in as:', auth?.currentUser?.uid, auth?.currentUser?.email);
    }
    repo.subscribe((snapshot) => set({ data: snapshot, ready: true }));
  },

  signInAs: async (role) => {
    if (isFirebaseConfigured && import.meta.env.VITE_DATA_SOURCE === 'firebase') {
      try {
        const user = await signInAsRole(role);
        if (user) { set({ user }); get().subscribeToData(); return; }
      } catch (err) {
        console.warn('[auth] Firebase sign-in failed, using demo profile:', err);
      }
    }
    set({ user: seed.users.find((u) => u.role === role) ?? null });
    get().subscribeToData();
  },

  signOut: () => {
    if (isFirebaseConfigured) void signOutUser();
    set({ user: null });
  },

  recordPayment: async ({ familyId, studentId, amount, method, reference, note }) => {
    const { repo, data, user } = get();
    if (!data) return { status: 'review' as const, reason: 'Not ready yet.' };

    // a placeholder payment, just to run through the matching engine - no real id yet
    const draft: Omit<Payment, 'id'> = {
      familyId,
      studentId,
      amount,
      method,
      reference,
      note,
      paidAt: new Date().toISOString(),
      recordedBy: user?.uid ?? 'unknown',
      status: 'review',
    };

    // the engine decides: matched, needs review, or a duplicate
    const open = data.invoices.filter((i) => outstandingOf(i) > 0);
    const result = matchPayment({ id: 'draft', ...draft }, open, data.payments);

    const saved = await repo.addPayment({
      ...draft,
      status: result.status,
      invoiceId: result.invoiceId,
    });

    if (result.status === 'matched' && result.invoiceId) {
      const invoice = data.invoices.find((i) => i.id === result.invoiceId);
      if (invoice) await repo.updateInvoice(applyPayment(invoice, saved));

      // if this payment settles part of an instalment plan, mark that part paid
      const plan = data.plans.find((p) => p.invoiceId === result.invoiceId);
      if (plan) {
        const partIndex = plan.installments.findIndex(
          (part) => !part.paid && Math.abs(part.amount - saved.amount) <= 1,
        );
        if (partIndex >= 0) {
          const installments = plan.installments.map((part, i) =>
            i === partIndex ? { ...part, paid: true } : part,
          );
          await repo.updatePlan({ ...plan, installments });
        }
      }
    }

    return { status: result.status, reason: result.reason };
  },

  offerPlan: async (invoiceId) => {
    const { repo, data } = get();
    if (!data) return;
    const invoice = data.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const history = seed.historyByFamily[invoice.familyId];
    const { installments, reason } = planInstallments({
      amountDue: outstandingOf(invoice),
      dueDate: invoice.dueDate,
      avgDelayDays: history?.avgDelayDays ?? 0,
      installmentPlansUsed: history?.installmentPlansUsed ?? 0,
      preferredDayOfMonth: 10,
    });

    await repo.savePlan({
      invoiceId,
      familyId: invoice.familyId,
      createdAt: new Date().toISOString(),
      installments,
      reason,
    });
  },

  toggleOffline: () => {
    const { repo, data } = get();
    repo.setOffline?.(data?.online ?? true);
  },

  riskProfiles: () => {
    const { data } = get();
    if (!data) return {};
    const out: Record<string, FamilyRiskProfile> = {};
    for (const fam of data.families) {
      const features = featuresFor(fam.id, data);
      out[fam.id] = {
        familyId: fam.id,
        features,
        result: scoreFamily(features),
        updatedAt: new Date().toISOString(),
      };
    }
    return out;
  },

  openInvoices: () => {
    const { data } = get();
    return data ? data.invoices.filter((i) => outstandingOf(i) > 0) : [];
  },

  familyBalance: (familyId) => {
    const { data } = get();
    if (!data) return 0;
    return data.invoices
      .filter((i) => i.familyId === familyId)
      .reduce((s, i) => s + outstandingOf(i), 0);
  },
}));

/** Convenience selector for the office dashboard. */
export function useForecast() {
  const openInvoices = useAppStore((s) => s.openInvoices());
  const profiles = useAppStore((s) => s.riskProfiles());
  return forecastCollection(openInvoices, profiles);
}
