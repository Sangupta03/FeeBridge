import type {
  Family, Student, Invoice, Payment, FeeHead, InstallmentPlan, AppUser, Role,
} from '../types';

/**
 * The data layer is behind an interface on purpose.
 *
 * The UI never imports Firebase directly. It talks to a Repository. That means:
 *  - we can run the entire app on seeded local data (instant demo, no network),
 *  - we can swap in Firestore without touching a single component,
 *  - and the engines stay testable as pure functions.
 *
 * This is the "clean backend integration" part of the architecture.
 */

/** Who's asking - lets a repository scope its reads to what that role can see. */
export interface SubscribeContext {
  role: Role;
  familyId?: string;
}

export interface Repository {
  /** stream everything the current user is allowed to see */
  subscribe(onChange: (snapshot: DataSnapshot) => void, context?: SubscribeContext): () => void;

  addPayment(payment: Omit<Payment, 'id'>): Promise<Payment>;
  updatePayment(payment: Payment): Promise<void>;
  updateInvoice(invoice: Invoice): Promise<void>;
  savePlan(plan: Omit<InstallmentPlan, 'id'>): Promise<InstallmentPlan>;
  updatePlan(plan: InstallmentPlan): Promise<void>;
  addFeeHead(fee: Omit<FeeHead, 'id'>): Promise<FeeHead>;

  /** demo helper: pretend the network went away */
  setOffline?(offline: boolean): void;
}

export interface DataSnapshot {
  families: Family[];
  students: Student[];
  invoices: Invoice[];
  payments: Payment[];
  feeHeads: FeeHead[];
  plans: InstallmentPlan[];
  users: AppUser[];
  /** writes still queued on this device because we are offline */
  queuedWrites: number;
  online: boolean;
}

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
