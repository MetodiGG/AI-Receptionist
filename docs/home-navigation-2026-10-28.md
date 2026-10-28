# Visible Home navigation — 28 October 2026

## Change

- Shared `HomeLink` uses a fixed local `/?lang=bg|en` target with visible Начало/Home text and the existing house icon. It does not sign out, submit a form, or depend on browser history.
- Visible outside the hamburger on AI Search and business onboarding; also included in business login, account, password request/reset, privacy/terms, business booking, booking management, reviews, owner dashboard and admin/review headers.
- Booking/owner loading and error states retain an escape back to the homepage. Embedded booking still hides the entire host-delegated header.
- Mobile headers reserve a top-right cell for Home and another row for languages/menu. Minimum Home target height 46px, text 16px, visible keyboard outline. The narrow legal header sits outside its padded article to avoid overlapping the logo.
- Home closes the open marketing menu, including when already on the homepage. Existing booking, sign-in, registration, consent, trial/billing and search behavior is unchanged.

## Verification before release

- `pnpm test`: 338 passed, zero failed.
- `pnpm build`: passed (Next 16.4.1); `git diff --check`: passed.
- CUA browser: 320/390/1280px checks for login, privacy, onboarding, fictional admin and the development-only owner shell; no horizontal page overflow or intersections between the visible header logo, language switch and Home.
- Additional 320px checks: account signed-out page, forgot/reset password, terms, fictional business/review, invalid booking/business links and dashboard loading state all expose the localized Home link.
- Real link activation: login → AI Search in BG; owner fixture → AI Search in EN. EN keyboard Tab focuses Home with a 3px outline and Enter navigates to the English AI homepage. Clicking Home on an already-open home menu collapses it.
- Owner fixture has no real identity or database writes and returns notFound outside development. Admin/profile/review fixtures use existing fictional data only. Embedded-header preservation is covered by the stylesheet regression assertion; the existing profile fixture does not enter embed mode.
- No provider search, GPS permission, real booking, registration, client email, database migration, billing/key/quota or authentication-setting changes were performed.

## Release

- Published source: `fa14a58c8d052bc167f10e1629871465e765db65` on main.
- Vercel deployment `3TaDg3Q6wcCEu2eWrxy4MEhCjJfY`: Ready, Production, Current; custom domain www.gorez.co. Immutable hostname `ai-receptionist-mvenc4bu7-ai-receptionist12.vercel.app`.
- Live mobile (390px): login Home appears at x250/y28 with 46px height and 16px text; page width and scroll width both 390px. Header elements do not overlap.
- Live clicks verified: BG login → AI homepage; EN menu → business login → English AI homepage; published ВЕСИ СТУДИО profile → Bulgarian AI homepage. No booking submitted.
- Live Home remains visible while the hamburger is open; clicking it on the homepage collapses the menu. Language switch also updates Home/Home's destination.
- Proof: `/tmp/gorez-home-button-live-20261028.png` and `/tmp/gorez-home-button-menu-live-20261028.png` (ephemeral local screenshots; the login proof was embedded in the owner-facing update).
- Development server stopped; temporary QA/deployment tabs closed and temporary viewport reset. The Bulgarian AI homepage is left as the user-facing browser deliverable.
- No infrastructure, environment, Google/AI quotas, billing, migrations or real client data changed.
