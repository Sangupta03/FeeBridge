<div align="center">

# 🌉 FeeBridge

### A calmer, kinder way for schools to handle fees, and for families to pay them.

**🔗 Live app:** **[feebridge.vercel.app](https://feebridge.vercel.app)**

*Built by **Team SheBuilds** for the Smart School FinTech Innovation Challenge*

</div>

---

Most schools run fees on registers, spreadsheets, and a WhatsApp group. Cash payments go unrecorded until someone remembers to write them down. A family with three children gets three separate reminders for what is really one household budget. And the families who fall behind often find out they're in trouble from a printed defaulter list — the same day everyone else does.

None of that is really a technology problem. It's a **dignity** problem. FeeBridge fixes both at once: catch a family before they default, help them quietly, and never make the school's books harder to keep than they already are.

---

## 📸 Main Dashboard Preview

<img width="1907" height="916" alt="image" src="https://github.com/user-attachments/assets/be020fa5-3d21-4524-9052-4223d7825efd" />

---

## Contents

- [Core Portals](#-core-portals)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Run it Locally](#-run-it-locally)
- [Firebase Integration](#-firebase-integration-optional)
- [Testing & Verification](#-testing--verification)
- [Limitations & Honesty](#-limitations--honesty)

---

## 👥 Core Portals

FeeBridge provides three tailored views off a single shared source of truth:

### 🏫 The Office (School Administration)
Monitor total outstanding collections, view cash/cheque deposits pending review, calibrate risk prediction models, and dispatch templated alerts via the Notification Hub.
<img width="1876" height="921" alt="image" src="https://github.com/user-attachments/assets/a070a740-6ace-40e8-a392-03b873306d2e" />


### 👪 The Family (Parent Portal)
View a single, unified balance for all siblings. Access custom payment plans, scan scannable UPI QR codes for instant payment, and read inbox notifications.
<img width="1913" height="911" alt="image" src="https://github.com/user-attachments/assets/7e566a40-1c36-4136-b38c-0b51aa89c84a" />


### 🧾 The Front Desk (Clerk Desk)
Accept cash and cheque payments instantly, even when offline. The matching engine automatically maps payments to outstanding invoices when the network resumes.
<img width="1860" height="915" alt="image" src="https://github.com/user-attachments/assets/ac0c98b2-40b3-4126-af2c-280aa440cd4a" />


---

## 🚀 Key Features

### 1. 👪 Unified Family Wallet
Instead of managing separate invoices for siblings, FeeBridge rolls up all child accounts (`studentId`) under a parent account (`familyId`). 
- **Single Payment Flow**: Pay the entire family balance in one UPI checkout.
- **Scannable UPI Intent QR Code**: Dynamically generates local Indian `upi://pay` intents containing the school VPA and exact payment amount.

### 2. 🧠 In-Browser Risk Predictor (ML Calibration)
FeeBridge includes a built-in Machine Learning classification model to predict late payment risk.
- **L2-Regularized Logistic Regression**: Trained directly inside the browser using client-side Javascript.
- **SMOTE Generator**: Automatically synthesizes up to 5,000 artificial profiles based on real historical data to ensure high-fidelity model training.
- **Admin Calibration Control**: School administrators can add mock records, fine-tune weights, and run "Auto-Calibrate" to observe training accuracy curves in real-time.
<img width="1888" height="903" alt="image" src="https://github.com/user-attachments/assets/b8e55779-e16f-4844-bafb-61970844a621" />


### 3. 💬 Integrated Notification Hub
Alert parents about overdue payments empathetically without manual copy-pasting.
- **Real WhatsApp Deep Links**: Generates `wa.me/` Click-to-Chat links containing pre-formatted messages to launch the WhatsApp app on the administrator's desktop or phone.
- **SMS URI Protocols**: Uses `sms:` link schemes for mobile dispatch.
- **Inbox Feed**: Parents see a clear feed of all sent alerts directly inside the portal header inbox, with red unread indicators.
  <img width="1892" height="915" alt="image" src="https://github.com/user-attachments/assets/daa10675-043f-423e-b8ec-c85e99de2c21" />


### 4. 📳 Robust Offline Ledger
Front desks are prone to network dropouts. FeeBridge is designed to work fully offline.
- **Optimistic UI Writes**: Instantly updates local clerk records during cash collections.
- **Local Write Queue**: Holds updates in memory and localStorage when offline, then automatically flushes them once network connectivity is restored.
- **Reconciliation Engine**: Auto-matches incoming payments against open invoices or prompts clerk intervention if manual splits are required.

### 5. 🔄 Demo State Reset
To facilitate seamless live demonstrations, FeeBridge includes a one-click reset action next to the "Demo data" pill in the header. 
- Discards all local storage modifications, mock payments, and installment configurations.
- Instantly re-seeds the application back to the standard 6-family, 9-student mock school state.

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
│  risk           │            │   ├ LocalAdapter   │
│  installments   │            │   └ FirestoreAdapter│
│  reconcile      │            └─────────┬──────────┘
│  forecast       │                      │
└─────────────────┘            ┌─────────▼──────────┐
                               │ Firestore + cache  │
                               │ Auth · UPI intents │
                               └────────────────────┘
```

- **Domain Engines** (`src/domain/`): Pure TypeScript libraries (no React, no Firebase, no UI) that contain all algorithms for risk forecasting, installment scheduling, and payment matching.
- **Zustand State Store** (`src/store/`): Owns data subscription, triggers offline queue flushes, and computes derived states.
- **Repository Interface** (`src/data/`): Dynamically resolves to `LocalRepository` (using localStorage and seeded JSON fixtures) or `FirestoreRepository` depending on configuration.

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

---

## 🔥 Firebase Integration *(Optional)*

To enable multi-device synchronization and real database persistence, follow these steps:

1. **Setup Project**: Create a new project in the [Firebase Console](https://console.firebase.google.com).
2. **Turn on Firestore**: Under **Build -> Firestore Database**, click **Create database** and start in test mode.
3. **Turn on Authentication**: Under **Build -> Authentication**, enable **Email/Password** as a sign-in provider.
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

The core business logic of the four domain engines is verified using unit tests.

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

## 📝 Limitations & Honesty

- **Credit Balances**: If a parent pays more than the total outstanding balance, the application currently has no wallet credit system to carry forward excess amounts.
- **Manual Reconciliation Splits**: If a clerk receives a cheque or cash payment that exceeds all single outstanding invoices for a family, the matching engine defaults the record to "Needs Review". A human clerk must manually allocate portions of the payment across multiple invoices.
- **Simulated Payment Gateway**: Since real payment gateway verification requires business registration/merchant KYC, the UPI flow generates a genuine deep link QR code but relies on optimistic user verification for simulated transaction success.
