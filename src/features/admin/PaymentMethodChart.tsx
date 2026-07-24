import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import type { Payment } from '../../types';

// fixed hue order, matching the deck's palette - never reassigned by filtering
const METHOD_COLOR: Record<Payment['method'], string> = {
  cash: '#1B6B54',
  cheque: '#C56A45',
  upi: '#B98328',
};
const METHOD_LABEL: Record<Payment['method'], string> = {
  cash: 'Cash',
  cheque: 'Cheque',
  upi: 'UPI',
};

/** How money actually arrives: cash vs cheque vs UPI, by rupee not by count. */
export function PaymentMethodChart() {
  const data = useAppStore((s) => s.data)!;

  const totals = { cash: 0, cheque: 0, upi: 0 } as Record<Payment['method'], number>;
  for (const p of data.payments) {
    if (p.status === 'duplicate') continue;
    totals[p.method] += p.amount;
  }
  const rows = (Object.keys(totals) as Payment['method'][])
    .map((method) => ({ method, label: METHOD_LABEL[method], value: totals[method] }))
    .filter((r) => r.value > 0);

  if (rows.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="label-caps">Payment method split</div>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex-none">
          <PieChart width={160} height={160}>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="label"
              cx={80}
              cy={80}
              innerRadius={42}
              outerRadius={68}
              paddingAngle={2}
            >
              {rows.map((r) => (
                <Cell key={r.method} fill={METHOD_COLOR[r.method]} stroke="#FCFBF7" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E5DECF', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number, name: string) => [inr(value), name]}
            />
          </PieChart>
        </div>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.method} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLOR[r.method] }} />
              <span className="text-body">{r.label}</span>
              <span className="font-semibold text-ink">{inr(r.value)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
