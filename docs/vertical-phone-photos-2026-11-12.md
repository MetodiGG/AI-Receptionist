# Vertical results, phone-only appointments and photo normalization

Implemented locally on 2026-11-12. No deployment or production SQL was run.

## Behavior

- Business results use normal vertical document flow: one business per row at
  every screen width. On desktop, a card's photo sits beside its information,
  not beside another business. Categories retain the existing horizontal rail.
  Existing global catalogue ordering, partner priority, filtering,
  deduplication and bounded API pagination are unchanged.
- The next catalogue page loads near the end of the list. A generation/cursor
  gate prevents duplicate requests; stale observer callbacks cannot load the
  previous search. Error retry stays at the bottom. The keyboard-only load
  control remains mounted through loading and the final page to retain focus.
- Optional legacy Google farther results still require actual scroll intent;
  automatic search-result scrolling must not mount an extra paid provider batch.
  No Google mode, budget or other paid service is enabled by this change.
- New photos are prepared locally and independently normalized on the server to
  at most **1200 px on the longest edge**, preserving aspect ratio without
  cropping or upscaling. Server normalization strips metadata and encodes WebP.
  Existing smaller request/output byte budgets remain enforced. Business,
  application, staff and catalogue photo upload paths share this policy.
- Existing stored photos and curated project artwork were not bulk rewritten.
  There is no separate service-photo upload endpoint to migrate.
- Text values continue to use bound SDK/RPC parameters. The two raw PostgREST
  OR expressions now have fixed typed constructors that revalidate UUIDs and
  timestamp cursors at the final grammar boundary. No SQL-keyword blacklist
  rejects valid Bulgarian names, apostrophes or ordinary comments.

## Phone-only mode

`booking_mode: 'phone'` is separate from native `'gorez'` and `'external'`.
Registration offers the exact Bulgarian label
“Желая да получавам резервации само по телефонен номер”, requires a valid
business phone number, and skips unnecessary team/calendar steps. Existing
services, price currencies, ranges and qualifications are retained.

Public “Резервирай час” actions use one safe `tel:` destination. The public
profile does not mount a native availability calendar or booking assistant for
this mode. It does not confirm telephone appointments. Invalid numbers never
become a dial destination. Native public booking, availability and chat paths
reject phone mode; a SQL INSERT guard independently enforces this boundary.

Owner/admin settings keep ownership, revisions, moderation and acknowledgement
of existing future appointments. Schedules and existing appointments are not
deleted. Authorized management of existing appointments is retained.

### Required release dependency — NOT applied

`supabase/migrations/20261112100000_phone_booking_mode.sql` extends the mode
constraint, phone validation, settings/application/publication RPCs and the
new-appointment guard. It delegates existing native/external paths to their
previous implementations and remains only in `PENDING_STAGING_MIGRATIONS`.

Obtain separate release/SQL approval and apply this migration before publishing
the phone-mode UI. Do not treat an earlier approval for
`20261111190000_service_price_details` as approval for this new migration;
the earlier migration has already been applied and must not be rerun.

## Main implementation files

- `components/discovery-business-list.js`, `discovery-home-browse.js`,
  `google-discovery-list.js`; `lib/discovery/list-pagination.mjs`;
  `app/business-results.css`, `app/layout.js`.
- `lib/photo-policy.mjs`, `image-normalization.mjs`, `photo-selection.js`.
- `lib/postgrest-filter-safety.mjs`, `monthly-availability.mjs`,
  `app/api/admin/reviews/route.js`.
- `lib/booking-mode.mjs`, `business-application.mjs`, `booking-settings.mjs`,
  `public-booking.js`; registration, settings, outbound button, profile,
  discovery projection and owner/admin booking-mode controls.

## Validation and limitations

Final executed checks:

- `pnpm test`: **1603 passed, 0 failed, 0 skipped**.
- `pnpm catalogue:check`: passed; 981 records, 958 currently approved,
  23 intentionally excluded; no newly blocked or changed catalogue records.
- `python3 tests/booking-pricing-flow_test.py`: 4 passed.
- `python3 tests/pricing-extraction_test.py`: 8 passed.
- `pnpm build --webpack`: passed, 85 static pages generated. The bundled
  Webpack build was used because the local shared `node_modules` symlink is
  outside Turbopack's filesystem root. No dependency/configuration changes were
  made for this workaround.
- `git diff --check`: passed.

Offline hostile-input tests use the actual Supabase serializer and actual
migration RPC SQL in PGlite. Phone migration tests cover unchanged legacy data,
safe-number parity, applications, activation, revisions, atomic rollback,
future appointments, write permissions and native/external delegation.
No existing exploitable SQL injection was demonstrated; the filter changes are
defense in depth, not a claim that every possible security risk is eliminated.

Browser checks used local fictional/inert fixtures, not production accounts or
real bookings. Vertical results, registration and phone profiles were checked
at 360, 390, 430, 768 and 1280 px with no horizontal page overflow. Price ranges
stayed inside their business cards; categories remained horizontal. Local
pagination reached 18 unique records, stopped at the end, retried a simulated
failure, reset on category change and retained keyboard focus after appending.
The phone profile retained the selected service and showed no native form or
calendar in BG/EN.

No live Google widget was loaded, actual phone call placed, real account
created, production photo uploaded or customer notification sent. Performance
of tens of thousands of simultaneously mounted results was not measured; this
does not promise a universally lag-free website.

Development fixture: `/dev/business-grid` (finite local pages, optional
`?case=error`, `?lang=en`), `/dev/business-setup`, and
`/dev/business-profile?mode=phone`. All remain development-only.
