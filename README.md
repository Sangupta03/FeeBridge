<div align="center">

# 🌉 FeeBridge

### A calmer, kinder way for schools to handle fees, and for families to pay them.

**🔗 Live app:** **[feebridge.vercel.app](https://feebridge.vercel.app)**

*Built by **Team SheBuilds** for the Smart School FinTech Innovation Challenge*

</div>

> 📸 Screenshots and a demo video land here once the last screens are locked down.

---

Most schools run fees on registers, spreadsheets, and a WhatsApp group. Cash
payments go unrecorded until someone remembers to write them down. A family
with three children gets three separate reminders for what is really one
household budget. And the families who fall behind often find out they're in
trouble from a printed defaulter list — the same day everyone else does.

None of that is really a technology problem. It's a **dignity** problem.
FeeBridge tries to fix both at once: catch a family before they default, help
them quietly, and never make the school's books harder to keep than they
already are.

## Contents

- [What FeeBridge does](#what-feebridge-does)
- [What's different about it](#whats-different-about-it)
- [How it's built](#how-its-built)
- [Run it locally](#run-it-locally)
- [Connect a real Firebase project](#connect-a-real-firebase-project-optional)
- [Honest notes](#honest-notes)

---

## What FeeBridge does

Three roles, one shared source of truth:

| | Role | What they get |
|---|---|---|
| 🏫 | **The office** | Every rupee outstanding, a collection forecast of what will actually arrive, and a list of families worth a quiet word before their due date. Equipped with **FeeBridge Genius** (an offline AI copilot), **in-browser Machine Learning calibration** with Recharts convergence curves, and a **Notification Hub** for sending templated reminders via real WhatsApp Web/SMS integrations. |
| 👪 | **A parent** | One balance covering every child in the family. Pays by scanning scannable UPI QR codes or by installment. Includes a portal header **Notification Inbox bell** with red unread badges to catch alerts. |
| 🧾 | **The front desk** | Takes cash and cheque as fast as a paper register, with the reconciliation engine matching each payment to the right invoice automatically. Works completely offline, syncing automatically on reconnection. |

## What's different about it

- 🧠 **Trainable, explainable ML Risk Predictor.** Includes an in-browser Logistic
  Regression model. Admins can run batch gradient descent (with L2 regularization)
  on 30 historical cases to calibrate coefficients, or manually adjust sliders,
  updating family risk scores instantly.
- 💬 **Integrated WhatsApp/SMS Communications.** Not just mock alerts — clicking
  send launches real `wa.me` WhatsApp Click-to-Chat deep links or device `sms:`
  messengers to draft and dispatch templates directly to parents.
- 📳 **Offline cash reconciliation that's actually tested.** Not a toast that
  says "you're offline" — a real local write queue that flushes and reconciles
  the moment the network returns, provable end to end.
- 👨‍👩‍👧‍👦 **One family, one wallet.** The data model denormalises `familyId` onto
  every invoice and payment specifically so "what does this family owe, in
  total" is one query, not a join.

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
| Risk model | `src/domain/risk.ts` | Explainable logistic model, supports dynamic weights |
| ML training | `src/domain/ml.ts` | L2-Regularized logistic regression training loop |
| Instalment planner | `src/domain/installments.ts` | Suggests a plan shaped by the family's history |
| Reconciliation | `src/domain/reconcile.ts` | Auto-matching + duplicate detection |
| Forecast | `src/domain/forecast.ts` | Expected collection with an honest confidence band |
| State | `src/store/useAppStore.ts` | Zustand, derives everything from raw data |
| ML Dashboard | `src/features/admin/MLDashboard.tsx` | Real-time gradient descent charts & sliders |
| Notification Center | `src/features/admin/NotificationCenter.tsx` | WhatsApp/SMS dispatcher log & rules |
| Parent Inbox | `src/features/parent/ParentInbox.tsx` | Bell icon with unread message logs |
| AI Copilot | `src/features/admin/FeeBridgeGenius.tsx` | Offline sparkles copilot for risk summaries |

The four engines in `src/domain/` are pure TypeScript — no React, no Firebase,
no I/O — with **24 unit tests**, so the logic that actually matters can be
verified without clicking through the UI. The UI never talks to Firestore
directly; it only ever talks to a `Repository` interface, which is why the
whole app runs instantly on seeded local data with zero setup, and swaps to
real Firestore with a one-line environment variable. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full write-up,
including the security model and scalability notes.

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS · Zustand · Firebase
(Auth + Firestore) · Recharts · `qrcode.react` · Vitest · `vite-plugin-pwa`

---

## Run it locally

### Prerequisites

- **Node.js 18 or newer** ([nodejs.org](https://nodejs.org)) — check with `node -v`
- No Python, no `requirements.txt` needed — this is a Node project, and
  `package-lock.json` already pins every dependency to an exact version (the
  JS equivalent of a requirements file). `npm install` reads it automatically.

### Get it running — no Firebase needed

```bash
git clone https://github.com/Sangupta03/FeeBridge.git
cd FeeBridge/feebridge
npm install
npm run dev
```

Open **http://localhost:5173** and pick a role. That's it.

The app ships with a seeded demo school (6 families, 9 students, real
invoices and payments) behind the repository interface described above, so it
works instantly and fully offline — **you do not need a Firebase project to
run or judge this app.**

```bash
npm test              # run the 24 domain-engine unit tests
npm run build          # production build (also generates the PWA service worker)
npm run preview        # serve the production build locally, exactly as deployed
```

---

## Connect a real Firebase project *(optional)*

Only needed if you want real multi-device sync instead of the seeded local
demo. Budget about 15 minutes.

**1. Create the project**
Go to [console.firebase.google.com](https://console.firebase.google.com) →
**Create a project** → name it (e.g. `feebridge`) → turn Google Analytics
**off** (not needed) → Continue.

**2. Turn on Firestore**
Left sidebar → **Build → Firestore Database → Create database** → pick a
region close to you → **Start in test mode** (you'll lock it down in step 6) →
Enable.

**3. Turn on Authentication**
Left sidebar → **Build → Authentication → Get started** → under **Sign-in
method**, enable **Email/Password**.

**4. Get your web app config**
**⚙️ Project settings** (gear icon, top left) → **Your apps** → click the web
icon `</>` → nickname it anything → **don't** tick Firebase Hosting →
**Register app**. Keep the `firebaseConfig` block visible — you'll need it next.

**5. Set your environment variables**

Copy `.env.example` to `.env.local` in the `feebridge/` folder and fill it in:

```bash
VITE_DATA_SOURCE=firebase

VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc

# A real UPI VPA so the QR code is genuinely scannable (yours is fine — nobody is charged)
VITE_SCHOOL_UPI_VPA=yourname@okaxis
VITE_SCHOOL_NAME=Your School Name
```

`.env.local` is already in `.gitignore`, so your keys are never committed.

**6. Seed the demo school and lock down the rules**

```bash
npm run seed
```

This uploads the seeded families, students, invoices and payments, and
creates three sign-in accounts. Then, in the Firebase console: **Firestore
Database → Rules** tab → paste the entire contents of `firestore.rules` over
what's there → **Publish**.

Restart the dev server (`Ctrl+C`, then `npm run dev`) and sign in with:

| Role | Email | Password |
|---|---|---|
| Office | `office@feebridge.demo` | `feebridge123` |
| Front desk | `desk@feebridge.demo` | `feebridge123` |
| Parent | `parent@feebridge.demo` | `feebridge123` |

**Testing in a loop?** Once you've made test payments and want a clean slate
without re-doing the steps above:

```bash
npm run seed:reset     # clears test payments/plans, then reseeds fresh
```

**If anything goes wrong** — set `VITE_DATA_SOURCE=local` in `.env.local` and
restart. The app falls back to the seeded local demo automatically; you lose
nothing but multi-device sync.

---

## Honest notes

- The risk model's coefficients are **calibrated using an in-browser training engine** (gradient descent on 30 historical cases) or manually adjusted by the school office using sliders, with built-in L2 regularization to prevent overfitting.
- We build **real UPI deep links** (`upi://pay` intents with the school's
  actual VPA and the exact amount), which open correctly in any Indian payment
  app. We do **not** settle money ourselves — that needs a verified merchant
  account, which is a business-verification step, not an engineering one.
- The reconciliation engine matches one payment to one invoice, or a partial
  payment to the oldest open invoice. A single payment **larger than any one
  invoice** is deliberately routed to a human to split by hand, rather than
  guessed at automatically — the office's Needs Review screen supports
  splitting one payment across several invoices for exactly this case.
- There's no credit-balance concept yet: if a payment is larger than
  everything a family currently owes, the extra amount has nowhere to go
  inside the app. That's a real, known limitation, not an oversight.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it fits together, the
  data model, and the security model, in more depth than fits here.
