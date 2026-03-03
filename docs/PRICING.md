# Somnia — Pricing Strategy (SP-03)

---

## 1. Three-Tier Pricing Table

| Feature | Free | Pro ($8/mo · $64/yr) | Lifetime ($149 one-time) |
|---|:---:|:---:|:---:|
| Dream entries | Up to 30 | Unlimited | Unlimited |
| Full-text search | — | ✓ | ✓ |
| AI pattern analysis | — | ✓ | ✓ |
| Custom tags | 3 | Unlimited | Unlimited |
| Rich text editor (Tiptap) | ✓ | ✓ | ✓ |
| Notebooks / collections | — | ✓ | ✓ |
| Mood tracking & charts | Basic (7-day) | Full history | Full history |
| Data export (JSON/Markdown) | — | ✓ | ✓ |
| Dark/light theme | Dark only | ✓ | ✓ |
| Custom font for entries | — | ✓ | ✓ |
| Priority support | — | ✓ | ✓ |
| Future features | — | Auto-included | Auto-included |

---

## 2. Price Point Justification

### Free Tier
The 30-entry limit is the key gate. New users can capture ~1 month of daily dreams before hitting the wall. This is intentional: by day 30, users have enough data to *want* pattern analysis — which is Pro-only. The limit is soft (no data deletion), just a soft write block with an upgrade prompt.

### Pro: $8/month · $64/year (33% annual discount)
- Benchmarked against Reflectly ($9.99/mo), Day One ($34.99/yr), and Journey ($4.99/mo)
- $8/mo sits below the "impulse regret threshold" for journaling apps (~$10)
- Annual at $64 = $5.33/mo effective, which matches or beats competitors and rewards commitment
- Targeting Maya and similar users (tech-comfortable, WTP $8–12/mo confirmed in persona research)

### Lifetime: $149
- Targets Daniel persona (teacher, prefers one-time payment, WTP $40–60 — but $149 is achievable if trust is established through trial)
- Offered only after user has been Pro for 30+ days OR on the anniversary of signup (avoids devaluing Pro before trust is built)
- Generates upfront cash for solo founder; limits to first 500 buyers to create scarcity ("Founding Member" badge)
- $149 = ~18.6 months of Pro at $8/mo — breaks even after ~19 months, acceptable LTV trade-off

---

## 3. Paywall Trigger Strategy

### Primary Trigger: Entry #31
When the user attempts to create their 31st dream entry, show the upgrade modal. This is the highest-intent moment:
- The user has established a habit (30+ entries)
- They clearly value the product enough to keep using it
- They are mid-action, which creates completion motivation

**Modal framing:** "You've recorded 30 dreams. Upgrade to Pro to keep going — and finally see the patterns."

### Secondary Triggers
| Trigger | Prompt Copy |
|---|---|
| User clicks Search with 10+ entries | "Search across all your dreams — Pro feature. Start free trial." |
| User clicks AI Insights tab | "Uncover recurring symbols and emotion trends — upgrade to Pro." |
| User tries to add 4th tag | "Unlimited tags with Pro. You've used 3 of 3." |
| 30-day anniversary email | "You've been dreaming with Somnia for a month. See what the AI found." |

**Rule:** Never show more than one paywall prompt per session. Never show one within the first 3 entries.

---

## 4. Annual vs. Monthly Discount

**Recommendation: 33% annual discount ($8/mo → $64/yr)**

- 33% is the sweet spot: large enough to feel meaningful, small enough to not undermine monthly pricing
- Surface the annual option *first* on the pricing page (default selection)
- Display as "$5.33/month, billed annually" — unit economics framing increases conversion
- Offer a 7-day free trial on Pro (no credit card) to reduce Sara-type hesitation
- After trial: default to annual checkout, with monthly as "pay more" option

---

## 5. Churn-Reduction Tactics (First 90 Days)

### Days 1–7: Activation
- **Welcome sequence (3 emails):** Day 1 (getting started), Day 3 (how AI analysis works), Day 7 (your first week of patterns)
- **In-app checklist:** "Log your first dream → Add a tag → Check your mood chart" — dopamine loop

### Days 8–30: Habit Formation
- **Streak counter** visible on dashboard (non-pushy, no notifications unless opted in)
- **Weekly Digest email:** "Last week you dreamed about [top theme] 3 times." Personalised = high open rate
- **Milestone badge:** "10 dreams logged" — shareable (optional) to Twitter/X

### Days 31–90: Value Deepening
- **Monthly AI Report:** Auto-generated PDF summary of the month's patterns. Makes cancelling feel like losing something real.
- **Notebook prompt:** "Try organising your dreams by theme" — Pro feature education
- **Cancellation survey + pause option:** "Pause for 1 month at no charge" available before full cancellation. Reduces reflex churn by ~20–30% (industry benchmark).

---

*Pricing last reviewed: 2026-03-03. Re-evaluate quarterly against App Store competitive pricing.*
