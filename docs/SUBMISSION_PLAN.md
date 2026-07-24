# FeeBridge — submission plan

**What you're delivering:** a GitHub repo, a deployed URL, and a 3–5 minute video.
Nobody is watching you build, and nobody is asking you questions live. Everything
you would have said out loud has to be in the README or the narration instead.

That changes three things:

1. **The README is your pitch.** It's the first thing opened and it has to explain
   the idea, not just the install steps.
2. **The video can be re-recorded.** No pressure, no rehearsal needed. Record it
   in pieces and cut them together.
3. **The deployed link matters more than usual.** It lets them click around
   instead of trusting your video. It's also the easiest mark to earn — the app
   needs no backend, so it deploys as a static site in about four minutes.

---

## Order of work

Ship a complete, deployed, documented thing early. Then improve it. Do **not**
save deployment and docs for the last day.

| Day | Morning | Afternoon |
|---|---|---|
| 1 | Phase A — office dashboard | Phase B — parent wallet + UPI |
| 2 | Phase C — cash desk + offline | **Phase D — deploy + README (do not skip)** |
| 3 | Phase E — analytics + polish | Phase F — video + final repo pass |

Phase D sits in the middle on purpose. Once it's done you always have something
submittable, and every later phase is a bonus rather than a risk.

---

## Phase A — Office dashboard *(Day 1 morning)*

> Build the full office (admin) dashboard, replacing `OfficeStarter` in `App.tsx`
> with a proper feature folder at `src/features/admin/`.
>
> 1. Stat cards: total outstanding, expected collection with its confidence band
>    from `useForecast`, families needing help, collection rate as a percentage.
> 2. A "Families worth a quiet word" list sorted by risk score ascending. Show the
>    family, guardian, what's due and when, a soft amber or terracotta chip with
>    the score — never a harsh red — and the top three reasons from
>    `result.reasons`. Make the reasons visible on the card, not hidden in a
>    tooltip: explainability is the whole point.
> 3. An "Offer a plan" button calling `offerPlan(invoiceId)`, opening a modal that
>    previews the generated instalments before confirming.
> 4. An invoice table with filters by class, status and term.
>
> Use `src/lib/format.ts` for money and dates. Keep components small, shared
> pieces in `src/components/ui/`.

---

## Phase B — Parent wallet + UPI *(Day 1 afternoon)*

> Build the parent wallet in `src/features/parent/`, replacing `ParentStarter`.
>
> 1. One family balance covering all children, then a per-child breakdown.
> 2. A pay flow generating a real UPI QR via `buildUpiLink()` and `qrcode.react`,
>    reading the VPA and school name from `import.meta.env`.
> 3. An "I've paid" button calling `recordPayment()` so the loop completes without
>    real money moving.
> 4. If a plan exists, show it as a timeline and allow paying just the next part.
> 5. Payment history with receipts.
>
> A parent must never see a risk score or band — office-only, by design.
> Mobile-first: parents are on phones.

**Capture the QR working on a real phone as soon as this runs.** Screen-record the
app, film the phone separately. That clip is the most convincing 15 seconds in
your video and you don't want to be re-shooting it on day three.

---

## Phase C — Cash desk + offline *(Day 2 morning)*

> Build the clerk experience in `src/features/clerk/`, replacing `ClerkStarter`.
>
> 1. Fast cash/cheque entry: searchable student picker, amount, method, reference.
> 2. On save, `recordPayment()` runs reconciliation. Show the outcome plainly —
>    matched, Needs Review, or duplicate — including the engine's reason string.
> 3. A connection indicator; when offline show how many writes are queued and mark
>    queued payments as pending.
> 4. A Needs Review screen letting someone attach an unmatched payment by hand.
> 5. A printable receipt view.
>
> The header's offline toggle calls `toggleOffline()`. The full flow must work
> with it on: record offline, see it queue, come back online, watch it sync and
> reconcile itself.

---

## Phase D — Deploy and document *(Day 2 afternoon — the important one)*

### Deploy

The app needs no backend, so this is a static deploy.

```bash
npm run build          # check it succeeds
npx vercel --prod      # follow the prompts, accept the defaults
```

Vercel will ask to log in (GitHub is easiest), then detect Vite automatically.
Netlify works the same way: `npx netlify deploy --prod --dir=dist`.

Afterwards, open the URL on your phone and confirm the parent view looks right and
the QR scans. Then put the link at the very top of the README.

### The README

This is doing the job you'd otherwise do in person, so give it real time.

> Rewrite `README.md` for someone who has never met us and will spend ninety
> seconds on it. Structure:
> 1. Name, one-line description, live URL, and a screenshot of the office
>    dashboard right at the top.
> 2. "The problem" — three or four sentences about registers, lost cash, siblings
>    getting separate reminders, and public defaulter lists.
> 3. "What FeeBridge does" — the three roles, with a screenshot each.
> 4. "What's different about it" — explainable risk flags, offline cash
>    reconciliation, one family one wallet.
> 5. "How it's built" — the layer diagram from `docs/ARCHITECTURE.md`, the stack,
>    and a note that the engines are pure and tested.
> 6. "Run it locally" — exact commands.
> 7. "Honest notes" — model weights are hand-set not trained, and we build real
>    UPI intents but don't settle money.
>
> Take screenshots at 1280px wide and put them in `docs/images/`.

Commit and push. **You are now submittable.** Everything after this is upside.

---

## Phase E — Analytics and polish *(Day 3 morning)*

> Add analytics to the office dashboard with `recharts`: collection trend over the
> term, outstanding by class using `pendingByClass()`, payment method split, and a
> forecast card showing expected, the low–high band and confidence with one plain
> sentence explaining it. Use the palette: `#1B6B54`, `#C56A45`, `#B98328` on the
> warm paper background.

> Then a production pass: loading and empty states everywhere, an error boundary,
> keyboard navigation and ARIA labels, check every screen at 375px, verify the PWA
> installs from `npm run preview`, and add a small "Demo data" badge.

---

## Phase F — Video and final repo pass *(Day 3 afternoon)*

### The video

See `docs/DEMO_SCRIPT.md` for the beat-by-beat. Since it's recorded, not live:

- Record in **separate clips** per section and join them. A five-minute unbroken
  take is needless stress.
- Fluffed a line? Pause, say it again, cut it later.
- OBS Studio is free and fine. Your phone films the QR moment.
- Zoom the browser to 110–125% so text survives compression.
- Narrate what the thing *means*, not what you're clicking. Not "now I click
  offer plan" — instead "this family hasn't defaulted yet, and the system already
  knows why they might."
- Upload unlisted to YouTube; link it in the README.

### Final repo pass

> Review the repo for submission:
> 1. `npm install`, `npm test` and `npm run build` all work from a clean clone.
> 2. Remove dead code, unused imports and stray console.logs.
> 3. JSDoc on every exported function.
> 4. Write `docs/API.md` covering the repository interface and each engine's
>    signature, inputs and outputs.
> 5. Check `docs/ARCHITECTURE.md` matches what we actually built.
> 6. Tidy commit history — meaningful messages, no "final final v2".

---

## Submission checklist

- [ ] Repo public, README with live URL and screenshots at the top
- [ ] Deployed link works on desktop **and** phone
- [ ] `npm install && npm test && npm run build` pass from a clean clone
- [ ] Video 3–5 min, unlisted YouTube link in README and submission form
- [ ] `docs/ARCHITECTURE.md`, `docs/API.md`, setup steps all present
- [ ] Honest notes section included
- [ ] Both Round 2 fields submitted on the EduHack workspace

---

## If you run short

Cut in this order: analytics charts, printable receipts, invoice filters.

**Never cut:** explainable risk flags, offline cash sync, the UPI QR, the deployed
link, or the README. The first three are the product; the last two are how anyone
finds out.
