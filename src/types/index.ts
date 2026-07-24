/**
 * FeeBridge domain types.
 * Everything the app understands lives here, so the UI, the data layer and the
 * engines all speak the same language.
 */

export type Role = 'admin' | 'parent' | 'clerk';

export type PaymentMethod = 'cash' | 'cheque' | 'upi';

export type PaymentStatus =
  | 'matched'      // linked to an invoice automatically
  | 'review'       // could not be matched confidently -> Needs Review
  | 'duplicate';   // looks like the same payment recorded twice

export type InvoiceStatus = 'open' | 'part_paid' | 'paid' | 'overdue';

export type RiskBand = 'healthy' | 'watch' | 'at_risk';

export interface Family {
  id: string;
  name: string;              // "Sharma family"
  guardianName: string;
  phone: string;
  email?: string;
}

export interface Student {
  id: string;
  familyId: string;
  name: string;
  className: string;         // "Class 7-B"
  rollNo: string;
}

export interface FeeHead {
  id: string;
  name: string;              // Tuition / Transport / Late fee
  amount: number;            // in rupees
  term: string;              // "Term 2 2026"
  appliesToClasses: string[]; // ["Class 7-B", ...] or ["*"]
  dueDate: string;           // ISO date
}

export interface Invoice {
  id: string;
  studentId: string;
  familyId: string;
  feeHeadId: string;
  title: string;             // "Tuition - Term 2"
  amountDue: number;
  amountPaid: number;
  dueDate: string;           // ISO
  status: InvoiceStatus;
  term: string;
}

export interface Payment {
  id: string;
  familyId: string;
  studentId?: string;
  invoiceId?: string;        // set once reconciled
  amount: number;
  method: PaymentMethod;
  reference: string;         // UPI txn ref / cheque no / receipt no
  paidAt: string;            // ISO
  recordedBy: string;        // uid or 'parent'
  status: PaymentStatus;
  note?: string;
  /** true while the write is still queued on the device (offline) */
  pending?: boolean;
}

export interface InstallmentPlan {
  id: string;
  invoiceId: string;
  familyId: string;
  createdAt: string;
  installments: Installment[];
  reason: string;            // why this shape was suggested
}

export interface Installment {
  seq: number;
  amount: number;
  dueDate: string;           // ISO
  paid: boolean;
}

/** A single human-readable driver behind a risk score. */
export interface RiskReason {
  code: string;
  label: string;             // "Paid late 3 times this year"
  weight: number;            // contribution to the log-odds (signed)
}

export interface RiskResult {
  /** 0-100, higher is healthier. Shown to the office as a health score. */
  score: number;
  /** modelled probability the family misses the next payment (0-1) */
  probability: number;
  band: RiskBand;
  reasons: RiskReason[];     // sorted, strongest first
}

/** Features the risk model reads. All derived from data the school already keeps. */
export interface RiskFeatures {
  latePayments: number;        // how many past payments arrived after the due date
  overdueMonths: number;       // months currently overdue
  hadPartialPayment: boolean;  // paid less than the full amount last time
  outstandingAmount: number;   // rupees currently outstanding
  installmentPlansUsed: number;
  avgDelayDays: number;        // average days late across history
  siblings: number;            // children in the school (cost pressure)
}

export interface FamilyRiskProfile {
  familyId: string;
  features: RiskFeatures;
  result: RiskResult;
  updatedAt: string;
}

export interface CollectionForecast {
  expected: number;
  low: number;
  high: number;
  confidence: number;   // 0-1
  totalOutstanding: number;
}

export interface AppUser {
  uid: string;
  name: string;
  role: Role;
  familyId?: string;    // only for parents
}
