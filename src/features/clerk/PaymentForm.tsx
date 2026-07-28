import { useState, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { inr } from '../../lib/format';
import { outstandingOf } from '../../domain/reconcile';
import type { Student, Payment } from '../../types';
import { Wallet, Info, FileText, Check } from 'lucide-react';

interface PaymentFormProps {
  student: Student;
  onRecorded: (result: {
    amount: number;
    method: Payment['method'];
    reference: string;
    status: Payment['status'];
    reason: string;
  }) => void;
}

const METHODS: Array<{ value: Payment['method']; label: string }> = [
  { value: 'cash', label: 'Cash Payment' },
  { value: 'cheque', label: 'Cheque Payment' },
];

export function PaymentForm({ student, onRecorded }: PaymentFormProps) {
  const data = useAppStore((s) => s.data)!;
  const recordPayment = useAppStore((s) => s.recordPayment);
  
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<Payment['method']>('cash');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Get outstanding invoices for this student's family
  const familyInvoices = data.invoices.filter(
    (i) => i.familyId === student.familyId && outstandingOf(i) > 0
  );
  
  // Calculate total outstanding balance
  const totalOutstanding = familyInvoices.reduce((sum, i) => sum + outstandingOf(i), 0);

  const amountNum = Number(amount);
  const canSave = amountNum > 0 && reference.trim().length > 0 && !saving;

  // Auto-generate a sequential receipt reference number if cash method is used
  useEffect(() => {
    if (method === 'cash') {
      const randomRef = 'CSH-' + Math.floor(100000 + Math.random() * 900000);
      setReference(randomRef);
    } else {
      setReference('');
    }
  }, [method]);

  async function save() {
    setSaving(true);
    const outcome = await recordPayment({
      familyId: student.familyId,
      studentId: student.id,
      amount: amountNum,
      method,
      reference: reference.trim(),
      note: note.trim() || undefined,
    });
    setSaving(false);
    onRecorded({ amount: amountNum, method, reference: reference.trim(), ...outcome });
  }

  return (
    <div className="space-y-4">
      {/* Student Account Summary Card */}
      <div className="card p-4 border border-line bg-paper2 dark:bg-[#1a201d]/20 space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex gap-2.5 items-center">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-brand-dark dark:bg-mint/10 dark:text-brand-mid">
              <Wallet size={15} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Account Overview</h3>
              <p className="text-[10px] text-body mt-0.5">{student.name} · Class {student.className}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider">Total Outstanding</span>
            <div className="text-base font-bold text-ink leading-tight mt-0.5">{inr(totalOutstanding)}</div>
          </div>
        </div>

        {/* Invoice selection list */}
        {familyInvoices.length > 0 ? (
          <div className="space-y-1.5 pt-2 border-t border-line/45">
            <span className="text-[9px] font-bold text-muted uppercase tracking-wider block mb-1">Open Invoices (Click to auto-fill)</span>
            <div className="space-y-1">
              {familyInvoices.map((inv) => {
                const dueAmt = outstandingOf(inv);
                const isSelected = amountNum === dueAmt;
                return (
                  <button
                    key={inv.id}
                    onClick={() => setAmount(String(dueAmt))}
                    type="button"
                    className={`w-full text-left p-2 rounded-lg border text-xs flex justify-between items-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-brand/10 border-brand text-brand'
                        : 'bg-paper hover:bg-white hover:border-line border-line/50 text-ink dark:bg-[#121614]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText size={12} className="text-muted" />
                      <span>{inv.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold font-mono">
                      <span>{inr(dueAmt)}</span>
                      {isSelected && <Check size={11} className="text-brand" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-line/45 text-center text-xs text-brand font-semibold py-1">
            ✓ No outstanding fees for this household.
          </div>
        )}
      </div>

      {/* Input Recording Form */}
      <div className="card space-y-4 p-5">
        <h3 className="text-xs font-bold text-ink uppercase tracking-wider">Enter Payment Details</h3>
        
        <div>
          <label htmlFor="pf-amount" className="label-caps">Amount</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted font-semibold text-sm">
              ₹
            </div>
            <input
              id="pf-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-line bg-white dark:bg-[#121614] pl-7 pr-4 py-2 text-lg font-semibold text-ink focus:outline-none focus:border-brand"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {totalOutstanding > 0 && (
              <button
                type="button"
                onClick={() => setAmount(String(totalOutstanding))}
                className="text-[10px] font-semibold px-2 py-1 rounded bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 cursor-pointer"
              >
                Clear Balance ({inr(totalOutstanding)})
              </button>
            )}
            {[2000, 5000, 10000, 15000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className="text-[10px] font-semibold px-2 py-1 rounded bg-paper dark:bg-[#1a201d] border border-line hover:border-brand cursor-pointer text-ink"
              >
                {inr(preset)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="pf-method" className="label-caps">Method</label>
            <select
              id="pf-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as Payment['method'])}
              className="mt-1 w-full rounded-lg border border-line bg-white dark:bg-[#121614] px-3 py-2 text-sm text-ink cursor-pointer"
            >
              {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-reference" className="label-caps">Reference</label>
            <input
              id="pf-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={method === 'cash' ? 'Receipt no.' : 'Cheque no.'}
              className="mt-1 w-full rounded-lg border border-line bg-white dark:bg-[#121614] px-3 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <label htmlFor="pf-note" className="label-caps">Note (optional)</label>
          <input
            id="pf-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Term 2 tuition fees split payment"
            className="mt-1 w-full rounded-lg border border-line bg-white dark:bg-[#121614] px-3 py-2 text-sm text-ink"
          />
        </div>

        <button 
          className="btn-primary w-full py-2.5 text-xs flex justify-center items-center gap-1.5 cursor-pointer" 
          disabled={!canSave} 
          onClick={() => { void save(); }}
        >
          {saving ? 'Recording Payment...' : amountNum > 0 ? `Record ${inr(amountNum)} Payment` : 'Record Payment'}
        </button>
      </div>
    </div>
  );
}
