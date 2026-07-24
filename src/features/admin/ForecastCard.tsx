import { useAppStore, useForecast } from '../../store/useAppStore';
import { inr, inrShort } from '../../lib/format';

/** Plain-language explanation of the forecast number, plus how late payments tend to run. */
export function ForecastCard() {
  const data = useAppStore((s) => s.data)!;
  const forecast = useForecast();

  const delays = data.payments
    .filter((p) => p.status === 'matched' && p.invoiceId)
    .map((p) => {
      const invoice = data.invoices.find((i) => i.id === p.invoiceId);
      if (!invoice) return null;
      return (new Date(p.paidAt).getTime() - new Date(invoice.dueDate).getTime()) / 86_400_000;
    })
    .filter((d): d is number => d !== null);

  const avgDelay = delays.length > 0 ? delays.reduce((sum, d) => sum + d, 0) / delays.length : null;

  return (
    <div className="card p-5">
      <div className="label-caps">What to expect this term</div>
      <p className="mt-2 text-sm text-body">
        Based on how families have paid so far, the office can expect about{' '}
        <strong className="text-ink">{inrShort(forecast.expected)}</strong> to come in, most likely
        landing between <strong className="text-ink">{inrShort(forecast.low)}</strong> and{' '}
        <strong className="text-ink">{inrShort(forecast.high)}</strong> — that range is
        {' '}{Math.round(forecast.confidence * 100)}% confidence, not a guarantee.
      </p>
      {avgDelay !== null && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          On average, payments land{' '}
          <strong className="text-ink">
            {Math.abs(Math.round(avgDelay))} day{Math.abs(Math.round(avgDelay)) === 1 ? '' : 's'}{' '}
            {avgDelay >= 0 ? 'after' : 'before'} the due date
          </strong>
          {' '}({inr(forecast.totalOutstanding)} still outstanding overall).
        </p>
      )}
    </div>
  );
}
