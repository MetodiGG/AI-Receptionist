# Owner calendar release

Publish the owner day/week/list calendar and industry-specific booking questions on top of the current production baseline (`c469fb3`).

Included:

- Day and week calendars, searchable list, specialist/status filters and booking details.
- Existing owner actions for creating, rescheduling and changing booking status.
- BG/EN questions in the public form, guided assistant and manual booking flow.
- Answers stored in the existing `appointments.notes` column.
- Development-only isolated calendar preview; production returns 404 for `/dev/calendar`.

No new environment variables, database migrations or billable providers are required. Google Places and nearby discovery are not part of this release. User-owned untracked files in the primary checkout are not included.

Acceptance: tests/build on this release branch, Vercel build success, production calendar asset check, public business/availability health checks and production 404 for the development preview.
