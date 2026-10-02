# Deploying Zaina Boutique — GitHub + Vercel + Firebase

This is a single, start-to-finish path to get your store live on the internet with a real
database. It assumes no prior experience — every command is spelled out exactly.

For feature documentation (what each admin setting does, CSV import format, etc.), see
`README.md` in this same folder. This file is only about getting deployed.

**Total time:** roughly 30–45 minutes the first time.

---

## Part 0 — One-time tool setup

Skip anything you've already installed.

1. **Node.js** — download the current LTS version from [nodejs.org](https://nodejs.org) and
   install it. This project requires **Node 20.9 or later**. After installing, confirm it in a
   terminal:
   ```
   node -v
   ```
   If that shows anything below `v20.9.0`, reinstall from nodejs.org before continuing.

2. **Git** — download from [git-scm.com/downloads](https://git-scm.com/downloads), click through
   the installer with default options.

3. **GitHub account** — [github.com/signup](https://github.com/signup) if you don't have one.

4. **Vercel account** — [vercel.com/signup](https://vercel.com/signup) — sign up **using your
   GitHub account** (there's a "Continue with GitHub" button). This links them automatically.

5. **Firebase account** — no separate signup; it uses your existing Google account. You'll create
   a project in Part 3.

---

## Part 1 — Get the project running on your computer

1. Unzip the project folder somewhere you'll remember, e.g. your Desktop.
2. Open a terminal and navigate into it:
   ```
   cd path/to/sky-store
   ```
   (Type `cd `, then drag the folder into the terminal window, then press Enter.)
3. Install dependencies:
   ```
   npm install
   ```
4. Test it runs:
   ```
   npm run dev
   ```
   Open `http://localhost:3000` — you should see the storefront in **demo mode** (works, but
   nothing you do is saved anywhere permanent yet). Press `Ctrl+C` in the terminal to stop it.

---

## Part 2 — Put the project on GitHub

1. Go to [github.com/new](https://github.com/new). Name the repository `zaina-boutique` (or
   anything you like). Leave it **Private** unless you have a reason to make it public. Click
   **Create repository**. Leave the next page open — you'll need the URL it shows you.
2. Back in your terminal, still inside the `sky-store` folder, run these one at a time:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/zaina-boutique.git
   git push -u origin main
   ```
   Replace `YOUR-USERNAME` with your actual GitHub username (visible in the URL GitHub just
   showed you). The first push may ask you to sign in — follow the prompts.
3. Refresh the GitHub page — you should now see all your project files listed there.

---

## Part 3 — Create your Firebase project (the database)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
   Name it (e.g. "Zaina Boutique"), click through the setup screens (Google Analytics is
   optional, skip it if unsure).
2. Once created, click the **`</>`** (web) icon on the project overview page to register a web
   app. Give it any nickname. **Copy the config values it shows you** — you'll need these in
   Part 5. It looks like:
   ```
   apiKey: "...",
   authDomain: "...",
   projectId: "...",
   storageBucket: "...",
   messagingSenderId: "...",
   appId: "...",
   ```
3. In the left sidebar: **Build → Firestore Database → Create database**. Choose a location
   close to your customers, and start in **test mode** for now (you'll lock it down in Part 6).
4. **Build → Storage → Get started** (accept the defaults).
5. **Build → Authentication → Sign-in method** → enable:
   - **Email/Password** (this is how you'll log into your admin dashboard)
   - **Google** (lets customers use "Sign in with Google")

---

## Part 4 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new). Your `zaina-boutique` repository should be
   listed automatically (since your GitHub and Vercel accounts are linked) — click **Import**
   next to it.
2. Leave all settings as-is — Vercel auto-detects this as a Next.js project.
3. Before clicking Deploy, expand **Environment Variables** and add each of these (values from
   the Firebase config you copied in Part 3, step 2):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | your `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | your `authDomain` |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | your `projectId` |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | your `storageBucket` |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | your `messagingSenderId` |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | your `appId` |
   | `NEXT_PUBLIC_SITE_URL` | leave blank for now — you'll fill this in after step 4 below |

4. Click **Deploy**. Wait 1–2 minutes. You'll get a live URL like
   `zaina-boutique-yourname.vercel.app` — **that's your website, live on the internet.**
5. Go back to **Settings → Environment Variables**, edit `NEXT_PUBLIC_SITE_URL`, and set it to
   the URL you were just given (e.g. `https://zaina-boutique-yourname.vercel.app`). Then go to
   the **Deployments** tab → click the **⋯** menu on the latest deployment → **Redeploy**, so the
   site picks up that value.

---

## Part 5 — Connect your live site to Firebase

Your site is live, but it's still running in demo mode because Firebase needs one more thing:
your live domain has to be allowed to use Firebase Auth.

1. Firebase Console → **Authentication → Settings → Authorized domains** → **Add domain** →
   paste in your Vercel URL (without `https://`, e.g. `zaina-boutique-yourname.vercel.app`).
2. On your computer, update your local `.env.local` file (copy from `.env.local.example` if you
   haven't already) with the same six Firebase values from Part 3. Then run:
   ```
   npm run seed
   ```
   This loads starter products, categories, and settings into your real Firestore database.

---

## Part 6 — Create your first admin account

This is the one step that can't be automated — it's a deliberate security gate so random
visitors can't reach your dashboard.

1. Firebase Console → **Authentication → Users → Add user**. Enter an email and password — this
   is your admin login (separate from customer accounts).
2. Copy that user's **User UID** shown in the users list.
3. Firebase Console → **Firestore Database → Start collection**. Collection ID: `admins`.
   Document ID: paste the UID you copied. Add one field: `email` (type: string), value: your
   admin email. Click **Save**.
4. Go to `https://your-site.vercel.app/admin-portal/login` and sign in with that email/password.

You're in. From here, use Admin → Customer to grant admin access to other accounts later — no
need to repeat steps 1–3 for future admins.

---

## Part 7 — Lock down your database (important before going fully public)

Firestore's "test mode" from Part 3 allows anyone to read/write anything — fine for setup, not
fine for a live store. In Firebase Console → **Firestore Database → Rules**, replace the
contents with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }
    match /products/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /categories/{id}    { allow read: if true; allow write: if isAdmin(); }
    match /banners/{id}       { allow read: if true; allow write: if isAdmin(); }
    match /discounts/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /settings/{id}      { allow read: if true; allow write: if isAdmin(); }
    match /pages/{id}         { allow read: if true; allow write: if isAdmin(); }
    match /faqs/{id}          { allow read: if true; allow write: if isAdmin(); }
    match /reviews/{id}       { allow read: if true; allow create: if true; allow update, delete: if isAdmin(); }
    match /orders/{id}        { allow create: if true; allow read, update: if isAdmin(); }
    match /admins/{id}        { allow read: if isAdmin(); allow write: if isAdmin(); }
    match /users/{id} {
      allow read: if isAdmin() || request.auth.uid == id;
      allow create: if request.auth.uid == id;
      allow update: if isAdmin();
    }
  }
}
```

Click **Publish**. Then do the same for **Storage → Rules**:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Optional next steps

These aren't required to be live — do them whenever you're ready:

- **Accept real payments:** Admin → Settings → Payments to enable Razorpay or Order via
  WhatsApp. See `README.md` section 3 for the full Razorpay key setup.
- **Custom domain:** Vercel → your project → Settings → Domains → add your own domain (e.g.
  `zainaboutique.com`). Update `NEXT_PUBLIC_SITE_URL` to match afterward and redeploy.
- **Google Search Console:** verify your domain and submit your sitemap — see `README.md`
  section 11.

---

## Making changes later

Whenever you (or I) update the code:

1. Replace the files in your local `sky-store` folder with the new versions.
2. In your terminal, inside that folder:
   ```
   git add .
   git commit -m "Update site"
   git push
   ```
3. Vercel automatically redeploys within a minute or two — no dashboard clicks needed. You can
   watch progress at [vercel.com/dashboard](https://vercel.com/dashboard).

---

## If something goes wrong

Take a screenshot of the exact error (terminal error, browser error page, or Vercel deployment
log) and send it — that's the fastest way to get it fixed.
