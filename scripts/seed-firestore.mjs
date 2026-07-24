/**
 * Seed a Firebase project with the FeeBridge demo school.
 *
 * Run once, after you have created the project and switched Firestore on:
 *   npm run seed
 *
 * It creates three sign-in accounts (office / desk / parent), then uploads the
 * families, students, invoices and payments that the demo tells its story with.
 *
 * IMPORTANT: run this while Firestore is still in test mode. Deploy the locked
 * down rules in firestore.rules afterwards.
 */
import { readFileSync } from 'node:fs';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, doc, setDoc, writeBatch, collection, getDocs,
} from 'firebase/firestore';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
} from 'firebase/auth';

const RESET = process.argv.includes('--reset');

// ---------------------------------------------------------------- env loading
function loadEnv() {
  let raw = '';
  for (const file of ['.env.local', '.env']) {
    try { raw = readFileSync(file, 'utf8'); break; } catch { /* try next */ }
  }
  if (!raw) {
    console.error('\n  Could not find .env.local. Copy .env.example first.\n');
    process.exit(1);
  }
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = loadEnv();
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

if (!config.apiKey || !config.projectId) {
  console.error('\n  Missing Firebase config in .env.local. Fill in VITE_FIREBASE_* first.\n');
  process.exit(1);
}

const app = initializeApp(config);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------------------------------------------------------------- demo school
const iso = (days) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

const families = [
  { id: 'fam-sharma', name: 'Sharma family', guardianName: 'Anita Sharma', phone: '+91 98100 11111' },
  { id: 'fam-khan',   name: 'Khan family',   guardianName: 'Imran Khan',   phone: '+91 98100 22222' },
  { id: 'fam-patel',  name: 'Patel family',  guardianName: 'Nilesh Patel', phone: '+91 98100 33333' },
  { id: 'fam-rao',    name: 'Rao family',    guardianName: 'Lakshmi Rao',  phone: '+91 98100 44444' },
  { id: 'fam-dsouza', name: 'D\u2019Souza family', guardianName: 'Maria D\u2019Souza', phone: '+91 98100 55555' },
  { id: 'fam-verma',  name: 'Verma family',  guardianName: 'Rohit Verma',  phone: '+91 98100 66666' },
];

const students = [
  { id: 'stu-aarav',  familyId: 'fam-sharma', name: 'Aarav Sharma', className: 'Class 7-B', rollNo: '7B-12' },
  { id: 'stu-diya',   familyId: 'fam-sharma', name: 'Diya Sharma',  className: 'Class 4-A', rollNo: '4A-08' },
  { id: 'stu-zoya',   familyId: 'fam-khan',   name: 'Zoya Khan',    className: 'Class 9-A', rollNo: '9A-21' },
  { id: 'stu-imaan',  familyId: 'fam-khan',   name: 'Imaan Khan',   className: 'Class 6-C', rollNo: '6C-04' },
  { id: 'stu-arya',   familyId: 'fam-khan',   name: 'Arya Khan',    className: 'Class 2-B', rollNo: '2B-15' },
  { id: 'stu-kabir',  familyId: 'fam-patel',  name: 'Kabir Patel',  className: 'Class 9-A', rollNo: '9A-07' },
  { id: 'stu-meera',  familyId: 'fam-rao',    name: 'Meera Rao',    className: 'Class 5-A', rollNo: '5A-19' },
  { id: 'stu-ryan',   familyId: 'fam-dsouza', name: 'Ryan D\u2019Souza', className: 'Class 7-B', rollNo: '7B-03' },
  { id: 'stu-nikhil', familyId: 'fam-verma',  name: 'Nikhil Verma', className: 'Class 9-A', rollNo: '9A-11' },
];

const feeHeads = [
  { id: 'fee-tuition',   name: 'Tuition',   amount: 9000, term: 'Term 2 2026', appliesToClasses: ['*'], dueDate: iso(6) },
  { id: 'fee-transport', name: 'Transport', amount: 2400, term: 'Term 2 2026', appliesToClasses: ['*'], dueDate: iso(6) },
  { id: 'fee-lab',       name: 'Lab fee',   amount: 1500, term: 'Term 2 2026', appliesToClasses: ['Class 9-A'], dueDate: iso(20) },
];

const mkInvoice = (id, studentId, familyId, title, amountDue, amountPaid, dueDate) => ({
  id, studentId, familyId, feeHeadId: 'fee-tuition', title, amountDue, amountPaid, dueDate,
  term: 'Term 2 2026',
  status: amountPaid >= amountDue ? 'paid'
    : new Date(dueDate) < new Date() ? 'overdue'
      : amountPaid > 0 ? 'part_paid' : 'open',
});

const invoices = [
  mkInvoice('inv-1',  'stu-aarav',  'fam-sharma', 'Tuition \u2013 Term 2',   9000, 0,    iso(6)),
  mkInvoice('inv-2',  'stu-diya',   'fam-sharma', 'Tuition \u2013 Term 2',   9000, 0,    iso(6)),
  mkInvoice('inv-3',  'stu-aarav',  'fam-sharma', 'Transport \u2013 Term 2', 2400, 0,    iso(6)),
  mkInvoice('inv-4',  'stu-zoya',   'fam-khan',   'Tuition \u2013 Term 2',   9000, 3000, iso(-24)),
  mkInvoice('inv-5',  'stu-imaan',  'fam-khan',   'Tuition \u2013 Term 2',   9000, 0,    iso(-24)),
  mkInvoice('inv-6',  'stu-arya',   'fam-khan',   'Tuition \u2013 Term 2',   9000, 0,    iso(-24)),
  mkInvoice('inv-7',  'stu-kabir',  'fam-patel',  'Tuition \u2013 Term 2',   9000, 9000, iso(-10)),
  mkInvoice('inv-8',  'stu-kabir',  'fam-patel',  'Lab fee \u2013 Term 2',   1500, 0,    iso(20)),
  mkInvoice('inv-9',  'stu-meera',  'fam-rao',    'Tuition \u2013 Term 2',   9000, 4500, iso(-4)),
  mkInvoice('inv-10', 'stu-ryan',   'fam-dsouza', 'Tuition \u2013 Term 2',   9000, 9000, iso(-12)),
  mkInvoice('inv-11', 'stu-nikhil', 'fam-verma',  'Tuition \u2013 Term 2',   9000, 0,    iso(3)),
];

const payments = [
  { id: 'pay-1', familyId: 'fam-patel',  studentId: 'stu-kabir', invoiceId: 'inv-7',  amount: 9000, method: 'upi',    reference: 'UPI-8891',  paidAt: iso(-11), recordedBy: 'parent',  status: 'matched' },
  { id: 'pay-2', familyId: 'fam-dsouza', studentId: 'stu-ryan',  invoiceId: 'inv-10', amount: 9000, method: 'upi',    reference: 'UPI-8892',  paidAt: iso(-13), recordedBy: 'parent',  status: 'matched' },
  { id: 'pay-3', familyId: 'fam-rao',    studentId: 'stu-meera', invoiceId: 'inv-9',  amount: 4500, method: 'cash',   reference: 'RCPT-241',  paidAt: iso(-5),  recordedBy: 'clerk-1', status: 'matched' },
  { id: 'pay-4', familyId: 'fam-khan',   studentId: 'stu-zoya',  invoiceId: 'inv-4',  amount: 3000, method: 'cheque', reference: 'CHQ-55120', paidAt: iso(-20), recordedBy: 'clerk-1', status: 'matched' },
  { id: 'pay-5', familyId: 'fam-verma',                                                amount: 12000, method: 'cheque', reference: 'CHQ-55133', paidAt: iso(-2),  recordedBy: 'clerk-1', status: 'review', note: 'Larger than any single open invoice' },
  { id: 'pay-6', familyId: 'fam-sharma', studentId: 'stu-aarav', amount: 9000, method: 'upi',    reference: 'UPI-7701', paidAt: iso(-95), recordedBy: 'parent',  status: 'matched' },
  { id: 'pay-7', familyId: 'fam-sharma', studentId: 'stu-diya',  amount: 9000, method: 'cheque', reference: 'CHQ-7702', paidAt: iso(-93), recordedBy: 'parent',  status: 'matched' },
];

const accounts = [
  { role: 'admin',  email: 'office@feebridge.demo', password: 'feebridge123', name: 'Priya Menon' },
  { role: 'clerk',  email: 'desk@feebridge.demo',   password: 'feebridge123', name: 'Suresh Nair' },
  { role: 'parent', email: 'parent@feebridge.demo', password: 'feebridge123', name: 'Anita Sharma', familyId: 'fam-sharma' },
];

// ---------------------------------------------------------------- upload
async function upsertCollection(name, rows) {
  const batch = writeBatch(db);
  for (const row of rows) {
    const { id, ...data } = row;
    batch.set(doc(collection(db, name), id), data);
  }
  await batch.commit();
  console.log(`  ${name.padEnd(10)} ${rows.length} documents`);
}

/** Create or sign in to a demo account. Returns its uid, but does not write its
 *  profile doc yet - that write needs admin rights (see main()), and right
 *  after this call we're signed in as the account itself, not as admin. */
async function resolveAccountUid(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`  created  ${email}`);
    return cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log(`  exists   ${email}`);
      return cred.user.uid;
    }
    throw err;
  }
}

/** Delete every document in a collection, in batches. Used by --reset to clear
 *  out test payments and plans, which the normal seed never touches (it only
 *  overwrites documents that share an id with the seed data below). */
async function clearCollection(name) {
  const snap = await getDocs(collection(db, name));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  console.log(`  ${name.padEnd(10)} cleared (${snap.docs.length} documents)`);
}

async function main() {
  console.log(`\nSeeding project: ${config.projectId}\n`);

  console.log('Accounts');
  const uidByRole = {};
  for (const acc of accounts) {
    uidByRole[acc.role] = await resolveAccountUid(acc.email, acc.password);
  }

  // profile writes (and everything below) need admin rights, so sign back in
  // as admin now - the loop above left us signed in as the last account
  const admin = accounts.find((a) => a.role === 'admin');
  await signInWithEmailAndPassword(auth, admin.email, admin.password);

  for (const acc of accounts) {
    const profile = { name: acc.name, role: acc.role };
    if (acc.familyId) profile.familyId = acc.familyId;
    await setDoc(doc(db, 'users', uidByRole[acc.role]), profile, { merge: true });
  }

  if (RESET) {
    console.log('\nResetting (--reset)');
    await clearCollection('payments');
    await clearCollection('plans');
  }

  console.log('\nCollections');
  await upsertCollection('families', families);
  await upsertCollection('students', students);
  await upsertCollection('feeHeads', feeHeads);
  await upsertCollection('invoices', invoices);
  await upsertCollection('payments', payments);

  console.log(`
Done.

  Sign in with:
    office@feebridge.demo / feebridge123   (the office)
    desk@feebridge.demo   / feebridge123   (the front desk)
    parent@feebridge.demo / feebridge123   (a parent)

  Next: set VITE_DATA_SOURCE=firebase in .env.local, then deploy the security
  rules in firestore.rules from the Firebase console.
`);
  process.exit(0);
}

main().catch((err) => {
  console.error('\nSeeding failed:', err.message || err);
  if (err.code === 'permission-denied') {
    console.error('Firestore rules are blocking writes. Set the database to test mode, seed, then deploy the real rules.\n');
  }
  process.exit(1);
});
