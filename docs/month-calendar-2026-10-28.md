# Business booking month view — 28 October 2026

## Delivered

- Adds Месец / Month alongside the existing Day, Week and List views in `AppointmentCalendar`.
- Monday-first month grid with complete weeks, adjacent dates, today marker, selected-day state and per-day filtered booking counts. Large counts display 99+ while the accessible label retains the exact number.
- Month/year heading, previous/next month, Today and the existing direct date/month/year picker. Month navigation anchors on the first day to avoid skipping months after the 29th–31st.
- Selecting a date displays its actual filtered bookings below the grid. Existing booking-detail dialog/status/reschedule handlers are reused; Open day keeps the selected date and filters. New booking passes the selected date and specialist into the existing owner form.
- Month totals count each appointment once and exclude adjacent-month-only bookings. Overnight appointments can correctly appear on each intersecting day without double-counting the monthly total.
- Interval grouping parses each booking only once for the month and uses business-zone day boundaries, including 23/25-hour DST days.
- Responsive seven-column grid (40px-wide × 84px-high cells at 320px; 50px × 84px at 390px). Date/count type is 18/16px mobile, 20/16px desktop; visible focus, native buttons and localized accessible labels.

## Verification

- `pnpm test`: 344 passed, zero failures; `pnpm build` and `git diff --check`: passed.
- Unit coverage: 28/35/42-cell months, leap February, year boundaries, 29th–31st month navigation, midnight exclusion, overnight visits, spring/fall DST, sorting, malformed intervals, no mutations, specialist/status/client filters and unique in-month summary.
- CUA UI tests use only the existing development-only `/dev/calendar` fixture, which has fictional appointments and no database/email writes.
- Month → November: 42 cells, zero monthly total even though the grid includes October's five fixture bookings. Today restores October. October → November → December → January 2027 → December works.
- Specialist Alex: 3 monthly visits, 2 on the selected day. No-show filter: empty agenda and zero count. Clear filters restores results.
- Selected 29 October: one booking, matching detail dialog. New booking callback receives 2026-10-29; Open day retains 29 October. No actual booking was created or changed.
- EN view options/month/weekday labels verified; existing Week and List still render. Keyboard Tab + Enter selects 6 October. Page width equals scroll width at 320/390/1280px.
- Mobile proof: `/tmp/gorez-month-calendar-mobile-20261028.png` (ephemeral local screenshot with fictional data).
- No new dependencies, migrations, API keys, provider calls, quotas, billing or owner authentication changes. Production private calendar contents were not read or modified for QA.

## Release

- Source `1b05f694c3f59b0ceb1aa90b80070975b238cad5` published to main.
- Vercel `9RLd1ZmydVMB5fRTJwyortNjQE4o`: Ready, Production, Current, www.gorez.co; immutable hostname `ai-receptionist-q87of9vm9-ai-receptionist12.vercel.app`.
- Inspected a Vercel build warning about the existing `engines.node >=20.9.0` range. The calendar change does not modify package/runtime/deployment configuration.
- Public post-deployment smoke: www.gorez.co renders the Bulgarian AI homepage. The authenticated month UI was exercised on the development-only fictional fixture, not on a real client's booking data.
- Development server stopped. Vercel inspection tab closed. The unmarked local QA tab became a connection-refused page after the server stopped; browser URL policy prevented its manual cleanup, so it is left for normal end-of-turn temporary-tab cleanup. No security setting was changed. The working public homepage remains marked as the user-facing deliverable.
