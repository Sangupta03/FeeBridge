import { create } from 'zustand';
import type { DataSnapshot, Repository } from '../data/repository';
import { createRepository } from '../data';
import { signInAsRole, signOutUser, watchAuth } from '../lib/auth';
import { isFirebaseConfigured } from '../lib/firebase';
import { seed } from '../data/seed';
import { scoreFamily } from '../domain/risk';
import { matchPayment, applyPayment, outstandingOf } from '../domain/reconcile';
import { planInstallments } from '../domain/installments';
import { forecastCollection } from '../domain/forecast';
import type {
  AppUser, FamilyRiskProfile, Invoice, Payment, RiskFeatures, Role, NotificationItem,
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
  offerPlan: (invoiceId: string, customParts?: number, preferredDayOfMonth?: number) => Promise<void>;
  /** manually split a Needs Review payment across one or more of that family's invoices */
  splitPayment: (paymentId: string, allocations: Array<{ invoiceId: string; amount: number }>) => Promise<void>;
  toggleOffline: () => void;

  // ---- derived
  riskProfiles: () => Record<string, FamilyRiskProfile>;
  openInvoices: () => Invoice[];
  familyBalance: (familyId: string) => number;

  // ---- theme & ml & notifications states
  weights: Record<string, number> | null;
  notifications: NotificationItem[];
  theme: 'light' | 'dark';

  // ---- theme & ml & notifications actions
  saveWeights: (w: Record<string, number>) => void;
  resetWeights: () => void;
  sendNotification: (familyId: string, text: string, channel: 'whatsapp' | 'sms') => Promise<void>;
  markNotificationsAsRead: (familyId: string) => void;
  setTheme: (t: 'light' | 'dark') => void;
}

/**
 * If an invoice being settled has an instalment plan against it, mark whichever
 * part this amount pays off as paid. Shared by recordPayment() and
 * splitPayment() so both reconciliation paths keep a plan's timeline honest.
 */
async function markPlanInstallmentPaid(
  repo: Repository, data: DataSnapshot, invoiceId: string, amount: number,
) {
  const plan = data.plans.find((p) => p.invoiceId === invoiceId);
  if (!plan) return;

  const partIndex = plan.installments.findIndex(
    (part) => !part.paid && Math.abs(part.amount - amount) <= 1,
  );
  if (partIndex < 0) return;

  const installments = plan.installments.map((part, i) =>
    i === partIndex ? { ...part, paid: true } : part,
  );
  await repo.updatePlan({ ...plan, installments });
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
    const { repo, subscribed, user } = get();
    if (subscribed) return;
    set({ subscribed: true });
    repo.subscribe(
      (snapshot) => set({ data: snapshot, ready: true }),
      user ? { role: user.role, familyId: user.familyId } : undefined,
    );
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
      await markPlanInstallmentPaid(repo, data, result.invoiceId, saved.amount);
    }

    return { status: result.status, reason: result.reason };
  },

  offerPlan: async (invoiceId, customParts, preferredDayOfMonth) => {
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
      parts: customParts,
      preferredDayOfMonth: preferredDayOfMonth ?? 10,
    });

    await repo.savePlan({
      invoiceId,
      familyId: invoice.familyId,
      createdAt: new Date().toISOString(),
      installments,
      reason,
    });
  },

  splitPayment: async (paymentId, allocations) => {
    const { repo, data } = get();
    if (!data || allocations.length === 0) return;
    const payment = data.payments.find((p) => p.id === paymentId);
    if (!payment) return;

    const [first, ...rest] = allocations;

    // the original payment record settles the first invoice
    const firstInvoice = data.invoices.find((i) => i.id === first.invoiceId);
    const firstPortion = { ...payment, amount: first.amount, status: 'matched' as const, invoiceId: first.invoiceId };
    await repo.updatePayment(firstPortion);
    if (firstInvoice) await repo.updateInvoice(applyPayment(firstInvoice, firstPortion));
    await markPlanInstallmentPaid(repo, data, first.invoiceId, first.amount);

    // every other allocation becomes its own payment record, so each invoice
    // ends up settled by a real, individually reconciled payment
    for (const alloc of rest) {
      const invoice = data.invoices.find((i) => i.id === alloc.invoiceId);
      if (!invoice) continue;
      const saved = await repo.addPayment({
        familyId: payment.familyId,
        studentId: invoice.studentId,
        amount: alloc.amount,
        method: payment.method,
        reference: payment.reference,
        note: `Split from payment ${payment.reference}`,
        paidAt: payment.paidAt,
        recordedBy: payment.recordedBy,
        status: 'matched',
        invoiceId: alloc.invoiceId,
      });
      await repo.updateInvoice(applyPayment(invoice, saved));
      await markPlanInstallmentPaid(repo, data, alloc.invoiceId, alloc.amount);
    }
  },

  toggleOffline: () => {
    const { repo, data } = get();
    repo.setOffline?.(data?.online ?? true);
  },

  riskProfiles: () => {
    const { data, weights } = get();
    if (!data) return {};
    const out: Record<string, FamilyRiskProfile> = {};
    for (const fam of data.families) {
      const features = featuresFor(fam.id, data);
      out[fam.id] = {
        familyId: fam.id,
        features,
        result: scoreFamily(features, weights || undefined),
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

  // ---- theme & ml & notifications implementation
  weights: null,
  notifications: [
    { id: 'notif-1', familyId: 'fam-khan', text: 'Gentle reminder: Term 2 Tuition fees of \u20b99,000 are overdue.', channel: 'whatsapp', sentAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), read: true },
    { id: 'notif-2', familyId: 'fam-sharma', text: 'Standard bill issued for Aarav Sharma & Diya Sharma (Tuition + Transport).', channel: 'sms', sentAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(), read: true }
  ],
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',

  saveWeights: (w) => set({ weights: w }),
  resetWeights: () => set({ weights: null }),
  sendNotification: async (familyId, text, channel) => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      familyId,
      text,
      channel,
      sentAt: new Date().toISOString(),
      read: false
    };
    set((state) => ({ notifications: [notif, ...state.notifications] }));
  },
  markNotificationsAsRead: (familyId) => set((state) => ({
    notifications: state.notifications.map(n => n.familyId === familyId ? { ...n, read: true } : n)
  })),
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },
}));

/** Convenience selector for the office dashboard. */
export function useForecast() {
  const openInvoices = useAppStore((s) => s.openInvoices());
  const profiles = useAppStore((s) => s.riskProfiles());
  return forecastCollection(openInvoices, profiles);
}
