# Architecture

## The shape of it

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

## Three decisions worth explaining

### 1. The engines are pure functions

`src/domain/` has no React, no Firebase, no I/O. Every engine takes data in and
returns a result. That means they are unit-testable (24 tests, no mocking), they
can move to a Cloud Function without changes, and the "intelligence" of the
product is auditable in about 300 lines.

### 2. The UI never touches the database

Components talk to the store; the store talks to a `Repository` interface. Two
adapters implement it:

- **`LocalRepository`** — seeded demo school in memory + localStorage. Zero setup,
  instant, and it survives a dead conference-hall wifi.
- **`FirestoreAdapter`** — the same interface backed by Firestore.

Swapping them is one line. This is why the demo cannot fail because of a network.

### 3. Offline is a data-layer concern, not a UI concern

Firestore's `persistentLocalCache` queues writes on the device and syncs them when
the connection returns. The local adapter mirrors that behaviour with an explicit
queue so the offline story is demonstrable without Firebase.

Either way, the cash desk UI just calls `recordPayment()`. It never knows whether
it is online.

## Data model

```
families
  └ students
      └ invoices          (one per fee head, per term)
          └ payments      cash · cheque · UPI
students
  └ riskProfile           score + probability + reasons
```

Denormalised `familyId` on invoices and payments keeps the parent wallet a single
query instead of a join — the "one family, one balance" feature is a data model
decision, not a UI trick.

## Security model

Three roles, enforced at the data layer:

| Role | Can see | Can write |
|---|---|---|
| admin | everything in the school | fees, plans, reconciliation |
| clerk | students, open invoices | payments only |
| parent | **their own family only** | payments for their family |

Risk scores are **office-only**. A parent never sees a score or a band — that is a
deliberate product decision, not an oversight. The system's job is to help quietly,
not to label people.

Firestore rules live in `firestore.rules`.

## Scalability notes

- Reads are indexed by `familyId` and `term`, so a school with 5,000 students pages
  the same way as one with 200.
- The engines are O(n) over open invoices and run client-side for one school; when
  a deployment covers many schools they move to a scheduled Cloud Function that
  writes `riskProfile` documents, and the client just reads them. No UI change.
- The PWA shell is precached, so repeat loads are near-instant on poor connections —
  which is the realistic condition in most schools.
