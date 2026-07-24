# FeeBridge — build plan for Round 2

Three days, three people. This plan assumes you work in **VS Code with Claude Code**.

Everything in `src/domain/` already works and is tested. **Do not rewrite it.**
Your job over the next three days is to build screens on top of it.

---

## Before you start (20 minutes)

1. **Install Claude Code** in VS Code — install Node 18+, then in a terminal:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```
   Then open VS Code, open the `feebridge` folder, open a terminal (`` Ctrl+` ``)
   and run `claude`. Sign in when prompted. (There is also a Claude Code extension
   in the VS Code marketplace if you prefer a side panel.)

2. **Get the project running:**
   ```bash
   npm install
   npm run dev
   npm test
   ```
   You should see the role picker, and 24 passing tests.

3. **Create the repo and push.** Judges score code quality and commit history —
   commit at the end of every phase with a real message, not "final final v2".

4. **Split the work.** Suggested, based on your deck:
   - **Sanjoli** — office dashboard + analytics (Phases 1, 4)
   - **Ridhima** — parent wallet + UPI (Phase 2)
   - **Roli** — cash desk + reconciliation (Phase 3)
   Phases 5 and 6 are together.

---

## How to talk to Claude Code

Start **every** session by pasting this once, so it explains as it goes:

> I'm a B.Tech student building this for a hackathon. As you work:
> explain what you're doing and why before you write code, keep changes small
> and reviewable, and after each file tell me in two or three sentences what it
> does and how it connects to the rest. Don't rewrite anything in `src/domain/` —
> it's tested and final. Read `docs/ARCHITECTURE.md` first. Match the existing
> visual style: warm paper background, forest green and terracotta, serif
> headings. Ask me before adding any new dependency.

Then paste the phase prompt.

**After each phase, ask it:**
> Walk me through what you just built as if you're explaining it to a judge,
> and point out anything you'd flag as a weakness.

That answer is your demo script and your Q&A prep.

---

# Phase 1 — The office dashboard  *(Day 1 morning, ~4h)*

The screen judges will look at longest. Everything it shows already exists in the
store; this is presentation.

**Prompt:**

> Build the full office (admin) dashboard, replacing `OfficeStarter` in `App.tsx`
> with a proper feature folder at `src/features/admin/`.
>
> It needs:
> 1. A top row of stat cards: total outstanding this term, expected collection
>    (with the confidence band from `useForecast`), number of families needing
>    help, and collection rate as a percentage.
> 2. A "Families worth a quiet word" list, sorted by risk score ascending. Each
>    row shows the family name, guardian, what's due and when, a soft amber or
>    terracotta band chip with the score — **never a harsh red** — and the top
>    three reasons from `result.reasons`. This explainability is our core
>    differentiator, so make the reasons prominent, not a tooltip.
> 3. An "Offer a plan" button on each at-risk row that calls `offerPlan(invoiceId)`
>    and opens a modal previewing the generated instalments before confirming.
> 4. A full invoice table with filters by class, status and term.
>
> Use `src/lib/format.ts` for all money and dates. Keep components small and put
> shared pieces in `src/components/ui/`. Explain your component structure before
> you write it.

**Done when:** you can see the school's money at a glance, and every flag explains itself.

---

# Phase 2 — The parent wallet and UPI  *(Day 1 afternoon, ~4h)*

This is the "one family, one payment" promise, and it contains your best live demo
moment.

**Prompt:**

> Build the parent wallet in `src/features/parent/`, replacing `ParentStarter`.
>
> 1. One big family balance covering **all** children, then a per-child breakdown.
>    Make it obvious this is one payment for the whole family, not one per child.
> 2. A "Pay now" flow that generates a real UPI QR using `buildUpiLink()` from
>    `src/domain/forecast.ts` and `qrcode.react`. Read the VPA and school name from
>    `import.meta.env`. Show the exact amount under the QR.
> 3. Below the QR, a "I've paid" button that calls `recordPayment()` so the demo
>    can complete the loop without real money moving.
> 4. If the family has an instalment plan, show it as a friendly timeline with each
>    part and its date, and let them pay just the next part.
> 5. A payment history list with receipts.
>
> Important: a parent must **never** see a risk score or band. That's an office-only
> concept and a deliberate product decision — check `docs/ARCHITECTURE.md`.
>
> Make this screen mobile-first; parents are on phones.

**Test it for real:** open the app on your phone, scan the QR with any UPI app, and
confirm it opens with the amount pre-filled. **Record this on video now** — it's your
strongest proof and you don't want to be capturing it at 3am.

---

# Phase 3 — The cash desk, offline and reconciliation  *(Day 2 morning, ~5h)*

The feature nobody else will attempt. Give it the time it deserves.

**Prompt:**

> Build the clerk experience in `src/features/clerk/`, replacing `ClerkStarter`.
>
> 1. A fast cash/cheque entry form: pick a student (searchable), amount, method,
>    reference number, and save. Optimised for speed — a clerk uses this fifty
>    times a morning.
> 2. On save, call `recordPayment()`, which runs the reconciliation engine. Show
>    the result clearly: matched to an invoice, sent to Needs Review, or flagged as
>    a duplicate — including the engine's `reason` string.
> 3. A prominent connection indicator. When offline, show how many writes are
>    queued, and make queued payments visibly "pending" in the list.
> 4. A "Needs Review" screen for the office listing unmatched payments, letting a
>    human attach one to an invoice by hand.
> 5. A receipt view that can be printed.
>
> The offline toggle in the header already simulates losing the network via
> `toggleOffline()`. Make sure the whole flow works with it switched on: record a
> payment offline, see it queue, switch back online, watch it sync and reconcile.
> Explain how the queue works in the local adapter before you change anything.

**Done when:** you can turn off the network, take a cash payment, turn it back on,
and watch it sync and match itself. Rehearse this — it's demo moment number two.

---

# Phase 4 — Analytics  *(Day 2 afternoon, ~3h)*

Turns it from a tool into a product.

**Prompt:**

> Add an analytics section to the office dashboard using `recharts`.
>
> 1. Collection trend over the term (line chart).
> 2. Outstanding by class (bar chart) — use `pendingByClass()` from
>    `src/domain/forecast.ts`.
> 3. Payment method split: cash vs cheque vs UPI (donut).
> 4. A forecast card: expected collection, the low–high band, and the confidence
>    percentage, with one plain sentence explaining what the number means.
> 5. Average payment delay in days.
>
> Match the deck's palette: forest green `#1B6B54`, terracotta `#C56A45`,
> amber `#B98328` on the warm paper background. No neon, no default chart colours.

---

# Phase 5 — Polish, PWA and deploy  *(Day 2 evening, ~3h)*

**Prompt:**

> Production pass:
> 1. Loading and empty states for every screen. No blank flashes.
> 2. An error boundary with a human message.
> 3. Keyboard navigation and sensible ARIA labels — the brief scores accessibility.
> 4. Check every screen at 375px width.
> 5. Verify the PWA installs: `npm run build && npm run preview`, then check the
>    install prompt appears and the app opens offline.
> 6. Add a subtle "Demo data" badge so judges know the school is seeded.

Then deploy — Vercel or Netlify, both free:

```bash
npm run build
npx vercel --prod        # or: npx netlify deploy --prod --dir=dist
```

Put the live URL in your README and your submission.

---

# Phase 6 — Documentation and video  *(Day 3, ~5h)*

The brief explicitly asks for docs, so this is free marks. **Do not skip it.**

**Prompt:**

> Review the whole repo for submission quality:
> 1. Update `README.md` with real screenshots, the live URL, and the exact setup steps.
> 2. Check `docs/ARCHITECTURE.md` still matches what we actually built, and fix it
>    if it doesn't.
> 3. Write `docs/API.md` covering the repository interface and each engine's
>    signature, inputs and outputs.
> 4. Add JSDoc to any exported function that's missing it.
> 5. Remove dead code, unused imports and stray `console.log`s.
> 6. Make sure `npm test` and `npm run build` both pass from a clean clone.

Then record the video — see `docs/DEMO_SCRIPT.md`.

---

## If you fall behind

Cut in this order, and protect what's below the line:

1. ~~Analytics charts (Phase 4)~~ — nice, not load-bearing
2. ~~Printable receipts~~
3. ~~Invoice table filters~~

**Never cut:** the explainable risk flags, the offline cash sync, or the UPI QR.
Those three *are* your project. Everything else is scaffolding around them.

---

## Mapping to the judging criteria

| Criterion | Where you earn it |
|---|---|
| Innovation & Creativity | Explainable risk + dignity-first reminders (Phase 1) |
| Problem Solving | Offline cash reconciliation (Phase 3) |
| Technical Excellence | Pure tested engines, 24 unit tests |
| Software Architecture | Repository pattern, swappable adapters (`docs/ARCHITECTURE.md`) |
| Code Quality | TypeScript strict, small components, JSDoc (Phase 6) |
| UI/UX Design | Warm consistent design system, mobile-first parent view |
| Scalability | Indexed queries, engines liftable to Cloud Functions |
| Business Impact | Forecast + collection rate (Phase 4) |
| Demonstration | The two rehearsed moments: offline sync, and scan-to-pay |
