# Start here

Follow this top to bottom. Nothing is assumed. Budget about 90 minutes for the
whole page, most of it waiting for downloads.

---

## Step 1 — Install the tools *(20 min, once per laptop)*

1. **Node.js** — download the LTS version from https://nodejs.org and install it.
   Check it worked by opening a terminal and running:
   ```bash
   node -v
   ```
   You should see something like `v20.x` or higher.

2. **VS Code** — https://code.visualstudio.com

3. **Git** — https://git-scm.com/downloads

4. **Claude Code** — in a terminal:
   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

---

## Step 2 — Get the project running *(5 min)*

1. Unzip `feebridge-starter.zip` somewhere sensible, like `Documents/feebridge`.
2. Open VS Code → **File → Open Folder** → pick the `feebridge` folder.
3. Open a terminal inside VS Code with `` Ctrl + ` `` (backtick, top-left of the keyboard).
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:5173 in your browser.

You should see the FeeBridge role picker. Click **The office** and you'll see real
numbers, at-risk families and their reasons.

Also confirm the tests pass:
```bash
npm test
```
You should see **24 passed**.

> At this point the app is running on seeded demo data. No Firebase yet, and that
> is fine — everything works.

---

## Step 3 — Put it on GitHub *(10 min)*

Evaluators want a repo, so create it before you write any code. That way your
commit history shows the whole build.

1. Go to https://github.com/new and create a repository called `feebridge`.
   Public. Do **not** add a README (you already have one).
2. Back in the VS Code terminal:
   ```bash
   git init
   git add .
   git commit -m "Starter: domain engines, data layer, app shell"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/feebridge.git
   git push -u origin main
   ```

From now on, commit at the end of every work session:
```bash
git add .
git commit -m "Office dashboard: stat cards and at-risk list"
git push
```

---

## Step 4 — Connect Firebase *(30 min)*

You can skip this and still have a working app, but your Round 1 deck promised
Firebase, and it unlocks real multi-device sync. Worth doing.

### 4a. Create the project

1. Go to https://console.firebase.google.com → **Create a project**.
2. Name it `feebridge`. Turn Google Analytics **off** (you don't need it).
3. Wait for it to finish, then click **Continue**.

### 4b. Turn on Firestore

1. Left sidebar → **Build → Firestore Database** → **Create database**.
2. Choose a location near you (`asia-south1` for India).
3. Choose **Start in test mode**. This matters — the seeding script needs open
   rules for a few minutes. You'll lock it down in step 4f.
4. Click **Enable**.

### 4c. Turn on Authentication

1. Left sidebar → **Build → Authentication** → **Get started**.
2. Under **Sign-in method**, click **Email/Password**.
3. Toggle the first switch **Enable**, then **Save**.

### 4d. Get your config keys

1. Click the **gear icon** (top left, next to Project Overview) → **Project settings**.
2. Scroll to **Your apps** → click the **web icon** `</>`.
3. Nickname it `feebridge-web`, don't tick Firebase Hosting, click **Register app**.
4. You'll see a `firebaseConfig` block. Keep this tab open.

### 4e. Put the keys in your project

1. In VS Code, copy `.env.example` to a new file called `.env.local`.
2. Fill in the values from that config block:

   ```
   VITE_DATA_SOURCE=firebase

   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=feebridge-xxxx.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=feebridge-xxxx
   VITE_FIREBASE_STORAGE_BUCKET=feebridge-xxxx.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123:web:abc

   VITE_SCHOOL_UPI_VPA=yourname@okaxis
   VITE_SCHOOL_NAME=Green Valley School
   ```

   For `VITE_SCHOOL_UPI_VPA`, use a **real UPI ID** (yours is fine — nobody is
   sending money, and it makes the QR genuinely scannable in your video).

3. `.env.local` is already in `.gitignore`, so your keys won't be pushed.

### 4f. Upload the demo school and lock it down

Still in the VS Code terminal:

```bash
npm run seed
```

You should see it create three accounts and upload five collections. Then:

1. Firebase console → **Firestore Database** → **Rules** tab.
2. Open `firestore.rules` in VS Code, copy the whole file, paste it over what's
   in the console, and click **Publish**.

Now restart the dev server (`Ctrl+C`, then `npm run dev`) and sign in. It's
talking to Firestore.

**Test it properly:** open the app in a normal window and an incognito window.
Sign in as the front desk in one and the office in the other. Record a payment in
one and watch the other update by itself. That's your real-time sync working, and
it's the thing localStorage could never do.

Sign-in accounts:

| Role | Email | Password |
|---|---|---|
| Office | office@feebridge.demo | feebridge123 |
| Front desk | desk@feebridge.demo | feebridge123 |
| Parent | parent@feebridge.demo | feebridge123 |

### If something breaks

- **`permission-denied` while seeding** — Firestore isn't in test mode. Rules tab →
  temporarily set `allow read, write: if true;` → Publish → seed → paste the real
  rules back.
- **`auth/operation-not-allowed`** — Email/Password sign-in isn't enabled (step 4c).
- **App still shows demo data** — check `VITE_DATA_SOURCE=firebase` in `.env.local`
  and restart the dev server. Env changes need a restart.
- **Anything else** — set `VITE_DATA_SOURCE=local` and keep building. The app
  falls back automatically and you lose nothing but multi-device sync.

---

## Step 5 — Start building *(the actual work)*

Open `docs/SUBMISSION_PLAN.md`. It has six phases with copy-paste prompts.

In the VS Code terminal, start Claude Code:
```bash
claude
```

Paste this **first**, once per session:

> I'm a B.Tech student building this for a hackathon. As you work: explain what
> you're doing and why before you write code, keep changes small and reviewable,
> and after each file tell me in two or three sentences what it does and how it
> connects to the rest. Don't rewrite anything in `src/domain/` — it's tested and
> final. Read `docs/ARCHITECTURE.md` first. Match the existing visual style: warm
> paper background, forest green and terracotta, serif headings. Ask me before
> adding any new dependency.

Then paste the Phase A prompt from the submission plan.

After each phase:
```bash
npm test          # make sure nothing broke
git add .
git commit -m "..."
git push
```

---

## The order, in one glance

1. Tools installed ✓
2. `npm install && npm run dev` works ✓
3. Repo on GitHub ✓
4. Firebase connected and seeded ✓
5. Phase A — office dashboard
6. Phase B — parent wallet + UPI *(record the QR clip here)*
7. Phase C — cash desk + offline
8. **Phase D — deploy + README** *(you're submittable from here)*
9. Phase E — analytics + polish
10. Phase F — video + final pass
