# Verified visit reviews and structured business profiles

## Deployment order

Apply `supabase/migrations/20261026120000_business_profiles_reviews.sql` before
deploying this release. It is repeatable and preserves existing profile,
appointment and client data. It adds no paid integration and performs no
historical backfill or email-provider call. The previous worker keeps using
`claim_booking_email(uuid,boolean)` and cannot claim the new mail kind; the new
worker uses `claim_visit_email(uuid,boolean,boolean)`.

The existing five-minute Supabase job and Vercel notification endpoint handle
review mail. Do not create another scheduler, change Auth SMTP, rotate secrets,
or change the existing email flags for this release.

## Invitation lifecycle

- A new transition to `appointments.status='done'` queues at most one invitation
  for that visit. The appointment must have email notifications requested, a
  current client email, and an active/enabled business with email and review
  invitations enabled. Visits ending more than seven days earlier are excluded.
- Due time is the later of completion marking and one hour after appointment
  end. The five-minute worker gives approximate timing, not an exact delivery
  guarantee. Cancellation/no-show does not request a review.
- Each invitation expires after 30 days, is revocable and single-use. Its
  timestamp/revision/tenant/visit status are rechecked before sending and again
  inside the locked submission transaction. A visit can have only one review.
- The worker uses the existing frozen payload, leased claim, stable provider
  idempotency key, three-attempt limit and 23-hour ambiguous-retry ceiling. Review
  mail more than 72 hours overdue is skipped; it does not use the six-hour limit
  for immediate booking events. Provider acceptance is not inbox delivery.
- No rating is selected by default. Overall 1–5 rating, public name/initials and
  explicit publication consent are required. Comment and four detail ratings
  are optional. Private booking contacts/notes are not published.
- Turning invitations off suppresses unsubmitted queue work on revalidation.
  Turning them back on does not replay skipped mail or completed historical
  visits. The preferences are in Settings → Public page & reviews.

## Privacy and integrity

The invitation/review/audit tables and write functions are service-only. Public
reads use an explicit projection containing only consented display name,
rating, comment and review date, scoped to a published business and a completed
visit. Pagination is timestamp+ID keyset based. No token is sent in a public
review response.

Review email payloads also contain the private review credential. A restrictive
authenticated-role RLS policy excludes `review_request` from the pre-existing
owner-readable outbox and its export, including reads and writes. Owners cannot
obtain an invitation from their own queue and rate themselves as a client. The
worker service role continues to access it. Owners can export review content
through an ownership-checked, field-whitelisted endpoint without invitation
IDs, tokens or email payloads.

Customer erasure deletes linked invitations and reviews; appointment/business
deletion cascades them. Cancelled/changed visits revoke invitations and remove
invalid reviews from public queries. Archives are not publicly queryable.
Private pages/API responses are no-store, noindex and no-referrer. The review
form does not emit product analytics or store its contents in local storage.

Administrators at `/admin/reviews` can hide/restore with a required reason and
optimistic revision check. Every action is audited. Neither owners nor the
moderation API can rewrite the score, author name or comment. Low ratings alone
are not a moderation reason.

## Business information

The profile uses the actual gallery, services/categories/prices/durations,
staff and union of active staff working periods (including recurring breaks).
Description, accepted payments, brands and map coordinates are optional owner
fields; absent information is not fabricated. No competitor logos/text/reviews
are included. Without reviews, the page states that there are none, not 5.0.

Directions use the saved address unless the owner supplies both coordinates.
The OpenStreetMap iframe loads only after an explicit Show map action and keeps
its native attribution. No paid geocoding call or guessed location is used.

## Verification

Run the complete Node test suite and `next build`. The database suite executes
the real migration in isolated PGlite PostgreSQL, including anti-forgery outbox
RLS, expiry/revision/tenant checks, uniqueness, no-backfill, erasure and audit.
Email tests inject an offline provider; they cannot send to real people.

`/dev/business-profile?lang=bg` (and `en`) is a production-gated, labelled local
fixture. `view=review` exercises the form in memory and `view=admin` exercises
moderation without external writes. Production returns 404 for these fixtures.

Live checks must be read-only unless a mailbox/isolated visit test has been
explicitly approved. Never mark an actual customer's visit done just to test
mail, publish fake reviews, or print invitation tokens/provider payloads.
