import { Modal } from '../../components/ui/Modal';
import { inr, shortDate } from '../../lib/format';
import type { Student, Payment } from '../../types';
import { FileText, Printer, CheckCircle } from 'lucide-react';

interface ReceiptViewProps {
  student: Student;
  familyName: string;
  amount: number;
  method: Payment['method'];
  reference: string;
  paidAt: string;
  onClose: () => void;
}

export function ReceiptView({
  student, familyName, amount, method, reference, paidAt, onClose,
}: ReceiptViewProps) {
  return (
    <Modal
      title="Official School Receipt"
      onClose={onClose}
      footer={
        <>
          <button className="btn-ghost py-1.5 px-4 text-xs cursor-pointer" onClick={onClose}>Close</button>
          <button 
            className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 cursor-pointer" 
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Print Receipt
          </button>
        </>
      }
    >
      <div className="print-area space-y-6 text-sm border-2 border-line/65 rounded-xl p-5 bg-paper dark:bg-[#1a201d]/10 relative overflow-hidden">
        
        {/* Paid Stamp overlay */}
        <div className="absolute right-4 top-16 rotate-12 border-2 border-emerald-600/50 rounded px-2.5 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-600/10 pointer-events-none select-none flex items-center gap-1">
          <CheckCircle size={10} />
          Paid - Cash Desk
        </div>

        {/* School Header */}
        <div className="text-center border-b border-line pb-4 space-y-1">
          <h3 className="font-serif text-xl font-bold text-ink">GREEN VALLEY SCHOOL</h3>
          <p className="text-[10px] text-muted tracking-wider uppercase font-bold">Official Fee Payment Receipt</p>
          <p className="text-[9px] text-body">Sector 4, Dwarka, New Delhi · Support: office@greenvalley.edu</p>
        </div>

        {/* Invoice and transaction details */}
        <div className="grid grid-cols-2 gap-y-3.5 text-xs pt-1">
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Student Name</span>
            <span className="font-semibold text-ink">{student.name}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Class / Section</span>
            <span className="font-semibold text-ink">{student.className}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Family Wallet</span>
            <span className="font-semibold text-ink">{familyName}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Receipt Date</span>
            <span className="font-semibold text-ink">{shortDate(paidAt)}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Payment Method</span>
            <span className="font-semibold text-ink uppercase">{method}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Reference / Doc No.</span>
            <span className="font-mono font-semibold text-ink">{reference}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="mt-5 rounded-lg bg-mint/25 dark:bg-mint/5 border border-line p-3.5 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Amount Paid</span>
            <p className="text-[9px] text-body mt-0.5">Fully reconciled in school accounts</p>
          </div>
          <div className="text-right">
            <span className="font-serif text-2xl font-bold text-brand">{inr(amount)}</span>
          </div>
        </div>

        {/* Terms message */}
        <div className="text-center text-[9px] text-muted border-t border-line/45 pt-4">
          This is a computer-generated receipt and does not require a physical signature. Thank you for your payment.
        </div>
      </div>
    </Modal>
  );
}
