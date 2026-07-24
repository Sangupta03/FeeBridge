# FeeBridge

**A calmer, kinder way for schools to handle fees, and for families to pay them.**

🔗 **Live:** [feebridge.vercel.app](https://feebridge.vercel.app)

Built by **Team SheBuilds** for the Smart School FinTech Innovation Challenge.

> Screenshots and a demo video go here — recorded once the last screens are locked down.

---

## The problem

Most schools run fees on registers, spreadsheets, and a WhatsApp group. Cash payments
go unrecorded until someone remembers to write them down. A family with three
children gets three separate reminders for what is really one household budget.
And the families who fall behind often find out they're in trouble from a
printed defaulter list on a noticeboard — the same day everyone else does.

None of that is a technology problem so much as a **dignity** problem. FeeBridge
tries to fix both at once: catch a family before they default, help them
quietly, and never make the school's books harder to keep than they already are.

---

## What FeeBridge does

**The office** — sees every rupee outstanding, a forecast of what will actually
arrive (with an honest confidence range, not a fake-precise number), and which
families are worth a quiet word before their due date — each one with the
specific reasons behind the flag, visible on the card, never behind a tooltip.

**A parent** — one balance covering every child in the family, not one bill
per kid. Pays by scanning a real UPI QR code, or by instalment if the office
has offered a plan. Never sees a risk score — that stays office-only, on purpose.

**The front desk** — takes cash and cheque as fast as a register, with the
reconciliation engine matching each payment to the right invoice automatically
(or flagging it for review, honestly, when it can't). Works completely offline;
queued payments sync and reconcile themselves the moment the connection returns.

---

## What's different about it

- **Explainable, not a black box.** The risk model is a logistic model with
  hand-set (not trained) weights — see [Honest notes](#honest-notes) — but every
  score ships with its top reasons attached. Nothing is flagged without saying why.
- **Offline cash reconciliation that's actually tested.** Not a toast that says
  "you're offline" — a real local write queue that flushes and reconciles the
  moment the network returns, provable end to end.
- **One family, one wallet.** The data model denormalises `familyId` onto every
  invoice and payment specifically so "what does this family owe, in total" is
  one query, not a join — a product decision made at the data layer, not patched
  on in the UI.

---

## How it's built

```
┌──────────────────────────────────────────────────┐
│  Client — React PWA (installable, works offline)  │
│  office view · parent wallet · cash desk          │
└───────────────────────┬──────────────────────────┘
                        │  reads / writes
┌───────────────────────▼──────────────────────────┐
│  Zustand store — one store, three roles           │
│  owns the subscription, derives everything else   │
└───────────────────────┬──────────────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
┌───────▼─────────┐            ┌─────────▼──────────┐
│  Engines (pure) │            │  Repository (iface)│
│  risk           │            │   ├ LocalAdapter   │
│  installments   │            │   └ FirestoreAdapter│
│  reconcile      │            └─────────┬──────────┘
│  forecast       │                      │
└─────────────────┘            ┌─────────▼──────────┐
                               │ Firestore + cache  │
                               │ Auth · UPI intents │
                               └────────────────────┘
```

| Area | Where | Notes |
|---|---|---|
| Risk model | `src/domain/risk.ts` | Explainable logistic model, always returns reasons |
| Instalment planner | `src/domain/installments.ts` | Suggests a plan shaped by the family's history |
| Reconciliation | `src/domain/reconcile.ts` | Auto-matching + duplicate detection |
| Forecast | `src/domain/forecast.ts` | Expected collection with an honest confidence band |
| UPI links | `src/domain/forecast.ts` | Real `upi://pay` intents |
| Data layer | `src/data/` | Repository interface + local and Firestore adapters |
| State | `src/store/useAppStore.ts` | Zustand, derives everything from raw data |

The four engines in `src/domain/` are pure TypeScript — no React, no Firebase,
no I/O — with **24 unit tests**, so the logic that actually matters can be
verified without clicking through the UI. The UI never talks to Firestore
directly; it only ever talks to a `Repository` interface, which is why the
whole app runs instantly on seeded local data with zero setup, and swaps to
real Firestore with a one-line change. See `docs/ARCHITECTURE.md` for the
full write-up, including the security model and scalability notes.

**Stack:** React + TypeScript + Vite, Tailwind, Zustand, Firebase (Auth +
Firestore), Recharts, `qrcode.react`, Vitest, `vite-plugin-pwa`.

---

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and pick a role.

**You do not need a Firebase project to run this.** The app ships with a seeded
demo school (6 families, 9 students, real invoices and payments) behind the
repository interface above, so it works instantly and offline. To point it at
a real Firestore project instead, copy `.env.example` to `.env.local`, fill in
your Firebase config, and set `VITE_DATA_SOURCE=firebase`.

```bash
npm test              # run the 24 domain engine unit tests
npm run build          # production build (also generates the PWA service worker)
npm run preview        # serve the production build locally
npm run seed           # upload the demo school to a real Firestore project
npm run seed:reset     # same, but first clears test payments/plans for a clean run
```

---

## Honest notes

- The risk model's coefficients are **hand-set from domain reasoning, not
  trained**, because a new school has no payment history on day one. The shape
  is deliberately the same as a fitted logistic regression, so real weights can
  drop in later without touching any UI. We say this openly rather than calling
  it something it isn't.
- We build **real UPI deep links** (`upi://pay` intents with the school's actual
  VPA and the exact amount), which open correctly in any Indian payment app. We
  do **not** settle money ourselves — that needs a verified merchant account,
  which is a business-verification step, not an engineering one.
- The reconciliation engine matches one payment to one invoice, or a partial
  payment to the oldest open invoice. A single payment **larger than any one
  invoice** is deliberately routed to a human to split by hand, rather than
  guessed at automatically — the office's Needs Review screen supports
  splitting one payment across several invoices for exactly this case.
- There's no credit-balance concept yet: if a payment is larger than everything
  a family currently owes, the extra amount has nowhere to go inside the app.
  That's a real, known limitation, not an oversight.

## Docs

- `docs/ARCHITECTURE.md` — how it fits together, the data model, and the
  security model, in more depth than fits here.
