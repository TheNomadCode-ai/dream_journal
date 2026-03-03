# Somnia — Production Deployment Runbook (DP-01)

**Infrastructure:** Vercel · Supabase · Resend · Stripe
**Audience:** Solo founder with basic CLI familiarity
**Date:** 2026-03-03

---

## Prerequisites

Install these CLIs before starting:

```bash
# Node.js 20+
node --version

# Supabase CLI
npm install -g supabase
supabase --version

# Vercel CLI
npm install -g vercel
vercel --version
```

---

## 1. Supabase Project Setup

### 1.1 Create Project
1. Go to [app.supabase.com](https://app.supabase.com) → **New project**
2. Choose a region close to your users
3. Set a **strong database password** — save it in your password manager
4. Wait for provisioning (~2 minutes)

### 1.2 Note Connection Strings
Navigate to **Settings → Database** and copy:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (never expose to client)
- **Direct connection string** → `DATABASE_URL` (use for migrations)
- **Project Ref** (in URL: `app.supabase.com/project/YOUR-REF`) → `SUPABASE_PROJECT_REF`

### 1.3 Run Database Migrations

```bash
# Authenticate with Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run all migrations
supabase db push

# Verify migrations applied:
supabase db diff  # Should show no pending changes
```

### 1.4 Configure Auth Providers

**Email/Password + Magic Link (required):**
1. **Authentication → Settings**
2. Enable **Email provider** — ON
3. Enable **Confirm email** — ON (users confirm via email link)
4. Set **Site URL**: `https://yourdomain.com`
5. Add **Redirect URLs**: `https://yourdomain.com/auth/callback`

**Google OAuth (optional):**
1. Create OAuth app at [console.cloud.google.com](https://console.cloud.google.com)
2. **Authentication → Providers → Google**
3. Add Client ID and Secret from Google Console
4. Add callback URL shown by Supabase to your Google OAuth app

### 1.5 Configure Resend for Transactional Email
1. Verify your domain at [resend.com](https://resend.com)
2. **Authentication → SMTP Settings → Custom SMTP**
   - SMTP host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Password: your Resend API key
3. Update **Email Templates** for prettier confirmation emails (optional)

### 1.6 Set Up Storage Bucket (for future attachments)
1. **Storage → New bucket**
2. Name: `dream-attachments`
3. Public: **OFF** (private bucket)
4. Add RLS policies:
```sql
-- Users can upload to their own folder
CREATE POLICY "users upload own attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dream-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own attachments
CREATE POLICY "users read own attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dream-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 2. Vercel Deployment

### 2.1 Connect GitHub Repository
1. Commit all code and push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repository
4. Framework preset: **Next.js** (auto-detected)
5. Root directory: `/` (default)

### 2.2 Configure Environment Variables

In Vercel → **Settings → Environment Variables**, add ALL of the following:

| Variable | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Production, Preview |
| `DATABASE_URL` | Postgres connection string | Production |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Production |
| `AUTH_SECRET` | Run: `openssl rand -base64 32` | All |
| `RESEND_API_KEY` | Your Resend API key | Production, Preview |
| `RESEND_FROM_EMAIL` | `hello@yourdomain.com` | Production |
| `STRIPE_SECRET_KEY` | `sk_live_…` | Production |
| `STRIPE_SECRET_KEY` | `sk_test_…` | Preview |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | Preview |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook setup | Production |
| `STRIPE_PRICE_PRO_MONTHLY` | Your Stripe price ID | Production |
| `STRIPE_PRICE_PRO_ANNUAL` | Your Stripe price ID | Production |
| `STRIPE_PRICE_LIFETIME` | Your Stripe price ID | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | Your Sentry DSN | All |
| `SENTRY_AUTH_TOKEN` | Your Sentry token | All |
| `SENTRY_ORG` | Your Sentry org slug | All |

### 2.3 Build Settings
These should be auto-detected for Next.js:
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`
- **Node.js Version:** 20.x

### 2.4 Domain Configuration
1. **Settings → Domains → Add Domain**
2. Enter `yourdomain.com` and `www.yourdomain.com`
3. Follow DNS instructions to add CNAME/A records at your registrar
4. SSL is provisioned automatically by Vercel

### 2.5 Configure Stripe Webhooks
1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → Webhooks → Add endpoint**
2. URL: `https://yourdomain.com/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
   - `invoice.payment_failed`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in Vercel

---

## 3. Environment Variables Manifest

| Variable | Description | Where to Find |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only bypass key | Supabase → Settings → API |
| `DATABASE_URL` | Postgres direct connection | Supabase → Settings → Database |
| `NEXT_PUBLIC_APP_URL` | Full app URL, no trailing slash | Your domain |
| `AUTH_SECRET` | Random 32-byte secret | `openssl rand -base64 32` |
| `RESEND_API_KEY` | Transactional email key | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender address | Your verified domain |
| `STRIPE_SECRET_KEY` | Stripe server key | Stripe → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client key | Stripe → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signature | Stripe → Webhooks → signing secret |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro monthly price ID | Stripe → Products |
| `STRIPE_PRICE_PRO_ANNUAL` | Pro annual price ID | Stripe → Products |
| `STRIPE_PRICE_LIFETIME` | Lifetime price ID | Stripe → Products |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking DSN | Sentry → Project → Settings → DSN |
| `SENTRY_AUTH_TOKEN` | Sentry CLI auth | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Sentry org slug | Sentry → Settings → General |
| `SUPABASE_ACCESS_TOKEN` | CI/CD migrations | app.supabase.com/account/tokens |
| `SUPABASE_PROJECT_REF` | Project ref (CI/CD) | Supabase project URL |
| `SUPABASE_DB_PASSWORD` | DB password (CI/CD) | Set during project creation |
| `VERCEL_TOKEN` | CI/CD deploy token | vercel.com → Settings → Tokens |
| `SLACK_WEBHOOK_URL` | Deploy notifications | Your Slack workspace |

---

## 4. Post-Deployment Verification Checklist

Run through every item before announcing launch:

- [ ] **1. Auth: Signup works** — create a new account and confirm the email
- [ ] **2. Auth: Magic link works** — request a magic link and click through
- [ ] **3. Auth: Redirect works** — unauthenticated visit to `/dashboard` redirects to `/login`
- [ ] **4. Dream CRUD** — create, edit, and soft-delete a dream entry
- [ ] **5. Full-text search** — log 3 dreams, search for a word that appears in one
- [ ] **6. Tags** — create and remove tags from a dream
- [ ] **7. Stripe checkout** — complete a test checkout (use Stripe test card `4242 4242 4242 4242`)
- [ ] **8. Stripe webhook** — verify plan updates to `pro` after successful checkout in Supabase
- [ ] **9. Data export** — export all dreams as JSON from Settings
- [ ] **10. Sentry** — trigger a test error and confirm it appears in Sentry dashboard

---

## 5. Rollback Procedure

### Vercel Rollback (Instant)
1. **Vercel Dashboard → Deployments**
2. Find the last known-good deployment
3. Click **⋯ → Promote to Production**
4. Rollback is live within ~30 seconds, no downtime

### Supabase Database Rollback
Supabase does not have one-click rollback. Use the down migration files:

```bash
# Roll back the most recent migration (example: rollback 004)
psql "$DATABASE_URL" -f supabase/migrations/004_notebooks_down.sql

# Roll back multiple migrations in reverse order
psql "$DATABASE_URL" -f supabase/migrations/004_notebooks_down.sql
psql "$DATABASE_URL" -f supabase/migrations/003_functions_triggers_down.sql
# etc.
```

**Always take a database snapshot before deploying migrations:**
- Supabase Dashboard → **Database → Backups → Manual backup**

---

*Runbook maintained by: Founder · Last updated: 2026-03-03*
