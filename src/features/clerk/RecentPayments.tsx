import { Inbox, CreditCard, Banknote, Calendar } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { inr, shortDate } from '../../lib/format';
import { EmptyState } from '../../components/ui/EmptyState';

const STATUS_TONE: Record<string, string> = {
  matched: 'bg-mint text-brand-dark dark:bg-mint/10 dark:text-brand-mid',
  review: 'bg-amber/10 text-amber dark:bg-amber/5 dark:text-amber/90',
  duplicate: 'bg-peach text-terra-dark dark:bg-peach/10 dark:text-terra-dark',
};

const STATUS_LABEL: Record<string, string> = {
  matched: 'Matched',
  review: 'Review',
  duplicate: 'Duplicate',
};

export function RecentPayments() {
  const data = useAppStore((s) => s.data)!;
  const recent = [...data.payments]
    .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt))
    .slice(0, 12);

  // Group payments by date
  const groupPayments = () => {
    const todayStr = new Date().toDateString();
    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

    const groups: Record<string, typeof recent> = {
      'Today': [],
      'Yesterday': [],
      'Earlier': []
    };

    recent.forEach(p => {
      const pDateStr = new Date(p.paidAt).toDateString();
      if (pDateStr === todayStr) {
        groups['Today'].push(p);
      } else if (pDateStr === yesterdayStr) {
        groups['Yesterday'].push(p);
      } else {
        groups['Earlier'].push(p);
      }
    });

    return groups;
  };

  const paymentGroups = groupPayments();

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-ink flex items-center gap-2">
          <Calendar size={16} className="text-brand" />
          Recent Counter Transactions
        </h2>
        <p className="text-[10px] text-body mt-0.5">List of last 12 payments recorded at the cash desk</p>
      </div>

      <div className="space-y-4">
        {recent.length === 0 ? (
          <EmptyState 
            icon={Inbox} 
            title="Nothing recorded yet" 
            hint="Payments taken at the desk will appear here as soon as you save one." 
          />
        ) : (
          Object.keys(paymentGroups).map(groupName => {
            const list = paymentGroups[groupName];
            if (list.length === 0) return null;

            return (
              <div key={groupName} className="space-y-2">
                <span className="text-[9px] font-bold text-muted uppercase tracking-wider block px-1">
                  {groupName}
                </span>
                
                <div className="space-y-1.5">
                  {list.map((p) => {
                    const student = data.students.find((s) => s.id === p.studentId);
                    const isCash = p.method === 'cash';

                    return (
                      <div key={p.id} className="card-flat flex items-center justify-between p-3 hover:border-brand/35 transition-all">
                        <div className="flex gap-2.5 items-center min-w-0">
                          <span className={`grid h-8 w-8 place-items-center rounded-lg flex-none ${
                            isCash 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' 
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}>
                            {isCash ? <Banknote size={15} /> : <CreditCard size={15} />}
                          </span>
                          
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-ink">{inr(p.amount)}</div>
                            <div className="text-[10px] text-muted truncate mt-0.5">
                              {student?.name ?? 'Family Balance'} · {student?.className ? `Class ${student.className}` : 'General'}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 flex-none">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            p.pending ? 'bg-terra/10 text-terra-dark' : STATUS_TONE[p.status]
                          }`}>
                            {p.pending ? 'Pending sync' : STATUS_LABEL[p.status]}
                          </span>
                          <span className="text-[9px] text-muted font-mono">{p.reference}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
