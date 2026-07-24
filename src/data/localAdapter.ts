import type { Repository, DataSnapshot } from './repository';
import { newId } from './repository';
import { seed } from './seed';
import type { FeeHead, InstallmentPlan, Invoice, Payment } from '../types';

const LS_KEY = 'feebridge:state:v1';

/**
 * In-memory (and localStorage-backed) repository.
 *
 * This runs the whole product with no Firebase project at all, which makes the
 * demo bulletproof. It also mirrors Firestore's behaviour in the one way that
 * matters for our story: when it is "offline", writes go into a queue and are
 * flushed when the connection comes back.
 */
export class LocalRepository implements Repository {
  private state: DataSnapshot;
  private listeners = new Set<(s: DataSnapshot) => void>();
  private queue: Array<() => void> = [];
  private online = true;

  constructor() {
    this.state = this.load();
  }

  private load(): DataSnapshot {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return { ...JSON.parse(raw), online: true, queuedWrites: 0 };
    } catch {
      /* fall through to a fresh seed */
    }
    return {
      families: seed.families,
      students: seed.students,
      invoices: seed.invoices,
      payments: seed.payments,
      feeHeads: seed.feeHeads,
      plans: [],
      users: seed.users,
      queuedWrites: 0,
      online: true,
    };
  }

  private persist() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.state));
    } catch {
      /* storage full or unavailable - the demo still works from memory */
    }
  }

  private emit() {
    this.state = { ...this.state, online: this.online, queuedWrites: this.queue.length };
    this.persist();
    this.listeners.forEach((l) => l(this.state));
  }

  /** run now if online, otherwise hold it until the connection returns */
  private write(fn: () => void) {
    if (this.online) {
      fn();
      this.emit();
    } else {
      this.queue.push(fn);
      this.emit();
    }
  }

  subscribe(onChange: (s: DataSnapshot) => void) {
    this.listeners.add(onChange);
    onChange(this.state);
    return () => this.listeners.delete(onChange);
  }

  setOffline(offline: boolean) {
    this.online = !offline;
    if (this.online && this.queue.length) {
      // flush everything that happened while we were offline
      const pending = [...this.queue];
      this.queue = [];
      pending.forEach((fn) => fn());
      this.state.payments = this.state.payments.map((p) => ({ ...p, pending: false }));
    }
    this.emit();
  }

  async addPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const created: Payment = { ...payment, id: newId('pay'), pending: !this.online };
    // optimistic: show it immediately, even offline
    this.state.payments = [created, ...this.state.payments];
    this.write(() => {
      this.state.payments = this.state.payments.map((p) =>
        p.id === created.id ? { ...p, pending: false } : p,
      );
    });
    return created;
  }

  async updateInvoice(invoice: Invoice): Promise<void> {
    this.write(() => {
      this.state.invoices = this.state.invoices.map((i) => (i.id === invoice.id ? invoice : i));
    });
  }

  async savePlan(plan: Omit<InstallmentPlan, 'id'>): Promise<InstallmentPlan> {
    const created: InstallmentPlan = { ...plan, id: newId('plan') };
    this.write(() => {
      this.state.plans = [created, ...this.state.plans];
    });
    return created;
  }

  async updatePlan(plan: InstallmentPlan): Promise<void> {
    this.write(() => {
      this.state.plans = this.state.plans.map((p) => (p.id === plan.id ? plan : p));
    });
  }

  async addFeeHead(fee: Omit<FeeHead, 'id'>): Promise<FeeHead> {
    const created: FeeHead = { ...fee, id: newId('fee') };
    this.write(() => {
      this.state.feeHeads = [created, ...this.state.feeHeads];
    });
    return created;
  }

  /** demo convenience: wipe back to the seeded school */
  reset() {
    localStorage.removeItem(LS_KEY);
    this.queue = [];
    this.online = true;
    this.state = this.load();
    this.emit();
  }
}
