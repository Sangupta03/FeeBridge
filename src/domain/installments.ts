import type { Installment, RiskFeatures } from '../types';

/**
 * Instalment planner.
 *
 * A fixed "split it in two" button is not much help. This suggests a plan shaped
 * by what we know about the family: how big the fee is, how late they usually
 * pay, and whether they have used a plan before. It then rounds to friendly
 * numbers, because nobody wants to pay 2,983.33.
 */

export interface PlanInput {
  amountDue: number;
  dueDate: string | Date;
  /** average days after the due date this family usually pays */
  avgDelayDays?: number;
  /** how many plans they have used before */
  installmentPlansUsed?: number;
  /** force a specific number of parts (otherwise chosen for them) */
  parts?: number;
  /** day of month the family usually has money, e.g. 10 for just after salary */
  preferredDayOfMonth?: number;
}

export interface PlanResult {
  installments: Installment[];
  parts: number;
  reason: string;
}

/** Round to the nearest 100 so the numbers feel human. */
export function roundFriendly(n: number): number {
  return Math.round(n / 100) * 100;
}

/**
 * Choose how many parts to split into.
 * Small fees stay whole. Bigger fees, or families who run late, get more room.
 */
export function choosePartCount(amountDue: number, avgDelayDays: number): number {
  let parts = 1;
  if (amountDue > 3000) parts = 2;
  if (amountDue > 8000) parts = 3;
  if (amountDue > 20000) parts = 4;

  // if they are usually a couple of weeks late, one extra part buys breathing room
  if (avgDelayDays >= 10 && parts < 4) parts += 1;

  return parts;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getTime());
  const targetMonth = d.getMonth() + months;
  d.setMonth(targetMonth);
  return d;
}

function withPreferredDay(date: Date, day?: number): Date {
  if (!day) return date;
  const d = new Date(date.getTime());
  // clamp to the end of the month (no 31 Feb)
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

export function planInstallments(input: PlanInput): PlanResult {
  const {
    amountDue,
    dueDate,
    avgDelayDays = 0,
    installmentPlansUsed = 0,
    preferredDayOfMonth,
  } = input;

  const start = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const parts = input.parts ?? choosePartCount(amountDue, avgDelayDays);

  // even, friendly amounts; the final part absorbs the rounding remainder
  const base = roundFriendly(amountDue / parts);
  const installments: Installment[] = [];
  let allocated = 0;

  for (let i = 0; i < parts; i++) {
    const isLast = i === parts - 1;
    const amount = isLast ? amountDue - allocated : base;
    allocated += amount;
    const date = withPreferredDay(addMonths(start, i), preferredDayOfMonth);
    installments.push({
      seq: i + 1,
      amount,
      dueDate: date.toISOString(),
      paid: false,
    });
  }

  return { installments, parts, reason: buildReason(amountDue, parts, avgDelayDays, installmentPlansUsed) };
}

function buildReason(
  amountDue: number,
  parts: number,
  avgDelayDays: number,
  plansUsed: number,
): string {
  if (parts === 1) return 'The amount is small enough to pay in one go.';
  const bits: string[] = [`\u20b9${amountDue.toLocaleString('en-IN')} split into ${parts} parts`];
  if (avgDelayDays >= 10) bits.push(`they usually pay about ${Math.round(avgDelayDays)} days late`);
  if (plansUsed > 0) bits.push(`a plan has worked for them before`);
  return bits.join(', ') + '.';
}
