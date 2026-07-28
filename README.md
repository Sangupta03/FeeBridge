<div align="center">

# 🌉 FeeBridge

### A calmer, kinder way for schools to handle fees, and for families to pay them.

**🔗 Live app:** **[feebridge.vercel.app](https://feebridge.vercel.app)**

*Built by **Team SheBuilds** for the Smart School FinTech Innovation Challenge*

<br/>

<a href="https://drive.google.com/file/d/18x-aqDVY2euFJ4b2D0w7vzrWswzE1PEh/view?usp=sharing">
  <img src="https://img.shields.io/badge/%F0%9F%8E%AC_DEMO_VIDEO-Watch_the_5--minute_walkthrough-D90429?style=for-the-badge" alt="DEMO VIDEO — Watch the 5-minute walkthrough" />
  <br/><br/>
  <img width="820" alt="Click to watch the full FeeBridge demo" src="https://github.com/user-attachments/assets/be020fa5-3d21-4524-9052-4223d7825efd" style="border-radius:12px;border:3px solid #D90429;" />
</a>

<sub>👆 Click the screenshot to watch the full demo on Google Drive.</sub>

</div>

---

Most schools run fees on registers, spreadsheets, and a WhatsApp group. Cash payments go unrecorded until someone remembers to write them down. A family with three children gets three separate reminders for what is really one household budget. And the families who fall behind often find out they're in trouble from a printed defaulter list — the same day everyone else does.

None of that is really a technology problem. It's a **dignity** problem. FeeBridge fixes both at once: catch a family before they default, help them quietly, and never make the school's books harder to keep than they already are.

---

## Contents

- [Core Portals](#-core-portals)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Run it Locally](#-run-it-locally)
- [Firebase Integration](#-firebase-integration-optional)
- [Testing & Verification](#-testing--verification)
- [Honest Notes](#-honest-notes)

---

## 👥 Core Portals

FeeBridge provides three tailored views off a single shared source of truth:

### 🏫 The Office (School Administration)
Monitor total outstanding collections, view a statistically grounded collection forecast, calibrate the risk-prediction model, offer installment plans, review cash awaiting reconciliation, and dispatch templated alerts via the Notification Hub.
<img width="1876" height="921" alt="Office dashboard" src="https://github.com/user-attachments/assets/a070a740-6ace-40e8-a392-03b873306d2e" />

### 👪 The Family (Parent Portal)
View a single, unified balance for all siblings. Pay by scanning a UPI QR code or simulating a UPI app checkout, self-serve a custom installment plan, and read alerts in a bell-icon inbox.
<img width="1913" height="911" alt="Parent wallet" src="https://github.com/user-attachments/assets/7e566a40-1c36-4136-b38c-0b51aa89c84a" />

### 🧾 The Front Desk (Clerk Desk)
Accept cash and cheque payments instantly, even when offline, print a receipt on the spot, and let the matching engine automatically map payments to outstanding invoices the moment the network resumes.
<img width="1860" height="915" alt="Clerk desk" src="https://github.com/user-attachments/assets/ac0c98b2-40b3-4126-af2c-280aa440cd4a" />

---

## 🚀 Key Features

### 1. 👪 Unified Family Wallet & UPI Payments
Instead of managing separate invoices for siblings, FeeBridge rolls up all child accounts (`studentId`) under one parent account (`familyId`) so "what does this family owe, in total" is a single query, not a join.
- **Scannable UPI Intent QR Code** — generates a real `upi://pay` deep link with the school's actual VPA and exact amount, rendered as a scannable QR (`qrcode.react`).
- **Simulate-a-checkout mode** — a second payment tab walks a parent through a realistic GPay/PhonePe/Paytm/BHIM-style flow (app picker → PIN pad → "Contacting bank…" → a hand-rolled confetti success screen) for judges who can't scan a real QR mid-demo.

### 2. 📅 Installment Plans — two ways to get there
FeeBridge treats "can't pay it all today" as the normal case, not an edge case, and gives **both sides** a way to solve it:
- **Office-offered plans** (`Plans` tab) — an admin picks a family's invoice, previews the exact schedule the planning engine will generate, and offers it in one click. Every plan ever offered is tracked in a running ledger with each part's paid/upcoming status.
- **Parent self-serve plans** (`Need more time?` card) — a parent can choose 2–4 parts and a preferred day-of-month themselves, see the live-generated schedule before committing, and activate it without waiting on the office. Both paths call the *same* planning engine (`domain/installments.ts`), so a plan never drifts between what was previewed and what gets saved.
- The engine itself picks part count from the amount owed and stretches it further if that family has a history of paying late, rounds every installment to a friendly ₹100, and pins due dates to a real calendar day (correctly clamped for short months).

### 3. 🧠 Trainable In-Browser Risk Predictor
Not a static rule of thumb — a real, interactive machine-learning workbench that runs entirely in the browser, no server required.
- **Explainable baseline model** — a logistic-regression-shaped scorer with hand-set, documented weights returns a 0–100 risk score *and* its top-3 human-readable reasons, so the office never has to trust a black box.
- **SMOTE oversampling** — `runSMOTE()` synthesizes up to 5,000 balanced synthetic family profiles from a seed dataset using real k-nearest-neighbor interpolation (k=3, Euclidean distance).
- **Live gradient-descent calibration** — clicking "Auto-Calibrate" runs real L2-regularized batch gradient descent over 250 epochs, animating loss and accuracy curves on a live chart as it trains.
- **Register your own cases** — admins can add custom payment-history records on the fly and immediately retrain against them.
- The trained weights replace the baseline everywhere at once — risk lists, the forecast, even the AI copilot — with a one-click revert to the hand-set defaults.
<img width="1888" height="903" alt="ML calibration dashboard" src="https://github.com/user-attachments/assets/b8e55779-e16f-4844-bafb-61970844a621" />

### 4. 📈 Statistically Grounded Collection Forecast
Rather than a guess, the forecast treats every open invoice as a weighted Bernoulli trial on "will this family pay," sums the expected value and variance across all of them, and reports an ~80% confidence band — plus the average real payment delay pulled from actual matched payment history. `pendingByClass()` breaks the same numbers down per class for the outstanding-by-class chart.

### 5. 💬 Integrated Notification Hub + Inbox
Alert parents about overdue payments empathetically, without manual copy-pasting.
- **Real WhatsApp deep links** (`wa.me/…`) and **SMS URI links** (`sms:…`) open the parent's actual messaging app pre-filled with an empathetic template — a real handoff, not a mock gateway.
- Every send is logged, and parents see it land in a bell-icon **Notification Inbox** with an unread badge.
<img width="1892" height="915" alt="Notification hub" src="https://github.com/user-attachments/assets/daa10675-043f-423e-b8ec-c85e99de2c21" />

### 6. ✨ FeeBridgeGenius — the in-app copilot
A slide-out chat drawer, present for every role, that answers common questions instantly: "show me families at risk," "draft a reminder for the Sharmas," "what's the collection forecast," or (for a parent) "how do I split this into installments." It's a fast, scripted assistant tuned to FeeBridge's own data model — see [Honest Notes](#-honest-notes) for exactly how it works under the hood.

### 7. 📳 Robust Offline Ledger
Front desks are prone to network dropouts, so FeeBridge is built to work fully offline, not just tolerate it.
- **Optimistic local writes** — cash and cheque entries save instantly, marked "queued" until the network returns.
- **Local write queue** — held in memory/localStorage in demo mode, or Firestore's own `persistentLocalCache` + `disableNetwork()`/`enableNetwork()` in Firebase mode — genuine offline persistence either way.
- **Auto-reconnect listeners** — a dropped Firestore listener silently retries instead of leaving the UI stuck.
- **Reconciliation engine** — auto-matches a payment to the right invoice (exact settle, or partial against the oldest open invoice), flags likely duplicates by amount + timing + reference, and routes anything ambiguous to a **Needs Review** queue where the office can edit and confirm a manual split across multiple invoices.

### 8. 🧾 Built for a Real Front Desk
- **Live student search** across name, roll number, and class.
- **One-tap invoice amounts** — clicking an open invoice on the family's account card auto-fills the payment amount; quick preset buttons handle common amounts.
- **Printable receipts** — a proper receipt modal with a "Paid – Cash Desk" stamp that opens the browser's real print dialog.
- **Shift stats at a glance** — collected today, payments processed, and how many need audit.

### 9. 📊 At-a-Glance Analytics
Three purpose-built charts: a cumulative collection trend built from *real, matched receipts* (never a projection dressed up as data), outstanding rupees by class, and a payment-method split by cash/cheque/UPI.

### 10. 🛠️ Built for Demos & Judging
- **Installable PWA** — a real web-app manifest and Workbox-precached offline app shell, so it can be added to a home screen or desktop and opened without a network at all.
- **Light/dark theme**, remembered across sessions.
- **One-click demo reset** — wipes any payments, plans, or calibration changes made during a walkthrough and re-seeds the standard 6-family demo school in one click, so the next judge always starts from a clean slate.

---

## 🏗️ System Architecture

The application is structured around a clean backend integration model where components remain completely decoupled from the persistence layer.

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
│  risk · ml      │            │   ├ LocalAdapter   │
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
| Risk model | `src/domain/risk.ts` | Explainable logistic scorer, top-3 reasons per family |
| ML training | `src/domain/ml.ts` | SMOTE oversampling + L2-regularized gradient descent |
| Instalment planner | `src/domain/installments.ts` | Shared by office-offered and parent self-serve plans |
| Reconciliation | `src/domain/reconcile.ts` | Auto-matching, duplicate detection, manual-split routing |
| Forecast | `src/domain/forecast.ts` | Bernoulli-variance confidence band + UPI link builder |
| State | `src/store/useAppStore.ts` | Zustand, derives everything from raw data |
| Risk Dashboard | `src/features/admin/MLDashboard.tsx` | Live calibration charts, custom case registration |
| Notification Hub | `src/features/admin/NotificationCenter.tsx` | WhatsApp/SMS dispatcher + sent log |
| Needs Review | `src/features/admin/NeedsReview.tsx` | Manual multi-invoice payment splitting |
| Plans | `src/features/admin/PlansTab.tsx`, `OfferPlanModal.tsx` | Office-offered installment plans |
| Parent self-serve plan | `src/features/parent/NeedMoreTimeCard.tsx` | Family-originated installment plans |
| AI Copilot | `src/features/admin/FeeBridgeGenius.tsx` | Scripted assistant, per-role responses |

The domain engines in `src/domain/` are pure TypeScript — no React, no Firebase, no I/O — with unit tests covering the logic that actually matters, so it can be verified without clicking through the UI. The UI never talks to Firestore directly; it only ever talks to a `Repository` interface, which is why the whole app runs instantly on seeded local data with zero setup, and swaps to real Firestore with a one-line environment variable. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full write-up, including the security model and scalability notes.

**Stack:** React 18 + TypeScript + Vite · Tailwind CSS · Zustand · Firebase (Auth + Firestore) · Recharts · `qrcode.react` · Vitest · `vite-plugin-pwa`

---

## 💻 Run it Locally

### Prerequisites
- **Node.js 18 or newer** (verify using `node -v`)
- Packages are managed using `npm` and locked in `package-lock.json`. No external Python dependencies are needed.

### Installation
1. Clone the repository and navigate into the folder:
   ```bash
   git clone https://github.com/Sangupta03/FeeBridge.git
   cd FeeBridge
   ```
2. Install node modules:
   ```bash
   npm install
   ```
3. Boot up the local Vite dev server:
   ```bash
   npm run dev
   ```
4. Access the web app at **`http://localhost:5173`**.

The app ships with a seeded demo school (6 families, 9 students, real invoices and payments) behind the repository interface described above, so it works instantly and fully offline — **you do not need a Firebase project to run or judge this app.**

---

## 🔥 Firebase Integration *(Optional)*

To enable multi-device synchronization and real database persistence, follow these steps:

1. **Setup Project**: Create a new project in the [Firebase Console](https://console.firebase.google.com).
2. **Turn on Firestore**: Under **Build → Firestore Database**, click **Create database** and start in test mode.
3. **Turn on Authentication**: Under **Build → Authentication**, enable **Email/Password** as a sign-in provider.
4. **Copy App Config**: Register a web app under project settings to obtain the Firebase config object.
5. **Setup Environment Variables**: Create a `.env.local` file inside the root folder:
   ```env
   VITE_DATA_SOURCE=firebase
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_id
   VITE_FIREBASE_APP_ID=your_app_id

   VITE_SCHOOL_UPI_VPA=schoolname@okaxis
   VITE_SCHOOL_NAME=Green Valley School
   ```
6. **Upload Seed Data & Apply Security Rules**:
   ```bash
   npm run seed
   ```
   Copy the contents of `firestore.rules` and paste them into the **Rules** tab of your Firestore Database console, then click **Publish**.
7. **Sign In Credentials**:
   - **Office Admin**: `office@feebridge.demo` (Password: `feebridge123`)
   - **Clerk Desk**: `desk@feebridge.demo` (Password: `feebridge123`)
   - **Parent**: `parent@feebridge.demo` (Password: `feebridge123`)

---

## 🧪 Testing & Verification

The core business logic of the domain engines is verified using unit tests.

- Run all unit tests:
  ```bash
  npm test
  ```
- Build PWA service worker and optimize client bundle:
  ```bash
  npm run build
  ```
- Preview the built PWA locally:
  ```bash
  npm run preview
  ```

---

## 📝 Honest Notes

We'd rather tell you what's real than let a demo oversell it.

- **FeeBridgeGenius is a scripted assistant, not an LLM.** It matches keywords in your question against a set of response templates tuned to FeeBridge's own data (risk lists, forecasts, reminder drafts, installment math) — fast and reliable for a demo, but it is not calling out to any AI model.
- **The Notification Center's "Automation Rules" toggles are not yet wired up.** They're present in the UI to show the intended direction (auto-sending risk-based or due-date alerts), but toggling them today doesn't trigger anything yet — every alert currently sent is a deliberate click.
- **The risk model's coefficients start out hand-set**, documented in code as a heuristic baseline (`MODEL_VERSION: 'heuristic-logistic-v1'`) — the in-browser SMOTE + gradient-descent calibration engine lets an admin replace them with real trained weights whenever they choose to.
- **We build real UPI deep links** (`upi://pay` intents with the school's actual VPA and the exact amount), which open correctly in any Indian payment app. We do **not** settle money ourselves — that needs a verified merchant account, which is a business-verification step, not an engineering one.
- **A single payment larger than any one invoice** is deliberately routed to a human to split by hand on the Needs Review screen, rather than guessed at automatically.
- **There's no credit-balance concept yet** — if a payment is larger than everything a family currently owes, the extra amount has nowhere to go inside the app. That's a real, known limitation, not an oversight.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it fits together, the data model, and the security model, in more depth than fits here.
