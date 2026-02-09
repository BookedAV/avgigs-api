# AVGigs — AV Freelancer Marketplace

## Deployment Guide (Empty Repo → Live MVP)

---

## PROJECT STRUCTURE

```
av-gig-marketplace/
├── index.html              ← Landing page
├── auth.html               ← Sign up / Log in
├── jobs.html               ← Browse open positions
├── dashboard.html          ← Client dashboard (post jobs, manage, mark filled)
├── css/
│   └── style.css           ← All styles
├── js/
│   ├── config.js           ← Supabase + Stripe + serverless URLs (EDIT THIS)
│   └── app.js              ← Shared utilities (auth nav, toast, helpers)
├── sql/
│   └── schema.sql          ← Copy-paste into Supabase SQL Editor
└── api/                    ← Deploy SEPARATELY to Vercel (serverless functions)
    ├── vercel.json
    ├── package.json
    ├── create-setup-intent.js
    ├── charge-fill.js
    └── get-payment-method.js
```

**Key rule:** The `api/` folder deploys to Vercel. Everything else deploys to GitHub Pages.

---

## STEP 1: SUPABASE SETUP

### 1a. Create project
1. Go to https://supabase.com → New Project
2. Name it `avgigs`, pick a region, set a DB password
3. Wait for it to provision (~2 min)

### 1b. Run the schema SQL
1. Go to **SQL Editor** → **New Query**
2. Paste the entire contents of `sql/schema.sql`
3. Click **Run**
4. You should see: `profiles`, `jobs`, `applications` tables created with RLS policies

### 1c. Configure Auth
1. Go to **Authentication** → **Providers**
2. Email provider is enabled by default — that's all you need
3. **OPTIONAL for faster testing:** Go to **Authentication** → **Settings** → turn OFF "Confirm email" so accounts work immediately without email verification

### 1d. Get your keys
1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon public key** → this is your `SUPABASE_ANON`
3. Paste both into `js/config.js`

---

## STEP 2: STRIPE SETUP

### 2a. Create account
1. Go to https://dashboard.stripe.com → sign up
2. Stay in **Test Mode** (toggle at top right)

### 2b. Get keys
1. Go to **Developers** → **API Keys**
2. Copy:
   - **Publishable key** (`pk_test_...`) → paste into `js/config.js`
   - **Secret key** (`sk_test_...`) → you'll add this to Vercel as an env variable. **NEVER put this in frontend code.**

### 2c. No product/price setup needed
The charge is a one-time $25 PaymentIntent created directly in `charge-fill.js`. You don't need to create a Stripe Product or Price for this. The amount is hardcoded at 2500 cents ($25.00) in the serverless function.

If you later want to change the fee, edit `INTRO_FEE_CENTS` in `api/charge-fill.js`.

---

## STEP 3: DEPLOY SERVERLESS FUNCTIONS (Vercel)

### 3a. Create a separate repo for the API
```bash
mkdir avgigs-api
cp -r api/* avgigs-api/
cd avgigs-api
git init
git add .
git commit -m "Initial API functions"
```

Push this to a NEW GitHub repo (e.g., `avgigs-api`).

### 3b. Deploy to Vercel
1. Go to https://vercel.com → sign in with GitHub
2. Click **Add New** → **Project**
3. Import the `avgigs-api` repo
4. **Framework Preset:** Other
5. Go to **Settings** → **Environment Variables**
6. Add:
   - `STRIPE_SECRET_KEY` = `sk_test_YOUR_SECRET_KEY`
7. Click **Deploy**

### 3c. Get your function URL
After deploy, Vercel gives you a URL like `https://avgigs-api.vercel.app`.

Your endpoints are:
- `https://avgigs-api.vercel.app/api/create-setup-intent`
- `https://avgigs-api.vercel.app/api/charge-fill`
- `https://avgigs-api.vercel.app/api/get-payment-method`

Paste the base URL into `js/config.js`:
```js
const SERVERLESS_BASE_URL = 'https://avgigs-api.vercel.app';
```

---

## STEP 4: DEPLOY FRONTEND (GitHub Pages)

### 4a. Push to GitHub
```bash
# In your main repo (NOT the api repo)
# Remove the api/ folder from this repo — it's deployed separately
git add .
git commit -m "AVGigs MVP"
git push origin main
```

### 4b. Enable GitHub Pages
1. Go to your repo on GitHub → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Click **Save**
5. Your site will be live at `https://YOUR_USERNAME.github.io/REPO_NAME/`

---

## STEP 5: UPDATE CONFIG

Open `js/config.js` and fill in all four values:

```js
const SUPABASE_URL   = 'https://xyzabc123.supabase.co';      // from Step 1d
const SUPABASE_ANON  = 'eyJhbGciOiJIUzI1NiIs...';            // from Step 1d
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51ABC...';            // from Step 2b
const SERVERLESS_BASE_URL = 'https://avgigs-api.vercel.app';  // from Step 3c
```

Commit and push. Your site is live.

---

## END-TO-END FLOW

Here's exactly what happens at each step:

### 1. Client signs up
- Goes to `auth.html` → fills email, password, name, selects "Client"
- `supabase.auth.signUp()` creates auth user
- Code inserts a row into `profiles` table with `role: 'client'`
- Redirects to `dashboard.html`

### 2. Client posts a job
- On dashboard → "Post New" tab
- Fills in title, category, location, date, rate, description
- `supabase.from('jobs').insert(...)` creates the row
- Job immediately appears on `jobs.html` for freelancers

### 3. Client adds card
- On dashboard → "Payment" tab
- Frontend calls serverless `/api/create-setup-intent`
  - Serverless function creates a Stripe Customer (using secret key)
  - Creates a SetupIntent and returns `client_secret`
- Frontend uses `stripe.confirmCardSetup(client_secret, { payment_method: { card } })`
  - Card details go directly from browser → Stripe. Never touch your server.
- On success, saves `stripe_customer_id` and `has_payment_method: true` to the `profiles` table
- Calls `/api/get-payment-method` to get card brand + last4 for display

### 4. Freelancer applies
- Goes to `jobs.html` → clicks "Apply" on a job
- Fills in message + proposed rate
- `supabase.from('applications').insert(...)` creates the row
- UNIQUE constraint prevents duplicate applications

### 5. Client clicks "Mark Filled"
- On dashboard → clicks "Mark Filled" on a job card
- Frontend checks `has_payment_method` — if no card, redirects to Payment tab
- Confirmation modal appears: "This will charge $25 to your card"

### 6. Stripe charges automatically
- Frontend calls serverless `/api/charge-fill` with `job_id` + `customer_id`
- Serverless function:
  - Retrieves customer's saved payment method from Stripe
  - Creates a PaymentIntent with `off_session: true, confirm: true`
  - Charges $25 immediately
  - Returns success/failure
- On success, frontend updates `jobs.status = 'filled'` in Supabase

### 7. Job closes
- Job status changes to `filled` in the database
- It no longer appears on `jobs.html` (filtered to `status = 'open'`)
- Dashboard shows updated stats

---

## WHY SECRET KEYS NEVER TOUCH THE FRONTEND

- `js/config.js` contains ONLY the Stripe **publishable** key (`pk_test_...`). This key can only create tokens and confirm SetupIntents — it cannot charge cards or read customer data.
- The Stripe **secret** key (`sk_test_...`) lives ONLY in Vercel's environment variables. It's used by the serverless functions to create customers, SetupIntents, and PaymentIntents.
- Card numbers are collected by Stripe Elements (an iframe hosted by Stripe) and sent directly to Stripe's servers. Your frontend and serverless functions never see the card number.

---

## SECURITY NOTES FOR PRODUCTION

Before going live (switching Stripe to live mode):

1. **Lock CORS:** In each `api/*.js` file, replace `'*'` with your actual GitHub Pages domain
2. **Validate on server:** The `charge-fill` function should verify the job belongs to the customer by querying Supabase server-side (add `SUPABASE_SERVICE_ROLE_KEY` to Vercel env vars)
3. **Enable email confirmation** in Supabase Auth settings
4. **Switch Stripe to live mode** and update both keys (publishable in config.js, secret in Vercel env vars)
5. **Add rate limiting** to your serverless functions (Vercel has built-in options)

---

## TESTING CHECKLIST

Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP.

- [ ] Sign up as client → profile created in Supabase
- [ ] Sign up as freelancer (different email) → profile created
- [ ] Client posts a job → appears on jobs page
- [ ] Freelancer applies → application appears in client dashboard
- [ ] Client saves card → Stripe customer created, card on file
- [ ] Client marks job filled → $25 charged in Stripe Dashboard → job status = filled
- [ ] Job disappears from public listings
