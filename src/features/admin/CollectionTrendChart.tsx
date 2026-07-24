import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { inrShort, inr, shortDate } from '../../lib/format';

/** Running total of matched payments over time - real receipts, not a projection. */
export function CollectionTrendChart() {
  const data = useAppStore((s) => s.data)!;

  const matched = data.payments
    .filter((p) => p.status === 'matched')
    .sort((a, b) => +new Date(a.paidAt) - +new Date(b.paidAt));

  if (matched.length === 0) return null;

  let running = 0;
  const rows = matched.map((p) => {
    running += p.amount;
    return { date: p.paidAt, total: running };
  });

  return (
    <div className="card p-5">
      <div className="label-caps">Collection trend</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="collectionFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1B6B54" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#1B6B54" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#E5DECF" />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => shortDate(v)}
              tick={{ fill: '#7A7E74', fontSize: 11 }}
              axisLine={{ stroke: '#E5DECF' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => inrShort(v)}
              tick={{ fill: '#7A7E74', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E5DECF', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [inr(value), 'Collected so far']}
              labelFormatter={(v: string) => shortDate(v)}
              labelStyle={{ color: '#2A332D', fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#1B6B54"
              strokeWidth={2}
              fill="url(#collectionFill)"
              dot={{ r: 3, fill: '#1B6B54', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
