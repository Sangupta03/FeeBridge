# Demo video runsheet (3–5 minutes)

Record in this order. Screen recording + clear audio beats a fancy edit.
Do a full dry run before the real take.

## 0:00–0:30 — The problem, with a face on it
Open on the office view. Say it plainly:

> "In most schools, fees live in a register, a spreadsheet and three half-used
> apps. Cash gets lost on paper. A parent with three children gets three separate
> reminders. And families who fall behind usually find out when their name is read
> out in public. FeeBridge fixes the money problem and the dignity problem together."

## 0:30–1:15 — One family, one balance
Switch to the parent role. Show the single balance covering both children, then
the per-child breakdown.

> "Anita has two children here. One balance, one payment."

## 1:15–2:00 — Scan to pay  ⭐ MOMENT ONE
Open the pay screen. **Physically pick up a phone and scan the QR on camera.**
Show the UPI app opening with the amount already filled in.

> "That's a real UPI intent. We don't settle the money — that needs a merchant
> account, which is paperwork, not engineering — but the rail is live."

## 2:00–3:00 — Offline cash  ⭐ MOMENT TWO
Switch to the front desk. Toggle offline. Record a cash payment.

> "The internet's gone. The clerk doesn't care."

Show it queued. Toggle back online. Watch it sync and auto-match to the right
invoice. Then show the Needs Review pile with a payment that couldn't be matched,
and the duplicate-detection flag.

## 3:00–4:00 — The part we care about most
Back to the office view. Point at an amber family.

> "This family hasn't defaulted yet. The model thinks they're about to — and it
> tells us why: paid late three times, twelve thousand outstanding, used a plan
> twice before. No black box."

Click **Offer a plan**. Show the generated instalments.

> "Not a fixed 50-50 split. It's shaped by how this family actually pays. And the
> reminder goes privately to one parent, never onto a list."

## 4:00–4:30 — Under the hood
One breath on architecture:

> "React PWA, Firebase with offline persistence, and four pure TypeScript engines
> with twenty-four unit tests. The UI never touches the database directly — it goes
> through a repository interface, so we can swap the data source without changing a
> single component."

## 4:30–5:00 — Close
> "More fees collected, fewer students lost, and families treated kindly on what's
> often a hard month. That's FeeBridge."

---

## Recording tips
- OBS Studio (free) or your phone for the QR moment.
- Close Slack, WhatsApp and email first.
- Zoom the browser to 110–125% so text is readable in compressed video.
- If you fluff a line, pause two seconds and say it again — easy to cut.
- Upload unlisted to YouTube and put the link in the README.
