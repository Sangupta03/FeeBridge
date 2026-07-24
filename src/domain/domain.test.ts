import { describe, it, expect } from 'vitest';
import { scoreFamily, bandFor, sigmoid } from './risk';
import { planInstallments, choosePartCount, roundFriendly } from './installments';
import { matchPayment, findDuplicate, applyPayment, outstandingOf } from './reconcile';
import { forecastCollection, buildUpiLink } from './forecast';
import type { RiskFeatures, Invoice, Payment, FamilyRiskProfile } from '../types';

const cleanFamily: RiskFeatures = {
  latePayments: 0,
  overdueMonths: 0,
  hadPartialPayment: false,
  outstandingAmount: 0,
  installmentPlansUsed: 0,
  avgDelayDays: 0,
  siblings: 1,
};

const strugglingFamily: RiskFeatures = {
  latePayments: 3,
  overdueMonths: 2,
  hadPartialPayment: true,
  outstandingAmount: 12000,
  installmentPlansUsed: 2,
  avgDelayDays: 14,
  siblings: 3,
};

describe('risk model', () => {
  it('sigmoid stays inside 0..1', () => {
    expect(sigmoid(0)).toBeCloseTo(0.5);
    expect(sigmoid(-50)).toBeGreaterThanOrEqual(0);
    expect(sigmoid(50)).toBeLessThanOrEqual(1);
  });

  it('a family with a clean history scores healthy', () => {
    const r = scoreFamily(cleanFamily);
    expect(r.band).toBe('healthy');
    expect(r.score).toBeGreaterThan(70);
    expect(r.probability).toBeLessThan(0.3);
  });

  it('a struggling family scores at risk', () => {
    const r = scoreFamily(strugglingFamily);
    expect(r.band).toBe('at_risk');
    expect(r.score).toBeLessThan(40);
  });

  it('always explains itself with at most three reasons', () => {
    const r = scoreFamily(strugglingFamily);
    expect(r.reasons.length).toBeGreaterThan(0);
    expect(r.reasons.length).toBeLessThanOrEqual(3);
    // strongest first
    expect(r.reasons[0].weight).toBeGreaterThanOrEqual(r.reasons[1].weight);
    // reasons are human sentences, not codes
    expect(r.reasons[0].label).toMatch(/[a-z]/);
  });

  it('a clean family has nothing to explain', () => {
    expect(scoreFamily(cleanFamily).reasons.length).toBe(0);
  });

  it('more overdue months never improves the score', () => {
    const a = scoreFamily({ ...cleanFamily, overdueMonths: 1 }).score;
    const b = scoreFamily({ ...cleanFamily, overdueMonths: 3 }).score;
    expect(b).toBeLessThan(a);
  });

  it('bands split at 70 and 40', () => {
    expect(bandFor(85)).toBe('healthy');
    expect(bandFor(70)).toBe('healthy');
    expect(bandFor(55)).toBe('watch');
    expect(bandFor(39)).toBe('at_risk');
  });
});

describe('instalment planner', () => {
  it('rounds to friendly hundreds', () => {
    expect(roundFriendly(2983.33)).toBe(3000);
    expect(roundFriendly(1040)).toBe(1000);
  });

  it('leaves small fees whole', () => {
    expect(choosePartCount(1500, 0)).toBe(1);
  });

  it('splits a big fee into more parts', () => {
    expect(choosePartCount(9000, 0)).toBe(3);
    expect(choosePartCount(25000, 0)).toBe(4);
  });

  it('gives late payers an extra part', () => {
    expect(choosePartCount(9000, 14)).toBe(4);
  });

  it('instalments always add up to the exact amount due', () => {
    for (const amount of [9000, 7777, 12345, 500]) {
      const { installments } = planInstallments({ amountDue: amount, dueDate: '2026-07-10' });
      const total = installments.reduce((s, i) => s + i.amount, 0);
      expect(total).toBe(amount);
    }
  });

  it('spreads instalments one month apart on the preferred day', () => {
    const { installments } = planInstallments({
      amountDue: 9000,
      dueDate: '2026-07-01',
      preferredDayOfMonth: 10,
    });
    expect(installments).toHaveLength(3);
    const days = installments.map((i) => new Date(i.dueDate).getDate());
    expect(days).toEqual([10, 10, 10]);
    const months = installments.map((i) => new Date(i.dueDate).getMonth());
    expect(months[1]).toBe((months[0] + 1) % 12);
  });

  it('explains why it chose that shape', () => {
    const { reason } = planInstallments({ amountDue: 9000, dueDate: '2026-07-01', avgDelayDays: 12 });
    expect(reason.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------- reconcile

const invoice = (over: Partial<Invoice> = {}): Invoice => ({
  id: 'inv1',
  studentId: 'stu1',
  familyId: 'fam1',
  feeHeadId: 'fee1',
  title: 'Tuition - Term 2',
  amountDue: 5000,
  amountPaid: 0,
  dueDate: '2026-07-10',
  status: 'open',
  term: 'Term 2 2026',
  ...over,
});

const payment = (over: Partial<Payment> = {}): Payment => ({
  id: 'pay1',
  familyId: 'fam1',
  amount: 5000,
  method: 'upi',
  reference: 'UPI123',
  paidAt: '2026-07-09T10:00:00.000Z',
  recordedBy: 'parent',
  status: 'review',
  ...over,
});

describe('reconciliation', () => {
  it('matches a payment that settles the balance exactly', () => {
    const r = matchPayment(payment(), [invoice()]);
    expect(r.status).toBe('matched');
    expect(r.invoiceId).toBe('inv1');
  });

  it('applies a part payment to the oldest open invoice', () => {
    const older = invoice({ id: 'old', dueDate: '2026-05-10' });
    const newer = invoice({ id: 'new', dueDate: '2026-08-10' });
    const r = matchPayment(payment({ amount: 2000 }), [newer, older]);
    expect(r.status).toBe('matched');
    expect(r.invoiceId).toBe('old');
  });

  it('sends an unmatchable payment to Needs Review', () => {
    const r = matchPayment(payment({ familyId: 'nobody' }), [invoice()]);
    expect(r.status).toBe('review');
  });

  it('sends an overlarge payment to Needs Review', () => {
    const r = matchPayment(payment({ amount: 99000 }), [invoice()]);
    expect(r.status).toBe('review');
  });

  it('flags the same UPI reference recorded twice', () => {
    const first = payment({ id: 'a', status: 'matched' });
    const second = payment({ id: 'b', paidAt: '2026-07-09T10:05:00.000Z' });
    const r = matchPayment(second, [invoice()], [first]);
    expect(r.status).toBe('duplicate');
  });

  it('does not flag the same amount a week apart', () => {
    const first = payment({ id: 'a', status: 'matched', paidAt: '2026-07-01T10:00:00.000Z' });
    const second = payment({ id: 'b', paidAt: '2026-07-09T10:00:00.000Z' });
    expect(findDuplicate(second, [first])).toBeUndefined();
  });

  it('applying a payment updates the invoice status', () => {
    const part = applyPayment(invoice(), payment({ amount: 2000 }));
    expect(part.status).toBe('part_paid');
    expect(outstandingOf(part)).toBe(3000);

    const full = applyPayment(invoice(), payment({ amount: 5000 }));
    expect(full.status).toBe('paid');
    expect(outstandingOf(full)).toBe(0);
  });
});

describe('forecast', () => {
  it('expects less money from risky families', () => {
    const invs = [invoice({ id: 'i1', familyId: 'safe' }), invoice({ id: 'i2', familyId: 'risky' })];
    const profiles: Record<string, FamilyRiskProfile> = {
      safe: {
        familyId: 'safe',
        features: cleanFamily,
        result: scoreFamily(cleanFamily),
        updatedAt: '',
      },
      risky: {
        familyId: 'risky',
        features: strugglingFamily,
        result: scoreFamily(strugglingFamily),
        updatedAt: '',
      },
    };
    const f = forecastCollection(invs, profiles);
    expect(f.totalOutstanding).toBe(10000);
    expect(f.expected).toBeLessThan(f.totalOutstanding);
    expect(f.low).toBeLessThanOrEqual(f.expected);
    expect(f.high).toBeGreaterThanOrEqual(f.expected);
    expect(f.confidence).toBeGreaterThanOrEqual(0);
    expect(f.confidence).toBeLessThanOrEqual(1);
  });

  it('handles an empty ledger without dividing by zero', () => {
    const f = forecastCollection([], {});
    expect(f.expected).toBe(0);
    expect(f.confidence).toBe(0);
  });
});

describe('upi link', () => {
  it('builds a scannable upi intent with the amount pre-filled', () => {
    const link = buildUpiLink({
      vpa: 'school@okaxis',
      payeeName: 'Green Valley School',
      amount: 5000,
      note: 'Tuition Term 2',
      txnRef: 'FB-1',
    });
    expect(link.startsWith('upi://pay?')).toBe(true);
    expect(link).toContain('pa=school%40okaxis');
    expect(link).toContain('am=5000.00');
    expect(link).toContain('cu=INR');
  });
});
