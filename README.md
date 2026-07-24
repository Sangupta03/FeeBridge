# FeeBridge

**A calmer, kinder way for schools to handle fees, and for families to pay them.**

Built by **Team SheBuilds** for the Smart School FinTech Innovation Challenge.

Managing school fees is a chaotic blend of registers, spreadsheets and half-used apps.
Cash goes missing on paper, parents with three children get three separate reminders,
and families who fall behind often find out from a defaulter list read out in public.

FeeBridge puts the whole thing in one place — and, crucially, notices a family in
trouble *before* they default, then helps them privately instead of shaming them.

---

## Quick start

```bash
npm install
cp .env.example .env.local     # optional - the app runs without any config
npm run dev
```

Open http://localhost:5173 and pick a role.

**You do not need a Firebase project to run this.** The app ships with a seeded
demo school (6 families, 9 students, real invoices and payments) behind a
repository interface, so it works instantly and offline. Firebase is wired in as a
swappable adapter — see `docs/ARCHITECTURE.md`.

```bash
npm test          # run the engine unit tests
npm run build     # production build (also generates the PWA service worker)
npm run preview   # serve the production build
```

---

## What's in the box

| Area | Where | Notes |
|---|---|---|
| Risk model | `src/domain/risk.ts` | Explainable logistic model, always returns reasons |
| Instalment planner | `src/domain/installments.ts` | Suggests a plan shaped by the family's history |
| Reconciliation | `src/domain/reconcile.ts` | Auto-matching + duplicate detection |
| Forecast | `src/domain/forecast.ts` | Expected collection with an honest confidence band |
| UPI links | `src/domain/forecast.ts` | Real `upi://pay` intents |
| Data layer | `src/data/` | Repository interface + local and Firestore adapters |
| State | `src/store/useAppStore.ts` | Zustand, derives everything from raw data |

All four engines are pure TypeScript with **24 unit tests**, so the logic can be
verified without clicking through the UI.

---

## The three roles

- **The office** — sees every rupee, a forecast of what will actually arrive, and
  which families need a quiet word (with the reasons why).
- **A parent** — one balance covering all their children, one payment, a UPI QR.
- **The front desk** — takes cash and cheque, works with no internet at all, and
  syncs by itself when the connection returns.

---

## Honest notes

- The risk model's coefficients are **hand-set from domain reasoning, not trained**,
  because a new school has no history on day one. The shape is the same as a fitted
  logistic regression, so real weights can drop in later without UI changes. We say
  this openly rather than calling it something it isn't.
- We build **real UPI deep links**, which open any Indian payment app with the
  amount pre-filled. We do not settle money — that needs a merchant account, which
  is a business-verification step rather than an engineering one.

## Docs

- `docs/ARCHITECTURE.md` — how it fits together, and why
- `docs/BUILD_PHASES.md` — the build plan
- `docs/DEMO_SCRIPT.md` — the demo video runsheet
