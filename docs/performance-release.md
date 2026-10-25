# Frankfurt and navigation performance

## Baseline (production, 26 October 2026)

Three sequential GET samples per endpoint, from the same machine. These are
time-to-first-byte measurements, not whole-page rendering or a load test.

| Endpoint | TTFB samples (ms) | Execution path |
| --- | --- | --- |
| Homepage BG | 486 / 180 / 217 | fra1 → iad1 |
| Public directory | 1047 / 878 / 958 | fra1 → iad1 |
| Availability | 1725 / 1636 / 1455 | fra1 → iad1 |

## Changes and safety

- Pin Vercel functions to `fra1`, beside the existing Frankfurt Supabase project.
  No database move, migration, paid plan, Auth setting or email setting change.
- Replace the public profile + four child queries with one PostgREST embedded
  query. Keep active/public filters, explicit field whitelists, service/staff
  filtering and ordering. No shared server cache of publication or schedules.
- Preserve one owner session/profile and sidebar in the shared dashboard layout.
  Page navigation and locale changes no longer re-fetch that profile. Profile
  saves force a fresh read; visible dashboards revalidate after one minute.
- Keep all customer/appointment queries authenticated and tenant-scoped. Clear
  private UI on sign-out/account changes; ignore responses from an earlier
  identity or an unmounted controller. Retain newer Auth sessions during reads.
- Reuse/deduplicate the public directory in browser memory for at most 30 seconds,
  with forced refresh on focus/retry. Do not persist it to local storage. This
  cache never contains sessions, customer history, availability or bookings.
- Availability explicitly sends `private, no-store`. The fresh appointment and
  time-off reads, submission-time slot check and database race guards remain.
- Expose duration-only `Server-Timing` labels for directory/availability requests,
  without identifiers, credentials or response data.

## Validation

Run `node --test tests/*.test.mjs`, then `next build`. Performance tests cover the
real Supabase client's generated request, joined-query ordering/filters, uncached
publication changes, cache expiry/errors/deduplication, owner isolation, stale
responses, logout/account switching, session refresh and no-business setup.

After publishing, run `node scripts/measure-performance.mjs`. Confirm `fra1`
execution and compare the three warm/first-request samples with the baseline.
Use the live `Server-Timing` header to separate database stages from network time.

Read-only pre-release public snapshot for 27 October: three directory businesses;
first-service availability counts 70 / 22 / 37. Compare response digests after
publishing to ensure performance work has not changed the returned slots.
Check public BG/EN navigation and booking controls, unauthenticated owner/admin
denial, invalid slot requests and development fixture 404s. Do not create a real
booking, send an email or modify an existing account for performance QA.

Rollback is a normal Git revert/redeployment. No data rollback is required.
