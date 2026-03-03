# DreamLog

> A privacy-first dream journal. Log, search, and discover patterns in your dreams — built for the 60-second window after waking.

---

## Overview

DreamLog is a full-stack web application built with Next.js 14 (App Router) and Supabase. Users log dreams in a distraction-free editor, organise entries with tags and notebooks, search their full archive using Postgres full-text search, and discover recurring patterns over time.

**Design language:** Nocturnal Luxury — deep navy/slate backgrounds, Cormorant Italic display type, Josefin Sans UI labels, and gold (`#C9A84C`) accents on a grain-textured dark canvas.

**Core principles:**
- Privacy first — no ads, no data resale, full export at any time
- Speed of capture — optimised for the 60-second window after waking
- Calm, distraction-free interface — dark mode by default

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + custom design system |
| Rich text | Tiptap 2 |
| Database | Supabase (Postgres + Auth + Storage) |
| Email | Resend |
| Payments | Stripe |
| Error tracking | Sentry |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |

---

## Folder Structure

```
dream_journal/
├── app/                              # Next.js App Router
│   ├── (auth)/                       # Unauthenticated pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/                  # Authenticated pages
│   │   ├── dashboard/page.tsx        # Dream feed
│   │   ├── dreams/
│   │   │   ├── [id]/page.tsx         # Dream detail view
│   │   │   └── new/page.tsx          # Dream editor with auto-save
│   │   ├── search/page.tsx
│   │   ├── notebooks/page.tsx
│   │   ├── insights/page.tsx         # AI pattern analysis (Pro)
│   │   ├── settings/page.tsx
│   │   └── layout.tsx                # Sidebar layout
│   ├── api/                          # Route Handlers
│   │   ├── dreams/route.ts           # GET list + POST create
│   │   ├── dreams/[id]/route.ts      # GET + PATCH + DELETE
│   │   ├── dreams/search/route.ts    # Full-text search
│   │   ├── notebooks/route.ts
│   │   ├── tags/route.ts
│   │   └── stripe/
│   │       ├── checkout/route.ts
│   │       └── webhook/route.ts
│   ├── auth/callback/route.ts        # OAuth / magic-link callback
│   ├── layout.tsx                    # Root layout
│   └── page.tsx                      # Landing page
│
├── components/
│   ├── ScrollReveal.tsx              # IntersectionObserver scroll animations
│   ├── ErrorBoundary.tsx
│   └── ui/                           # shadcn/ui primitives
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client
│   │   └── middleware.ts             # Middleware session refresh
│   ├── validations/
│   │   ├── dreams.ts                 # Zod schemas
│   │   └── auth.ts
│   ├── logger.ts
│   └── utils.ts
│
├── hooks/
│   ├── useUser.ts
│   ├── useDreams.ts
│   └── useDebounce.ts
│
├── types/
│   ├── database.ts                   # Generated Supabase Database interface
│   ├── dream.ts
│   ├── notebook.ts
│   └── user.ts
│
├── styles/
│   └── globals.css                   # Design system, keyframes, component classes
│
├── supabase/
│   ├── migrations/                   # Applied SQL migrations (up only)
│   │   ├── 001_core_tables.sql
│   │   ├── 002_rls_policies.sql
│   │   ├── 003_functions_triggers.sql
│   │   └── 004_notebooks.sql
│   ├── rollbacks/                    # Rollback scripts (run manually if needed)
│   │   ├── 001_core_tables_down.sql
│   │   ├── 002_rls_policies_down.sql
│   │   ├── 003_functions_triggers_down.sql
│   │   └── 004_notebooks_down.sql
│   └── config.toml
│
├── scripts/
│   └── screenshot.js                 # Playwright screenshot capture (dev util)
│
├── docs/
│   ├── MARKET_RESEARCH.md
│   ├── PERSONAS.md
│   ├── PRICING.md
│   ├── GTM_PLAN.md
│   ├── UI_SPEC.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + typecheck + test + build
│       ├── deploy-preview.yml        # Vercel PR preview
│       └── deploy-production.yml     # Vercel prod + Supabase migrations
│
├── middleware.ts                     # Route protection
├── instrumentation.ts                # Sentry App Router init
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Local Setup

### Prerequisites

- Node.js 20+
- npm or pnpm
- [Supabase CLI](https://supabase.com/docs/guides/cli) — `npm i -g supabase`
- A Supabase project ([create one free](https://supabase.com))

### Steps

**1. Clone and install**
```bash
git clone https://github.com/TheNomadCode-ai/dream_journal.git
cd dream_journal
npm install
```

**2. Configure environment**
```bash
cp .env.example .env.local
# Fill in your Supabase credentials and other keys
```

**3. Run database migrations**
```bash
# Against your remote Supabase project
supabase db push --db-url "postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres"
```

**4. Start the development server**
```bash
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✓ | Supabase service role key (server only) |
| `DATABASE_URL` | ✓ | Postgres direct connection string |
| `NEXT_PUBLIC_APP_URL` | ✓ | Full app URL, no trailing slash |
| `AUTH_SECRET` | ✓ | Random secret for auth |
| `RESEND_API_KEY` | prod | Resend email API key |
| `RESEND_FROM_EMAIL` | prod | Verified sender email |
| `STRIPE_SECRET_KEY` | prod | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | prod | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | prod | Stripe webhook signing secret |
| `NEXT_PUBLIC_SENTRY_DSN` | prod | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | prod | Sentry auth token for source maps |

Copy `.env.example` to `.env.local` — never commit `.env.local`.

---

## Database

Four migrations are applied in order:

| Migration | Contents |
|---|---|
| `001_core_tables` | `user_profiles`, `dreams` (with `tsvector` search column), `tags`, `dream_tags` |
| `002_rls_policies` | Row Level Security enabled, user-scoped policies on all tables |
| `003_functions_triggers` | `set_updated_at()`, `search_dreams()` RPC, `handle_new_user()` trigger |
| `004_notebooks` | `notebooks`, `dream_notebooks`, RLS policies |

Rollback scripts live in `supabase/rollbacks/` — run them manually if needed. Do not place them in `supabase/migrations/` or the Supabase CLI will treat them as forward migrations.

---

## Deployment

See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) for the full production runbook.

Quick summary:
1. Push this repo to GitHub
2. Connect to [Vercel](https://vercel.com) and set all production environment variables
3. Run Supabase migrations against the production database
4. Configure Stripe webhooks → `https://yourdomain.com/api/stripe/webhook`
5. Add your production URL to Supabase Auth → Redirect URLs

---

## CI/CD

Three GitHub Actions workflows:

| Workflow | Trigger | Actions |
|---|---|---|
| `ci.yml` | Every push / PR | Lint, typecheck, Vitest, build |
| `deploy-preview.yml` | Pull request | Vercel preview deploy + PR comment |
| `deploy-production.yml` | Push to `main` | Supabase migrations + Vercel production |

Required GitHub Actions secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_ID`.

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run coverage
```

---

## Design System

| Token | Value | Usage |
|---|---|---|
| `background` | `#0A0B12` | Page background |
| `surface` | `#12141F` | Cards, sidebar |
| `border` | `#1E2235` | Dividers, input borders |
| `gold` | `#C9A84C` | CTAs, active states, accents |
| `lavender` | `#7B6EAB` | Tags, secondary accents |
| `text-primary` | `#E8E4D9` | Headings, body copy |
| `text-muted` | `#6B6F85` | Labels, timestamps |

Fonts: **Cormorant** (display/italic headings) · **Crimson Pro** (body) · **Josefin Sans** (UI labels, uppercase)

---

*Built with Next.js, Supabase, Tailwind CSS, and Tiptap. Deployed on Vercel.*
