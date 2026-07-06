# IM-VESTOR

Leads marketplace that connects **entrepreneurs** and **investors**. Members
browse and unlock leads, send introduction *pokes*, chat in real time, and pay
for credits and memberships through Stripe.

## What the platform does

- **Leads marketplace** — entrepreneurs and investors discover each other from a
  shared dashboard. Investor profiles carry an investment capacity and sectors
  of interest; entrepreneur profiles surface their venture.
- **Real-time messaging** — conversations, unread counts and notifications sync
  live over Supabase Realtime.
- **Shop & wallet** — three things are purchasable through Stripe Checkout:
  - **Pokes** — introduction currency used to reach another member.
  - **Lead credits** — each one unlocks a lead's full profile, media and chat.
  - **Memberships** — monthly / annual subscriptions for full marketplace access.
  - Balances and subscription state live on the user's profile; billing
    (card, invoices, cancellation) is handled by the Stripe billing portal.
- **Referrals** — every user gets a referral code and can credit a referrer at
  sign-up.

## Tech stack

| Concern        | Choice                                                   |
| -------------- | -------------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Turbopack) + React               |
| Auth           | Clerk (custom sign-in / sign-up flows)                   |
| Database       | PostgreSQL via Prisma 7 (`@prisma/adapter-pg`)           |
| Realtime       | Supabase Realtime (messaging, notifications)             |
| Payments       | Stripe (Checkout + webhooks + billing portal)            |
| Data fetching  | TanStack Query                                           |
| UI             | Tailwind v4, shadcn / Base UI, `next-themes`             |
| Tooling        | Biome (lint + format), Bun                               |

> **Note:** this app pins a Next.js build with breaking changes from upstream.
> See `AGENTS.md` — read the relevant guide under `node_modules/next/dist/docs/`
> before changing framework-level code.

## Getting started

Prerequisites: [Bun](https://bun.sh), a PostgreSQL database, and Clerk, Supabase
and Stripe projects.

```bash
bun install                       # installs deps; postinstall runs `prisma generate`
cp .env.example .env              # then fill in the values (see below)
bunx prisma migrate dev           # apply the schema to your database
bun dev                           # http://localhost:3000
```

## Environment variables

Copy `.env.example` and fill these in:

- **Clerk** — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
- **Database** — `DATABASE_URL` (pooled), `DIRECT_URL` (direct, for migrations).
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Stripe** — `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`, and one price id per product
  (`STRIPE_PRICE_SUBSCRIPTION_MONTHLY/ANNUAL`, `STRIPE_PRICE_POKE_PACK_3/5/10`,
  `STRIPE_PRICE_LEAD_CREDIT`).

The shop boots without Stripe keys — products just show as "Coming soon" until
the matching price ids are set. Full setup walkthrough: [`docs/STRIPE_SHOP_SETUP.md`](docs/STRIPE_SHOP_SETUP.md).

## Scripts

| Command          | Does                                              |
| ---------------- | ------------------------------------------------- |
| `bun dev`        | Start the dev server                              |
| `bun run build`  | Production build                                  |
| `bun start`      | Serve the production build                        |
| `bun run lint`   | Biome lint                                        |
| `bun run format` | Biome format (writes)                             |
| `bun run check`  | Biome check + fix (writes)                        |

## Project layout

```
src/
  app/            App Router routes (dashboard, profile, shop, messages, sign-in/up)
    api/stripe/   Stripe webhook (grants pokes/credits, syncs subscriptions)
  components/     UI and feature components (shadcn/Base UI in components/ui)
  hooks/          Supabase Realtime hooks (messages, conversations, notifications)
  lib/            Domain logic — stripe catalog, prisma client, user helpers, supabase
prisma/           Prisma schema and migrations
docs/             Operational docs (Stripe shop setup)
```

TEST TEST
