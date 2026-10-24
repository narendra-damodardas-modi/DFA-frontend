<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Digital Footprint Finder (frontend)

Mobile-first Next.js frontend for non-technical Indian users to find their
public digital footprint. Premium, trustworthy, extremely simple English UI.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + `lucide-react`
- No shadcn/ui components installed (shadcn-style hand-rolled Tailwind used)
- No test suite. Verify with `npm run build` and `npm run lint`.

## Commands

```powershell
npm run dev    # local dev
npm run build  # must pass before commit (Turbopack)
npm run lint   # must pass before commit (eslint)
```

## Backend API

- Base URL: `https://dfa-9ha3.onrender.com` (override via
  `NEXT_PUBLIC_API_BASE_URL`, see `.env.example`)
- `POST /free-search` (no auth): free Instagram-only preview from all filled
  fields. Always `locked:true` — every result masked (partial title, `link:"locked"`).
- `POST /deep-internet-analysis` (preferred; `/search` legacy), JSON body —
  **send only filled fields + auth**:
  `{ "query": "<name>", "city": "...", "phone": "...", "username": "...", "email": "...", "include_summary": true }`
  with `Authorization: Bearer <token>`. UI brand name is "Deep Internet Analysis".
- Success response adds `locked:false, credits_charged, current_credits, required_credits`.
  HTTP 402 = paywall (`detail = {locked:true, message, input, total_results, results (first 2 visible, rest masked + link:"locked"), agent_summary:null, required_credits, current_credits}`).
  HTTP 401 = redirect to `/login`.
- Credits (1 credit = ₹1): signup bonus 0 (no free credits) · report 20 ·
  AI mode +10 (search w/ summary 30) · re-summarize 10.
  Funnel: dashboard works logged-out — form submit runs the FREE Instagram
  preview (`freeSearchFootprint`), then "Unlock full report (₹20)" runs the
  paid search. Guests clicking unlock get `dfa_pending_unlock`
  (sessionStorage, `{values, includeSummary}`) saved → /login → auto-runs the
  paid search on the dashboard after auth. `GET /api/credits/balance → {credits}` (auth). Razorpay Standard Checkout:
  `POST /api/create-order {credits} → {order_id, amount, currency, credits, key_id}` (public key only, never KEY_SECRET),
  `POST /api/verify-payment {razorpay_order_id, razorpay_payment_id, razorpay_signature} → {credits_added, balance}`.
  Checkout script lives in `app/layout.tsx`; modal in `components/BuyCreditsModal.tsx`.
- Render free tier sleeps: first request can take 20–40s. UI copy already
  warns users; keep long `fetch` timeout / no aggressive abort. Network
  failure message lives in `searchFootprint()` — keep it user-friendly.

## Structure

```text
src/
  app/
    page.tsx      # landing (marketing, CTAs → /dashboard free search)
    dashboard/page.tsx  # search page: free preview (no login) + unlock flow + results
    layout.tsx    # metadata, viewport, Geist fonts, Razorpay checkout script
    globals.css   # Tailwind v4 `@import "tailwindcss"`, loading-slide keyframes, .dot-grid
  components/
    SearchForm.tsx  # form fields + validation display + big submit button (free search CTA, unlock-cost line)
    ResultCard.tsx  # platform badge, title, snippet, Open link + copy (+ locked blur mode)
    States.tsx      # LoadingState (free/full variants), LoadingSkeleton, EmptyState, NoResults, ErrorState
    BuyCreditsModal.tsx  # Razorpay Standard Checkout modal (input 1–100000, default 20)
    PaywallBanner.tsx    # 3 states: guest login CTA / unlock now / buy credits
    SummaryCard.tsx   # AI summary render
  lib/
    api.ts  # types, buildSearchPayload, freeSearchFootprint (free preview), searchFootprint, validateForm, platformStyle, shortHost, PaywallError/UnauthorizedError, REPORT_COST/AI_COST
    auth.ts  # AuthUser (incl. credits), token storage, signup/login/me
    payments.ts  # getCreditsBalance, createOrder, verifyPayment, Razorpay types
```

## Conventions

- `page.tsx` is `"use client"` with `idle | loading | done | error` status
  state and `AbortController` per search; keep that pattern.
- Form mapping: `name → query`, strip `@` from username, strip spaces/dashes
  from phone. Never send empty strings.
- Validation (`validateForm`): at least one field required; email regex;
  phone digits 10–11 after stripping non-digits and leading `91`. Keep error
  copy in plain, kind English.
- Platform badge colours in `platformStyle()` — extend there, not inline.
- UI language: simple English for non-tech users + footer must stay
  `Public data only • Built for India`. No private-data claims (tool only
  shows already-public data).
- Tailwind v4 (no config file): arbitrary values OK; `border-slate-150` is
  NOT a valid class — use standard palette.
- `next.config.ts` is intentionally minimal for zero-config Vercel deploy.

## Gotchas

- `create-next-app` repo was renamed to `digital-footprint-finder`;
  branch is `master` (not `main`).
- `.gitignore` ignores `.env*` except `!.env.example` — keep that exception.
- Node v22.12 shows EBADENGINE warnings for eslint deps; harmless, ignore.
