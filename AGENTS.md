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
- `POST /search`, JSON body — **send only filled fields**:
  `{ "query": "<name>", "city": "...", "phone": "...", "username": "...", "email": "..." }`
- Response: `{ success, input, total_results, results: [{ platform, title, link, snippet?, rank? }], message }`
- Render free tier sleeps: first request can take 20–40s. UI copy already
  warns users; keep long `fetch` timeout / no aggressive abort. Network
  failure message lives in `searchFootprint()` — keep it user-friendly.

## Structure

```text
src/
  app/
    page.tsx      # main page (client component): hero, trust row, form, results, how-it-works, footer
    layout.tsx    # metadata, viewport, Geist fonts
    globals.css   # Tailwind v4 `@import "tailwindcss"`, loading-slide keyframes, .dot-grid
  components/
    SearchForm.tsx  # form fields + validation display + big submit button
    ResultCard.tsx  # platform badge, title, snippet, Open link + copy
    States.tsx      # LoadingState, LoadingSkeleton, EmptyState, NoResults, ErrorState
  lib/
    api.ts  # types, buildSearchPayload, searchFootprint, validateForm, platformStyle, shortHost
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
