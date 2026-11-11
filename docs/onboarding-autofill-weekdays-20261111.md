# Catalogue price autofill and Monday–Friday hours — 2026-11-11

## Implemented

- Known, current catalogue prices populate the editable onboarding rows without per-price confirmation or re-entry. The import success message is neutral. Missing prices and durations are not invented.
- Currency, fixed/from/range semantics, upper bounds, units and published conditions survive import, application validation, persistence and public display. Owners/admins can edit them through compact optional pricing controls.
- Added an explicit, right-aligned Monday action: **Повтаря се - Пон/Петък** / **Apply to Mon–Fri**. Native opening/closing times and recurring breaks, or external opening periods, copy to Tuesday–Friday only. Saturday/Sunday stay unchanged. Existing Save remains responsible for persistence.
- Both real editors reject copying closed/invalid Monday hours; later individual edits remain independent. No new availability algorithm, booking endpoint or notification behavior.

## Rollout dependency — NOT deployed or applied

`supabase/migrations/20261111190000_service_price_details.sql` is a **pending, local migration**, not approved/applied by this work. It adds optional `services.price_details`, preserves old fixed-EUR records, validates new data, and extends the existing transactional application/content RPCs. Existing tenancy, revision, schedule and booking protections remain.

**Apply this reviewed migration before deploying the new public service SELECTs.** They request `price_details`; deploying first would fail against the old database schema. `scripts/prepare-staging.mjs` lists it only as pending, not in the approved migration set. Production application needs separate authorization.

The bounded application JSON reader now allows 200,000 characters / 800,000 UTF-8 bytes so forty services can retain their actual price conditions. Existing photo/multipart limits remain unchanged.

## Verification actually executed

- Final Node suite: 1,523 passed, zero failures/skips.
- Python price flow/extraction tests: 12 passed (4 + 8).
- `pnpm catalogue:check`: passed; catalogue unchanged at 981 records, 958 approved / 23 excluded.
- `pnpm build`: passed; 84 generated routes/pages.
- Seven actual PGlite SQL migration/application/content tests are included in the Node suite. No production database or account was used.
- Independent read-only full catalogue pipeline check (DTO → normalized import → application projection), as of 2026-11-11: 957 offered businesses / 8,772 services; all 7,867 current published prices populate with zero mismatches in amount/currency/range/unit/conditions. The 905 missing prices remain unknown. BeautyQ: 42/42 known prices populate; nine genuinely missing durations remain blank.
- Actual browser interactions with both schedule editors: Monday–Friday match the source, weekend remains distinct. Native breaks and external split shifts preserved. BG widths 360, 390, 430, 768, 1280: document width equals viewport, no editor overflow. English desktop copy verified at 1280 px.
- Actual onboarding browser import reached BeautyQ selection/import and showed the centered photo note. The local file chooser automation did not complete, so a full browser onboarding submission is **not claimed**. Actual component tests cover BG/EN advancement without touching imported known prices and validate submission payloads.
- Existing local manual-booking dialog also inspected at 390 px: no horizontal overflow; no real booking submitted.

Proof directory:
`/Users/metodig/.codex/visualizations/2026/10/13/01a13548-f728-7172-a396-a52db0f30e43/onboarding-autofill-hours-20261111/`

- `copy-weekdays-bg-390.jpg`
- `copy-weekdays-en-1280.jpg`
- `photo-note-centered-390.jpg`
- `browser-checks.json`

No production bookings, accounts, notifications, database writes, catalogue edits or paid provider calls were performed. Temporary browser tab and viewport override were cleaned up, local dev server stopped.

## Affected areas

Onboarding: `components/business-setup.js`, `components/catalogue-import-review.js`, `lib/catalogue-onboarding.mjs`, `lib/onboarding-catalogue-draft.mjs`, `app/onboarding.css`.

Pricing validation/edit/persistence: `lib/service-pricing.mjs`, `components/service-pricing-fields.js`, `lib/business-application.mjs`, `lib/business-application-limits.mjs`, `lib/application-photos.mjs`, `lib/business-content.mjs`, `components/admin-business-editor.js`, `app/dashboard/settings/page.js`, new SQL migration and pending staging entry.

Public price projection/formatting: `lib/public-business-query.mjs`, `lib/public-directory.mjs`, `lib/discovery/public-details.mjs`, `lib/discovery/internal-search.mjs`, `lib/business-profile-ui.mjs`, `components/business-directory.js`.

Hours: `lib/weekday-hours-copy.mjs`, `components/weekly-schedule-fields.js`, `components/opening-hours-editor.js`, `app/business-management.css`; local-only fixture `app/dev/owner-forms/preview.js`.

Tests: business application, setup/catalogue, bulk import, onboarding draft, public pricing, pricing schema/database, weekday copying and local preview.
