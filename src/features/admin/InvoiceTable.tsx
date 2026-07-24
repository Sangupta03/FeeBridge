import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import type { InvoiceStatus } from '../../types';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: 'Open',
  part_paid: 'Part paid',
  paid: 'Paid',
  overdue: 'Overdue',
};

const STATUS_CHIP: Record<InvoiceStatus, string> = {
  open: 'bg-paper2 text-body',
  part_paid: 'bg-amber/10 text-amber',
  paid: 'bg-mint text-brand-dark',
  overdue: 'bg-peach text-terra-dark',
};

/** All invoices, filterable by class, status and term. */
export function InvoiceTable() {
  const data = useAppStore((s) => s.data)!;
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');

  const classes = useMemo(
    () => Array.from(new Set(data.students.map((s) => s.className))).sort(),
    [data.students],
  );
  const terms = useMemo(
    () => Array.from(new Set(data.invoices.map((i) => i.term))).sort(),
    [data.invoices],
  );

  const rows = useMemo(() => data.invoices
    .map((invoice) => ({ invoice, student: data.students.find((s) => s.id === invoice.studentId) }))
    .filter(({ student }) => classFilter === 'all' || student?.className === classFilter)
    .filter(({ invoice }) => statusFilter === 'all' || invoice.status === statusFilter)
    .filter(({ invoice }) => termFilter === 'all' || invoice.term === termFilter)
    .sort((a, b) => +new Date(a.invoice.dueDate) - +new Date(b.invoice.dueDate)),
  [data.invoices, data.students, classFilter, statusFilter, termFilter]);

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Invoices</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={classFilter} onChange={setClassFilter} label="All classes" options={classes} />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            label="All statuses"
            options={Object.keys(STATUS_LABEL)}
            display={(v) => STATUS_LABEL[v as InvoiceStatus]}
          />
          <Select value={termFilter} onChange={setTermFilter} label="All terms" options={terms} />
        </div>
      </div>

      <div className="card-flat mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ invoice, student }) => (
              <tr key={invoice.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-semibold text-ink">{student?.name ?? '—'}</td>
                <td className="px-4 py-3 text-body">{student?.className ?? '—'}</td>
                <td className="px-4 py-3 text-body">{invoice.title}</td>
                <td className="px-4 py-3 text-body">{shortDate(invoice.dueDate)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CHIP[invoice.status]}`}>
                    {STATUS_LABEL[invoice.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-ink">{inr(outstandingOf(invoice))}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted">
                  No invoices match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Select({ value, onChange, label, options, display }: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  options: string[];
  display?: (v: string) => string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
    >
      <option value="all">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>{display ? display(o) : o}</option>
      ))}
    </select>
  );
}
