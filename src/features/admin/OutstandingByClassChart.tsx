import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAppStore } from '../../store/useAppStore';
import { pendingByClass } from '../../domain/forecast';
import { inrShort, inr } from '../../lib/format';

/** Which classes are carrying the most outstanding fees right now - one glance, one hue. */
export function OutstandingByClassChart() {
  const data = useAppStore((s) => s.data)!;
  const classOf = (studentId: string) => data.students.find((s) => s.id === studentId)?.className ?? 'Unknown';
  const rows = pendingByClass(data.invoices, classOf);

  if (rows.length === 0) return null;

  return (
    <div className="card p-5">
      <div className="label-caps">Outstanding by class</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#E5DECF" />
            <XAxis
              dataKey="className"
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
              cursor={{ fill: '#F1ECE0' }}
              contentStyle={{ background: '#FFFFFF', border: '1px solid #E5DECF', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number) => [inr(value), 'Outstanding']}
              labelStyle={{ color: '#2A332D', fontWeight: 600 }}
            />
            <Bar dataKey="amount" fill="#1B6B54" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
