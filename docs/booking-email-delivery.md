# Booking email rollout

## Safety / current state

Keep `EMAIL_NOTIFICATIONS_ENABLED=false` and `EMAIL_REMINDERS_ENABLED=false`
until the migration, deployment, scheduler and controlled mailbox test pass.
Supabase Auth password-recovery SMTP is independent and stays working.
No migration installs paid services, changes billing, sends email, or backfills
old pilot bookings. Never reuse the API key previously exposed in a screenshot.

## Implementation

- Apply `supabase/migrations/20261015210000_reliable_booking_emails.sql` before
  publishing this code. It adds fields and service-only queue claiming; existing
  customer/appointment records and owner RLS remain in place. Legacy pending/
  failed messages are retained but marked skipped, not replayed.
- Each NEW booking stores its BG/EN language and explicit sending/reminder opt-in
  from the server's configuration. Its queue intents commit in the same database
  transaction. Manual owner bookings use the same path.
- Confirmation and owner alerts are attempted immediately. The scheduler retries
  transient failures and delivers due reminders and customer cancellation/change
  notices for edits made directly in the owner calendar. Owner alerts use Business contact
  email, not the Auth login address. Owners can disable email and choose their
  own notification language in Settings → Business.
- Reminder target is 24h before, only when the booking/new time was saved more
  than 24h ahead. A five-minute runner gives approximate timing, not an SLA.
  Bookings less than 24h ahead get a confirmation/change email, not an extra
  immediate reminder.
- Moving/cancelling/completing a booking invalidates pending, failed AND claimed
  old revisions. Delivery checks current tenant, recipient, revision, status,
  business availability and time immediately before provider submission. A mail
  already accepted by the provider cannot be recalled; changes can race an
  already-started network request.
- Atomic `FOR UPDATE SKIP LOCKED` claims have five-minute leases. Every attempt
  increments its count, including network failures. Maximum three attempts.
  Freeze exact HTML/text/sender payload before submission and use a Resend
  `Idempotency-Key` per queue row. Stop ambiguous retries after 23h, before
  Resend's 24h deduplication window expires. Stale non-reminder events expire
  after six hours. A sent record means provider ACCEPTED, not inbox Delivered.
- No raw provider response, contact data, API key or private link is logged.
  Outbox rows/payloads are private owner-readable data and included in existing
  customer erasure and business-account deletion flows. Exception: review-request
  rows are service-only even for the business owner, because their payload
  contains a one-use client review credential. See `business-reviews.md`.

- Completed-visit review invitations add one optional customer message per
  completed booking. They share the provider quota with booking and Auth mail.
  They use the same worker/scheduler, but only after the reviews migration.

## Production settings

Vercel Production (never NEXT_PUBLIC for credentials):

| Key | Type | Value |
| --- | --- | --- |
| RESEND_API_KEY | Secret | private domain-restricted Sending access key |
| EMAIL_FROM | Config | `GoRez <info@gorez.co>` |
| NEXT_PUBLIC_APP_URL | Config | `https://www.gorez.co` |
| EMAIL_NOTIFICATIONS_ENABLED | Config | `false`, then explicitly approved `true` |
| EMAIL_REMINDERS_ENABLED | Config | `false`, then `true` ONLY after scheduler test |
| CRON_SECRET | Secret | privately generated random value, >=32 characters |

Redeploy after changes. Resend domain must be Verified. Disable link/open tracking
for transactional booking mail in the domain settings: private management links
should not be rewritten, and tracking pixels are unnecessary.

Each owner's Settings → Business contact email must be correct, and the email
preference enabled. Old bookings saved while sending was off remain silent;
there is deliberately no automatic bulk backfill.

## Five-minute scheduler without upgrading Vercel

Use the EXISTING Supabase project's Cron + pg_net and Vault, subject to its
normal usage allowances. No new third-party scheduler account is required.
This is an explicit operator setup step, not an automatic schema side effect.

1. Privately generate a random secret. Enter it yourself into Vercel Production
   `CRON_SECRET` (Secret). Do not share it in chat or screenshots.
2. In Supabase Vault, create secret name `gorez_booking_cron_secret` with the
   identical value. Use Vault's entry form, not SQL containing the literal value.
3. After approval, run `supabase/operations/schedule-booking-emails.sql`.
   No recipient information or Resend API key is stored in cron job text.
4. Redeploy with both sending flags still false. Invoke the dispatcher once;
   inspect ONLY `status_code` in `net._http_response`. Expect 200 with disabled
   processing. Never select request headers, Vault contents or full response
   bodies. `cron.job_run_details` success confirms only dispatch, not HTTP success.
5. Verify the next scheduled invocation also returns 200. A missing/short/wrong
   bearer secret returns 401 and sends nothing. Endpoint accepts GET (Vercel)
   and POST (Supabase), with no-store/no-referrer responses.
6. The existing once-daily Vercel job can remain a fallback; claims deduplicate
   overlapping runs. It is NOT the primary reminder scheduler.

## Controlled activation / acceptance

Obtain explicit permission before live test messages. Use only the founder's
approved recipient `info@gorez.co` for tests; do not contact existing customers.
Enable the flags and redeploy only after code/migration/scheduler verification.
Create clearly labelled test data within an agreed business or isolated test
tenant. Never change a real customer's booking to force a reminder test.

Verify in Resend that the customer confirmation and owner alert are Delivered;
check mailbox receipt too. Check language, new domain, local date/time and private
management link. Prove due-reminder acceptance, then move/cancel the isolated
booking and verify no old reminder is sent. Mailbox tests must not claim to test
actual 24h elapsed time: use isolated controlled due-time fixtures. Obtain the
required approval before permanently removing any test data. Disable flags and
redeploy on failure; bookings and Auth recovery remain usable.

Before switching live booking sending on, the operator can POST an approved
`{ "kind": "booking_confirmation", "locale": "en" }` fixture to
`/api/cron/notifications/test`, authenticated by the same CRON_SECRET. This
diagnostic endpoint is the ONLY intentional exception to the global booking
sending switch. It accepts no recipient or appointment IDs: it sends fictional,
clearly labelled [TEST] data ONLY to the configured EMAIL_FROM mailbox. Limited
to six attempts/day/IP by the existing database rate limiter, with stable daily
provider idempotency keys; no real appointment/CRM row is created. Never call it
without mailbox-owner approval. Provider acceptance is not inbox delivery proof.

Resend Free currently allows 3,000 messages/month and 100/day shared with Auth
messages. Each booking can consume customer confirmation + owner alert + reminder;
changes add more. Do not enable paid overages or upgrades without permission.
Five-minute scheduling alone invokes the endpoint about 8,640 times per 30 days;
keep usage below the existing hosting/database limits and monitor backlog.

## Verification

`pnpm test`: offline worker/template/cron tests, actual in-memory PostgreSQL
migration + queue/lease/revision/RLS tests. `pnpm build`: production build.
`/dev/booking-emails?lang=en&kind=booking_reminder` is a development-only visual
fixture with fake data; production returns 404. It never sends email.

References: [Supabase Cron](https://supabase.com/docs/guides/cron),
[Vault + scheduled HTTP](https://supabase.com/docs/guides/functions/schedule-functions),
[Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Vercel scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing),
[Resend limits](https://resend.com/pricing).
