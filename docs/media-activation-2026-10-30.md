# Media activation checkpoint — 30 October 2026

## Approval and cost boundary

The owner approved the proposed staging migration/private photo storage and a
controlled staging upload, then the same Production migration/publication after
successful checks, **only if it does not cost money**. No paid plan, add-on,
Google quota change or paid AI activation is authorized by that answer. Existing
Google discovery is separately metered; this approval is not a guarantee of a
zero total operating bill or authority to increase its limits.

Read-only dashboard checks on 30 October confirmed:

- Supabase organization `owqwsqweklqohczaxyed` is **Free**, billing period
  13 October–13 November. The dashboard explicitly says overages are not billed
  on this plan. No included quota exceeded: Storage 0/1 GB, uncached egress
  0.013/5 GB, cached egress 0/5 GB, MAU 16/50,000. Project database sizes were
  28.95 MB (Production) and 26.75 MB (`gorez-staging`). These usage numbers may
  lag; no payment or subscription control was changed.
- Vercel team `ai-receptionist12` remains **Hobby**. Visible usage included
  300.34 MB/100 GB fast data transfer and 27.63 MB/10 GB origin transfer. No Pro
  purchase or paid resource was enabled. Hobby's published non-commercial-use
  restriction still applies; this checkpoint does not assert commercial
  eligibility or guaranteed continued hosting.
- Official references checked: https://supabase.com/pricing,
  https://supabase.com/docs/guides/platform/billing-on-supabase,
  https://vercel.com/docs/plans and
  https://vercel.com/docs/limits/fair-use-guidelines.

## Staging request submitted — success NOT yet verified

- Preserved the owner's existing Production SQL tab. Opened a separate Safari
  tab at the exact staging SQL address:
  `https://supabase.com/dashboard/project/dbvsfxkmljrwjberwodb/sql/f86ccb08-896a-4909-84e5-45f06c65a000`.
  Its header showed `gorez-staging`, the exact project URL and the Free org.
  Supabase's branch label `main PRODUCTION` refers to that staging project's
  own main branch, not the real GoRez Production project.
- Read-only preflight completed: Auth users, businesses, customers, appointments
  and queued messages all **0**; media table, revision column and media bucket
  absent.
- Pasted the exact reviewed
  `supabase/migrations/20261030100000_business_content_and_media.sql`, followed
  by a read-only verification SELECT for RLS, privileges, private WebP bucket,
  restrictive Storage policy and unchanged data counts.
  Migration SHA-256:
  `f68f39df4e64cca858a14ab6201ba9097765225af03fdeaf2df841fcbbe24922`.
- Clicked Run and confirmed Supabase's generic DDL warning for the already
  approved migration. The visible state became **Running...**. The Mac then
  locked before a success/error result could be read. **Do not infer success or
  rerun the migration on resume.** First unlock, inspect that query's result,
  and perform a fresh read-only schema/privilege/count check.
- Migration-history recording, actual Storage upload/round-trip, matching
  protected Preview deployment and all Production activation remain pending.
  No upload, new Auth identity, real profile edit, booking, email, Google search,
  environment edit, git push or deployment was performed in this checkpoint.

## Email question answered from implementation and prior evidence

The existing completed-visit invitation is not part of this pending media
migration. A new transition to `done` queues one invitation when business and
client email preferences permit it. Due time is the later of completion marking
and one hour after visit end; the existing worker provides approximate timing.
Rating is 1–5, comment optional, single-use link valid for 30 days. The owner
previously confirmed receipt of the explicitly approved diagnostic review email
at `info@gorez.co` on 27 October. This does not prove a complete elapsed-time
real-visit invitation/review transaction; no such transaction was created now.

Relevant implementation: `lib/notification-email.mjs`,
`supabase/migrations/20261026120000_business_profiles_reviews.sql` and
`docs/business-reviews.md`.
