# Approved one-message review test — 30 October 2026

Owner approved a separate restricted Resend key only for the protected
`codex/ai-business-search` Preview and one real review email to `info@gorez.co`.
No Production key, paid plan or existing real visit may be changed.

## Preparation

- Resend `gorez` account's live Usage page: Transactional Free, 18/3,000 monthly,
  0/100 daily, paid overage switches off. No billing control changed.
- Created **GoRez Preview Review Test**, Sending access restricted to **gorez.co**,
  ID `7d9adac0-91ce-479c-a40c-8d8aac054b1d`. Existing password recovery/Production
  key untouched. Value transferred in memory directly to Vercel, not chat/Git/
  local files, as a Secret `RESEND_API_KEY` only for this Preview branch.
- Independent operator secret `PREVIEW_REVIEW_TEST_SECRET` and temporary
  `PREVIEW_REVIEW_TEST_ENABLED=true` are also only for that branch. Existing
  global notification/reminder flags remain off in Preview. No shared or
  Production environment entry was edited.
- `/dev/review-mail-test` and `/api/operator/preview-review-test` require exact
  Preview environment, exact branch, explicit test flag and exact staging
  Supabase URL. Page is noindex/no-referrer. POST additionally checks exact
  origin, bounded strict form, a separate constant-time operator secret and
  durable request limiting. Production/other environments return 404.
- Uses the existing notification store/worker, restricted to a constant test
  appointment ID and one message per request. Refuses different tenant, recipient,
  kind or unlabelled fixture. The final provider boundary rejects CC/BCC,
  attachments, reply-to overrides and non-Preview review links. An already
  accepted queue item is not resent. Original payload freezing, leases and
  provider idempotency remain in effect. No request can choose visit/recipient.
- `supabase/operations/seed-preview-review-test.sql` refuses populated databases
  and repeat runs before writing. The banned passwordless owner placeholder,
  business, staff, service, hours, client and visit are explicitly fictional.
  A real new completion transition creates the one invitation/outbox entry.
  Time is a controlled past fixture, not proof of a real one-hour elapsed wait.
- 420 automated tests passed and optimized build/TypeScript passed before the
  corrected Preview deployment. Ten new tests cover environment/auth/CSRF/recipient boundaries,
  repeated calls, provider failure and actual SQL execution on the full original
  PostgreSQL schema, including refusal to seed populated databases or rerun.

## Live staging checkpoint

The isolated staging seed completed: one completed fictional visit, one pending
review message and one unused invitation. The first operator HTML-form POST
was rejected by the strict origin check before any queue inspection or provider
call. A `no-referrer` form POST can use an opaque origin. The test control now
uses explicit CORS-mode fetch, retains no-referrer and clears the secret after
submission; the server still rejects an opaque/null origin.

## Verified end-to-end result

- Corrected Preview commit `637aba0` reached Ready. One operator invocation
  returned `accepted: 1`, `failed: 0`, `skipped: 0`. No second send was attempted.
- Resend showed **Delivered**, to `info@gorez.co`, for the single message
  `Как мина посещението ти? · [TEST] GoRez Preview Review`.
- The actual Titan mailbox contained that message and its **Остави оценка**
  button. Its private one-use URL pointed to the approved Preview, not Production.
  The token was not written to docs, local files or chat.
- The actual link loaded the actual review form for the fictional staging visit.
  Submitted `[TEST] QA`, rating 5 and an explicitly labelled technical-test
  comment saying it is not feedback on a real business/service. This is only
  staging, not a fabricated review of a real partner.
- The page showed the saved/thank-you state. A full reload showed the already
  recorded state with no form for a second submission.
- Read-only staging verification returned exactly one queue row, one sent
  provider-accepted review message, one saved review and `used_at IS NOT NULL`.
- No real customer, real appointment, Production environment/key, paid plan or
  Google quota was changed by this test. The existing Production release remains
  unchanged. Controlled fixture timing does not prove a real one-hour wait or
  the deployed Production scheduler.

## Cleanup checkpoint

`PREVIEW_REVIEW_TEST_ENABLED=false` was saved successfully for only the exact
Preview branch. A fresh Preview deployment and 404 read-back are still pending.
Retire the separate key with owner confirmation; old deployments retain their
own environment snapshots. Do not touch the Production key.

Local proof images (no private link token):

- `/tmp/gorez-review-test-provider-accepted-20261030.png`
- `/tmp/gorez-review-test-resend-delivered-20261030.png`
- `/tmp/gorez-review-test-mailbox-received-20261030.png`
- `/tmp/gorez-review-test-form-saved-20261030.png`
- `/tmp/gorez-review-test-staging-counts-20261030.png`
