/** Indian rupee formatting, so numbers look local and familiar. */
export const inr = (n: number) => '\u20b9' + Math.round(n).toLocaleString('en-IN');

export const inrShort = (n: number) => {
  if (n >= 10000000) return `\u20b9${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `\u20b9${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `\u20b9${(n / 1000).toFixed(1)}k`;
  return inr(n);
};

export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

export const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

export function dueCopy(iso: string): string {
  const d = daysUntil(iso);
  if (d === 0) return 'due today';
  if (d > 0) return `due in ${d} day${d === 1 ? '' : 's'}`;
  return `${Math.abs(d)} day${Math.abs(d) === 1 ? '' : 's'} overdue`;
}
