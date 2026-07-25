import type { RiskFeatures, RiskResult, RiskReason, RiskBand } from '../types';

/**
 * Payment risk model.
 *
 * This is a logistic model: we combine a handful of features into log-odds and
 * squash them into a probability that a family misses their next payment.
 *
 * The coefficients below are hand-set from domain reasoning rather than trained,
 * because a new school has no history on day one. The shape is deliberately the
 * same as a trained logistic regression, so once a school has a term or two of
 * data these weights can be replaced by fitted ones without touching any UI.
 * We say that openly rather than calling it something it is not.
 *
 * Crucially, every prediction carries its reasons, so the office can always see
 * *why* a family was flagged. No black boxes.
 */

export const MODEL_VERSION = 'heuristic-logistic-v1';

/** log-odds contribution per unit of each feature */
export const WEIGHTS = {
  intercept: -2.2,
  latePayments: 0.42,
  overdueMonths: 0.85,
  hadPartialPayment: 0.55,
  outstandingPer10k: 0.40,
  installmentPlansUsed: 0.30,
  avgDelayDaysPer7: 0.28,
  siblings: 0.18,
} as const;

const LABELS: Record<string, (v: number) => string> = {
  latePayments: (v) => `Paid late ${v} ${v === 1 ? 'time' : 'times'}`,
  overdueMonths: (v) => `${v} ${v === 1 ? 'month' : 'months'} currently overdue`,
  hadPartialPayment: () => 'Last payment was only partial',
  outstandingPer10k: (v) => `\u20b9${Math.round(v).toLocaleString('en-IN')} still outstanding`,
  installmentPlansUsed: (v) => `Used an instalment plan ${v} ${v === 1 ? 'time' : 'times'}`,
  avgDelayDaysPer7: (v) => `Pays about ${Math.round(v)} days late on average`,
  siblings: (v) => `${v} children in the school`,
};

export function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export function bandFor(score: number): RiskBand {
  if (score >= 70) return 'healthy';
  if (score >= 40) return 'watch';
  return 'at_risk';
}

/**
 * Score a family. Returns a health score (0-100, higher is better), the modelled
 * probability of missing the next payment, and the reasons behind it.
 */
export function scoreFamily(f: RiskFeatures, customWeights?: Record<string, number>): RiskResult {
  const w = customWeights || WEIGHTS;
  const contributions: Array<{ code: string; raw: number; weight: number }> = [
    { 
      code: 'latePayments', 
      raw: f.latePayments, 
      weight: (w.latePayments ?? WEIGHTS.latePayments) * f.latePayments 
    },
    { 
      code: 'overdueMonths', 
      raw: f.overdueMonths, 
      weight: (w.overdueMonths ?? WEIGHTS.overdueMonths) * f.overdueMonths 
    },
    {
      code: 'hadPartialPayment',
      raw: f.hadPartialPayment ? 1 : 0,
      weight: f.hadPartialPayment ? (w.hadPartialPayment ?? WEIGHTS.hadPartialPayment) : 0,
    },
    {
      code: 'outstandingPer10k',
      raw: f.outstandingAmount,
      weight: ((w.outstandingPer10k ?? WEIGHTS.outstandingPer10k) * f.outstandingAmount) / 10000,
    },
    {
      code: 'installmentPlansUsed',
      raw: f.installmentPlansUsed,
      weight: (w.installmentPlansUsed ?? WEIGHTS.installmentPlansUsed) * f.installmentPlansUsed,
    },
    {
      code: 'avgDelayDaysPer7',
      raw: f.avgDelayDays,
      weight: ((w.avgDelayDaysPer7 ?? WEIGHTS.avgDelayDaysPer7) * f.avgDelayDays) / 7,
    },
    // more than one child is a cost pressure, so only count the extra ones
    {
      code: 'siblings',
      raw: f.siblings,
      weight: (w.siblings ?? WEIGHTS.siblings) * Math.max(0, f.siblings - 1),
    },
  ];

  const z = (w.intercept ?? WEIGHTS.intercept) + contributions.reduce((sum, c) => sum + c.weight, 0);
  const probability = sigmoid(z);
  const score = Math.round((1 - probability) * 100);

  const reasons: RiskReason[] = contributions
    .filter((c) => c.weight > 0.01)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((c) => ({
      code: c.code,
      label: LABELS[c.code](c.raw),
      weight: Number(c.weight.toFixed(3)),
    }));

  return {
    score,
    probability: Number(probability.toFixed(4)),
    band: bandFor(score),
    reasons,
  };
}

/** Human sentence for a band, used in the office UI. */
export function bandCopy(band: RiskBand): { label: string; help: string } {
  switch (band) {
    case 'healthy':
      return { label: 'On track', help: 'Nothing to do here.' };
    case 'watch':
      return { label: 'Worth a gentle nudge', help: 'A quiet reminder now usually settles it.' };
    case 'at_risk':
      return { label: 'Likely to need help', help: 'Offer an instalment plan before the due date.' };
  }
}
