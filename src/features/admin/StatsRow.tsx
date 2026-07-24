import { Wallet, TrendingUp, HeartHandshake, PieChart } from 'lucide-react';
import { useAppStore, useForecast } from '../../store/useAppStore';
import { inrShort } from '../../lib/format';
import { StatCard } from '../../components/ui/StatCard';

interface StatsRowProps {
  atRiskCount: number;
}

/** The four top-line numbers: outstanding, expected, families needing help, collection rate. */
export function StatsRow({ atRiskCount }: StatsRowProps) {
  const data = useAppStore((s) => s.data)!;
  const forecast = useForecast();

  const totalDue = data.invoices.reduce((sum, i) => sum + i.amountDue, 0);
  const totalPaid = data.invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon={Wallet} label="Outstanding this term" value={inrShort(forecast.totalOutstanding)} />
      <StatCard
        icon={TrendingUp}
        label="Expected to come in"
        value={inrShort(forecast.expected)}
        hint={`${Math.round(forecast.confidence * 100)}% confidence · ${inrShort(forecast.low)}–${inrShort(forecast.high)}`}
      />
      <StatCard icon={HeartHandshake} label="Families needing help" value={String(atRiskCount)} />
      <StatCard
        icon={PieChart}
        label="Collection rate"
        value={`${collectionRate}%`}
        hint={`${inrShort(totalPaid)} of ${inrShort(totalDue)} billed`}
      />
    </section>
  );
}
