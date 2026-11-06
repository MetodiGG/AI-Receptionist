# Catalogue photos release — 6 November 2026

## Approval and database

Owner approval: apply only `20261106100000_catalogue_photos` to Production and
publish after tests; no paid plan or partner/customer/booking changes.

The authenticated Supabase SQL Editor target was
`ilpdtvbymxqgimrboyvh` / main. Preflight confirmed all three new table names and
both RPC names absent, and the existing `business-media` bucket private.

Reviewed migration SHA-256:
`8b1b2779ffd0a49717e84b93833b7b243e71a2d8fe8368e6dd65321029ffe2d1`.

Applied in a repeatable-read transaction with 3-second lock timeout and 30-second
statement timeout, an already-migrated guard, and temporary before/after content
digests for businesses, customers, appointments, services, staff, hours and
partner media. Digests matched. The temporary snapshot was dropped on commit;
it was not made accessible to browser roles. No baseline/bootstrap/history
schema was applied or created.

The SQL Editor returned `catalogue_photo_migration=applied`, `rls_tables=3`,
`catalogue_photos=0`. Existing counts remained 4 businesses, 10 customers and
1 appointment. Public/customer table and RPC denial checks passed inside the
same transaction. No real catalogue photo was uploaded for release QA.

Application publication is verified separately after the release merge. The
additive private tables can safely remain if an application rollback is needed.

## Tests and UI

- Full suite: 879 passed, 0 failed. Production build and diff whitespace check
  passed. No dependencies or environment values changed.
- Local UI: large 25.8 MB synthetic JPEG prepared to 1024×683; upload, replacement,
  removal and fallback; permission gating; category filtering; debounced name
  search; BG/EN; 16 px form text and no horizontal overflow at 320 px viewport.
- The full sourced rail reaches 203 cards across bounded pages, stops exactly at
  `scrollLeft=max=59402`, and disables Next. Switching category resets to 0 and
  the auto-repair rail reaches its 17 real cards and stops. Desktop viewport and
  page width both 1280 px. Fixtures never submit appointments or provider calls.
- Admin upload/auth/validation/conflict tests and PGlite transaction/RLS tests
  cover real backend logic separately from the labelled browser-only fixture.

## Performance changes requested during this release

- Keep a single observer lifecycle per carousel. Observe actual child insertion,
  removal and resize; coalesce layout reads into one animation frame. Typing no
  longer re-registers observers across all previously loaded business cards.
- Memoise stable cards, matching rows and distance origins so unrelated typing
  does not recompute every card. Actual filters, coordinates, locale, photos and
  result changes still update the UI. No availability cache or stale slot path
  was introduced.
- Defer the legacy Google list renderer until a real server-approved plan needs
  it. Catalogue browsing does not load that component's code or call Google.
- Built homepage application-entry scripts: 331,887 → 325,437 uncompressed bytes;
  103,040 → 101,355 individually gzip-compressed bytes. These are build-manifest
  entry chunks, not an entire page-transfer or field Core Web Vitals claim.
  Observer tests coalesce 100 resize/mutation notifications into one scheduled
  measurement and verify exact append/removal cleanup and unmount cancellation.

There is no claim of zero latency: device speed, permission prompts, network and
live database latency still apply. No paid plan, provider quota or booking logic
was changed to obtain these improvements.
