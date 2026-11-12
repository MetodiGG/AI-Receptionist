# Owner approval email — 12 November 2026

## Scope

One transactional notice after the first successful publication of each future business. It is not an Auth verification link, password reset, reservation confirmation or marketing subscription. Existing administrative account activation is unchanged.

`20261112144000_business_approval_email.sql` adds only a private outbox, service-only claim/revalidation functions, and a publication trigger. Initial table creation records every pre-existing business as `skipped / PREEXISTING_BUSINESS`, with no recipient or payload. These terminal ledger rows prevent old profiles (including Touch and care center) receiving backfill mail after edits/republication. Reapplying the migration does not seed or suppress later pending registrations.

New publication enqueues atomically, with a unique business ID. Rollback rolls back the email intent. The destination is the business owner's matching confirmed `auth.users.email`, never the business's reservation/contact email. Changes to owner/email/publication invalidate delivery.

## Delivery and retries

- The existing `EMAIL_NOTIFICATIONS_ENABLED=true`, `RESEND_API_KEY` and `EMAIL_FROM` configuration enables delivery. No new credential, provider, paid service, scheduler or global Auth setting is introduced.
- Successful application approval and Businesses-tab publication schedule an immediate Next.js `after` task. A transient failure gets at most one immediate retry per claim (normally after one second; a provider Retry-After up to two seconds is respected). Both requests retain identical frozen bytes/key and revalidate the claim/owner before sending. Three claims mean at most six HTTP attempts per notice. Queue rows are paced by at least 600 ms and a worker stops within its 18-second HTTP budget.
- The existing authenticated notifications cron retries pending/failed intents separately from visit emails, up to ten notices per invocation within that budget. On 12 November, a read-only Production check confirmed the existing Supabase `gorez-booking-emails` job is active on `*/5 * * * *`; its command and credentials were not read. `vercel.json` separately defines a daily fallback. Neither schedule is changed. Longer outages or backlogs can still delay delivery, and ambiguous sends are deliberately not retried beyond the idempotency fence. This task does not introduce a paid scheduler or promise inbox delivery.
- A provider/database failure cannot undo the accepted publication. Frozen payloads, stable provider idempotency keys, single-consumer claims and claim-token conditional writes prevent duplicate processing.
- Do not retry ambiguous sends after 23 hours (inside the provider's 24-hour idempotency window). Untouched intents expire after seven days. Operational recipient/payload/provider IDs are removed after 90 days; the unique terminal publication ledger remains to prevent replay.
- A `sent` state records provider acceptance, not a claim that the message reached the inbox. Provider errors are generic; response bodies, credentials, tokens and passwords are not persisted/logged.
- The fixed canonical links are `https://www.gorez.co/login?lang=…` and the actual `/book/<slug>?lang=…` profile. BG/EN plain text and escaped HTML are provided.

## Safe rollout

Apply the reviewed migration before publishing the app. Verify RLS is enabled, anon/authenticated have no table/function access, and initial queue rows are terminal only. Check configuration *presence* without copying or exposing values. Do not toggle approval or run the worker for old profiles to test delivery. No current-owner resend/backfill is included in this task.

Testing uses injected provider/store mocks and in-memory PostgreSQL (PGlite). No real emails, customer bookings, notifications, production data or credentials are needed. New worker/SQL suites cover rollback, owner mismatch, suspension, duplicate publication/claims, stale claim tokens, invalid payloads, provider errors, retry expiry, retention, old-profile suppression and actual after-hook adapters.
