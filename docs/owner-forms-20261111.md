# Compact owner forms · 11 November 2026

Implemented locally; not deployed. The previous service-word-wrapping fix is
also still pending publication. No catalogue research was resumed.

## Changes

- Centered the required-photo text and added bottom/side padding so it does
  not sit against the dashed photo-picker border.
- Added one-action service selection/clearing to the existing catalogue import
  dialog. A native checkbox exposes partial/mixed selection. Actual source
  indexes, prices, conditions and the explicit replacement confirmation remain
  unchanged. The existing registration/API limit remains40 services: oversized
  menus explicitly say “Избери до40” rather than silently bypassing that limit.
- Fixed the concrete owner-modal CSS collision: `.admin-modal > div` made the
  intended form grid and heading horizontal flex rows. Scoped display rules and
  the new native manual-booking dialog preserve their intended layout.
- Isolated manual input state in `OwnerManualBookingDialog`; customer typing
  no longer changes state in the dashboard calendar's parent. This removes
  those input-triggered calendar recalculations, not a claim of zero site lag.
- Added bounded dialog scrolling, compact header/actions, focus restoration,
  native modal inertness/Escape and body scroll locking. The sticky footer stays
  inside the scrollport. Service/staff/date changes immediately clear old times;
  context keys and AbortController prevent stale responses from taking over.
- Kept technical errors distinct from empty availability, with a retry action.
  Saving locks editing/dismissal and has a synchronous duplicate-submission guard.
  A409 slot conflict refreshes times while preserving customer-entered details.

## Existing server contracts preserved

Availability still uses `GET /api/public/[slug]/availability` with service/date
and optional staff identifiers. Submission still uses owner-authenticated
`POST /api/public/[slug]/bookings`, `source:manual`, the actual selected staff
and start timestamp, required customer contacts, existing intake/consent and
locale. Success is accepted only with the server's confirmed appointment ID.
Server availability rules, atomic conflict protection and notification behavior
were not changed. External-mode businesses still cannot create native bookings.

## Files

- `app/dashboard/appointments/page.js`
- `components/owner-manual-booking-dialog.js`
- `components/catalogue-import-review.js`
- `app/dashboard-responsive.css`
- `app/business-management.css`
- `app/onboarding.css`
- `tests/booking-contact.test.mjs` (follow the relocated real manual email field)
- `tests/catalogue-import-select-all.test.mjs`
- `tests/owner-manual-booking-dialog.test.mjs`
- `tests/owner-forms-layout.test.mjs`
- `app/dev/owner-forms/page.js` and `preview.js`
- `tests/owner-forms-preview.test.mjs`

## Executed checks and limits

- Final full Node suite:1479/1479 passed;0 failed/skipped. Includes32 new tests
  for selection, layout contracts, actual-component hook behavior and fixtures.
- Python price/extraction tests:8+4 passed.
- Catalogue/pricing checks passed:981 records,958 approved,23 intentionally
  excluded; no blocked newly changed listings and no data edits in this task.
- Production build passed:84 static pages.
- Local development `GET /dev/owner-forms?lang=bg` returned200. The preview uses
  actual components with fictional services, IDs and local availability only;
  booking creation/authentication/POST, uploads and notifications are disabled.
- Production/test guards and noindex metadata are covered by executed tests.
- Browser visual/responsive checks and new screenshots were NOT performed:
  the computer-use service returned “Local browser access is unavailable for
  this chat” for both inventory and the direct in-app preview attempt. CSS/SSR
  and hook tests are not represented as physical browser or iPhone validation.
- No real customer booking, account registration, production write, notification,
  migration, paid service, dependency change or deployment was performed.

Logs: `/private/tmp/gorez-owner-forms-full-node-final-20261111.log` and
`/private/tmp/gorez-owner-forms-build-20261111.log`. The owned development server
was stopped after the local route check.
