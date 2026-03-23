# AI Personal Assistant — Setup & Deploy Guide
# 100% FREE hosting (Vercel + Render + Supabase)

---

## Step 1: Create All Accounts (all free)

| Service | Sign up at | What you get |
|---------|-----------|-------------|
| GitHub | github.com | Free code hosting |
| Supabase | supabase.com | Free database + auth |
| Render | render.com | Free backend hosting |
| Vercel | vercel.com | Free frontend hosting |
| Anthropic | console.anthropic.com | Claude AI API key |
| Stripe | dashboard.stripe.com | Payments (free, takes 2.9% per sale) |
| OpenAI | platform.openai.com | Whisper voice transcription |
| ElevenLabs | elevenlabs.io | Text-to-speech voice |
| Serper | serper.dev | Web search for the AI |

---

## Step 2: Set Up Supabase Database

1. Go to supabase.com → Create new project
2. Wait for it to start (1-2 minutes)
3. Click **SQL Editor** in left sidebar
4. Copy the entire contents of `database/schema.sql`
5. Paste it and click **Run**
6. Go to **Settings → API** → copy these 3 values:
   - Project URL (like `https://abc123.supabase.co`)
   - `anon` key (long text starting with `eyJ`)
   - `service_role` key (another long text starting with `eyJ`)
7. Go to **Authentication → URL Configuration**:
   - Site URL: `https://your-app.vercel.app` (fill in after Step 6)
   - Redirect URLs: `https://your-app.vercel.app/**`

---

## Step 3: Set Up Stripe (Payments)

1. Go to dashboard.stripe.com → Create account
2. Go to **Products** → **Add Product** → create 3 products:
   - Name: "Plus", Price: $9.00/month recurring → copy Price ID (`price_...`)
   - Name: "Pro", Price: $29.00/month recurring → copy Price ID
   - Name: "Premium", Price: $79.00/month recurring → copy Price ID
3. Go to **Developers → API Keys** → copy **Secret key** (`sk_test_...`)
4. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://your-backend.onrender.com/billing/webhook` (fill in after Step 5)
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy **Signing secret** (`whsec_...`)

---

## Step 4: Push Code to GitHub

Open a terminal in `d:/start up/ai for everything`:

```bash
git init
git add .
git commit -m "Initial commit"
```

Go to github.com → New Repository → name it `ai-assistant` → copy the URL, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-assistant.git
git push -u origin main
```

---

## Step 5: Deploy Backend to Render (Free)

1. Go to render.com → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your `ai-assistant` GitHub repo
4. Settings:
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance type**: Free
5. Click **Environment** → Add all these variables:

```
ANTHROPIC_API_KEY         = sk-ant-...
SUPABASE_URL              = https://abc123.supabase.co
SUPABASE_ANON_KEY         = eyJ...
SUPABASE_SERVICE_KEY      = eyJ...
STRIPE_SECRET_KEY         = sk_test_...
STRIPE_WEBHOOK_SECRET     = whsec_...
STRIPE_PLUS_PRICE_ID      = price_...
STRIPE_PRO_PRICE_ID       = price_...
STRIPE_PREMIUM_PRICE_ID   = price_...
OPENAI_API_KEY            = sk-...
ELEVENLABS_API_KEY        = ...
SERPER_API_KEY            = ...
FRONTEND_URL              = https://your-app.vercel.app
DEBUG                     = false
```

6. Click **Create Web Service** → wait 2-3 minutes
7. Your backend URL: `https://ai-assistant.onrender.com`
8. Test: visit `https://ai-assistant.onrender.com/health` → shows `{"status":"ok"}`

---

## Step 6: Deploy Frontend to Vercel (Free)

1. Go to vercel.com → Sign up with GitHub
2. Click **New Project** → import `ai-assistant` repo
3. Settings:
   - **Root directory**: `frontend`
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add **Environment Variables**:

```
VITE_API_URL           = https://ai-assistant.onrender.com
VITE_SUPABASE_URL      = https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY = eyJ...
```

5. Click **Deploy** → wait 1-2 minutes
6. Your app is live at: `https://ai-assistant.vercel.app`

After this, go back and update:
- Supabase → Auth → Site URL → set to your Vercel URL
- Render → `FRONTEND_URL` env var → set to your Vercel URL → redeploy
- Stripe → Webhooks → update URL to `https://ai-assistant.onrender.com/billing/webhook`

---

## Step 7: Test Everything

1. Visit `https://ai-assistant.vercel.app` → Landing page shows
2. Click **Get Started Free** → create account
3. Chat with AI → it responds
4. Go to `/billing` → click **Upgrade to Plus**
5. Stripe Checkout opens → test card: `4242 4242 4242 4242`, any future date, any CVC
6. Return to app → Plus badge shows, voice unlocks

---

## Step 8: Build Desktop App (.exe) — Optional

```bash
cd "d:/start up/ai for everything/frontend"
npm install
npm run electron:build
# Output: dist-electron/AI Assistant Setup.exe
```

Upload .exe to GitHub Releases → update the download URL in [Download.jsx](frontend/src/pages/Download.jsx).

---

## How Customers Buy (Flow)

```
1. Visit your Vercel URL → see Landing page
2. Click "Try Free" → sign up (no card)
3. Chat 10 times free
4. Hit limit → "Upgrade" button appears
5. Stripe Checkout → enters credit card
6. Stripe charges them $9/29/79 per month
7. Webhook fires → their tier updates instantly
8. Features unlock in the app
```

---

## Get First Users (Free Marketing)

1. **Reddit** — r/productivity, r/ChatGPT, r/Windows, r/artificial
2. **Twitter/X** — screen recording demo GIF
3. **Product Hunt** — launch Tuesday, ask friends to upvote
4. **YouTube** — 3-minute demo video
5. **HackerNews** — "Show HN: I built a better Siri for Windows"
