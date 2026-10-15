# Scheduling, lunch breaks and Bulgarian business locations

Release date: 15 October 2026.

## Owner workflow

- Onboarding → Business: select one Bulgarian city (searchable, checkmark selection), optional neighbourhood, and the usual appointment duration. New services inherit that duration, but each service has its own exact duration.
- Settings → Services: edit a service to 45, 60 or another valid duration (5–1440 minutes). Saved appointments retain their agreed start/end time. A 15-minute start interval is not a 15-minute service.
- Settings → Hours & breaks: select a specialist, enable working days and recurring weekly breaks, e.g. 12:00–13:00. These recur in the business timezone, including across daylight-saving changes.
- Bookings → Block time / break → One-off closure: block a particular date/time for one specialist or the entire business. The reason is private.
- A break/closure which would conflict with an existing active booking is rejected; move or cancel the booking first. The schedule update is atomic.
- Client form, guided chat, owner booking/rescheduling and confirmation show start/end times.
- Removed the Demo sidebar entry and uptime/online badges. Legacy `/dashboard/demo` redirects to bookings. Actual booking-status labels remain.

## Database

`20261015143000_business_schedule_locations.sql` was dry-run in a rolled-back transaction, then successfully applied through the project's Supabase SQL editor. It adds business city/default-duration fields and weekly break fields, extends the existing atomic schedule RPC and enforces schedule/service duration on booking writes. RLS and the existing concurrent-booking exclusion constraint remain in place. No existing services, bookings or addresses were rewritten.

The database schedule lock coordinates booking creation, time-off writes and weekly schedule replacement. It rejects direct bookings during lunch, outside working hours/time off or shorter than the current service duration. Existing active bookings can still be confirmed or have notes edited without silently adopting a later service duration change.

## Verification

- `pnpm test`: 59 tests passed, including duration/overlap/break boundaries, whole-business time off, Sofia DST and city-code consistency.
- `pnpm build`: production build succeeded.
- `git diff --check` and `node --check scripts/pilot-e2e.mjs`: passed.
- Actual onboarding component tested at 390×844: city/neighbourhood selection; usual duration 60 with individual service 45; five 12:00–13:00 breaks; invalid break blocked; BG/EN labels and state preservation; final review. No business was created by the development-only fixture.
- `scripts/pilot-e2e.mjs` additionally covers real deployment booking/closure conflicts, race handling, tenant isolation, guided/manual booking and cancellation. It requires explicit opt-in, creates isolated fictional tenants and removes their business data; generated Auth identities are retained and signed out. Live results must be recorded from the run, not inferred from unit tests.

## Scope and limitations

The 257 cities come from NSI/EKATTE; see `location-data.md`. Neighbourhoods are non-exhaustive suggestions for seven major cities, with custom entry for every city. One recurring break is supported per specialist/day; extra one-off periods can be blocked separately. Existing services are intentionally not changed to 45/60 minutes automatically. No paid API, Google Places, model, email delivery, SMS or Viber service is enabled by this release.
