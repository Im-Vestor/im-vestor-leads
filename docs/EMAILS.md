# Notifications and transactional email

Every meaningful event has **one** entry point in `src/lib/notify.ts`. It writes
the in-app notification behind the header bell and sends the email, so a call
site never has to remember both:

```ts
notifyLeadUnlocked({ projectId, investorId: user.id }); // returns void, adds no latency
```

Sign-in, sign-up and verification emails are **not** here — Clerk owns those.

Email provider: [Resend](https://resend.com). Templates are plain TypeScript
that return `{ subject, html, text }`, so there is no extra render dependency.

## Setup

```bash
RESEND_API_KEY=re_...                        # from resend.com/api-keys
EMAIL_FROM="IM-VESTOR <hello@im-vestor.com>" # domain must be verified in Resend
EMAIL_REPLY_TO=support@im-vestor.com         # optional
NEXT_PUBLIC_APP_URL=https://app.im-vestor.com
```

`NEXT_PUBLIC_APP_URL` is required in production: emails cannot use relative
URLs, so every link and the logo are built from it.

**Without `RESEND_API_KEY` nothing is sent.** Each send is logged to the console
instead, which keeps local development quiet and safe.

## Preview

With the dev server running:

- `/api/dev/emails` — gallery of every template
- `/api/dev/emails?template=welcome` — render one
- `/api/dev/emails?template=welcome&format=text` — the plain-text part

The route 404s in production. Sample payloads live in `src/lib/email/preview.ts`.

## What fires, and when

Bell = an in-app notification row. Email = an inbox message. Most events do
both; chat is the exception, because the bell is instant and the email is only
a fallback for people who are not looking.

| Step | Bell | Email | Sent to | Trigger |
| --- | :-: | :-: | --- | --- |
| Sign-up completed | ✔ | `welcome` | new member | `completeSignup` |
| Sign-up used a referral code | ✔ | `referral-joined` | the referrer | `completeSignup` |
| Project switched to PUBLISHED | ✔ | `project-published` | entrepreneur | `setProjectStatus` |
| Investor spends a lead credit | ✔ | `lead-unlocked-founder` | entrepreneur | `unlockProject` |
| Investor spends a lead credit | ✔ | `lead-unlocked-investor` | investor | `unlockProject` |
| Hyper Train ticket applied | ✔ | `hypertrain-activated` | buyer | `applyHypertrainTo*` |
| Poke sent | ✔ | `poke-received` | receiver | `sendPoke` |
| Poke accepted | ✔ | `poke-accepted` | sender | `respondToPoke` |
| Poke declined | ✔ | `poke-rejected` | sender | `respondToPoke` |
| Any message | ✔ | only if offline | recipient | `sendMessage` |
| Message to the support user | ✔ | `support-request` | support inbox | `sendMessage` |
| Support answers a thread | ✔ | `support-reply` | member | `replyAsSupport` |
| One-off checkout paid | ✔ | `purchase-receipt` | buyer | `fulfillPaidCheckoutSession` |
| Membership checkout paid | ✔ | `subscription-started` | buyer | `fulfillPaidCheckoutSession` |
| Poke plan renewed | ✔ | `subscription-renewed` | subscriber | `invoice.paid` webhook |
| Membership cancelled | ✔ | `subscription-cancelled` | member | `customer.subscription.deleted` |
| Card declined | ✔ | `payment-failed` | member | `invoice.payment_failed` webhook |

## The bell

`NotificationBell` sits in the header on every screen size. The badge counts
unread rows and updates live: `useNotifications` refetches whenever Supabase
Realtime reports an INSERT on `notifications` for that user. Clicking a row
marks it read optimistically and navigates to its `link`.

A notification row stores **no prose**. `type` picks the title and icon, and the
title is translated client-side through the normal `useTranslation` hook —
`message` holds only the dynamic part (sender name, project name, preview). That
keeps the feed correct in all six languages without storing copy in the
database. Adding a type therefore means: the enum + a migration, an icon and a
`notif*` translation key in each locale file, and the `createNotification` call.

Chat rows are written by `sendMessage` and `replyAsSupport` inside their
existing transactions, so a message and its notification always land together.
Poke rows work the same way, written by `sendPoke` and `respondToPoke`. Every
other row is written by `src/lib/notify.ts`.

**Pokes are the one row you can act on without leaving the bell.** A
`POKE_RECEIVED` row carries a `pokeId`, and while that poke is still `PENDING`
the row renders Accept / Decline instead of a link — accepting opens the
conversation and takes you to it, declining returns the poke to the sender.
Answering marks the row read in the same transaction, so the badge clears with
the decision. Once answered, the row shows how it ended and stops offering
buttons.

## Rules that keep the volume sane

**Chat emails only reach people who are away.** `notifyNewMessage` resolves
presence with the same `resolvePresence` the UI uses; if the recipient is
`online` or `away` (tab open), no email is sent — they can already see it.

**Bursts collapse into one email.** If the recipient already has an unread
message from the same sender inside the last 30 minutes, they were emailed for
that burst and are skipped. Change the window with
`MESSAGE_EMAIL_THROTTLE_MS` in `src/lib/email/notify.ts`.

**Welcome is sent exactly once.** The claim is an atomic
`UPDATE users SET "welcomeEmailSentAt" = now() WHERE id = ? AND "welcomeEmailSentAt" IS NULL`,
so concurrent sign-up calls cannot double-send.

**Purchases inherit Stripe idempotency.** Receipts fire from
`fulfillPaidCheckoutSession`, which is already guarded by the
`ProcessedStripeEvent` row, so a replayed webhook does not re-send.

## How sending works

`sendEmail()` never throws and never rejects. A Resend outage must not fail a
checkout, a chat message or a webhook — it logs and returns `false`.

`deliver()` wraps the work in Next's `after()`, so the data loading and the API
call run **after the response is flushed**. Callers stay synchronous:

```ts
notifyLeadUnlocked({ projectId, investorId: user.id }); // returns void, adds no latency
```

## Layout

```
src/lib/
  notify.ts       one function per event — writes the bell row, sends the email
  notifications.ts  createNotification() (never throws)
  email/
    config.ts     Resend client, from/reply-to, absolute URLs
    theme.ts      hex mirror of globals.css (mail clients cannot parse oklch)
    render.ts     buildEmail() + blocks — each renders HTML and text at once
    send.ts       sendEmail() (never throws), deliver() (runs after the response)
    preview.ts    sample payloads for /api/dev/emails
    templates/    account · projects · messages · billing

src/components/notifications/notification-bell.tsx  bell, badge, popover
src/hooks/use-notifications.ts                      feed + live unread count
src/app/messages/notifications.actions.ts           list / mark read
```

## Adding an event

1. Write the template in the matching `email/templates/*.ts` file using the
   blocks from `render.ts` (`p`, `panel`, `metric`, `quote`, `bullets`, `note`).
   Wrap every user-supplied value in `esc()`.
2. Add the type to the `NotificationType` enum plus a migration, an icon in
   `notification-bell.tsx`, and a `notif*` key in all six locale files.
3. Add a `notify*` function in `src/lib/notify.ts` that loads its data, calls
   `createNotification(...)` and `sendEmail({ to, tag, ...template(...) })`,
   all inside one `deliver(...)`.
4. Add a sample to `email/preview.ts` and check it at `/api/dev/emails`.
5. Call the `notify*` function from the action or webhook for that step.

## Known gaps

- **Copy is English only.** The UI ships six languages; email copy does not
  follow the user's language because the account has no stored locale and
  webhooks have no request cookie. Adding it means a `locale` column on `User`
  plus translated copy per template.
- **No unsubscribe / preference centre.** Every email here is transactional, so
  none is legally required, but a "mute chat notifications" toggle is the
  obvious next step.
- **The bell feed is capped at 20 rows and never prunes.** There is no "see all"
  page and no retention job, so `notifications` grows forever.
- **Hyper Train expiry is not emailed.** There is no scheduled job in the app;
  a cron hitting a route would be needed to warn before a boost ends.
