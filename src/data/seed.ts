import type {
  Family, Student, FeeHead, Invoice, Payment, AppUser,
} from '../types';

/**
 * Seeded demo data.
 *
 * A demo that depends on a live network is a demo that fails in front of judges.
 * This gives the whole app a believable school to run on with zero setup, and it
 * doubles as the fixture set for tests.
 *
 * Everything is deterministic, so every run of the demo looks the same.
 */

const iso = (daysFromNow: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
};

export const families: Family[] = [
  { id: 'fam-sharma',  name: 'Sharma family',  guardianName: 'Anita Sharma',  phone: '+91 98100 11111' },
  { id: 'fam-khan',    name: 'Khan family',    guardianName: 'Imran Khan',    phone: '+91 98100 22222' },
  { id: 'fam-patel',   name: 'Patel family',   guardianName: 'Nilesh Patel',  phone: '+91 98100 33333' },
  { id: 'fam-rao',     name: 'Rao family',     guardianName: 'Lakshmi Rao',   phone: '+91 98100 44444' },
  { id: 'fam-dsouza',  name: 'D\u2019Souza family', guardianName: 'Maria D\u2019Souza', phone: '+91 98100 55555' },
  { id: 'fam-verma',   name: 'Verma family',   guardianName: 'Rohit Verma',   phone: '+91 98100 66666' },
];

export const students: Student[] = [
  { id: 'stu-aarav',  familyId: 'fam-sharma', name: 'Aarav Sharma',  className: 'Class 7-B', rollNo: '7B-12' },
  { id: 'stu-diya',   familyId: 'fam-sharma', name: 'Diya Sharma',   className: 'Class 4-A', rollNo: '4A-08' },
  { id: 'stu-zoya',   familyId: 'fam-khan',   name: 'Zoya Khan',     className: 'Class 9-A', rollNo: '9A-21' },
  { id: 'stu-imaan',  familyId: 'fam-khan',   name: 'Imaan Khan',    className: 'Class 6-C', rollNo: '6C-04' },
  { id: 'stu-arya',   familyId: 'fam-khan',   name: 'Arya Khan',     className: 'Class 2-B', rollNo: '2B-15' },
  { id: 'stu-kabir',  familyId: 'fam-patel',  name: 'Kabir Patel',   className: 'Class 9-A', rollNo: '9A-07' },
  { id: 'stu-meera',  familyId: 'fam-rao',    name: 'Meera Rao',     className: 'Class 5-A', rollNo: '5A-19' },
  { id: 'stu-ryan',   familyId: 'fam-dsouza', name: 'Ryan D\u2019Souza', className: 'Class 7-B', rollNo: '7B-03' },
  { id: 'stu-nikhil', familyId: 'fam-verma',  name: 'Nikhil Verma',  className: 'Class 9-A', rollNo: '9A-11' },
];

export const feeHeads: FeeHead[] = [
  { id: 'fee-tuition',   name: 'Tuition',   amount: 9000, term: 'Term 2 2026', appliesToClasses: ['*'], dueDate: iso(6) },
  { id: 'fee-transport', name: 'Transport', amount: 2400, term: 'Term 2 2026', appliesToClasses: ['*'], dueDate: iso(6) },
  { id: 'fee-lab',       name: 'Lab fee',   amount: 1500, term: 'Term 2 2026', appliesToClasses: ['Class 9-A'], dueDate: iso(20) },
];

/** helper so invoices stay consistent */
function inv(
  id: string, studentId: string, familyId: string, title: string,
  amountDue: number, amountPaid: number, dueDate: string,
): Invoice {
  const status: Invoice['status'] =
    amountPaid >= amountDue ? 'paid'
      : new Date(dueDate) < new Date() ? 'overdue'
        : amountPaid > 0 ? 'part_paid' : 'open';
  return { id, studentId, familyId, feeHeadId: 'fee-tuition', title, amountDue, amountPaid, dueDate, status, term: 'Term 2 2026' };
}

export const invoices: Invoice[] = [
  // Sharma - the hero story: two children, about to fall behind
  inv('inv-1', 'stu-aarav', 'fam-sharma', 'Tuition \u2013 Term 2',  9000, 0, iso(6)),
  inv('inv-2', 'stu-diya',  'fam-sharma', 'Tuition \u2013 Term 2',  9000, 0, iso(6)),
  inv('inv-3', 'stu-aarav', 'fam-sharma', 'Transport \u2013 Term 2', 2400, 0, iso(6)),

  // Khan - three children, already overdue, the affordability case
  inv('inv-4', 'stu-zoya',  'fam-khan', 'Tuition \u2013 Term 2', 9000, 3000, iso(-24)),
  inv('inv-5', 'stu-imaan', 'fam-khan', 'Tuition \u2013 Term 2', 9000, 0,    iso(-24)),
  inv('inv-6', 'stu-arya',  'fam-khan', 'Tuition \u2013 Term 2', 9000, 0,    iso(-24)),

  // Patel - healthy payer
  inv('inv-7', 'stu-kabir', 'fam-patel', 'Tuition \u2013 Term 2', 9000, 9000, iso(-10)),
  inv('inv-8', 'stu-kabir', 'fam-patel', 'Lab fee \u2013 Term 2',  1500, 0,    iso(20)),

  // Rao - slightly late but fine
  inv('inv-9',  'stu-meera', 'fam-rao', 'Tuition \u2013 Term 2', 9000, 4500, iso(-4)),

  // D'Souza - healthy
  inv('inv-10', 'stu-ryan', 'fam-dsouza', 'Tuition \u2013 Term 2', 9000, 9000, iso(-12)),

  // Verma - cash payer, the reconciliation story
  inv('inv-11', 'stu-nikhil', 'fam-verma', 'Tuition \u2013 Term 2', 9000, 0, iso(3)),
];

export const payments: Payment[] = [
  { id: 'pay-1', familyId: 'fam-patel',  studentId: 'stu-kabir', invoiceId: 'inv-7',  amount: 9000, method: 'upi',    reference: 'UPI-8891', paidAt: iso(-11), recordedBy: 'parent', status: 'matched' },
  { id: 'pay-2', familyId: 'fam-dsouza', studentId: 'stu-ryan',  invoiceId: 'inv-10', amount: 9000, method: 'upi',    reference: 'UPI-8892', paidAt: iso(-13), recordedBy: 'parent', status: 'matched' },
  { id: 'pay-3', familyId: 'fam-rao',    studentId: 'stu-meera', invoiceId: 'inv-9',  amount: 4500, method: 'cash',   reference: 'RCPT-241', paidAt: iso(-5),  recordedBy: 'clerk-1', status: 'matched' },
  { id: 'pay-4', familyId: 'fam-khan',   studentId: 'stu-zoya',  invoiceId: 'inv-4',  amount: 3000, method: 'cheque', reference: 'CHQ-55120', paidAt: iso(-20), recordedBy: 'clerk-1', status: 'matched' },
  // one that could not be matched - shows the Needs Review pile is real
  { id: 'pay-5', familyId: 'fam-verma',  amount: 12000, method: 'cheque', reference: 'CHQ-55133', paidAt: iso(-2), recordedBy: 'clerk-1', status: 'review', note: 'Larger than any single open invoice' },
  // Sharma is the hero story - give them real history from Term 1, so their own
  // wallet isn't empty even though every Term 2 invoice is still unpaid
  { id: 'pay-6', familyId: 'fam-sharma', studentId: 'stu-aarav', amount: 9000, method: 'upi',    reference: 'UPI-7701', paidAt: iso(-95), recordedBy: 'parent', status: 'matched' },
  { id: 'pay-7', familyId: 'fam-sharma', studentId: 'stu-diya',  amount: 9000, method: 'cheque', reference: 'CHQ-7702', paidAt: iso(-93), recordedBy: 'parent', status: 'matched' },
];

export const users: AppUser[] = [
  { uid: 'u-admin', name: 'Priya Menon',  role: 'admin' },
  { uid: 'u-clerk', name: 'Suresh Nair',  role: 'clerk' },
  { uid: 'u-parent', name: 'Anita Sharma', role: 'parent', familyId: 'fam-sharma' },
];

/**
 * Payment history summary per family, used by the risk model.
 * In production these are computed from the payments collection by a Cloud
 * Function; here they are pre-computed so the demo is instant and repeatable.
 */
export const historyByFamily: Record<
  string,
  { latePayments: number; installmentPlansUsed: number; avgDelayDays: number; hadPartialPayment: boolean }
> = {
  'fam-sharma': { latePayments: 2, installmentPlansUsed: 0, avgDelayDays: 9,  hadPartialPayment: false },
  'fam-khan':   { latePayments: 3, installmentPlansUsed: 2, avgDelayDays: 14, hadPartialPayment: true },
  'fam-patel':  { latePayments: 0, installmentPlansUsed: 0, avgDelayDays: 0,  hadPartialPayment: false },
  'fam-rao':    { latePayments: 1, installmentPlansUsed: 0, avgDelayDays: 5,  hadPartialPayment: true },
  'fam-dsouza': { latePayments: 0, installmentPlansUsed: 0, avgDelayDays: 1,  hadPartialPayment: false },
  'fam-verma':  { latePayments: 1, installmentPlansUsed: 1, avgDelayDays: 7,  hadPartialPayment: false },
};

export const seed = { families, students, feeHeads, invoices, payments, users, historyByFamily };
export type SeedData = typeof seed;
